import { HabitAPI, ExecutionAPI, AnalyticsAPI } from '../api.js';
import { clearElement } from '../utils/dom.js';
import { Modal } from './Modal.js';

export class HabitList {
  constructor(container) {
    this.container = container;
    this.habits = [];
    this.streaks = {};
    this.modal = new Modal();
    this.searchQuery = '';
    this.filterMode = 'all'; // 'all' | 'completed' | 'pending'
  }

  async render(habits, streaks = {}) {
    this.habits = habits;
    this.streaks = streaks;

    clearElement(this.container);

    if (habits.length === 0) {
      this.renderEmpty();
      return;
    }

    const listWrap = document.createElement('div');
    listWrap.className = 'habit-list-items';
    listWrap.setAttribute('role', 'list');

    habits.forEach(habit => {
      const item = this.createHabitItem(habit);
      listWrap.appendChild(item);
    });

    this.container.appendChild(listWrap);
    this.attachEventListeners(listWrap);
  }


  renderEmpty() {
    const empty = document.createElement('div');
    empty.style.cssText = 'text-align: center; padding: 40px 20px; color: var(--c-text-secondary);';
    empty.setAttribute('role', 'status');
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
    item.setAttribute('role', 'listitem');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label',
      `${habit.name}, streak ${streak.currentStreak} days, ${isCompleted ? 'completed' : 'not completed'}`
    );

