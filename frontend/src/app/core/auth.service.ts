import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from './models';

interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl;
  private readonly TOKEN_KEY = 'ep_token';
  private readonly USER_KEY = 'ep_user';

  // Reactive current user
  user = signal<User | null>(this.loadUser());
  isLoggedIn = computed(() => this.user() !== null);
  role = computed(() => this.user()?.role ?? null);

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.api}/login`, { email, password })
      .pipe(tap((res) => this.setSession(res)));
  }

  register(payload: any): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.api}/register`, payload)
      .pipe(tap((res) => this.setSession(res)));
  }

  logout(): void {
    this.http.post(`${this.api}/logout`, {}).subscribe({ complete: () => {}, error: () => {} });
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.user.set(null);
  }

  get token(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setSession(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    this.user.set(res.user);
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  }
}
