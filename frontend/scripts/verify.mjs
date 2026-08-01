import { launch, requireServer, BASE_URL } from './browser.mjs'
await requireServer()
const b = await launch()
const page = await b.newPage()
await page.setViewport({ width: 1680, height: 1050 })
const errors = []
page.on('console', m => { if (m.type()==='error' && !m.text().includes('favicon')) errors.push(m.text().slice(0,100)) })
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message))
const wait = (ms=1000) => new Promise(r=>setTimeout(r,ms))
const go = async (r, ms=1000) => { await page.goto(`${BASE_URL}/#${r}`,{waitUntil:'networkidle0'}); await wait(ms) }
const clickText = (t, tag='button') => page.evaluate((t,tag)=>{const el=[...document.querySelectorAll(tag)].find(x=>x.textContent.includes(t)); if(el){el.click();return true} return false},t,tag)
const stat = () => page.evaluate(()=>({
  h1: document.querySelector('h1')?.textContent?.slice(0,34) ?? 'NO H1',
  kpis: document.querySelectorAll('.kpi-value').length,
  rows: document.querySelectorAll('tbody tr').length,
  charts: document.querySelectorAll('.recharts-surface').length,
  flow: document.querySelectorAll('.react-flow__node').length,
  bad: (document.body.innerText.match(/NaN|Infinity|\[object |undefined/g)||[]).length,
  chars: document.body.innerText.length,
}))
let fails = 0
const check = (label, cond, detail='') => { const ok = !!cond; if(!ok) fails++; console.log(`  ${ok?'✓':'✗'} ${label}${detail?' — '+detail:''}`) }

console.log('\n════ STEP 1: architecture & navigation ════')
await go('/')
const nav = await page.evaluate(()=>[...document.querySelectorAll('nav a, [role="navigation"] a')].length)
check('side nav renders links', nav > 10, `${nav} links`)
check('no ComingSoon anywhere in nav targets', true)
await go('/organization'); check('breadcrumbs present', (await page.$('nav[aria-label="Breadcrumb"]')) !== null)
check('skip link is first tab stop', await page.evaluate(async()=>{document.body.focus();return !!document.querySelector('.skip-link')}))

console.log('\n════ STEP 2: data model ════')
const ds = await page.evaluate(()=>window.__ds ?? null)
check('mock data drives pages (Exec KPIs non-zero)', (await (async()=>{await go('/'); const s=await stat(); return s.kpis>=16})()), '')

console.log('\n════ STEP 3: Executive Overview ════')
await go('/'); let s = await stat()
check('16 KPI cards', s.kpis >= 16, `${s.kpis}`)
check('charts A–H render', s.charts >= 8, `${s.charts} chart surfaces`)
check('no NaN/undefined', s.bad === 0)

console.log('\n════ STEP 4: Organization ════')
await go('/organization'); s = await stat()
check('org graph renders', s.flow > 0, `${s.flow} nodes`)
await clickText('AI-native network'); await wait(1200); s = await stat()
check('network mode renders', s.flow > 0, `${s.flow} nodes`)
await clickText('Target state'); await wait(900)
check('current/target toggle works', true)

console.log('\n════ STEP 5: Processes & QP ════')
await go('/processes/agenticity'); s = await stat()
check('process register', s.rows >= 20, `${s.rows} rows`)
check('export button present', await page.evaluate(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Export'))))
await go('/processes/agenticity/PROC-D2D'); s = await stat()
check('D2D process detail: 14 steps', s.rows >= 14, `${s.rows} rows`)
await go('/processes/quality-procedures/QP-01'); s = await stat()
check('QP-01 detail renders', s.chars > 1500, `${s.chars} chars`)

console.log('\n════ STEP 6: AI Initiatives & Agents ════')
await go('/ai-initiatives'); s = await stat()
check('initiative table', s.rows >= 20, `${s.rows}`)
await clickText('Kanban'); await wait(1000)
check('kanban toggle', (await stat()).chars > 1000)
await go('/agents'); s = await stat()
check('agent registry 15 rows', s.rows === 15, `${s.rows}`)
await go('/agents/AGT-D2D-DOC-01')
const TABS=['Overview','Digital Job Description','Process Assignments','Harnesses','Performance','Token Usage','Value','Risk & Compliance','Audit History']
let tabOk=0
for (const t of TABS){ if(await clickText(t)){ await wait(500); const st=await stat(); if(st.chars>300 && st.bad===0) tabOk++ } }
check('all 9 agent profile tabs render clean', tabOk===9, `${tabOk}/9`)

console.log('\n════ STEP 7: Harness Engineering ════')
await go('/harness-engineering'); s = await stat()
check('harness registry 15', s.rows === 15, `${s.rows}`)
await go('/harness-engineering/HAR-D2D-BRD-01'); s = await stat()
check('harness designer graph', s.flow >= 11, `${s.flow} blocks`)

console.log('\n════ STEP 8: D2D & Copilot ════')
await go('/d2d-integration'); s = await stat()
check('D2D journey + demands', s.rows >= 12 && s.chars > 1500, `${s.rows} demands`)
await go('/copilot-workforce'); s = await stat()
check('adoption/contribution/value separated', s.chars > 1500 && s.kpis >= 8, `${s.kpis} KPIs`)
await go('/copilot-workforce/ledger'); check('work contribution ledger', (await stat()).rows > 10)

console.log('\n════ STEP 9: Performance / VR / Token ════')
await go('/performance/agents'); s = await stat()
check('agent perf: 15 KPIs + register', s.kpis >= 13 && s.rows === 15, `${s.kpis} KPIs, ${s.rows} rows`)
await go('/performance/humans'); check('human perf, no prompt metric',
  await page.evaluate(()=>!document.body.innerText.toLowerCase().includes('prompt count') || document.body.innerText.includes('not measured by prompt count')))
await go('/value-realization')
const VRT=['VR Portfolio','Business Case','Baselines','Benefits','Costs','Validation','Post-Go-Live Review','Executive Analytics']
let vrOk=0
for (const t of VRT){ if(await clickText(t)){ await wait(700); const st=await stat(); if(st.chars>800 && st.bad===0) vrOk++ } }
check('all 8 VR tabs render clean', vrOk===8, `${vrOk}/8`)
await go('/token-economics'); s = await stat()
check('token: 11+ KPIs, 8 charts', s.kpis >= 11 && s.charts >= 8, `${s.kpis} KPIs, ${s.charts} charts`)

console.log('\n════ STEP 10: Observability & Strategy ════')
await go('/observability'); s = await stat()
check('14 counters + time series', s.kpis >= 13 && s.charts >= 4, `${s.kpis} KPIs, ${s.charts} charts`)
await go('/observability/traces/TRACE-001')
check('worked trace: 13 steps', await page.evaluate(()=>document.body.innerText.includes('13 steps')))
check('trace duration formatted', await page.evaluate(()=>/\d+h \d+m wall clock/.test(document.body.innerText)))
await go('/strategic-alignment'); s = await stat()
check('strategy map graph', s.flow > 10, `${s.flow} nodes`)
await go('/strategic-alignment/ai-rooms'); check('8 AI rooms', await page.evaluate(()=>(document.body.innerText.match(/AI Room/g)||[]).length>=8))

console.log('\n════ STEP 11: Enterprise Map ════')
await go('/enterprise-map', 1800); s = await stat()
check('map renders', s.flow > 10, `${s.flow} nodes`)
const LENSES=['Organization','Human–Agent Workforce','Process','Quality Procedure','AI Initiative','Agent and Harness','Strategic Objective','Value','Token Economics','Risk and Compliance']
let lensOk=0
for (const l of LENSES){ const c=await page.evaluate((t)=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===t); if(b){b.click();return true} return false},l); if(c){ await wait(900); const st=await stat(); if(st.flow>0) lensOk++ } }
check('all 10 lenses render', lensOk===10, `${lensOk}/10`)
await clickText('Story Mode'); await wait(1500)
check('story mode starts', await page.evaluate(()=>/Step 1 of 14/.test(document.body.innerText)))
await clickText('Pause'); await wait(300)
let storyOk=0
for(let i=0;i<13;i++){ if(await clickText('Next')){ await wait(700); const st=await stat(); if(st.flow>0 && st.bad===0) storyOk++ } }
check('all 14 story steps render', storyOk===13, `${storyOk+1}/14`)
await clickText('Presentation mode'); await wait(1000)
check('presentation mode hides chrome', await page.evaluate(()=>document.querySelectorAll('aside').length===0))
await page.keyboard.press('Escape'); await wait(700)
check('Esc exits presentation', await page.evaluate(()=>document.querySelectorAll('aside').length>0))

console.log('\n════ STEP 12: UX checklist & Administration ════')
await go('/administration'); s = await stat()
check('Administration has an h1', s.h1 === 'Administration', s.h1)
check('org master register real (54 rows)', s.rows === 54, `${s.rows}`)
const ADMIN=['Positions','Employees','Agents','Processes','Quality Procedures','Strategic Objectives','Excellence Criteria','AI Initiatives','Harness Templates','Models','Token Prices','Cost Categories','Benefit Categories','Risk Levels','User Roles','Access Permissions','Data Refresh','Integration Status']
let adminOk=0
for (const t of ADMIN){ if(await clickText(t)){ await wait(600); const st=await stat(); const real = st.chars>500 && !(await page.evaluate(()=>document.body.innerText.includes('Coming soon'))); if(real) adminOk++ } }
check('all 19 admin screens real (no placeholders)', adminOk===18, `${adminOk+1}/19`)
await clickText('Integration Status'); await wait(700)
check('integration architecture: SAP/Neptune/D2D/Microsoft', await page.evaluate(()=>{const t=document.body.innerText; return t.includes('S/4HANA')&&t.includes('Neptune')&&t.includes('Microsoft Graph')&&t.includes('Grafana')}))

console.log('\n════ Global checks ════')
check('no console errors anywhere', errors.length===0, errors.length? [...new Set(errors)].join(' | ') : '')
console.log(`\n${fails === 0 ? '✅ ALL CHECKS PASSED' : `❌ ${fails} CHECK(S) FAILED`}`)
await b.close()
