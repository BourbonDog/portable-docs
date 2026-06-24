'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const FILES = {
  proposal: ['..', 'src', 'utils', 'build.js'],
  article:  ['..', 'scripts', 'build-article.js'],
  slides:   ['..', 'scripts', 'build-slides.js'],
};
for (const [name, parts] of Object.entries(FILES)) {
  test(`${name} bundler registers the diagram components`, () => {
    const src = fs.readFileSync(path.join(__dirname, ...parts), 'utf8');
    for (const c of ['DiagramError', 'QuadrantChart', 'FlowDiagram']) {
      assert.ok(src.includes(`'${c}'`), `${name} bundler array must include '${c}'`);
    }
  });
}
