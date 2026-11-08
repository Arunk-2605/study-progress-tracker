
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { CreateTopicDto } from './dto/create-topic.dto';
import { AddPrerequisiteDto } from './dto/add-prerequisite.dto';
import { UpdateTopicStatusDto } from './dto/update-topic-status.dto';
import { CreateStudySessionDto } from './dto/create-study-session.dto';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  // Find all incomplete prerequisites, including indirect prerequisites.
  private async getMissingPrerequisites(topicId: number) {
    const visited = new Set<number>();
    const missing = new Map<number, { id: number; title: string }>();

    const check = async (currentTopicId: number) => {
      if (visited.has(currentTopicId)) return;
      visited.add(currentTopicId);

      const links = await this.prisma.topicPrerequisite.findMany({
        where: { topicId: currentTopicId },
        include: {
          prerequisite: {
            select: {
              id: true,
              title: true,
              completed: true,
            },
          },
        },
      });

      for (const link of links) {
        const prerequisite = link.prerequisite;

        if (!prerequisite.completed) {
          missing.set(prerequisite.id, {
            id: prerequisite.id,
            title: prerequisite.title,
          });
        }

        await check(prerequisite.id);
      }
    };

    await check(topicId);
    return Array.from(missing.values());
  }

  // Create a new goal.
  async createGoal(userId: number, dto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: {
        title: dto.title,
        description: dto.description,
        userId,
      },
    });
  }

  // Get goals belonging to a learner or all goals for a mentor.
  async getGoals(userId: number, role: string) {
    if (role === 'MENTOR') {
      return this.prisma.goal.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          topics: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.goal.findMany({
      where: { userId },
      include: { topics: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Create a topic inside a goal.
  async createTopic(userId: number, goalId: number, dto: CreateTopicDto) {
    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new NotFoundException(
        'Goal not found or does not belong to you',
      );
    }

    return this.prisma.topic.create({
      data: { title: dto.title, goalId },
    });
  }

  // Get topics and their prerequisite/unlock status.
  async getGoalTopics(userId: number, goalId: number, role: string) {
    const goal = await this.prisma.goal.findFirst({
      where: role === 'MENTOR' ? { id: goalId } : { id: goalId, userId },
      include: {
        topics: {
          include: {
            prerequisites: {
              include: { prerequisite: true },
            },
          },
        },
      },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return Promise.all(
      goal.topics.map(async (topic) => {
        const missingPrerequisites =
          await this.getMissingPrerequisites(topic.id);

        return {
          id: topic.id,
          title: topic.title,
          completed: topic.completed,
          goalId: topic.goalId,
          prerequisites: topic.prerequisites.map(
            (link) => link.prerequisite,
          ),
          locked: missingPrerequisites.length > 0,
          missingPrerequisites,
        };
      }),
    );
  }

  // Add a prerequisite to a topic.
  async addPrerequisite(
    userId: number,
    goalId: number,
    topicId: number,
    dto: AddPrerequisiteDto,
  ) {
    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new NotFoundException(
        'Goal not found or does not belong to you',
      );
    }

    const topic = await this.prisma.topic.findFirst({
      where: { id: topicId, goalId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found in this goal');
    }

    const prerequisite = await this.prisma.topic.findFirst({
      where: { id: dto.prerequisiteId, goalId },
    });

    if (!prerequisite) {
      throw new NotFoundException(
        'Prerequisite topic not found in this goal',
      );
    }

    if (topicId === dto.prerequisiteId) {
      throw new BadRequestException(
        'A topic cannot be its own prerequisite',
      );
    }

    const existing = await this.prisma.topicPrerequisite.findUnique({
      where: {
        topicId_prerequisiteId: {
          topicId,
          prerequisiteId: dto.prerequisiteId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('This prerequisite already exists');
    }

    const config = await this.prisma.appConfig.findUnique({
      where: { id: 1 },
    });

    const maxPrerequisites = config?.maxPrerequisites ?? 5;

    const currentCount = await this.prisma.topicPrerequisite.count({
      where: { topicId },
    });

    if (currentCount >= maxPrerequisites) {
      throw new BadRequestException(
        `A topic can have at most ${maxPrerequisites} prerequisites`,
      );
    }

    // Check for circular dependencies.
    const visited = new Set<number>();
    const stack = [dto.prerequisiteId];

    while (stack.length > 0) {
      const currentId = stack.pop()!;

      if (currentId === topicId) {
        throw new BadRequestException(
          'This prerequisite would create a circular dependency',
        );
      }

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const links = await this.prisma.topicPrerequisite.findMany({
        where: { topicId: currentId },
        select: { prerequisiteId: true },
      });

      for (const link of links) {
        stack.push(link.prerequisiteId);
      }
    }

    return this.prisma.topicPrerequisite.create({
      data: {
        topicId,
        prerequisiteId: dto.prerequisiteId,
      },
      include: { prerequisite: true, topic: true },
    });
  }

  // Update topic completion status.
  async updateTopicStatus(
    userId: number,
    goalId: number,
    topicId: number,
    dto: UpdateTopicStatusDto,
  ) {
    const topic = await this.prisma.topic.findFirst({
      where: {
        id: topicId,
        goalId,
        goal: { userId },
      },
    });

    if (!topic) {
      throw new NotFoundException(
        'Topic not found or does not belong to you',
      );
    }

    // Complete a topic only if all prerequisites are complete.
    if (dto.completed) {
      const missing = await this.getMissingPrerequisites(topicId);

      if (missing.length > 0) {
        throw new BadRequestException(
          `Complete these prerequisites first: ${missing
            .map((item) => item.title)
            .join(', ')}`,
        );
      }

      return this.prisma.topic.update({
        where: { id: topicId },
        data: { completed: true },
      });
    }

    // Find this topic and all topics that depend on it.
    const topicsToReopen = new Set<number>([topicId]);
    const queue = [topicId];

    while (queue.length > 0) {
      const currentTopicId = queue.shift()!;

      const dependents = await this.prisma.topicPrerequisite.findMany({
        where: {
          prerequisiteId: currentTopicId,
          topic: { goalId },
        },
        select: { topicId: true },
      });

      for (const dependent of dependents) {
        if (!topicsToReopen.has(dependent.topicId)) {
          topicsToReopen.add(dependent.topicId);
          queue.push(dependent.topicId);
        }
      }
    }

    // Reopen the selected topic and all its dependent topics.
    await this.prisma.topic.updateMany({
      where: {
        id: { in: Array.from(topicsToReopen) },
      },
      data: { completed: false },
    });

    return this.prisma.topic.findUnique({
      where: { id: topicId },
    });
  }

  // Create a study session.
  async createStudySession(
    userId: number,
    goalId: number,
    dto: CreateStudySessionDto,
  ) {
    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new NotFoundException(
        'Goal not found or does not belong to you',
      );
    }

    const topic = await this.prisma.topic.findFirst({
      where: { id: dto.topicId, goalId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found in this goal');
    }

    const config = await this.prisma.appConfig.findUnique({
      where: { id: 1 },
    });

    const minMinutes = config?.minSessionMinutes ?? 5;
    const maxMinutes = config?.maxSessionMinutes ?? 480;

    if (dto.minutes < minMinutes || dto.minutes > maxMinutes) {
      throw new BadRequestException(
        `Study minutes must be between ${minMinutes} and ${maxMinutes}`,
      );
    }

    const sessionDate = new Date(dto.date);

    if (sessionDate.getTime() > Date.now()) {
      throw new BadRequestException(
        'Study session date cannot be in the future',
      );
    }

    const missing = await this.getMissingPrerequisites(dto.topicId);

    if (missing.length > 0) {
      throw new BadRequestException(
        `This topic is locked. Complete these prerequisites first: ${
          missing.map((item) => item.title).join(', ')
        }`,
      );
    }

    return this.prisma.studySession.create({
      data: {
        date: sessionDate,
        minutes: dto.minutes,
        note: dto.note,
        userId,
        topicId: dto.topicId,
      },
    });
  }

  // Get study-session history.
  async getStudySessions(userId: number, goalId: number, role: string) {
    const goal = await this.prisma.goal.findFirst({
      where:
        role === 'MENTOR'
          ? { id: goalId }
          : { id: goalId, userId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return this.prisma.studySession.findMany({
      where: {
        topic: { goalId },
        ...(role === 'MENTOR' ? {} : { userId }),
      },
      include: {
        topic: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  // Calculate goal progress.
  async getGoalProgress(userId: number, goalId: number, role: string) {
    const goal = await this.prisma.goal.findFirst({
      where:
        role === 'MENTOR'
          ? { id: goalId }
          : { id: goalId, userId },
      include: {
        topics: {
          select: {
            id: true,
            title: true,
            completed: true,
          },
        },
      },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    const totalTopics = goal.topics.length;

    const completedTopics = goal.topics.filter(
      (topic) => topic.completed,
    ).length;

    const progressPercentage =
      totalTopics === 0
        ? 0
        : Math.round((completedTopics / totalTopics) * 100);

    const studyTime = await this.prisma.studySession.aggregate({
      where: {
        topic: { goalId },
        ...(role === 'MENTOR' ? {} : { userId }),
      },
      _sum: { minutes: true },
    });

    return {
      goalId: goal.id,
      goalTitle: goal.title,
      totalTopics,
      completedTopics,
      remainingTopics: totalTopics - completedTopics,
      progressPercentage,
      totalStudyMinutes: studyTime._sum.minutes ?? 0,
      topics: goal.topics,
    };
  }
}
