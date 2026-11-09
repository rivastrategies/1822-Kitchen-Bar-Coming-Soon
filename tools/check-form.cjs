// Exercise delivery outcomes without sending additional external applications.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../careers/careers.js'), 'utf8');

function setup({host = 'localhost', mode = 'draft', reply = {ok: true}, status = 200, reject = false, hold = false, valid = true} = {}) {
  const events = {}; const sent = []; const tracked = [];
  const input = (value = '') => ({value, type: 'text', removeAttribute(){}, setAttribute(){}, setCustomValidity(){}, checkValidity(){return valid;}, focus(){}, reportValidity(){}});
  const inputs = {name: input('QA Test'), email: input('qa@example.com'), resume_url: input(), phone: input(), _gotcha: input()};
  const form = {elements: inputs, resetCount: 0, querySelectorAll(){return Object.values(inputs);}, addEventListener(n,fn){events[n]=fn;}, setAttribute(){},removeAttribute(){},reset(){this.resetCount++;}};
  const button = {disabled: true}; const nodes = [];
  const feedback = {hidden: true,classList:{toggle(){}},replaceChildren(){nodes.length=0;},append(...items){nodes.push(...items);},focus(){}};
  const generic = {};
  const document = {getElementById(id){return {'application-form':form,'submit-application':button,'form-feedback':feedback}[id]||generic;},createElement(){return {};},querySelector(){return generic;}};
  let finish;
  const response = {ok: status >= 200 && status < 300, status, json:async()=>reply};
  const context = {document, window:{siteConfig:{mode,careersEndpoint:'https://formspree.io/f/mljjyqaw'},is1822Live: mode==='live'&&host==='1822kitchenandbar.com',rrAnalytics:{trackEvent(n,p){tracked.push([n,p]);}}}, location:{hostname:host}, URL, crypto:require('node:crypto').webcrypto, AbortController, setTimeout, clearTimeout, Date,
    FormData:class{constructor(){this.values={name:'QA Test',email:'qa@example.com'};}set(k,v){this.values[k]=v;}},
    fetch:async(url,options)=>{sent.push({url,options});if(reject)throw new Error('network');if(hold)await new Promise(r=>finish=r);return response;}
  };
  vm.runInNewContext(source,context);
  return {form,button,nodes,sent,tracked,events, finish:()=>finish(),submit:()=>events.submit({preventDefault(){}})};
}

(async()=>{
  let s=setup({valid:false});await s.submit();assert.equal(s.sent.length,0);assert.equal(s.form.resetCount,0);
  s=setup({host:'staging.example.com'});await s.submit();assert.equal(s.button.disabled,true);assert.equal(s.sent.length,0);
  s=setup({hold:true});const pending=s.submit();await s.submit();assert.equal(s.sent.length,1);assert.equal(s.button.disabled,true);s.finish();await pending;assert.equal(s.form.resetCount,1);assert.equal(s.button.disabled,true);await s.submit();assert.equal(s.sent.length,1);assert.equal(s.tracked.length,0);assert.equal(s.sent[0].options.body.values.environment,'draft');assert.match(s.sent[0].options.body.values.submission_id,/^1822-TEST-/);assert.equal(s.sent[0].options.body.values.submission_page,'/careers/');
  for (const options of [{reply:{ok:false}}, {reply:null}, {status:422,reply:{errors:[{message:'Invalid'}]}}, {reject:true}]) {
    s=setup(options);await s.submit();assert.equal(s.form.resetCount,0);assert.equal(s.button.disabled,false);assert.notEqual(s.nodes[0].textContent,'Test application saved.');
  }
  s=setup({host:'1822kitchenandbar.com',mode:'live'});await s.submit();assert.equal(s.tracked[0][0],'career_application_submit');assert.equal(s.tracked[0][1].provider,'formspree');assert.equal(Object.keys(s.tracked[0][1]).length,1);
  const application=s.sent[0].options.body.values;
  assert.equal(application.environment,'production');assert.equal(application.submission_type,'career_application');assert.equal(application._subject,'1822 Kitchen & Bar — Application');assert.match(application.submission_id,/^1822-(?!TEST-)/);assert.equal(s.button.textContent,'Application received ✓');
  s=setup({host:'localhost',mode:'live'});await s.submit();assert.equal(s.button.disabled,true);assert.equal(s.sent.length,0);
  console.log('PASS: invalid/held/public-draft submissions blocked; concurrent and repeat submits suppressed; confirmed receipt only; errors preserve entries; draft analytics suppressed; tracking metadata present; no applicant details in custom analytics.');
})().catch(error=>{console.error(error);process.exit(1);});
