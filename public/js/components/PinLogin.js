import { AuthAPI } from '../api.js';

export class PinLogin {
  constructor(container) {
    this.container = container;
    this.selectedUser = null;
    this.pin = '';
    this.isLoading = false;
  }

  render() {
    this.container.innerHTML = `
      <div class="pin-screen">
        <div class="pin-content">
          <div class="pin-title">HABIT SEQUENCE</div>
          <div class="pin-subtitle">SELECT PROFILE</div>

          <div class="pin-users" id="pinUsers">
            <button class="pin-user-btn" data-username="allodasha">
              <div class="pin-user-avatar">A</div>
              <div class="pin-user-name">allodasha</div>
            </button>
            <button class="pin-user-btn" data-username="bunnycharl">
              <div class="pin-user-avatar">B</div>
              <div class="pin-user-name">bunnycharl</div>
            </button>
          </div>

          <div class="pin-entry" id="pinEntry" style="display: none;">
            <div class="pin-back" id="pinBack">&larr; back</div>
            <div class="pin-selected-user" id="pinSelectedUser"></div>
            <div class="pin-dots" id="pinDots">
              <div class="pin-dot"></div>
              <div class="pin-dot"></div>
              <div class="pin-dot"></div>
              <div class="pin-dot"></div>
            </div>
            <div class="pin-error" id="pinError"></div>
            <div class="pin-keypad" id="pinKeypad">
              <button class="pin-key" data-key="1">1</button>
              <button class="pin-key" data-key="2">2</button>
              <button class="pin-key" data-key="3">3</button>
              <button class="pin-key" data-key="4">4</button>
              <button class="pin-key" data-key="5">5</button>
              <button class="pin-key" data-key="6">6</button>
              <button class="pin-key" data-key="7">7</button>
              <button class="pin-key" data-key="8">8</button>
              <button class="pin-key" data-key="9">9</button>
              <button class="pin-key pin-key-empty"></button>
              <button class="pin-key" data-key="0">0</button>
              <button class="pin-key pin-key-delete" data-key="delete">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
                  <line x1="18" y1="9" x2="12" y2="15"/>
                  <line x1="12" y1="9" x2="18" y2="15"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEvents();
  }

  setupEvents() {
    // User selection
    document.getElementById('pinUsers').addEventListener('click', (e) => {
      const btn = e.target.closest('.pin-user-btn');
      if (!btn) return;
      this.selectUser(btn.dataset.username);
    });

    // Back button
    document.getElementById('pinBack').addEventListener('click', () => {
      this.goBack();
    });

    // Keypad
    document.getElementById('pinKeypad').addEventListener('click', (e) => {
      const key = e.target.closest('.pin-key');
      if (!key || key.classList.contains('pin-key-empty')) return;
      const value = key.dataset.key;
      if (value === 'delete') {
        this.deleteDigit();
      } else {
        this.addDigit(value);
      }
    });

    // Physical keyboard support
    document.addEventListener('keydown', this._keyHandler = (e) => {
      if (!this.selectedUser) return;
      if (e.key >= '0' && e.key <= '9') {
        this.addDigit(e.key);
      } else if (e.key === 'Backspace') {
        this.deleteDigit();
      }
    });
  }

  selectUser(username) {
    this.selectedUser = username;
    this.pin = '';

    document.getElementById('pinUsers').style.display = 'none';
    document.querySelector('.pin-subtitle').style.display = 'none';
    document.getElementById('pinEntry').style.display = 'flex';
    document.getElementById('pinSelectedUser').textContent = username;
    document.getElementById('pinError').textContent = '';
    this.updateDots();
  }

  goBack() {
    this.selectedUser = null;
    this.pin = '';

    document.getElementById('pinUsers').style.display = 'flex';
    document.querySelector('.pin-subtitle').style.display = 'block';
    document.getElementById('pinEntry').style.display = 'none';
  }

  addDigit(digit) {
    if (this.pin.length >= 4 || this.isLoading) return;
    this.pin += digit;
    this.updateDots();

    if (this.pin.length === 4) {
      this.submit();
    }
  }

  deleteDigit() {
    if (this.pin.length === 0 || this.isLoading) return;
    this.pin = this.pin.slice(0, -1);
    this.updateDots();
    document.getElementById('pinError').textContent = '';
  }

  updateDots() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('filled', i < this.pin.length);
    });
  }

  async submit() {
    this.isLoading = true;

    try {
      const result = await AuthAPI.login(this.selectedUser, this.pin);

      localStorage.setItem('authToken', result.token);
      localStorage.setItem('authUser', result.username);

      // Remove keyboard listener
      if (this._keyHandler) {
        document.removeEventListener('keydown', this._keyHandler);
      }

      // Notify app
      window.dispatchEvent(new Event('auth-login'));
    } catch (error) {
      this.pin = '';
      this.updateDots();
      this.isLoading = false;

      // Shake animation
      const dotsContainer = document.getElementById('pinDots');
      dotsContainer.classList.add('shake');
      setTimeout(() => dotsContainer.classList.remove('shake'), 500);

      document.getElementById('pinError').textContent = 'Wrong PIN';
    }
  }

  destroy() {
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
    }
  }
}
