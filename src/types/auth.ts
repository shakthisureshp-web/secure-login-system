export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  username: string;
  created_at: string;
  two_factor_enabled: number;
  last_login_at?: string | null;
  password_changed_at?: string | null;
}

export interface ActiveSession {
  id: string;
  createdAt: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
}

export interface SecurityLog {
  id: number;
  user_id: number | null;
  event_type: string;
  ip_address: string;
  user_agent: string;
  details: string;
  timestamp: string;
}

export interface AuthState {
  user: AuthUser | null;
  session: ActiveSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  csrfToken: string | null;
}

export interface PasswordStrength {
  score: number;
  entropyScore: number;
  isValid: boolean;
  errors: string[];
  feedback: {
    hasMinLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}