    const checkbox = document.createElement('div');
    checkbox.className = 'checkbox';
    checkbox.setAttribute('role', 'checkbox');
    checkbox.setAttribute('aria-checked', isCompleted ? 'true' : 'false');
    checkbox.setAttribute('aria-hidden', 'true');
    if (isCompleted) {
      checkbox.innerHTML = `
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'habit-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'habit-action-btn';
    editBtn.setAttribute('aria-label', `Edit ${habit.name}`);
    editBtn.title = 'Edit';
    editBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M10.5 1.5L12.5 3.5L4 12H2V10L10.5 1.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showEditModal(habit);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'habit-action-btn habit-action-btn-delete';
    deleteBtn.setAttribute('aria-label', `Delete ${habit.name}`);
    deleteBtn.title = 'Delete';
    deleteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 4H12M5 4V2H9V4M5 6V11M9 6V11M3 4L4 13H10L11 4" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.confirmDelete(habit);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(checkbox);
    item.appendChild(info);
    item.appendChild(actions);

    return item;
  }

  showEditModal(habit) {
    const colors = [
      { value: '#6CEFA0', label: 'Mint', bg: '#6CEFA0' },
      { value: '#6CDDEF', label: 'Blue', bg: '#6CDDEF' },
      { value: '#B06CEF', label: 'Purple', bg: '#B06CEF' },
      { value: '#EF9B6C', label: 'Orange', bg: '#EF9B6C' }
    ];

    // Check if current color is a preset or custom
    const isCustomColor = !colors.find(c => c.value === habit.color);

    const colorOptions = colors.map(c => {
      const selected = habit.color === c.value ? 'active' : '';
      return `<button type="button" class="color-opt ${selected}" data-color="${c.value}" style="background:${c.bg}" tabindex="0" role="radio" aria-label="${c.label}" aria-checked="${selected ? 'true' : 'false'}"></button>`;
    }).join('');

    const customPickerSelected = isCustomColor ? 'active' : '';
    const customPickerColor = isCustomColor ? habit.color : '#6CEFA0';
    const colorPickerHTML = `
      <label class="color-opt color-picker-opt ${customPickerSelected}" role="radio" aria-checked="${isCustomColor ? 'true' : 'false'}" aria-label="Custom color" tabindex="0" style="cursor: pointer; ${isCustomColor ? `--custom-color: ${customPickerColor}` : ''}">
        <input type="color" id="editCustomColorPicker" value="${customPickerColor}" style="opacity: 0; width: 0; height: 0; position: absolute;">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="pointer-events: none;">
          <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" fill="none"/>
          <circle cx="8" cy="8" r="3" fill="currentColor"/>
        </svg>
      </label>
    `;

    this.modal.show({
      title: 'Edit Habit',
      body: `
        <div class="input-group" style="margin-bottom: 16px;">
          <label class="label-micro" for="editHabitName">Name</label>
          <input type="text" id="editHabitName" value="${habit.name.replace(/"/g, '&quot;')}">
        </div>
        <div class="input-group">
          <span class="label-micro">Color</span>
          <div class="color-selector" id="editColorSelector" role="radiogroup" aria-label="Habit color">
            ${colorOptions}
            ${colorPickerHTML}
          </div>
        </div>
      `,
      confirmText: 'Save',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const nameInput = document.getElementById('editHabitName');
        const activeColor = document.querySelector('#editColorSelector .color-opt.active');
        const newName = nameInput ? nameInput.value.trim() : habit.name;

        // Check if custom color picker is active
        let newColor = habit.color;
        if (activeColor) {
          if (activeColor.classList.contains('color-picker-opt')) {
            const picker = document.getElementById('editCustomColorPicker');
            newColor = picker ? picker.value : habit.color;
          } else {
            newColor = activeColor.dataset.color;
          }
        }

        if (!newName) return;

        try {
          await HabitAPI.update(habit.id, { name: newName, color: newColor });
          await this.refresh();
          this.container.dispatchEvent(new CustomEvent('habit-updated', { bubbles: true }));
        } catch (error) {
          console.error('Error updating habit:', error);
        }
      }
    });

    // Attach color selector interaction inside modal
    const colorSelector = document.getElementById('editColorSelector');
    const customColorPicker = document.getElementById('editCustomColorPicker');

    if (colorSelector) {
      colorSelector.addEventListener('click', (e) => {
        const opt = e.target.closest('.color-opt');
        if (!opt) return;

        // If it's the custom color picker, trigger the input
        if (opt.classList.contains('color-picker-opt')) {
          customColorPicker.click();
          return;
        }

        colorSelector.querySelectorAll('.color-opt').forEach(o => {
          o.classList.remove('active');
          o.setAttribute('aria-checked', 'false');
        });
        opt.classList.add('active');
        opt.setAttribute('aria-checked', 'true');
      });

      // Handle custom color picker change
      if (customColorPicker) {
        customColorPicker.addEventListener('change', (e) => {
          const customColor = e.target.value;
          const pickerOpt = e.target.closest('.color-picker-opt');

          colorSelector.querySelectorAll('.color-opt').forEach(o => {
            o.classList.remove('active');
            o.setAttribute('aria-checked', 'false');
          });

          pickerOpt.classList.add('active');
          pickerOpt.setAttribute('aria-checked', 'true');
          pickerOpt.style.setProperty('--custom-color', customColor);
        });
      }
    }
  }

  confirmDelete(habit) {
    this.modal.show({
      title: 'Delete Habit',
      body: `<p style="font-size: 14px; color: var(--c-text-secondary);">Are you sure you want to delete <strong>"${habit.name.replace(/"/g, '&quot;')}"</strong>? This action cannot be undone.</p>`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await HabitAPI.delete(habit.id);
          await this.refresh();
          this.container.dispatchEvent(new CustomEvent('habit-updated', { bubbles: true }));
        } catch (error) {
          console.error('Error deleting habit:', error);
        }
      }
    });

    // Style the confirm button as destructive
    const confirmBtn = document.querySelector('.modal-btn-confirm');
    if (confirmBtn) {
      confirmBtn.style.background = '#ff4444';
    }
  }

  attachEventListeners(listWrap) {
    // Click handler
    listWrap.addEventListener('click', (e) => {
      // Ignore clicks on action buttons
      if (e.target.closest('.habit-actions')) return;

      const item = e.target.closest('.habit-item');
      if (!item) return;
      this.toggleHabit(item);
    });

    // Keyboard handler
    listWrap.addEventListener('keydown', (e) => {
      const item = e.target.closest('.habit-item');
      if (!item) return;

      if (e.key === 'Enter' || e.key === ' ') {
        // Don't toggle if focus is on an action button
        if (e.target.closest('.habit-actions')) return;
        e.preventDefault();
        this.toggleHabit(item);
      }

      // Arrow key navigation between habit items
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = Array.from(listWrap.querySelectorAll('.habit-item'));
        const currentIndex = items.indexOf(item);
        let nextIndex;

        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        }

        items[nextIndex].focus();
      }
    });
  }

  async toggleHabit(item) {
    const habitId = item.dataset.habitId;
    const checkbox = item.querySelector('.checkbox');

    try {
      const result = await ExecutionAPI.toggle(habitId);
      const habit = this.habits.find(h => String(h.id) === String(habitId));
      const streak = this.streaks[habitId] || { currentStreak: 0 };

      if (result.completed) {
        item.classList.add('completed');
        checkbox.setAttribute('aria-checked', 'true');
        checkbox.innerHTML = `
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="2"/>
          </svg>
        `;
      } else {
        item.classList.remove('completed');
        checkbox.setAttribute('aria-checked', 'false');
        checkbox.innerHTML = '';
      }

      // Update aria-label
      const habitName = habit ? habit.name : 'Habit';
      item.setAttribute('aria-label',
        `${habitName}, streak ${streak.currentStreak} days, ${result.completed ? 'completed' : 'not completed'}`
      );

      // Trigger refresh event
      this.container.dispatchEvent(new CustomEvent('habit-toggled', {
        bubbles: true,
        detail: { habitId, completed: result.completed }
      }));
    } catch (error) {
      console.error('Error toggling habit:', error);
      if (window.Toast) {
        window.Toast.error('Failed to update habit. Please try again.');
      }
    }
  }

  async refresh() {
    const [habits, streaksData] = await Promise.all([
      ExecutionAPI.getHabitsStatus(),
      AnalyticsAPI.getAllStreaks()
    ]);

    await this.render(habits, streaksData);
  }
}
