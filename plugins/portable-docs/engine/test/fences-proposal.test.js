'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

test('proposal: fenced @stats example survives as code; real @stats renders', () => {
  const eng = path.join(__dirname, '..', 'scripts', 'build-doc.js');
  const input = path.join(__dirname, 'fixtures', 'fence-proposal.md');
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pd-fencep-')), 'p.html');
  execFileSync('node', [eng, '--input', input, '--out', out, '--no-open', '--no-config'], { stdio: 'pipe' });
  const html = fs.readFileSync(out, 'utf-8');
  assert.ok(html.includes('label=\\"Example\\"') || html.includes('label="Example"'), 'fenced example survives as code');
  assert.ok(html.includes('Real'), 'real stat label renders');
});
