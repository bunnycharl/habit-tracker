/**
 * Toast Notification System
 * Replaces alert() calls with non-blocking, accessible toast notifications.
 */

class ToastManager {
  constructor() {
    this.container = null;
    this.queue = [];
    this.maxVisible = 5;
    this.defaultDuration = 4000;
  }

  init() {
    this.container = document.getElementById('toastContainer');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toastContainer';
      this.container.className = 'toast-container';
      this.container.setAttribute('role', 'status');
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'false');
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', duration = this.defaultDuration) {
    if (!this.container) this.init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');

    const icon = this.getIcon(type);

    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">${icon}</span>
      <span class="toast-message">${this.escapeHtml(message)}</span>
      <button class="toast-close" aria-label="Dismiss notification" type="button">&times;</button>
    `;

    // Close button handler
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.dismiss(toast));

    // Keyboard dismiss
    toast.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.dismiss(toast);
      }
    });

    this.container.appendChild(toast);

    // Trigger entrance animation
    requestAnimationFrame(() => {
      toast.classList.add('toast-enter');
    });

    // Auto dismiss
    if (duration > 0) {
      toast.timeoutId = setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }

    // Remove oldest if exceeding max
    const visible = this.container.querySelectorAll('.toast');
    if (visible.length > this.maxVisible) {
      this.dismiss(visible[0]);
    }

    return toast;
  }

  dismiss(toast) {
    if (!toast || !toast.parentNode) return;

    clearTimeout(toast.timeoutId);
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    });
  }

  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration || 6000);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }

  getIcon(type) {
    switch (type) {
      case 'success':
        return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      case 'error':
        return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      case 'warning':
        return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v6M8 12v1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      case 'info':
      default:
        return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 5v1M8 8v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Singleton instance
const Toast = new ToastManager();

// Expose globally for use in all modules
window.Toast = Toast;

export { ToastManager };
export default Toast;
