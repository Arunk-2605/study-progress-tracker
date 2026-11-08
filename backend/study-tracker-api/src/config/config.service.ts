
import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  // Get application configuration.
  async getConfig() {
    let config = await this.prisma.appConfig.findUnique({
      where: { id: 1 },
    });

    if (!config) {
      config = await this.prisma.appConfig.create({
        data: { id: 1 },
      });
    }

    return config;
  }

  // Update application configuration.
  async updateConfig(dto: {
    minSessionMinutes?: number;
    maxSessionMinutes?: number;
    maxPrerequisites?: number;
  }) {
    const current = await this.getConfig();

    const minMinutes =
      dto.minSessionMinutes ?? current.minSessionMinutes;

    const maxMinutes =
      dto.maxSessionMinutes ?? current.maxSessionMinutes;

    const maxPrerequisites =
      dto.maxPrerequisites ?? current.maxPrerequisites;

    if (minMinutes < 1 || maxMinutes > 1440) {
      throw new BadRequestException(
        'Session minutes must be between 1 and 1440',
      );
    }

    if (minMinutes > maxMinutes) {
      throw new BadRequestException(
        'Minimum session minutes cannot exceed maximum session minutes',
      );
    }

    if (maxPrerequisites < 0 || maxPrerequisites > 20) {
      throw new BadRequestException(
        'Maximum prerequisites must be between 0 and 20',
      );
    }

    return this.prisma.appConfig.upsert({
      where: { id: 1 },
      update: {
        minSessionMinutes: minMinutes,
        maxSessionMinutes: maxMinutes,
        maxPrerequisites,
      },
      create: {
        id: 1,
        minSessionMinutes: minMinutes,
        maxSessionMinutes: maxMinutes,
        maxPrerequisites,
      },
    });
  }
}
