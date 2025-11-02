export function dotToNested(obj: Record<string, unknown>) {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split('.');
    let cur = out;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]!;
      if (i === parts.length - 1) {
        cur[p] = value;
      } else {
        cur[p] = cur[p] ?? {};
        cur = cur[p];
      }
    }
  }
  return out;
}
