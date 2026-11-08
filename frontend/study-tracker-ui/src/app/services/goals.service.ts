import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Goal,
  CreateGoalRequest,
  Topic,
  TopicWithStatus,
  CreateTopicRequest,
  AddPrerequisiteRequest,
  UpdateTopicStatusRequest,
  StudySession,
  CreateStudySessionRequest,
  GoalProgress,
} from '../core/models/api.models';

@Injectable({
  providedIn: 'root',
})
export class GoalsService {
  private readonly apiUrl = 'http://localhost:3000/goals';

  constructor(private http: HttpClient) {}

  /**
   * Fetch all goals:
   * - For LEARNER: returns only the authenticated user's goals.
   * - For MENTOR: returns all goals with user { id, name, email } attached.
   */
  getGoals(): Observable<Goal[]> {
    return this.http.get<Goal[]>(this.apiUrl);
  }

  /**
   * Create a new learning goal (LEARNER only).
   */
  createGoal(dto: CreateGoalRequest): Observable<Goal> {
    return this.http.post<Goal>(this.apiUrl, dto);
  }

  /**
   * Fetch all topics for a goal, including lock status and missing prerequisites.
   */
  getTopics(goalId: number): Observable<TopicWithStatus[]> {
    return this.http.get<TopicWithStatus[]>(`${this.apiUrl}/${goalId}/topics`);
  }

  /**
   * Add a new topic to a goal (LEARNER only).
   */
  createTopic(goalId: number, dto: CreateTopicRequest): Observable<Topic> {
    return this.http.post<Topic>(`${this.apiUrl}/${goalId}/topics`, dto);
  }

  /**
   * Add a prerequisite dependency to a topic (LEARNER only).
   */
  addPrerequisite(
    goalId: number,
    topicId: number,
    prerequisiteId: number,
  ): Observable<any> {
    const dto: AddPrerequisiteRequest = { prerequisiteId };
    return this.http.post(
      `${this.apiUrl}/${goalId}/topics/${topicId}/prerequisites`,
      dto,
    );
  }

  /**
   * Update topic completion status (LEARNER only).
   * - Mark completed: checks all prerequisites are complete.
   * - Reopen: cascades reopening to all dependent topics.
   */
  updateTopicStatus(
    goalId: number,
    topicId: number,
    completed: boolean,
  ): Observable<Topic> {
    const dto: UpdateTopicStatusRequest = { completed };
    return this.http.patch<Topic>(
      `${this.apiUrl}/${goalId}/topics/${topicId}/status`,
      dto,
    );
  }

  /**
   * Log a study session for a topic (LEARNER only).
   */
  createStudySession(
    goalId: number,
    dto: CreateStudySessionRequest,
  ): Observable<StudySession> {
    return this.http.post<StudySession>(
      `${this.apiUrl}/${goalId}/sessions`,
      dto,
    );
  }

  /**
   * Get all study sessions logged for a goal.
   */
  getStudySessions(goalId: number): Observable<StudySession[]> {
    return this.http.get<StudySession[]>(`${this.apiUrl}/${goalId}/sessions`);
  }

  /**
   * Get progress calculation for a goal (completion %, total study minutes, topics).
   */
  getProgress(goalId: number): Observable<GoalProgress> {
    return this.http.get<GoalProgress>(`${this.apiUrl}/${goalId}/progress`);
  }
}

