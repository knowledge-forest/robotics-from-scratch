import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROADMAP = join(ROOT, 'content', 'ROADMAP.md');
const PHASE_DIR = join(ROOT, 'content', 'phase');
const OUT = join(ROOT, 'frontend', 'data', 'data.js');

/* ─────────────────────────  ROADMAP  ───────────────────────── */

function parseProgress(md) {
  const done = {};
  for (const line of md.split('\n')) {
    const m = line.match(/^-\s*\[([ x])\]\s*([\d-]+)/);
    if (m) done[m[2]] = m[1] === 'x';
  }
  return done;
}

function parsePhases(md, done) {
  const phases = [];
  let phase = null;
  for (const line of md.split('\n')) {
    const p = line.match(/^##\s+Phase\s+(\d+)\s+—\s+(.+?)\s*(?:\(([^)]+)\))?\s*(?:⚡([\d→]+))?\s*(?:←.*)?$/);
    if (p) {
      phase = { id: Number(p[1]), title: p[2].trim(), weeks: p[3] || '', difficulty: p[4] || '', lessons: [] };
      phases.push(phase);
      continue;
    }
    if (!phase) continue;
    const g = line.match(/^\*\*目標\*\*:\s*(.+)/);
    if (g) { phase.goal = g[1].trim(); continue; }
    const l = line.match(/^###\s+(\d+)\.(\d+)\s+(.+)/);
    if (l) {
      const key = `${l[1]}-${l[2]}`;
      const name = l[3]
        .replace(/\s*⚡[\d→]+\s*$/, '')   // drop difficulty ⚡3
        .replace(/\s*[（(].*$/, '')       // drop (第N週…) note
        .replace(/\s*—.*$/, '')           // drop — subtitle
        .trim();
      phase.lessons.push({ id: key, name, status: done[key] ? 'complete' : 'planned' });
    }
  }
  for (const ph of phases) {
    if (ph.lessons.length === 0) {
      const key = String(ph.id);
      ph.lessons.push({ id: key, name: ph.title, status: done[key] ? 'complete' : 'planned' });
    }
  }
  return phases;
}

/* ─────────────────────  MARKDOWN → HTML  ───────────────────── */
// Minimal, build-time. Handles: # ## ###, > quote, ``` fence,
// box-art tables, - lists, **bold**, `code`, paragraphs.

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

const BOX = /[\u2500-\u257F]/; // box-drawing chars

function mdToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let para = [], list = [], i = 0;
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(''))}</p>`); para = []; } };
  const flushList = () => { if (list.length) { out.push(`<ul>${list.map(x => `<li>${inline(x)}</li>`).join('')}</ul>`); list = []; } };
  const flush = () => { flushPara(); flushList(); };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {                       // fenced code
      flush(); const buf = []; i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`);
      continue;
    }
    if (BOX.test(line)) {                                // raw box-art table
      flush(); const buf = [];
      while (i < lines.length && BOX.test(lines[i])) buf.push(lines[i++]);
      out.push(`<pre class="ascii">${esc(buf.join('\n'))}</pre>`);
      continue;
    }
    const h = line.match(/^(#{1,3})\s+(.+)/);            // heading
    if (h) { flush(); const n = h[1].length; out.push(`<h${n}>${inline(h[2])}</h${n}>`); i++; continue; }

    if (line.startsWith('> ')) {                          // blockquote
      flush(); out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`); i++; continue;
    }
    if (/^[-*]\s+/.test(line)) {                          // list item
      flushPara(); list.push(line.replace(/^[-*]\s+/, '')); i++; continue;
    }
    if (!line.trim()) { flush(); i++; continue; }         // blank = break

    flushList(); para.push(line); i++;                    // paragraph line
  }
  flush();
  return out.join('\n');
}

/* ─────────────────────  DOC DISCOVERY  ─────────────────────── */

function parseDocs() {
  const docs = [];
  const phaseDirs = readdirSync(PHASE_DIR).filter(d => /^phase\d+$/.test(d)).sort();
  for (const pd of phaseDirs) {
    const phaseNum = Number(pd.replace('phase', ''));
    const lessonDirs = readdirSync(join(PHASE_DIR, pd)).filter(d => /^\d+-/.test(d)).sort();
    for (const ld of lessonDirs) {
      const md = readFileSync(join(PHASE_DIR, pd, ld, 'cn.md'), 'utf8');
      const title = (md.match(/^#\s+(.+)/m) || [, ld])[1].trim();
      const blurb = (md.match(/^>\s+(.+)/m) || [, ''])[1].trim();
      docs.push({
        id: `${phaseNum}/${ld}`,
        phase: phaseNum,
        order: Number(ld.match(/^(\d+)/)[1]),
        slug: ld,
        title,
        blurb,
        html: mdToHtml(md),
      });
    }
  }
  return docs;
}

/* ──────────────────────────  BUILD  ────────────────────────── */

function build() {
  const roadmapMd = readFileSync(ROADMAP, 'utf8');
  const done = parseProgress(roadmapMd);
  const phases = parsePhases(roadmapMd, done);
  const docs = parseDocs();

  const total = phases.reduce((n, p) => n + p.lessons.length, 0);
  const complete = phases.reduce((n, p) => n + p.lessons.filter(l => l.status === 'complete').length, 0);

  const out =
    `// AUTO-GENERATED by scripts/build.mjs — do not edit.\n` +
    `window.PHASES = ${JSON.stringify(phases, null, 2)};\n` +
    `window.DOCS = ${JSON.stringify(docs)};\n` +
    `window.STATS = ${JSON.stringify({ total, complete, phases: phases.length, docs: docs.length })};\n`;

  writeFileSync(OUT, out, 'utf8');
  console.log(`✅ ${phases.length} phases, ${total} lessons (${complete} complete), ${docs.length} docs → data.js`);
}

build();