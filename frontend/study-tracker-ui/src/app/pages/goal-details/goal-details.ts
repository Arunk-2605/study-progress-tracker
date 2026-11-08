import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';
import {
  Goal,
  TopicWithStatus,
  StudySession,
  GoalProgress,
  AppConfig,
} from '../../core/models/api.models';
import { GoalsService } from '../../services/goals.service';
import { ConfigService } from '../../services/config.service';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-goal-details',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './goal-details.html',
  styleUrl: './goal-details.css',
})
export class GoalDetails implements OnInit, OnDestroy {
  goalId = 0;
  goal: Goal | null = null;
  progress: GoalProgress | null = null;
  topics: TopicWithStatus[] = [];
  sessions: StudySession[] = [];
  config: AppConfig;

  isLearner = true;
  isLoading = true;
  errorMessage = '';

  // Topic creation
  newTopicTitle = '';
  isCreatingTopic = false;
  topicError = '';

  // Prerequisite modal
  showPrereqModal = false;
  targetTopicForPrereq: TopicWithStatus | null = null;
  selectedPrereqId: number | null = null;
  isAddingPrereq = false;
  prereqError = '';

  // Study session creation
  newSessionDate = '';
  newSessionTopicId: number | null = null;
  newSessionMinutes = 30;
  newSessionNote = '';
  isLoggingSession = false;
  sessionError = '';
  sessionSuccess = '';

