import { launch, requireServer, BASE_URL } from './browser.mjs'
await requireServer()
const b = await launch()
const page = await b.newPage(); await page.setViewport({width:1680,height:1050})
const wait=(ms=800)=>new Promise(r=>setTimeout(r,ms))
let fails=0
const check=(l,c,d='')=>{const ok=!!c;if(!ok)fails++;console.log(`  ${ok?'✓':'✗'} ${l}${d?' — '+d:''}`)}

console.log('\n════ Keyboard navigation ════')
for (const [route, expectHashPrefix] of [
  ['/agents','#/agents/'], ['/ai-initiatives','#/ai-initiatives/'],
  ['/harness-engineering','#/harness-engineering/'], ['/d2d-integration','#/d2d-integration/demands/'],
]) {
  await page.goto(`${BASE_URL}/#${route}`,{waitUntil:'networkidle0'}); await wait(1200)
  // focus the first drill-down link in the table and press Enter
  const ok = await page.evaluate(()=>{const el=document.querySelector('tbody [role="button"]'); if(!el) return false; el.focus(); return document.activeElement===el})
  if (!ok) { check(`${route}: drill-down focusable`, false); continue }
  await page.keyboard.press('Enter'); await wait(900)
  const hash = await page.evaluate(()=>location.hash)
  check(`${route}: Enter activates drill-down`, hash.startsWith(expectHashPrefix), hash)
}

console.log('\n════ Focus visibility ════')
await page.goto(BASE_URL + '/#/agents',{waitUntil:'networkidle0'}); await wait(1000)
const outline = await page.evaluate(()=>{const el=document.querySelector('tbody [role="button"]');el.focus();
  const s=getComputedStyle(el); return { outlineWidth: s.outlineWidth, outlineStyle: s.outlineStyle }})
check('focused drill-down shows a visible ring', outline.outlineStyle !== 'none' && outline.outlineWidth !== '0px', JSON.stringify(outline))

console.log('\n════ Escape closes side panels ════')
await page.goto(BASE_URL + '/#/organization',{waitUntil:'networkidle0'}); await wait(1600)
const opened = await page.evaluate(()=>{const n=document.querySelector('.react-flow__node'); if(!n) return false; n.querySelector('div')?.click(); return true})
await wait(900)
const before = await page.evaluate(()=>document.querySelectorAll('aside[role="dialog"]').length)
await page.keyboard.press('Escape'); await wait(700)
const after = await page.evaluate(()=>document.querySelectorAll('aside[role="dialog"]').length)
check('Esc closes the side panel', before === 0 || after < before, `${before} -> ${after}`)

console.log(`\n${fails===0?'✅ KEYBOARD OK':`❌ ${fails} issue(s)`}`)
await b.close()
