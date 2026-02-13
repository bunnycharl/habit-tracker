/**
 * ThemeManager
 * Handles dark/light mode toggling with localStorage persistence
 * and system preference detection
 */

export class ThemeManager {
  constructor() {
    this.STORAGE_KEY = 'habit-tracker-theme';
    this.theme = this._getInitialTheme();
    this.toggleBtn = null;
    this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }

  init() {
    this._applyTheme(this.theme);
    this._createToggleButton();
    this._listenSystemPreference();
  }

  _getInitialTheme() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    // Fall back to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  _applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
    if (this.toggleBtn) {
      this._updateToggleIcon();
    }
  }

  toggle() {
    this._applyTheme(this.theme === 'dark' ? 'light' : 'dark');
  }

  _createToggleButton() {
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.className = 'theme-toggle-btn';
    this.toggleBtn.setAttribute('aria-label', 'Toggle dark mode');
    this.toggleBtn.title = 'Toggle dark mode';
    this._updateToggleIcon();

    this.toggleBtn.addEventListener('click', () => this.toggle());
    document.body.appendChild(this.toggleBtn);
  }

  _updateToggleIcon() {
    if (this.theme === 'dark') {
      // Sun icon for switching to light
      this.toggleBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M9 1V3M9 15V17M1 9H3M15 9H17M3.3 3.3L4.7 4.7M13.3 13.3L14.7 14.7M14.7 3.3L13.3 4.7M4.7 13.3L3.3 14.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
      this.toggleBtn.setAttribute('aria-label', 'Switch to light mode');
    } else {
      // Moon icon for switching to dark
      this.toggleBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M15.5 10.5A7 7 0 0 1 7.5 2.5 7 7 0 1 0 15.5 10.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
      this.toggleBtn.setAttribute('aria-label', 'Switch to dark mode');
    }
  }

  _listenSystemPreference() {
    this._mediaQuery.addEventListener('change', (e) => {
      // Only auto-switch if user hasn't manually set a preference
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        this._applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}
