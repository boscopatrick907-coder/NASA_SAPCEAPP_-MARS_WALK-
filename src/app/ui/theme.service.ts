import { Injectable, signal, Signal } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'marswalk_theme';

  private _theme = signal<Theme>('dark');
  readonly theme: Signal<Theme> = this._theme.asReadonly();

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
      if (saved === 'light' || saved === 'dark') {
        this.applyTheme(saved);
        return;
      }

      // Mission-control dark is the default look; light stays one click away.
      this.applyTheme('dark');
    } catch {
      this.applyTheme('dark');
    }
  }

  toggleTheme(): void {
    const nextTheme: Theme = this._theme() === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
  }

  private applyTheme(theme: Theme): void {
    this._theme.set(theme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, theme);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }
}
