import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

const FORBIDDEN_NAME_FRAGMENTS = [
  'runtime_spec',
  'deltax-python-runtime',
  'canon.docx',
  'canon.pdf',
  'private/deltax',
];

const FORBIDDEN_CONTENT_PATTERNS = [
  /deltax-python-runtime/i,
  /runtime_spec\.(docx|txt)/i,
  /DeltaX Canon/i,
  /proprietary (?:math|mathematics) reproduced/i,
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'telemetry-out') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

describe('private-boundary', () => {
  it('repo tree has no private runtime / canon filenames', () => {
    const files = walk(ROOT);
    for (const f of files) {
      const lower = f.toLowerCase();
      for (const frag of FORBIDDEN_NAME_FRAGMENTS) {
        assert.ok(!lower.includes(frag.toLowerCase()), `forbidden path fragment ${frag} in ${f}`);
      }
    }
  });

  it('tracked text sources do not embed private runtime paths or canon', () => {
    const files = walk(ROOT).filter((f) =>
      ['.js', '.md', '.yaml', '.yml', '.json', '.html', '.example'].includes(extname(f)),
    );
    for (const f of files) {
      if (f.endsWith('private-boundary.test.js')) continue;
      const text = readFileSync(f, 'utf8');
      for (const re of FORBIDDEN_CONTENT_PATTERNS) {
        assert.ok(!re.test(text), `${f} matches ${re}`);
      }
    }
  });
});
