import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { Goal, GoalProgress, User } from '../../core/models/api.models';
import { Auth } from '../../services/auth';
import { GoalsService } from '../../services/goals.service';

interface DashboardGoal extends Goal {
  progress?: GoalProgress;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  goals: DashboardGoal[] = [];
  currentUser: User | null = null;

  totalGoals = 0;
  completedTopics = 0;
  totalTopics = 0;
  remainingTopics = 0;
  totalMinutes = 0;
  progressPercentage = 0;

  isLoading = false;
  errorMessage = '';

  // Create Goal form state
  showCreateModal = false;
  newGoalTitle = '';
  newGoalDescription = '';
  isCreatingGoal = false;
  createGoalError = '';

  private goalsSub?: Subscription;

  constructor(
    private goalsService: GoalsService,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.currentUser = this.auth.getCurrentUser();
    this.loadUserProfile();
    this.loadGoals();
  }

  ngOnDestroy() {
    if (this.goalsSub) {
      this.goalsSub.unsubscribe();
    }
  }

  loadUserProfile() {
    this.auth.getProfile().subscribe({
      next: (res) => {
        if (res && res.user) {
          const stored = this.auth.getCurrentUser();
          this.currentUser = {
            id: res.user.id,
            name: stored?.name || 'Learner',
            email: res.user.email,
            role: res.user.role,
          };
          this.cdr.markForCheck();
        }
      },
      error: () => {
        // Fall back to stored user data silently
        this.currentUser = this.auth.getCurrentUser();
        this.cdr.markForCheck();
      },
    });
  }

  loadGoals() {
    if (!this.auth.isLoggedIn()) {
      this.isLoading = false;
      this.cdr.markForCheck();
      this.router.navigate(['/login']);
      return;
    }

    if (this.goalsSub) {
      this.goalsSub.unsubscribe();
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.goalsSub = this.goalsService
      .getGoals()
      .pipe(
        switchMap((data) => {
          const goals = Array.isArray(data) ? data : [];
          this.totalGoals = goals.length;

          if (goals.length === 0) {
            this.goals = [];
            this.resetStatistics();
            this.isLoading = false;
            this.cdr.markForCheck();
            return of({ goals: [], progressData: [] });
          }

          // Populate goals immediately so UI renders without waiting for progress
          this.goals = goals.map((goal) => ({
            ...goal,
            progress: undefined,
          }));
          this.cdr.markForCheck();

          const progressRequests = goals.map((goal) =>
            this.goalsService.getProgress(goal.id).pipe(
              catchError((err) => {
                console.warn(
                  `[Dashboard] Failed to fetch progress for goal ${goal.id}:`,
                  err,
                );
                const fallback: GoalProgress = {
                  goalId: goal.id,
                  goalTitle: goal.title,
                  totalTopics: goal.topics?.length ?? 0,
                  completedTopics: 0,
                  remainingTopics: goal.topics?.length ?? 0,
                  progressPercentage: 0,
                  totalStudyMinutes: 0,
                  topics: [],
                };
                return of(fallback);
              }),
            ),
          );

          return forkJoin(progressRequests).pipe(
            map((progressData) => ({ goals, progressData })),
          );
        }),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (result) => {
          if (!result || !result.goals) {
            this.isLoading = false;
            this.cdr.markForCheck();
            return;
          }

          const { goals, progressData } = result;

          if (goals.length > 0 && progressData && progressData.length > 0) {
            this.goals = goals.map((goal, index) => ({
              ...goal,
              progress: progressData[index],
            }));

            this.completedTopics = progressData.reduce(
              (total, p) => total + (p?.completedTopics || 0),
              0,
            );

            this.totalTopics = progressData.reduce(
              (total, p) => total + (p?.totalTopics || 0),
              0,
            );

            this.remainingTopics = Math.max(
              0,
              this.totalTopics - this.completedTopics,
            );

            this.totalMinutes = progressData.reduce(
              (total, p) => total + (p?.totalStudyMinutes || 0),
              0,
            );

            this.progressPercentage =
              this.totalTopics > 0
                ? Math.round((this.completedTopics / this.totalTopics) * 100)
                : 0;
          }

          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.error?.message ||
            error.message ||
            'Unable to load your goals and progress. Please try again.';
          this.resetStatistics();
          this.cdr.markForCheck();
        },
      });
  }

  private resetStatistics() {
    this.completedTopics = 0;
    this.totalTopics = 0;
    this.remainingTopics = 0;
    this.totalMinutes = 0;
    this.progressPercentage = 0;
  }

  openCreateGoalModal() {
    this.newGoalTitle = '';
    this.newGoalDescription = '';
    this.createGoalError = '';
    this.showCreateModal = true;
    this.cdr.markForCheck();
  }

  closeCreateGoalModal() {
    this.showCreateModal = false;
    this.createGoalError = '';
    this.cdr.markForCheck();
  }

  submitCreateGoal() {
    const title = this.newGoalTitle.trim();
    if (!title) {
      this.createGoalError = 'Goal title is required.';
      return;
    }

    this.isCreatingGoal = true;
    this.createGoalError = '';
    this.cdr.markForCheck();

    this.goalsService
      .createGoal({
        title,
        description: this.newGoalDescription.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.isCreatingGoal = false;
          this.showCreateModal = false;
          this.newGoalTitle = '';
          this.newGoalDescription = '';
          this.cdr.markForCheck();
          this.loadGoals();
        },
        error: (err) => {
          this.isCreatingGoal = false;
          this.createGoalError =
            err.error?.message || 'Failed to create goal. Please try again.';
          this.cdr.markForCheck();
        },
      });
  }

  viewGoal(goalId: number) {
    this.router.navigate(['/goals', goalId]);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  formatStudyTime(totalMinutes: number): string {
    if (!totalMinutes || totalMinutes <= 0) return '0 mins';
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours === 0) return `${mins} min${mins === 1 ? '' : 's'}`;
    if (mins === 0) return `${hours} hr${hours === 1 ? '' : 's'}`;
    return `${hours}h ${mins}m`;
  }
}
