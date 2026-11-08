
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Req,
  UseGuards,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { CreateTopicDto } from './dto/create-topic.dto';
import { AddPrerequisiteDto } from './dto/add-prerequisite.dto';
import { UpdateTopicStatusDto } from './dto/update-topic-status.dto';
import { CreateStudySessionDto } from './dto/create-study-session.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  // Create a new goal
  @Post()
  @UseGuards(RolesGuard)
  @Roles('LEARNER')
  createGoal(@Req() req: any, @Body() dto: CreateGoalDto) {
    return this.goalsService.createGoal(req.user.id, dto);
  }

  // Get all goals
  @Get()
  getGoals(@Req() req: any) {
    return this.goalsService.getGoals(req.user.id, req.user.role);
  }

  // Create a topic inside a goal
  @Post(':goalId/topics')
  @UseGuards(RolesGuard)
  @Roles('LEARNER')
  createTopic(
    @Req() req: any,
    @Param('goalId', ParseIntPipe) goalId: number,
    @Body() dto: CreateTopicDto,
  ) {
    return this.goalsService.createTopic(req.user.id, goalId, dto);
  }

  // Get topics and prerequisite status
  @Get(':goalId/topics')
  getGoalTopics(
    @Req() req: any,
    @Param('goalId', ParseIntPipe) goalId: number,
  ) {
    return this.goalsService.getGoalTopics(
      req.user.id,
      goalId,
      req.user.role,
    );
  }

  // Add a prerequisite to a topic
  @Post(':goalId/topics/:topicId/prerequisites')
  @UseGuards(RolesGuard)
  @Roles('LEARNER')
  addPrerequisite(
    @Req() req: any,
    @Param('goalId', ParseIntPipe) goalId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() dto: AddPrerequisiteDto,
  ) {
    return this.goalsService.addPrerequisite(
      req.user.id,
      goalId,
      topicId,
      dto,
    );
  }

  // Update topic completion status
  @Patch(':goalId/topics/:topicId/status')
  @UseGuards(RolesGuard)
  @Roles('LEARNER')
  updateTopicStatus(
    @Req() req: any,
    @Param('goalId', ParseIntPipe) goalId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() dto: UpdateTopicStatusDto,
  ) {
    return this.goalsService.updateTopicStatus(
      req.user.id,
      goalId,
      topicId,
      dto,
    );
  }

  // Create a study session
  @Post(':goalId/sessions')
  @UseGuards(RolesGuard)
  @Roles('LEARNER')
  createStudySession(
    @Req() req: any,
    @Param('goalId', ParseIntPipe) goalId: number,
    @Body() dto: CreateStudySessionDto,
  ) {
    return this.goalsService.createStudySession(
      req.user.id,
      goalId,
      dto,
    );
  }

  // Get study-session history
  @Get(':goalId/sessions')
  getStudySessions(
    @Req() req: any,
    @Param('goalId', ParseIntPipe) goalId: number,
  ) {
    return this.goalsService.getStudySessions(
      req.user.id,
      goalId,
      req.user.role,
    );
  }

  // Get goal progress
  @Get(':goalId/progress')
  getGoalProgress(
    @Req() req: any,
    @Param('goalId', ParseIntPipe) goalId: number,
  ) {
    return this.goalsService.getGoalProgress(
      req.user.id,
      goalId,
      req.user.role,
    );
  }
}
