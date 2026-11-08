import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Dashboard } from './dashboard';

describe('Dashboard Component', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: class {} }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the dashboard component', () => {
    expect(component).toBeTruthy();
  });

  it('should format study time in hours and minutes correctly', () => {
    expect(component.formatStudyTime(0)).toBe('0 mins');
    expect(component.formatStudyTime(45)).toBe('45 mins');
    expect(component.formatStudyTime(60)).toBe('1 hr');
    expect(component.formatStudyTime(120)).toBe('2 hrs');
    expect(component.formatStudyTime(135)).toBe('2h 15m');
  });

  it('should open and close the create goal modal', () => {
    expect(component.showCreateModal).toBe(false);
    component.openCreateGoalModal();
    expect(component.showCreateModal).toBe(true);
    component.closeCreateGoalModal();
    expect(component.showCreateModal).toBe(false);
  });
});
