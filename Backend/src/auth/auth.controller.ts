import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  AuthResponseDto,
  TokensResponseDto,
  GoogleAuthDto,
} from './dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../common/interfaces/request.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký thành công',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Email hoặc username đã tồn tại' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Đăng nhập hệ thống' })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Thông tin đăng nhập không hợp lệ' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  // ========================
  // Google Auth — Mobile (idToken)
  // ========================

  @Post('google')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Đăng nhập Google (Mobile) — verify idToken từ SDK',
  })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập Google thành công',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Google token không hợp lệ' })
  async googleLogin(
    @Body() googleAuthDto: GoogleAuthDto,
  ): Promise<AuthResponseDto> {
    return this.authService.googleLogin(googleAuthDto);
  }

  // ========================
  // Google Auth — Web (OAuth2 redirect)
  // ========================

  @Get('google/redirect')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Đăng nhập Google (Web) — redirect tới trang consent',
  })
  @ApiResponse({ status: 302, description: 'Redirect to Google OAuth' })
  googleRedirect() {
    // Guard triggers redirect to Google
  }

  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth callback — xử lý sau khi người dùng chấp thuận',
  })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công, trả về JWT tokens qua redirect',
  })
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const googleProfile = req.user as {
      googleId: string;
      email?: string;
      displayName?: string;
      avatarUrl?: string;
    };

    const result = await this.authService.googleCallbackLogin(googleProfile);

    // For web clients: redirect with tokens as query params
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:3001';
    const params = new URLSearchParams({
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      userId: result.userId,
    });

    res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
  }

  // ========================
  // Token management
  // ========================

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Làm mới Access Token' })
  @ApiResponse({
    status: 200,
    description: 'Làm mới token thành công',
    type: TokensResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Refresh token không hợp lệ hoặc hết hạn' })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<TokensResponseDto> {
    return this.authService.refresh(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Đăng xuất (thu hồi refresh token)' })
  @ApiResponse({ status: 204, description: 'Đăng xuất thành công' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async logout(@Body() refreshTokenDto: RefreshTokenDto): Promise<void> {
    await this.authService.logout(refreshTokenDto.refreshToken);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Đăng xuất khỏi tất cả thiết bị' })
  @ApiResponse({ status: 204, description: 'Đã đăng xuất tất cả' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async logoutAll(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.authService.logoutAll(user.sub);
  }
}
