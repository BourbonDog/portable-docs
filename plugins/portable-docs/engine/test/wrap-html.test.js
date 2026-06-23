const test=require('node:test');const assert=require('node:assert');
const fs=require('fs');const os=require('os');const path=require('path');
const {wrapHtml}=require('../scripts/wrap-html.js');
test('wrapHtml emits classic-runtime pieces and strips any default export',()=>{
  const out=path.join(os.tmpdir(),'pd-wrap-test.html');
  wrapHtml({jsx:'const Doc=()=>React.createElement("div",null,"x");\nexport default Doc;',title:'T',out});
  const h=fs.readFileSync(out,'utf8');
  assert.ok(h.includes('react-classic'),'preset');
  assert.ok(h.includes('data-presets="react-classic"'),'data-presets');
  assert.ok(/ReactDOM\.createRoot/.test(h),'createRoot');
  assert.ok(!/export default/.test(h),'default export stripped');
});
