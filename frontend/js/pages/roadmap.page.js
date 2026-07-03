import { el } from '../lib/dom.js';
import { isDone, toggle, doneCount } from '../lib/store.js';

const phases = window.PHASES;
const total = window.STATS.total;

// ── Progress bar (top) ────────────────────────────────
const fill = el('div', { className: 'progress-fill' });
const label = el('div', { className: 'progress-label' });

function refreshBar() {
  const done = doneCount();
  fill.style.width = `${(done / total) * 100}%`;
  label.textContent = `${done} / ${total} 課完成`;
}

const bar = el('div', { className: 'progress' },
  label,
  el('div', { className: 'progress-track' }, fill),
);

// ── One lesson row ────────────────────────────────────
function lessonRow(lesson) {
  const box = el('input', {
    type: 'checkbox',
    checked: isDone(lesson.id),
    onchange: () => {
      const now = toggle(lesson.id);
      row.classList.toggle('is-done', now);
      refreshBar();
    },
  });
  const row = el('label', { className: 'lesson' + (isDone(lesson.id) ? ' is-done' : '') },
    box,
    el('span', { className: 'lesson-id' }, lesson.id),
    el('span', { className: 'lesson-name' }, lesson.name),
    lesson.status === 'complete' && el('span', { className: 'badge complete' }, '有教學'),
  );
  return row;
}

// ── One phase block ───────────────────────────────────
function phaseBlock(p) {
  return el('section', { className: 'phase' },
    el('div', { className: 'phase-head' },
      el('span', { className: 'phase-title' }, `Phase ${p.id} · ${p.title}`),
      p.weeks && el('span', { className: 'phase-meta' }, p.weeks),
      p.difficulty && el('span', { className: 'diff' }, `⚡${p.difficulty}`),
    ),
    p.goal && el('p', { className: 'phase-goal' }, p.goal),
    ...p.lessons.map(lessonRow),
  );
}

// ── Mount ─────────────────────────────────────────────
const root = document.getElementById('roadmap');
root.append(bar, ...phases.map(phaseBlock));
refreshBar();