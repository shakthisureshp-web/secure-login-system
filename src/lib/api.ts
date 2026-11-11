import { AuthUser, ActiveSession, SecurityLog, PasswordStrength } from '../types/auth.ts';

let cachedCsrfToken: string | null = null;

export async function getCsrfToken(): Promise<string> {
  if (cachedCsrfToken) return cachedCsrfToken;
  try {
    const res = await fetch('/api/auth/csrf', { credentials: 'include' });
    const data = await res.json();
    if (data.csrfToken) {
      cachedCsrfToken = data.csrfToken;
      return data.csrfToken;
    }
  } catch (err) {
    console.error('Failed to get CSRF token', err);
  }
  return '';
}

export function setCachedCsrfToken(token: string) {
  cachedCsrfToken = token;
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) {
      headers.set('x-csrf-token', csrfToken);
    }
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { message: await response.text() };
  }

  if (data?.csrfToken) {
    setCachedCsrfToken(data.csrfToken);
  }

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  return data as T;
}

// Client-side password evaluator for immediate, zero-latency user feedback
export function evaluateClientPasswordStrength(password: string): PasswordStrength {
  const errors: string[] = [];
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  if (!hasMinLength) errors.push('At least 8 characters');
  if (!hasUppercase) errors.push('At least 1 uppercase letter (A-Z)');
  if (!hasLowercase) errors.push('At least 1 lowercase letter (a-z)');
  if (!hasNumber) errors.push('At least 1 numerical digit (0-9)');
  if (!hasSpecialChar) errors.push('At least 1 special character (!@#$%^&*)');

  let metRules = 0;
  if (hasMinLength) metRules++;
  if (hasUppercase) metRules++;
  if (hasLowercase) metRules++;
  if (hasNumber) metRules++;
  if (hasSpecialChar) metRules++;

  let poolSize = 0;
  if (hasLowercase) poolSize += 26;
  if (hasUppercase) poolSize += 26;
  if (hasNumber) poolSize += 10;
  if (hasSpecialChar) poolSize += 33;

  const entropy = poolSize > 0 ? Math.round(password.length * Math.log2(poolSize)) : 0;
  const entropyScore = Math.min(100, Math.round((entropy / 80) * 100));

  let score = 0;
  if (metRules <= 2) score = 1;
  else if (metRules === 3) score = 2;
  else if (metRules === 4) score = 3;
  else if (metRules === 5 && password.length >= 10) score = 4;
  else score = 3;

  return {
    score,
    entropyScore,
    isValid: errors.length === 0,
    errors,
    feedback: {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
    },
  };
}
