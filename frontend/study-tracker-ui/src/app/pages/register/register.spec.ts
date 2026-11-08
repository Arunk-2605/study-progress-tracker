import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Register } from './register';

describe('Register Component', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the register component', () => {
    expect(component).toBeTruthy();
  });

  it('should reject registration when password and confirm password mismatch', () => {
    component.name = 'Test User';
    component.email = 'test@example.com';
    component.password = 'Password123!';
    component.confirmPassword = 'DifferentPassword!';

    component.onRegister();

    expect(component.errorMessage).toContain('Passwords do not match');
    expect(component.isLoading).toBe(false);
  });

  it('should reject registration when password length is under 8 characters', () => {
    component.name = 'Test User';
    component.email = 'test@example.com';
    component.password = 'short';
    component.confirmPassword = 'short';

    component.onRegister();

    expect(component.errorMessage).toContain('at least 8 characters');
    expect(component.isLoading).toBe(false);
  });
});
