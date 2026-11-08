import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MentorConfig } from './mentor-config';

describe('MentorConfig Component', () => {
  let component: MentorConfig;
  let fixture: ComponentFixture<MentorConfig>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MentorConfig],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MentorConfig);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the mentor config component', () => {
    expect(component).toBeTruthy();
  });

  it('should validate that minimum minutes cannot exceed maximum minutes', () => {
    component.minSession = 100;
    component.maxSession = 50;
    component.maxPrereqs = 5;

    component.saveConfig();

    expect(component.errorMessage).toContain(
      'Minimum session minutes cannot exceed maximum session minutes',
    );
    expect(component.isSaving).toBe(false);
  });

  it('should validate prerequisite bounds (0 to 20)', () => {
    component.minSession = 10;
    component.maxSession = 60;
    component.maxPrereqs = 25;

    component.saveConfig();

    expect(component.errorMessage).toContain(
      'Maximum prerequisites must be between 0 and 20',
    );
    expect(component.isSaving).toBe(false);
  });

  it('should reset fields to recommended defaults', () => {
    component.minSession = 99;
    component.maxSession = 999;
    component.maxPrereqs = 18;

    component.resetToDefaults();

    expect(component.minSession).toBe(5);
    expect(component.maxSession).toBe(480);
    expect(component.maxPrereqs).toBe(5);
  });
});

