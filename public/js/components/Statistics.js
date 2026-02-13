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

    // Active Habits Count (today's total)
    const activeCountEl = document.getElementById('activeCount');
    if (activeCountEl) {
      activeCountEl.textContent = this.overview.today_total || 0;
    }

    // Completion Rate (today's rate)
    const completionRateEl = document.getElementById('completionRate');
    if (completionRateEl) {
      const todayRate = this.overview.today_total > 0
        ? (this.overview.today_completed / this.overview.today_total)
        : 0;
      completionRateEl.textContent = Math.round(todayRate * 100);
    }
  }

  updateCharts() {
    if (!this.overview) return;

    // Daily pie chart
    this.renderDailyPieChart();

    // Stats card mini charts
    this.renderMiniChart('executionsChart', this.overview.weekly_trend);
    this.renderMiniChart('streakChart', this.overview.weekly_trend);
    this.renderMiniChart('efficiencyChart', this.overview.weekly_trend);
  }

  renderDailyPieChart() {
    const chartEl = document.getElementById('dailyPieChart');
    if (!chartEl) return;

    clearElement(chartEl);

    // Get today's completion rate
    const completionRate = this.overview.today_total > 0
      ? (this.overview.today_completed / this.overview.today_total)
      : 0;
    // Fix: Limit to 359.99 degrees to avoid gradient bug at 100%
    const completedAngle = completionRate >= 1 ? 359.99 : completionRate * 360;
    const radius = 50;
    const centerX = 60;
    const centerY = 60;
    const strokeWidth = 12;

    // Calculate arc coordinates
    const startAngle = -90; // Start from top
    const endAngle = startAngle + completedAngle;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    // Create gradient definition
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'pieGradient');
    gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
    gradient.setAttribute('x1', x1);
    gradient.setAttribute('y1', y1);
    gradient.setAttribute('x2', x2);
    gradient.setAttribute('y2', y2);

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#10B981'); // Bright emerald
    stop1.setAttribute('stop-opacity', '1');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#6EE7B7'); // Light emerald
    stop2.setAttribute('stop-opacity', '1');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    chartEl.appendChild(defs);

    // Background circle (gray)
    const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('cx', centerX);
    bgCircle.setAttribute('cy', centerY);
    bgCircle.setAttribute('r', radius);
    bgCircle.setAttribute('fill', 'none');
    bgCircle.setAttribute('stroke', '#E0E0E0');
    bgCircle.setAttribute('stroke-width', strokeWidth);
    chartEl.appendChild(bgCircle);

    // Completed arc (with gradient)
    if (completionRate > 0) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const largeArc = completedAngle > 180 ? 1 : 0;
      const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;

      path.setAttribute('d', pathData);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'url(#pieGradient)');
      path.setAttribute('stroke-width', strokeWidth);
      path.setAttribute('stroke-linecap', 'round');
      chartEl.appendChild(path);
    }

    // Center text showing percentage
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', centerX);
    text.setAttribute('y', centerY + 6);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-family', 'var(--font-data)');
    text.setAttribute('font-size', '20');
    text.setAttribute('font-weight', '500');
    text.setAttribute('fill', 'var(--c-text-primary)');
    text.textContent = `${Math.round(completionRate * 100)}%`;
    chartEl.appendChild(text);
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
