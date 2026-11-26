// Builds interface elements and validates links from the source catalogue.

/**
 * Create an element, appending non-null text or child nodes without parsing HTML.
 * @template {keyof HTMLElementTagNameMap} Tag
 * @param {Tag} tag HTML tag name.
 * @param {string} [className] CSS classes to apply.
 * @param {...(Node|string|number|null|undefined)} children Child nodes or text values.
 * @returns {HTMLElementTagNameMap[Tag]} New element with its children attached.
 */
export function node(tag, className = '', ...children) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  for (const child of children) {
    if (child != null) element.append(child);
  }
  return element;
}

/**
 * Create a non-submit button that dispatches through the delegated click handler.
 * @param {string} className CSS classes to apply.
 * @param {string} action Key in the delegated action map.
 * @param {...(Node|string|number|null|undefined)} children Button contents.
 * @returns {HTMLButtonElement} Button with its action data attribute set.
 */
export function actionButton(className, action, ...children) {
  const button = node('button', className, ...children);
  button.type = 'button';
  button.dataset.action = action;
  return button;
}

/**
 * Build a panel for a view with no content to display.
 * @param {string} message Text explaining the empty state.
 * @returns {HTMLDivElement} Empty-state panel.
 */
export function emptyMessage(message) {
  return node('div', 'empty-state', node('p', '', message));
}

/**
 * Build an error panel that assistive technology can announce as an alert.
 * @param {string} title Short error heading.
 * @param {string} message Error detail or recovery guidance.
 * @returns {HTMLDivElement} Alert panel.
 */
export function errorMessage(title, message) {
  const alert = node('div', 'error-state', node('h3', '', title), node('p', '', message));
  alert.setAttribute('role', 'alert');
  return alert;
}

/**
 * Allow only absolute HTTP and HTTPS URLs in clickable source links.
 * @param {unknown} url Candidate URL before parsing.
 * @returns {string} Normalized allowed URL, or an empty string on rejection.
 */
export function safeUrl(url) {
  try {
    const parsed = new URL(String(url));
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : '';
  } catch {
    return '';
  }
}
