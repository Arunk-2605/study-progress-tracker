
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';

import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles/roles.guard';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Learner Registration
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // User Login
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Protected Profile Endpoint
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: any) {
    return {
      message: 'Authenticated successfully',
      user: req.user,
    };
  }

  // Mentor-only Dashboard
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MENTOR')
  @Get('mentor-dashboard')
  mentorDashboard(@Req() req: any) {
    return {
      message: 'Welcome to Mentor Dashboard',
      user: req.user,
    };
  }
}
