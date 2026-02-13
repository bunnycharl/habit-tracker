/**
 * Modal Component
 * Accessible modal dialog with focus trapping and keyboard support
 */

export class Modal {
  constructor() {
    this.overlay = null;
    this.modalEl = null;
    this.previousFocus = null;
    this.onConfirm = null;
    this.onClose = null;
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._createOverlay();
  }

  _createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
    document.body.appendChild(this.overlay);
  }

  /**
   * Show the modal with given content
   * @param {object} options - { title, body (HTML string), confirmText, cancelText, onConfirm, onClose }
   */
  show({ title = '', body = '', confirmText = 'Confirm', cancelText = 'Cancel', onConfirm = null, onClose = null }) {
    this.onConfirm = onConfirm;
    this.onClose = onClose;
    this.previousFocus = document.activeElement;

    this.overlay.innerHTML = '';

    this.modalEl = document.createElement('div');
    this.modalEl.className = 'modal-content';
    this.modalEl.setAttribute('role', 'document');

    const header = document.createElement('div');
    header.className = 'modal-header';

    const titleEl = document.createElement('h3');
    titleEl.className = 'modal-title';
    titleEl.textContent = title;
    this.overlay.setAttribute('aria-label', title);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close-btn';
    closeBtn.setAttribute('aria-label', 'Close dialog');
    closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="2"/></svg>`;
    closeBtn.addEventListener('click', () => this.close());

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    const bodyEl = document.createElement('div');
    bodyEl.className = 'modal-body';
    bodyEl.innerHTML = body;

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'modal-btn modal-btn-cancel';
    cancelBtn.textContent = cancelText;
    cancelBtn.addEventListener('click', () => this.close());

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'modal-btn modal-btn-confirm';
    confirmBtn.textContent = confirmText;
    confirmBtn.addEventListener('click', () => this.confirm());

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    this.modalEl.appendChild(header);
    this.modalEl.appendChild(bodyEl);
    this.modalEl.appendChild(footer);
    this.overlay.appendChild(this.modalEl);

    this.overlay.classList.add('active');
    document.addEventListener('keydown', this._handleKeyDown);

    // Focus the first focusable element
    requestAnimationFrame(() => {
      const firstInput = this.modalEl.querySelector('input, select, textarea');
      if (firstInput) {
        firstInput.focus();
      } else {
        confirmBtn.focus();
      }
    });
  }

  confirm() {
    if (this.onConfirm) {
      this.onConfirm();
    }
    this._cleanup();
  }

  close() {
    if (this.onClose) {
      this.onClose();
    }
    this._cleanup();
  }

  _cleanup() {
    this.overlay.classList.remove('active');
    document.removeEventListener('keydown', this._handleKeyDown);
    if (this.previousFocus) {
      this.previousFocus.focus();
    }
  }

  _handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
      return;
    }

    // Focus trapping
    if (e.key === 'Tab' && this.modalEl) {
      const focusable = this.modalEl.querySelectorAll(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  destroy() {
    this._cleanup();
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}
