// Reader progress — which lessons the visitor ticked. localStorage only.
const KEY = 'rfs.progress.v1';   // bump .v2 if shape changes

const read = () => new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
const write = (set) => localStorage.setItem(KEY, JSON.stringify([...set]));

export const isDone = (id) => read().has(id);

export function toggle(id) {
  const s = read();
  s.has(id) ? s.delete(id) : s.add(id);
  write(s);
  return s.has(id);
}

export const doneCount = () => read().size;