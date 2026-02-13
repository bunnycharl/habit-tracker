/**
 * DOM utility functions
 */

export function createElement(tag, className = '', innerHTML = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (innerHTML) el.innerHTML = innerHTML;
  return el;
}

export function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function setTextContent(selector, text) {
  const el = document.querySelector(selector);
  if (el) el.textContent = text;
}

export function updateElement(selector, updates) {
  const el = document.querySelector(selector);
  if (!el) return;

  Object.entries(updates).forEach(([key, value]) => {
    if (key === 'text') {
      el.textContent = value;
    } else if (key === 'html') {
      el.innerHTML = value;
    } else if (key.startsWith('data-')) {
      el.setAttribute(key, value);
    } else {
      el[key] = value;
    }
  });
}