  private routeSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private goalsService: GoalsService,
    private configService: ConfigService,
    private auth: Auth,
    private cdr: ChangeDetectorRef,
  ) {
    this.config = this.configService.getCachedConfig();
  }

  ngOnInit() {
    this.isLearner = this.auth.getUserRole() !== 'MENTOR';
    this.newSessionDate = new Date().toISOString().split('T')[0];

    this.routeSub = this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id') || params.get('goalId');
      if (idParam) {
        this.goalId = Number(idParam);
        this.loadAllGoalData();
      } else {
        this.errorMessage = 'Invalid Goal ID.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });

    // Load config limits if mentor, or use safe defaults
    if (!this.isLearner) {
      this.configService.getConfig().subscribe({
        next: (cfg) => {
          this.config = cfg;
          this.cdr.markForCheck();
        },
      });
    }
  }

  ngOnDestroy() {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  loadAllGoalData() {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    forkJoin({
      goals: this.goalsService.getGoals(),
      topics: this.goalsService.getTopics(this.goalId),
      progress: this.goalsService.getProgress(this.goalId),
      sessions: this.goalsService.getStudySessions(this.goalId),
    }).subscribe({
      next: (res) => {
        const foundGoal = res.goals.find((g) => g.id === this.goalId);
        if (foundGoal) {
          this.goal = foundGoal;
        } else {
          // If not in array, synthesized from progress
          this.goal = {
            id: this.goalId,
            title: res.progress?.goalTitle || `Goal #${this.goalId}`,
            description: null,
            userId: 0,
            createdAt: new Date().toISOString(),
          };
        }

        this.topics = res.topics || [];
        this.progress = res.progress;
        this.sessions = res.sessions || [];

        // Set default topic for session logging
        const unlockedTopics = this.topics.filter((t) => !t.locked);
        if (unlockedTopics.length > 0 && !this.newSessionTopicId) {
          this.newSessionTopicId = unlockedTopics[0].id;
        }

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err.error?.message ||
          'Failed to load goal details. Please check the goal ID.';
        this.cdr.markForCheck();
      },
    });
  }

  refreshProgressAndTopics() {
    forkJoin({
      topics: this.goalsService.getTopics(this.goalId),
      progress: this.goalsService.getProgress(this.goalId),
    }).subscribe({
      next: (res) => {
        this.topics = res.topics;
        this.progress = res.progress;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to refresh progress & topics:', err);
      },
    });
  }

  // --- Topic Management ---

  createTopic() {
    if (!this.isLearner) return;

    const title = this.newTopicTitle.trim();
    if (!title) {
      this.topicError = 'Topic title cannot be empty.';
      return;
    }

    this.isCreatingTopic = true;
    this.topicError = '';
    this.cdr.markForCheck();

    this.goalsService.createTopic(this.goalId, { title }).subscribe({
      next: () => {
        this.isCreatingTopic = false;
        this.newTopicTitle = '';
        this.refreshProgressAndTopics();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isCreatingTopic = false;
        this.topicError =
          err.error?.message || 'Failed to add topic. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  toggleTopicStatus(topic: TopicWithStatus) {
    if (!this.isLearner) return;

    if (!topic.completed && topic.locked) {
      alert(
        `This topic is locked! Complete prerequisites first: ${topic.missingPrerequisites.map((m) => m.title).join(', ')}`,
      );
      return;
    }

    const nextCompleted = !topic.completed;

    this.goalsService
      .updateTopicStatus(this.goalId, topic.id, nextCompleted)
      .subscribe({
        next: () => {
          // Reopening cascades to dependent topics on the backend, so refresh both topics and progress!
          this.refreshProgressAndTopics();
        },
        error: (err) => {
          alert(
            err.error?.message ||
              'Failed to update topic status. Make sure all prerequisites are completed.',
          );
        },
      });
  }

  // --- Prerequisite Management ---

  openAddPrereqModal(topic: TopicWithStatus) {
    if (!this.isLearner) return;

    this.targetTopicForPrereq = topic;
    this.selectedPrereqId = null;
    this.prereqError = '';
    this.showPrereqModal = true;
    this.cdr.markForCheck();
  }

  closeAddPrereqModal() {
    this.showPrereqModal = false;
    this.targetTopicForPrereq = null;
    this.selectedPrereqId = null;
    this.prereqError = '';
    this.cdr.markForCheck();
  }

  getEligiblePrerequisites(): TopicWithStatus[] {
    if (!this.targetTopicForPrereq) return [];
    const targetId = this.targetTopicForPrereq.id;
    const existingPrereqIds = new Set(
      (this.targetTopicForPrereq.prerequisites || []).map((p) => p.id),
    );

    return this.topics.filter(
      (t) => t.id !== targetId && !existingPrereqIds.has(t.id),
    );
  }

  submitAddPrerequisite() {
    if (!this.isLearner || !this.targetTopicForPrereq || !this.selectedPrereqId) {
      this.prereqError = 'Please select a prerequisite topic.';
      return;
    }

    // Client-side guard for max prerequisites
    const currentPrereqCount =
      this.targetTopicForPrereq.prerequisites?.length || 0;
    if (currentPrereqCount >= this.config.maxPrerequisites) {
      this.prereqError = `A topic can have at most ${this.config.maxPrerequisites} prerequisites.`;
      return;
    }

    this.isAddingPrereq = true;
    this.prereqError = '';
    this.cdr.markForCheck();

    this.goalsService
      .addPrerequisite(
        this.goalId,
        this.targetTopicForPrereq.id,
        this.selectedPrereqId,
      )
      .subscribe({
        next: () => {
          this.isAddingPrereq = false;
          this.closeAddPrereqModal();
          this.refreshProgressAndTopics();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isAddingPrereq = false;
          this.prereqError =
            err.error?.message ||
            'Failed to add prerequisite. Circular dependencies are not allowed.';
          this.cdr.markForCheck();
        },
      });
  }

  // --- Study Sessions Management ---

  getUnlockedTopics(): TopicWithStatus[] {
    return this.topics.filter((t) => !t.locked);
  }

  logStudySession() {
    if (!this.isLearner) return;

    this.sessionError = '';
    this.sessionSuccess = '';

    if (!this.newSessionTopicId) {
      this.sessionError = 'Please select an unlocked topic.';
      return;
    }

    if (!this.newSessionDate) {
      this.sessionError = 'Please choose a study date.';
      return;
    }

    const selectedDate = new Date(this.newSessionDate);
    const now = new Date();
    // Allow today, but prevent future dates
    if (selectedDate.getTime() > now.getTime() + 86400000) {
      this.sessionError = 'Study session date cannot be in the future.';
      return;
    }

    const minutes = Number(this.newSessionMinutes);
    if (
      isNaN(minutes) ||
      minutes < this.config.minSessionMinutes ||
      minutes > this.config.maxSessionMinutes
    ) {
      this.sessionError = `Study minutes must be between ${this.config.minSessionMinutes} and ${this.config.maxSessionMinutes}.`;
      return;
    }

    this.isLoggingSession = true;
    this.cdr.markForCheck();

    this.goalsService
      .createStudySession(this.goalId, {
        date: new Date(this.newSessionDate).toISOString(),
        minutes,
        note: this.newSessionNote.trim() || undefined,
        topicId: Number(this.newSessionTopicId),
      })
      .subscribe({
        next: (session) => {
          this.isLoggingSession = false;
          this.sessionSuccess = `Logged ${minutes} minutes of study!`;
          this.newSessionNote = '';
          const matchedTopic = this.topics.find((t) => t.id === session.topicId);
          if (matchedTopic && !session.topic) {
            session.topic = matchedTopic;
          }
          this.sessions.unshift(session);
          this.refreshProgressAndTopics();
          this.cdr.markForCheck();

          setTimeout(() => {
            this.sessionSuccess = '';
            this.cdr.markForCheck();
          }, 3500);
        },
        error: (err) => {
          this.isLoggingSession = false;
          this.sessionError =
            err.error?.message || 'Failed to log study session.';
          this.cdr.markForCheck();
        },
      });
  }

  getDashboardLink(): string {
    return this.isLearner ? '/dashboard' : '/mentor';
  }

  formatStudyTime(totalMinutes?: number): string {
    const mins = totalMinutes || 0;
    if (mins <= 0) return '0 mins';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} min${m === 1 ? '' : 's'}`;
    if (m === 0) return `${h} hr${h === 1 ? '' : 's'}`;
    return `${h}h ${m}m`;
  }

  formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }
}

