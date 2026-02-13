import { AnalyticsAPI } from '../api.js';
import { clearElement } from '../utils/dom.js';

export class Statistics {
  constructor() {
    this.overview = null;
  }

  async render() {
    try {
      this.overview = await AnalyticsAPI.getOverview();
      this.updateStats();
      this.updateCharts();
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }

  updateStats() {
    if (!this.overview) return;

    // Total Executions
    const totalEl = document.getElementById('totalExecutions');
    if (totalEl) {
      totalEl.textContent = this.overview.total_executions.toLocaleString();
    }

    // Max Streak
    const maxStreakEl = document.getElementById('maxStreak');
    if (maxStreakEl) {
      maxStreakEl.innerHTML = `${this.overview.max_streak}<span style="font-size: 16px; color: #888; font-weight: 400; margin-left: 4px;">DAYS</span>`;
    }

    // Efficiency
    const efficiencyEl = document.getElementById('efficiency');
    if (efficiencyEl) {
      efficiencyEl.textContent = `${Math.round(this.overview.efficiency * 100)}%`;
    }

    // Active Habits Count
    const activeCountEl = document.getElementById('activeCount');
    if (activeCountEl) {
      activeCountEl.textContent = this.overview.active_habits;
    }

    // Completion Rate
    const completionRateEl = document.getElementById('completionRate');
    if (completionRateEl) {
      completionRateEl.textContent = Math.round(this.overview.completion_rate * 100);
    }
  }

  updateCharts() {
    if (!this.overview) return;

    // Weekly mini chart
    this.renderWeeklyChart();

    // Stats card mini charts
    this.renderMiniChart('executionsChart', this.overview.weekly_trend);
    this.renderMiniChart('streakChart', this.overview.weekly_trend);
    this.renderMiniChart('efficiencyChart', this.overview.weekly_trend);
  }

  renderWeeklyChart() {
    const chartEl = document.getElementById('weeklyMiniChart');
    if (!chartEl) return;

    clearElement(chartEl);

    this.overview.weekly_trend.forEach(rate => {
      const bar = document.createElement('div');
      bar.className = 'bar fill';
      bar.style.height = `${Math.round(rate * 100)}%`;
      chartEl.appendChild(bar);
    });
  }

  renderMiniChart(elementId, data) {
    const chartEl = document.getElementById(elementId);
    if (!chartEl) return;

    clearElement(chartEl);

    // Show last 3 values
    const lastThree = data.slice(-3);

    lastThree.forEach((value, index) => {
      const bar = document.createElement('div');
      bar.className = 'bar fill';
      bar.style.height = `${Math.round(value * 100)}%`;

      // Fade older bars
      if (index < 2) {
        bar.style.opacity = '0.3';
      }

      chartEl.appendChild(bar);
    });
  }

  async refresh() {
    await this.render();
  }
}
