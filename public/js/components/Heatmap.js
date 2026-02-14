import { AnalyticsAPI } from '../api.js';
import { clearElement } from '../utils/dom.js';

export class Heatmap {
  constructor(container) {
    this.container = container;
    this.year = new Date().getFullYear();
    this.viewMode = 'year';
    this._cachedData = null;
    this._resizeHandler = null;
    this._initResponsive();
  }

  /**
   * Returns the number of weeks to display based on current viewport width.
   * Mobile (<768px): 8 weeks, Tablet (768-1023px): 26 weeks, Desktop (1024+): 53 weeks
   */
  getResponsiveWeeks() {
    const width = window.innerWidth;
    if (width < 768) return 8;
    if (width < 1024) return 26;
    return 53;
  }

  /**
   * Listen for viewport resize and re-render grid when breakpoint changes.
   */
  _initResponsive() {
    let lastWeeks = this.getResponsiveWeeks();

    this._resizeHandler = () => {
      const currentWeeks = this.getResponsiveWeeks();
      if (currentWeeks !== lastWeeks) {
        lastWeeks = currentWeeks;
        if (this._cachedData) {
          this.renderGrid(this._cachedData);
        }
      }
    };

    window.addEventListener('resize', this._resizeHandler);
  }

  async render(year = this.year) {
    this.year = year;

    try {
      const heatmapData = await AnalyticsAPI.getHeatmap(year);
      this._cachedData = heatmapData.data;

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

    // Show only last N weeks on smaller screens
    const maxWeeks = this.getResponsiveWeeks();
    const maxDays = maxWeeks * 7;
    const displayData = data.length > maxDays ? data.slice(-maxDays) : data;

    const weeks = Math.ceil(displayData.length / 7);

    // Update grid layout
    this.container.style.gridTemplateColumns = `repeat(${weeks}, 1fr)`;

    const totalCells = displayData.length;

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'day-cell';

      const dayData = displayData[i];

      if (dayData) {
        const completionRate = dayData.completion_rate;

        if (completionRate === 0) {
          cell.style.backgroundColor = '#F0F0F0';
        } else if (completionRate < 0.33) {
          cell.style.backgroundColor = '#E0E0E0';
        } else if (completionRate < 0.66) {
          cell.style.backgroundColor = '#B8F2D0';
        } else {
          cell.style.backgroundColor = 'var(--c-accent)';
        }

        // Add popover
        const popover = this.createPopover(dayData);
        cell.appendChild(popover);
      } else {
        cell.style.backgroundColor = '#FAFAFA';
      }

      this.container.appendChild(cell);
    }

    // Add smart positioning on hover
    this.container.addEventListener('mouseover', (e) => {
      const cell = e.target.closest('.day-cell');
      if (!cell) return;

      const popover = cell.querySelector('.popover');
      if (!popover) return;

      const cellRect = cell.getBoundingClientRect();
      const popoverWidth = 300;
      const popoverHeight = 140;
      const margin = 10;

      if (cellRect.top > window.innerHeight / 2) {
        popover.style.top = `${cellRect.top - popoverHeight - margin}px`;
      } else {
        popover.style.top = `${cellRect.bottom + margin}px`;
      }

      if (cellRect.left > window.innerWidth / 2) {
        popover.style.left = `${cellRect.right - popoverWidth}px`;
      } else {
        popover.style.left = `${cellRect.left}px`;
      }
    });
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
