# Vendored runtime assets

These files are committed (not installed) so the plugin runs with zero `npm install`.

| File | Package | Version | Source | Used |
|------|---------|---------|--------|------|
| react.production.min.js | react | 18.3.1 | https://unpkg.com/react@18.3.1/umd/react.production.min.js | inlined into every output HTML |
| react-dom.production.min.js | react-dom | 18.3.1 | https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js | inlined into every output HTML |
| babel.min.js | @babel/standalone | 7.26.4 | https://unpkg.com/@babel/standalone@7.26.4/babel.min.js | build-time JSX→JS compile (Node only; never shipped) |

React and Babel are both MIT-licensed. To update, re-download the pinned URLs and bump the versions here.
