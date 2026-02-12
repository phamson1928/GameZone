import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  AuthResponseDto,
  TokensResponseDto,
  GoogleAuthDto,
} from './dto';
import { JwtPayload } from '../common/interfaces/request.interface';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;
  private readonly ACCESS_TOKEN_EXPIRES = '15m';
  private readonly REFRESH_TOKEN_EXPIRES = '7d';
  private readonly REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
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
