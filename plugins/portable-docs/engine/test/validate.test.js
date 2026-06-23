const test=require('node:test');const assert=require('node:assert');
const fs=require('fs');const os=require('os');const path=require('path');
const {validate}=require('../scripts/validate.js');
const GOOD=`<!doctype html><html><head>
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script>Babel.registerPreset('react-classic',{presets:[[Babel.availablePresets.react,{runtime:'classic'}]]});</script>
</head><body><div id="root"></div>
<script type="text/babel" data-presets="react-classic">const App=()=>null;const root=ReactDOM.createRoot(document.getElementById('root'));root.render(React.createElement(App));</script>
</body></html>`;
function tmp(name,content){const p=path.join(os.tmpdir(),name);fs.writeFileSync(p,content);return p;}
test('valid HTML passes',()=>{const r=validate({htmlPath:tmp('pd-good.html',GOOD)});assert.equal(r.ok,true,JSON.stringify(r.errors));});
test('HTML missing classic-runtime preset fails',()=>{
  const bad=GOOD.replace(/<script>Babel\.registerPreset[\s\S]*?<\/script>/,'').replace('data-presets="react-classic"','');
  const r=validate({htmlPath:tmp('pd-bad.html',bad)});
  assert.equal(r.ok,false);
  assert.ok(r.errors.some(e=>/classic/i.test(e)),'expected a classic-runtime error');
});
