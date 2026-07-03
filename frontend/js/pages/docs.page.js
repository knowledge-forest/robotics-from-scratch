import { el } from '../lib/dom.js';

const docs = window.DOCS;

// Group docs by phase → [{ phase, items:[...] }]
const groups = [];
for (const d of docs) {
  let g = groups.find(x => x.phase === d.phase);
  if (!g) groups.push(g = { phase: d.phase, items: [] });
  g.items.push(d);
}

const nav = document.getElementById('docs-nav');
const body = document.getElementById('doc-body');

function show(id) {
  const doc = docs.find(d => d.id === id) || docs[0];
  body.innerHTML = doc.html;                       // pre-rendered at build → trusted
  body.scrollTo?.(0, 0);
  for (const a of nav.querySelectorAll('a'))
    a.classList.toggle('is-active', a.dataset.id === doc.id);
  if (location.hash.slice(1) !== doc.id) history.replaceState(null, '', `#${doc.id}`);
}

// Build sidebar
for (const g of groups) {
  nav.append(el('h4', {}, `Phase ${g.phase}`));
  for (const d of g.items)
    nav.append(el('a', {
      href: `#${d.id}`, dataset: { id: d.id },
      onclick: (e) => { e.preventDefault(); show(d.id); },
    }, d.title));
}

// Initial + back/forward
show(location.hash.slice(1));
addEventListener('hashchange', () => show(location.hash.slice(1)));
