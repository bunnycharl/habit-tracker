import { AnalyticsAPI } from '../api.js';
import { clearElement } from '../utils/dom.js';

export class Heatmap {
  constructor(container) {
    this.container = container;
    this.year = new Date().getFullYear();
  }

  async render(year = this.year) {
    this.year = year;

    try {
      const heatmapData = await AnalyticsAPI.getHeatmap(year);
      this.renderGrid(heatmapData.data);

      // Update year display
      const yearEl = document.getElementById('heatmapYear');
      if (yearEl) yearEl.textContent = year;
    } catch (error) {
      console.error('Error loading heatmap:', error);
      this.renderError();
    }
  }

  renderGrid(data) {
    clearElement(this.container);

    // Create 53 weeks * 7 days = 371 cells
    const totalCells = 53 * 7;

    // Map data by date for quick lookup
    const dataMap = {};
    data.forEach(item => {
      dataMap[item.date] = item;
    });

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'day-cell';

      // Get date for this cell (if exists)
      const dayData = data[i];

      if (dayData) {
        const completionRate = dayData.completion_rate;

        // Color cell based on completion rate
        if (completionRate === 0) {
          cell.style.backgroundColor = '#F0F0F0'; // No completion
        } else if (completionRate < 0.33) {
          cell.style.backgroundColor = '#E0E0E0'; // Low
        } else if (completionRate < 0.66) {
          cell.style.backgroundColor = '#B8F2D0'; // Medium
        } else {
          cell.style.backgroundColor = 'var(--c-accent)'; // High
        }

        // Add popover
        const popover = this.createPopover(dayData);
        cell.appendChild(popover);
      } else {
        // Future date or no data
        cell.style.backgroundColor = '#FAFAFA';
      }

      this.container.appendChild(cell);
    }
  }

  createPopover(dayData) {
    const popover = document.createElement('div');
    popover.className = 'popover';

    const date = new Date(dayData.date + 'T00:00:00');
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const percentage = Math.round(dayData.completion_rate * 100);

    popover.innerHTML = `
      <div class="label-micro">${dateStr}</div>
      <div class="data-mono">COMPLETED: ${percentage}%</div>
      <div class="data-mono" style="margin-top: 4px; font-size: 12px;">
        ${dayData.habits_completed}/${dayData.total_habits} habits
      </div>
      <div class="chart-mini" style="height: 8px; margin-top: 8px;">
        <div class="bar fill" style="width: ${percentage}%; height: 100%;"></div>
      </div>
    `;

    return popover;
  }

  renderError() {
    clearElement(this.container);
    const error = document.createElement('div');
    error.style.cssText = 'text-align: center; padding: 20px; color: var(--c-text-secondary);';
    error.textContent = 'Failed to load heatmap data';
    this.container.appendChild(error);
  }

  async refresh() {
    await this.render(this.year);
  }
}
