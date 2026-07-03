// Theme = light|dark on <html data-theme>. Persist in localStorage.
const KEY = 'rfs.theme';

export const getTheme = () => document.documentElement.dataset.theme || 'light';

export function setTheme(t) {
  document.documentElement.dataset.theme = t;
  localStorage.setItem(KEY, t);
}

export const toggleTheme = () => setTheme(getTheme() === 'dark' ? 'light' : 'dark');
