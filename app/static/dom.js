// Element names and attributes are chosen by the UI. Values are appended as text.
export function node(tag, className = '', ...children) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  for (const child of children) {
    if (child != null) element.append(child);
  }
  return element;
}

export function actionButton(className, action, ...children) {
  const button = node('button', className, ...children);
  button.type = 'button';
  button.dataset.action = action;
  return button;
}

export function emptyMessage(message) {
  return node('div', 'empty-state', node('p', '', message));
}

export function errorMessage(title, message) {
  const alert = node('div', 'error-state', node('h3', '', title), node('p', '', message));
  alert.setAttribute('role', 'alert');
  return alert;
}

// Only http(s) links from the source catalogue are rendered as clickable links.
export function safeUrl(url) {
  try {
    const parsed = new URL(String(url));
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : '';
  } catch {
    return '';
  }
}
