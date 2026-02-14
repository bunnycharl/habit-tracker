/**
 * Main Application Entry Point
 * Initializes and coordinates all components
 */

import { HabitAPI, ExecutionAPI, AnalyticsAPI } from './api.js';
import { HabitList } from './components/HabitList.js';
import { Heatmap } from './components/Heatmap.js';
import { Statistics } from './components/Statistics.js';
import { formatDisplayDate, getTodayString } from './utils/dates.js';
import { ToastManager } from './components/Toast.js';
import { PinLogin } from './components/PinLogin.js';

class HabitTrackerApp {
  constructor() {
    this.habitList = null;
    this.heatmap = null;
    this.statistics = null;
    this.pinLogin = null;
    this.selectedColor = '#6CEFA0'; // Default color
  }

  async init() {
    console.log('🚀 Initializing Habit Tracker...');

    // Initialize toast notifications (global)
    window.Toast = new ToastManager();
    window.Toast.init();

    // Auth event listeners
    window.addEventListener('auth-login', () => this.onLogin());
    window.addEventListener('auth-logout', () => this.showLogin());

    // Check auth
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.showLogin();
      return;
    }

    await this.startDashboard();
  }

  showLogin() {
    const dashboard = document.querySelector('.dashboard-container');
    if (dashboard) dashboard.style.display = 'none';

    // Create or reuse login container
    let loginContainer = document.getElementById('loginContainer');
    if (!loginContainer) {
      loginContainer = document.createElement('div');
      loginContainer.id = 'loginContainer';
      document.body.appendChild(loginContainer);
    }

    if (this.pinLogin) this.pinLogin.destroy();
    this.pinLogin = new PinLogin(loginContainer);
    this.pinLogin.render();
  }

  async onLogin() {
    // Remove login screen
    const loginContainer = document.getElementById('loginContainer');
    if (loginContainer) loginContainer.remove();
    if (this.pinLogin) {
      this.pinLogin.destroy();
      this.pinLogin = null;
    }

    await this.startDashboard();
  }

  async startDashboard() {
    const dashboard = document.querySelector('.dashboard-container');
    if (dashboard) dashboard.style.display = '';

    try {
      // Initialize components
      this.habitList = new HabitList(document.getElementById('habitList'));
      this.heatmap = new Heatmap(document.getElementById('heatmapGrid'));
      this.statistics = new Statistics();

      // Set up UI event listeners
      this.setupEventListeners();

      // Set current date
      this.updateCurrentDate();

      // Load initial data
      await this.loadData();

      // Set up auto-refresh (every 60 seconds)
      this._refreshInterval = setInterval(() => this.refresh(), 60000);

      console.log('✅ Application initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.showError('Failed to initialize application. Please refresh the page.');
    }
  }

  setupEventListeners() {
    // Color selector with ARIA radio group support
    const colorSelector = document.getElementById('colorSelector');
    const customColorPicker = document.getElementById('customColorPicker');

    if (colorSelector) {
      colorSelector.addEventListener('click', (e) => {
        const colorOpt = e.target.closest('.color-opt');
        if (!colorOpt) return;

        // If it's the custom color picker, trigger the input
        if (colorOpt.classList.contains('color-picker-opt')) {
          customColorPicker.click();
          return;
        }

        // Update UI and ARIA
        colorSelector.querySelectorAll('.color-opt').forEach(opt => {
          opt.classList.remove('active');
          opt.setAttribute('aria-checked', 'false');
          opt.setAttribute('tabindex', '-1');
        });
        colorOpt.classList.add('active');
        colorOpt.setAttribute('aria-checked', 'true');
        colorOpt.setAttribute('tabindex', '0');

        // Update selected color
        this.selectedColor = colorOpt.dataset.color;
      });

      // Handle custom color picker
      if (customColorPicker) {
        customColorPicker.addEventListener('change', (e) => {
          const customColor = e.target.value;
          const pickerOpt = e.target.closest('.color-picker-opt');

          // Update UI
          colorSelector.querySelectorAll('.color-opt').forEach(opt => {
            opt.classList.remove('active');
            opt.setAttribute('aria-checked', 'false');
            opt.setAttribute('tabindex', '-1');
          });

          pickerOpt.classList.add('active');
          pickerOpt.setAttribute('aria-checked', 'true');
          pickerOpt.setAttribute('tabindex', '0');
          pickerOpt.style.setProperty('--custom-color', customColor);

          // Update selected color
          this.selectedColor = customColor;
        });
      }

      // Arrow key navigation for radio group
      colorSelector.addEventListener('keydown', (e) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
        e.preventDefault();

        const opts = Array.from(colorSelector.querySelectorAll('.color-opt'));
        const activeIndex = opts.findIndex(o => o.classList.contains('active'));
        let nextIndex;

        if (e.key === 'ArrowRight') {
          nextIndex = activeIndex < opts.length - 1 ? activeIndex + 1 : 0;
        } else {
          nextIndex = activeIndex > 0 ? activeIndex - 1 : opts.length - 1;
        }

        opts.forEach(o => {
          o.classList.remove('active');
          o.setAttribute('aria-checked', 'false');
          o.setAttribute('tabindex', '-1');
        });
        opts[nextIndex].classList.add('active');
        opts[nextIndex].setAttribute('aria-checked', 'true');
        opts[nextIndex].setAttribute('tabindex', '0');
        opts[nextIndex].focus();

        this.selectedColor = opts[nextIndex].dataset.color;
      });
    }

    // Form submit handler
    const habitForm = document.getElementById('habitForm');
    if (habitForm) {
      habitForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddHabit();
      });
    }

    // Listen to habit toggle events
    document.addEventListener('habit-toggled', () => {
      this.refresh();
    });

    // Listen to habit edit/delete events
    document.addEventListener('habit-updated', () => {
      this.refresh();
    });
  }

  async handleAddHabit() {
    const input = document.getElementById('habitInput');
    if (!input) return;

    const name = input.value.trim();
    if (!name) {
      if (window.Toast) {
        window.Toast.warning('Please enter a habit name');
      }
      input.focus();
      return;
    }

    try {
      await HabitAPI.create({
        name,
        color: this.selectedColor
      });

      // Clear input
      input.value = '';

      // Refresh data
      await this.loadData();

      if (window.Toast) {
        window.Toast.success(`Habit "${name}" created successfully`);
      }
    } catch (error) {
      console.error('Error creating habit:', error);
      if (window.Toast) {
        window.Toast.error('Failed to create habit. Please try again.');
      }
    }
  }

  async loadData() {
    console.log('📊 Loading data...');

    try {
      // Load all data in parallel
      const [habits, streaks, overview] = await Promise.all([
        ExecutionAPI.getHabitsStatus(),
        AnalyticsAPI.getAllStreaks(),
        AnalyticsAPI.getOverview()
      ]);

      // Update habit list
      await this.habitList.render(habits, streaks);

      // Update statistics
      this.statistics.overview = overview;
      this.statistics.updateStats();
      this.statistics.updateCharts();

      // Load heatmap
      await this.heatmap.render();

      console.log('✅ Data loaded successfully');
    } catch (error) {
      console.error('Error loading data:', error);
      this.showError('Failed to load data. Please refresh the page.');
    }
  }

  async refresh() {
    console.log('🔄 Refreshing data...');

    try {
      await this.loadData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }

  updateCurrentDate() {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
      const today = new Date();
      dateEl.textContent = formatDisplayDate(getTodayString());
    }
  }

  showError(message) {
    if (window.Toast) {
      window.Toast.error(message);
    } else {
      console.error(message);
    }
  }
}

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered with scope:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
            console.log('New Service Worker version available. Refresh to update.');
          }
        });
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new HabitTrackerApp();
    app.init();
  });
} else {
  const app = new HabitTrackerApp();
  app.init();
}

export default HabitTrackerApp;
