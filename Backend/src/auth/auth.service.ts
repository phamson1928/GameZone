import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  AuthResponseDto,
  TokensResponseDto,
  GoogleAuthDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';
import { JwtPayload } from '../common/interfaces/request.interface';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;
  private readonly ACCESS_TOKEN_EXPIRES = '15m';
  private readonly REFRESH_TOKEN_EXPIRES = '7d';
  private readonly REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly RESET_TOKEN_EXPIRES_MS = 15 * 60 * 1000; // 15 minutes
  private readonly googleClient: OAuth2Client;
  private readonly mailer: nodemailer.Transporter;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );

    // Setup nodemailer transporter (SMTP from env)
    this.mailer = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get<string>('MAIL_PORT') || '587'),
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, username, password } = registerDto;

    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    // Check if username already exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create user with profile
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        profile: {
          create: {}, // Create empty profile
        },
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      userId: user.id,
      email: user.email,
      username: user.username,
      tokens,
    };
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is banned
    if (user.status === 'BANNED') {
      throw new UnauthorizedException('Your account has been banned');
    }

    // Google-only users cannot login with password
    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account uses Google login. Please sign in with Google.',
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      userId: user.id,
      email: user.email,
      username: user.username,
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refresh(refreshTokenDto: RefreshTokenDto): Promise<TokensResponseDto> {
    const { refreshToken } = refreshTokenDto;

    // Verify refresh token
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Find the refresh token in database
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        token: refreshToken,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found or expired');
    }

    // Check if user is still active
    if (storedToken.user.status === 'BANNED') {
      throw new UnauthorizedException('Your account has been banned');
    }

    // Revoke old refresh token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
    );

    // Store new refresh token
    await this.storeRefreshToken(storedToken.user.id, tokens.refreshToken);

    return tokens;
  }

  /**
   * Logout user (revoke current refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    // Revoke the refresh token
    await this.prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        revoked: false,
      },
      data: { revoked: true },
    });
  }

  /**
   * Forgot password — generate reset token and send email
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = dto;

    // Find user by email — always return success to prevent email enumeration
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      // Return generic message for security (don't reveal if email exists or is Google-only)
      return {
        message:
          'If an account with this email exists, a password reset link has been sent.',
      };
    }

    // Invalidate any existing unused tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + this.RESET_TOKEN_EXPIRES_MS);

    // Store hashed token in DB
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt,
      },
    });

    // Build reset link
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const resetLink = `${frontendUrl}/auth/reset-password?token=${rawToken}`;

    // Send email (fire & forget — don't block response if email fails)
    const mailFrom =
      this.configService.get<string>('MAIL_FROM') ||
      '"TeamZoneVN" <noreply@teamzonevn.com>';

    this.mailer
      .sendMail({
        from: mailFrom,
        to: user.email,
        subject: '[TeamZoneVN] Đặt lại mật khẩu',
        html: this.buildResetEmailHtml(user.username, resetLink),
      })
      .catch((err: unknown) => {
        console.error('[AuthService] Failed to send reset email:', err);
      });

    return {
      message:
        'If an account with this email exists, a password reset link has been sent.',
    };
  }

  /**
   * Reset password — verify token and update password
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = dto;

    // Hash the incoming raw token to compare with DB
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    if (resetRecord.used) {
      throw new BadRequestException('This reset token has already been used');
    }

    if (resetRecord.expiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired. Please request a new one.');
    }

    if (resetRecord.user.status === 'BANNED') {
      throw new UnauthorizedException('Your account has been banned');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update password and mark token as used in transaction
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { used: true },
      }),
      // Revoke all existing refresh tokens for security
      this.prisma.refreshToken.updateMany({
        where: { userId: resetRecord.userId, revoked: false },
        data: { revoked: true },
      }),
    ]);

    return { message: 'Password has been reset successfully. Please log in with your new password.' };
  }

  /**
   * Build HTML email template for password reset
   */
  private buildResetEmailHtml(username: string, resetLink: string): string {
    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <title>Đặt lại mật khẩu - TeamZoneVN</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #0f0f1a; color: #e0e0ff; margin: 0; padding: 20px;">
        <div style="max-width: 480px; margin: 0 auto; background: #1a1a2e; border-radius: 12px; padding: 32px; border: 1px solid #7c3aed;">
          <h1 style="color: #a78bfa; margin-bottom: 8px;">🎮 TeamZoneVN</h1>
          <h2 style="margin-top: 0;">Đặt lại mật khẩu</h2>
          <p>Xin chào <strong>${username}</strong>,</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
          <p>Nhấn vào nút bên dưới để đặt mật khẩu mới. Link có hiệu lực trong <strong>15 phút</strong>.</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetLink}"
               style="background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff; text-decoration: none;
                      padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
              Đặt lại mật khẩu
            </a>
          </div>
          <p style="font-size: 13px; color: #9ca3af;">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này. Tài khoản của bạn vẫn an toàn.</p>
          <p style="font-size: 12px; color: #6b7280;">Hoặc copy link sau vào trình duyệt:<br/><span style="color: #a78bfa; word-break: break-all;">${resetLink}</span></p>
          <hr style="border-color: #374151; margin: 24px 0;"/>
          <p style="font-size: 12px; color: #6b7280; text-align: center;">© 2026 TeamZoneVN. Tìm đồng đội, chinh phục thử thách.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Logout from all devices (revoke all refresh tokens)
   */
  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revoked: false,
      },
      data: { revoked: true },
    });
  }

  /**
   * Google Login — Mobile flow (client sends idToken)
   */
  async googleLogin(dto: GoogleAuthDto): Promise<AuthResponseDto> {
    const { idToken } = dto;

    // Verify Google idToken
    let payload: TokenPayload | undefined;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedException('Invalid Google token payload');
    }

    const googleId: string | undefined = payload.sub;
    const email: string = payload.email;
    const name: string | undefined = payload.name;
    const picture: string | undefined = payload.picture;

    if (!googleId) {
      throw new UnauthorizedException('Invalid Google token: missing sub');
    }

    const user = await this.findOrCreateGoogleUser(
      googleId,
      email,
      name ?? null,
      picture ?? null,
    );

    return this.buildAuthResponse(user);
  }

  /**
   * Google Login — Web OAuth2 callback flow
   * Called after GoogleStrategy validates the user via passport
   */
  async googleCallbackLogin(googleProfile: {
    googleId: string;
    email?: string;
    displayName?: string;
    avatarUrl?: string;
  }): Promise<AuthResponseDto> {
    const { googleId, email, displayName, avatarUrl } = googleProfile;

    if (!email) {
      throw new BadRequestException(
        'Google account must have an email address',
      );
    }

    const user = await this.findOrCreateGoogleUser(
      googleId,
      email,
      displayName,
      avatarUrl,
    );

    return this.buildAuthResponse(user);
  }

  /**
   * Find existing user by googleId or email, or create a new one.
   * - If user exists with same googleId → login
   * - If user exists with same email (local account) → link Google to existing account
   * - If no user → create new Google user
   */
  private async findOrCreateGoogleUser(
    googleId: string,
    email: string,
    displayName?: string | null,
    avatarUrl?: string | null,
  ) {
    // 1. Try find by googleId
    let user = await this.prisma.user.findUnique({
      where: { googleId },
    });

    if (user) {
      if (user.status === 'BANNED') {
        throw new UnauthorizedException('Your account has been banned');
      }
      return user;
    }

    // 2. Try find by email (link Google to existing local account)
    user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      if (user.status === 'BANNED') {
        throw new UnauthorizedException('Your account has been banned');
      }

      // Link Google to existing account
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          authProvider: user.passwordHash ? 'LOCAL' : 'GOOGLE',
          avatarUrl: user.avatarUrl || avatarUrl || null,
        },
      });

      return user;
    }

    // 3. Create new Google user
    const username = await this.generateUniqueUsername(email, displayName);

    user = await this.prisma.user.create({
      data: {
        email,
        username,
        googleId,
        authProvider: 'GOOGLE',
        avatarUrl: avatarUrl || null,
        profile: {
          create: {},
        },
      },
    });

    return user;
  }

  /**
   * Generate a unique username from email or display name
   */
  private async generateUniqueUsername(
    email: string,
    displayName?: string | null,
  ): Promise<string> {
    // Base: use displayName or email prefix, sanitize to alphanumeric + underscore
    const base = (displayName || email.split('@')[0])
      .replace(/[^a-zA-Z0-9_]/g, '')
      .substring(0, 20);

    const candidate = base || 'user';

    // Check if available
    const existing = await this.prisma.user.findUnique({
      where: { username: candidate },
    });

    if (!existing) return candidate;

    // Append random digits until unique
    for (let i = 0; i < 10; i++) {
      const suffix = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      const attempt = `${candidate}${suffix}`;

      const exists = await this.prisma.user.findUnique({
        where: { username: attempt },
      });

      if (!exists) return attempt;
    }

    // Fallback: uuid-based
    return `user_${Date.now()}`;
  }

  /**
   * Build AuthResponse from user (shared by both Google flows)
   */
  private async buildAuthResponse(user: {
    id: string;
    email: string;
    username: string;
    role: string;
  }): Promise<AuthResponseDto> {
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      userId: user.id,
      email: user.email,
      username: user.username,
      tokens,
    };
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<TokensResponseDto> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.ACCESS_TOKEN_EXPIRES,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.REFRESH_TOKEN_EXPIRES,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Store refresh token in database
   */
  private async storeRefreshToken(
    userId: string,
    token: string,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRES_MS);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }
}
