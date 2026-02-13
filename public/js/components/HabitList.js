import { ExecutionAPI, AnalyticsAPI } from '../api.js';
import { clearElement } from '../utils/dom.js';

export class HabitList {
  constructor(container) {
    this.container = container;
    this.habits = [];
    this.streaks = {};
  }

  async render(habits, streaks = {}) {
    this.habits = habits;
    this.streaks = streaks;

    clearElement(this.container);

    if (habits.length === 0) {
      this.renderEmpty();
      return;
    }

    habits.forEach(habit => {
      const item = this.createHabitItem(habit);
      this.container.appendChild(item);
    });

    this.attachEventListeners();
  }

  renderEmpty() {
    const empty = document.createElement('div');
    empty.style.cssText = 'text-align: center; padding: 40px 20px; color: var(--c-text-secondary);';
    empty.innerHTML = `
      <div style="font-family: var(--font-data); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
        No Habits Yet
      </div>
      <div style="margin-top: 8px; font-size: 14px;">
        Create your first habit to get started
      </div>
    `;
    this.container.appendChild(empty);
  }

  createHabitItem(habit) {
    const isCompleted = habit.completed_today === 1;
    const streak = this.streaks[habit.id] || { currentStreak: 0 };

    const item = document.createElement('div');
    item.className = `habit-item ${isCompleted ? 'completed' : ''}`;
    item.style.setProperty('--active-color', habit.color);
    item.dataset.habitId = habit.id;

    const checkbox = document.createElement('div');
    checkbox.className = 'checkbox';
    if (isCompleted) {
      checkbox.innerHTML = `
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="2"/>
        </svg>
      `;
    }

    const info = document.createElement('div');
    info.className = 'habit-info';

    const name = document.createElement('div');
    name.className = 'habit-name';
    name.textContent = habit.name;

    const streakText = document.createElement('div');
    streakText.className = 'habit-streak';
    streakText.textContent = `Streak: ${streak.currentStreak} days`;

    info.appendChild(name);
    info.appendChild(streakText);

    item.appendChild(checkbox);
    item.appendChild(info);

    return item;
  }

  attachEventListeners() {
    this.container.addEventListener('click', async (e) => {
      const item = e.target.closest('.habit-item');
      if (!item) return;

      const habitId = item.dataset.habitId;
      const checkbox = item.querySelector('.checkbox');

      try {
        // Toggle execution
        const result = await ExecutionAPI.toggle(habitId);

        // Update UI
        if (result.completed) {
          item.classList.add('completed');
          checkbox.innerHTML = `
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="2"/>
            </svg>
          `;
        } else {
          item.classList.remove('completed');
          checkbox.innerHTML = '';
        }

        // Trigger refresh event
        this.container.dispatchEvent(new CustomEvent('habit-toggled', {
          bubbles: true,
          detail: { habitId, completed: result.completed }
        }));
      } catch (error) {
        console.error('Error toggling habit:', error);
        alert('Failed to update habit. Please try again.');
      }
    });
  }

  async refresh() {
    const [habits, streaksData] = await Promise.all([
      ExecutionAPI.getHabitsStatus(),
      AnalyticsAPI.getAllStreaks()
    ]);

    await this.render(habits, streaksData);
  }
}
