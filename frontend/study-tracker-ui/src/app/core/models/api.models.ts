// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'LEARNER' | 'MENTOR';

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** Sent to POST /auth/login */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Sent to POST /auth/register */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/** User object returned inside auth responses */
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

/** Response from POST /auth/login and POST /auth/register */
export interface AuthResponse {
  message: string;
  user: User;
  access_token: string;
}

/** Response from GET /auth/profile */
export interface ProfileResponse {
  message: string;
  user: {
    id: number;
    email: string;
    role: UserRole;
  };
}

// ─── Goals ────────────────────────────────────────────────────────────────────

/** Sent to POST /goals */
export interface CreateGoalRequest {
  title: string;
  description?: string;
}

/**
 * Goal object returned by GET /goals.
 * - Learner response: id, title, description, userId, createdAt, topics[]
 * - Mentor response: same + user { id, name, email }
 */
export interface Goal {
  id: number;
  title: string;
  description: string | null;
  userId: number;
  createdAt: string;
  /** Only present in mentor responses */
  user?: Pick<User, 'id' | 'name' | 'email'>;
  topics?: Topic[];
}

// ─── Topics ───────────────────────────────────────────────────────────────────

/** Sent to POST /goals/:goalId/topics */
export interface CreateTopicRequest {
  title: string;
}

/** Base Topic object (from creation or embedded lists) */
export interface Topic {
  id: number;
  title: string;
  completed: boolean;
  goalId: number;
}

/**
 * Enriched topic returned by GET /goals/:goalId/topics.
 * Includes lock status and prerequisite details.
 */
export interface TopicWithStatus extends Topic {
  prerequisites: Topic[];
  locked: boolean;
  missingPrerequisites: { id: number; title: string }[];
}

/** Sent to POST /goals/:goalId/topics/:topicId/prerequisites */
export interface AddPrerequisiteRequest {
  prerequisiteId: number;
}

/** Sent to PATCH /goals/:goalId/topics/:topicId/status */
export interface UpdateTopicStatusRequest {
  completed: boolean;
}

// ─── Study Sessions ───────────────────────────────────────────────────────────

/** Sent to POST /goals/:goalId/sessions */
export interface CreateStudySessionRequest {
  /** ISO date string — must not be in the future */
  date: string;
  /** Must be within AppConfig.minSessionMinutes – AppConfig.maxSessionMinutes */
  minutes: number;
  note?: string;
  topicId: number;
}

/**
 * StudySession returned by GET /goals/:goalId/sessions.
 * Always includes the nested topic object.
 */
export interface StudySession {
  id: number;
  date: string;
  minutes: number;
  note: string | null;
  userId: number;
  topicId: number;
  createdAt: string;
  topic?: Pick<Topic, 'id' | 'title'>;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

/** Response from GET /goals/:goalId/progress */
export interface GoalProgress {
  goalId: number;
  goalTitle: string;
  totalTopics: number;
  completedTopics: number;
  remainingTopics: number;
  progressPercentage: number;
  totalStudyMinutes: number;
  topics: Pick<Topic, 'id' | 'title' | 'completed'>[];
}

// ─── App Config (Mentor only) ─────────────────────────────────────────────────

/** Response from GET /config and PATCH /config */
export interface AppConfig {
  id: number;
  minSessionMinutes: number;
  maxSessionMinutes: number;
  maxPrerequisites: number;
}

/** Sent to PATCH /config — all fields are optional */
export interface UpdateConfigRequest {
  minSessionMinutes?: number;
  maxSessionMinutes?: number;
  maxPrerequisites?: number;
}

// ─── JWT Payload (decoded on frontend for role) ───────────────────────────────

/**
 * Shape of the JWT payload issued by the backend.
 * sub = user id, email, role.
 * Used only for role-based routing — never trusted as a security boundary.
 */
export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}
