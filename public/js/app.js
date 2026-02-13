/**
 * Main Application Entry Point
 * Initializes and coordinates all components
 */

import { HabitAPI, ExecutionAPI, AnalyticsAPI } from './api.js';
import { HabitList } from './components/HabitList.js';
import { Heatmap } from './components/Heatmap.js';
import { Statistics } from './components/Statistics.js';
import { formatDisplayDate, getTodayString } from './utils/dates.js';

class HabitTrackerApp {
  constructor() {
    this.habitList = null;
    this.heatmap = null;
    this.statistics = null;
    this.selectedColor = '#6CEFA0'; // Default color
  }

  async init() {
    console.log('🚀 Initializing Habit Tracker...');

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
      setInterval(() => this.refresh(), 60000);

      console.log('✅ Application initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.showError('Failed to initialize application. Please refresh the page.');
    }
  }

  setupEventListeners() {
    // Color selector
    const colorSelector = document.getElementById('colorSelector');
    if (colorSelector) {
      colorSelector.addEventListener('click', (e) => {
        const colorOpt = e.target.closest('.color-opt');
        if (!colorOpt) return;

        // Update UI
        document.querySelectorAll('.color-opt').forEach(opt => {
          opt.classList.remove('active');
        });
        colorOpt.classList.add('active');

        // Update selected color
        this.selectedColor = colorOpt.dataset.color;
      });
    }

    // Add habit button
    const addBtn = document.getElementById('addHabitBtn');
    const input = document.getElementById('habitInput');

    if (addBtn && input) {
      addBtn.addEventListener('click', () => this.handleAddHabit());

      // Allow Enter key to add habit
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleAddHabit();
        }
      });
    }

    // Listen to habit toggle events
    document.addEventListener('habit-toggled', () => {
      this.refresh();
    });
  }

  async handleAddHabit() {
    const input = document.getElementById('habitInput');
    if (!input) return;

    const name = input.value.trim();
    if (!name) {
      alert('Please enter a habit name');
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

      console.log(`✅ Habit "${name}" created successfully`);
    } catch (error) {
      console.error('Error creating habit:', error);
      alert('Failed to create habit. Please try again.');
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
    // Simple error display (could be enhanced with a modal or toast)
    const container = document.querySelector('.dashboard-container');
    if (!container) return;

    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 16px 24px;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: var(--font-data);
      font-size: 14px;
      z-index: 1000;
    `;
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
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
