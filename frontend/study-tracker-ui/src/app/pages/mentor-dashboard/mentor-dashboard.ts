import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { catchError, of } from 'rxjs';
import { Goal, GoalProgress, User } from '../../core/models/api.models';
import { GoalsService } from '../../services/goals.service';
import { Auth } from '../../services/auth';

interface MentorGoalView extends Goal {
  progress?: GoalProgress;
}

@Component({
  selector: 'app-mentor-dashboard',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './mentor-dashboard.html',
  styleUrl: './mentor-dashboard.css',
})
export class MentorDashboard implements OnInit {
  goals: MentorGoalView[] = [];
  filteredGoals: MentorGoalView[] = [];
  currentUser: User | null = null;
  welcomeMessage = 'Welcome to Mentor Dashboard';

  totalLearners = 0;
  totalGoals = 0;
  totalCompletedTopics = 0;
  totalStudyMinutes = 0;

  searchQuery = '';
  selectedLearnerId: number | 'all' = 'all';

  isLoading = true;
  errorMessage = '';

  constructor(
    private goalsService: GoalsService,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.currentUser = this.auth.getCurrentUser();
    this.loadMentorOverview();
  }

  loadMentorOverview() {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    forkJoin({
      mentorInfo: this.auth.getMentorDashboard().pipe(
        catchError((err) => {
          console.warn('Could not fetch mentor dashboard greeting:', err);
          return of({ message: 'Welcome to Mentor Dashboard', user: null });
        }),
      ),
      allGoals: this.goalsService.getGoals(),
    }).subscribe({
      next: (res) => {
        this.welcomeMessage = res.mentorInfo.message;
        const rawGoals = res.allGoals || [];
        this.totalGoals = rawGoals.length;

        // Count unique learners
        const learnerIds = new Set(rawGoals.map((g) => g.userId));
        this.totalLearners = learnerIds.size;

        if (rawGoals.length === 0) {
          this.goals = [];
          this.filteredGoals = [];
          this.isLoading = false;
          this.cdr.markForCheck();
          return;
        }

        // Fetch progress for each goal
        const progressReqs = rawGoals.map((g) =>
          this.goalsService.getProgress(g.id).pipe(
            catchError(() =>
              of({
                goalId: g.id,
                goalTitle: g.title,
                totalTopics: g.topics?.length || 0,
                completedTopics: 0,
                remainingTopics: g.topics?.length || 0,
                progressPercentage: 0,
                totalStudyMinutes: 0,
                topics: [],
              }),
            ),
          ),
        );

        forkJoin(progressReqs).subscribe({
          next: (progressList) => {
            this.goals = rawGoals.map((g, idx) => ({
              ...g,
              progress: progressList[idx],
            }));

            this.totalCompletedTopics = progressList.reduce(
              (acc, p) => acc + (p?.completedTopics || 0),
              0,
            );
            this.totalStudyMinutes = progressList.reduce(
              (acc, p) => acc + (p?.totalStudyMinutes || 0),
              0,
            );

            this.applyFilter();
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.goals = rawGoals.map((g) => ({ ...g }));
            this.applyFilter();
            this.isLoading = false;
            this.cdr.markForCheck();
          },
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err.error?.message ||
          'Failed to load learner progress data. Ensure you have mentor privileges.';
        this.cdr.markForCheck();
      },
    });
  }

  applyFilter() {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredGoals = this.goals.filter((g) => {
      const titleMatch = g.title.toLowerCase().includes(q);
      const descMatch = (g.description || '').toLowerCase().includes(q);
      const learnerNameMatch = (g.user?.name || '').toLowerCase().includes(q);
      const learnerEmailMatch = (g.user?.email || '').toLowerCase().includes(q);

      const matchesSearch =
        !q || titleMatch || descMatch || learnerNameMatch || learnerEmailMatch;

      const matchesLearner =
        this.selectedLearnerId === 'all' ||
        g.userId === this.selectedLearnerId;

      return matchesSearch && matchesLearner;
    });
    this.cdr.markForCheck();
  }

  getDistinctLearners(): { id: number; name: string; email: string }[] {
    const map = new Map<number, { id: number; name: string; email: string }>();
    for (const g of this.goals) {
      if (g.user && !map.has(g.user.id)) {
        map.set(g.user.id, {
          id: g.user.id,
          name: g.user.name || `Learner #${g.user.id}`,
          email: g.user.email,
        });
      }
    }
    return Array.from(map.values());
  }

  viewGoalDetails(goalId: number) {
    this.router.navigate(['/goals', goalId]);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  formatStudyTime(totalMinutes?: number): string {
    const mins = totalMinutes || 0;
    if (mins <= 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }
}

