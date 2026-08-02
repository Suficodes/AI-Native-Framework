import { launch, requireServer, BASE_URL } from './browser.mjs'
await requireServer()
const browser = await launch()
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 950 })
const ROUTES = ['/', '/organization', '/processes/agenticity', '/agents', '/agents/AGT-D2D-DOC-01', '/ai-playbook',
  '/value-realization', '/token-economics', '/observability', '/strategic-alignment', '/administration', '/performance/agents',
  '/agent-constellation']
let total = 0
for (const r of ROUTES) {
  await page.goto(`${BASE_URL}/#${r}`, { waitUntil: 'networkidle0' })
  await new Promise(x => setTimeout(x, 900))
  const a = await page.evaluate(() => {
    const problems = []
    const h1s = document.querySelectorAll('h1')
    if (h1s.length === 0) problems.push('no h1')
    if (h1s.length > 1) problems.push(`${h1s.length} h1 elements`)
    // heading order
    const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => +h.tagName[1])
    for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i-1] > 1) { problems.push(`heading jump h${hs[i-1]}→h${hs[i]}`); break }
    // images without alt
    const noAlt = [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).length
    if (noAlt) problems.push(`${noAlt} img without alt`)
    // buttons with no accessible name
    const nameless = [...document.querySelectorAll('button')].filter(b =>
      !b.textContent.trim() && !b.getAttribute('aria-label') && !b.getAttribute('title')).length
    if (nameless) problems.push(`${nameless} button(s) with no accessible name`)
    // links with no accessible name
    const badLinks = [...document.querySelectorAll('a')].filter(a =>
      !a.textContent.trim() && !a.getAttribute('aria-label')).length
    if (badLinks) problems.push(`${badLinks} link(s) with no accessible name`)
    // inputs with no label
    const badInputs = [...document.querySelectorAll('input:not([type=hidden])')].filter(i =>
      !i.getAttribute('aria-label') && !i.getAttribute('aria-labelledby') &&
      !(i.id && document.querySelector(`label[for="${i.id}"]`)) && !i.closest('label')).length
    if (badInputs) problems.push(`${badInputs} input(s) with no label`)
    // skip link present + main landmark
    if (!document.querySelector('.skip-link')) problems.push('no skip link')
    if (!document.querySelector('main')) problems.push('no <main> landmark')
    if (!document.querySelector('nav[aria-label="Breadcrumb"]') && location.hash !== '#/') problems.push('no breadcrumb')
    return problems
  })
  total += a.length
  console.log(`${r.padEnd(30)} ${a.length ? '⚠️ ' + a.join(' | ') : 'ok'}`)
}
console.log(`\ntotal a11y findings: ${total}`)
// keyboard: does Tab reach the skip link first?
await page.goto(BASE_URL + '/#/', { waitUntil: 'networkidle0' })
await new Promise(x => setTimeout(x, 700))
await page.keyboard.press('Tab')
const first = await page.evaluate(() => document.activeElement?.className + ' | ' + document.activeElement?.textContent?.slice(0,40))
console.log('first Tab stop:', first)
await browser.close()
