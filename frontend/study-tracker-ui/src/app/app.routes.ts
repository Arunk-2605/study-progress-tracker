import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { GoalDetails } from './pages/goal-details/goal-details';
import { MentorDashboard } from './pages/mentor-dashboard/mentor-dashboard';
import { MentorConfig } from './pages/mentor-config/mentor-config';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'register',
    component: Register,
  },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['LEARNER'] },
  },
  {
    path: 'goals/:id',
    component: GoalDetails,
    canActivate: [authGuard],
  },
  {
    path: 'mentor',
    component: MentorDashboard,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['MENTOR'] },
  },
  {
    path: 'mentor/learners',
    component: MentorDashboard,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['MENTOR'] },
  },
  {
    path: 'mentor/config',
    component: MentorConfig,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['MENTOR'] },
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
