
import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';

import { ConfigService } from './config.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import {
  IsInt,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

// DTO for updating application configuration.
class UpdateConfigDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  minSessionMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  maxSessionMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  maxPrerequisites?: number;
}

@Controller('config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MENTOR')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  // View application configuration.
  @Get()
  getConfig() {
    return this.configService.getConfig();
  }

  // Update application configuration.
  @Patch()
  updateConfig(@Body() dto: UpdateConfigDto) {
    return this.configService.updateConfig(dto);
  }
}
