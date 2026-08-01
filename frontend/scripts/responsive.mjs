import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'] })
const VIEWPORTS = [[1680,1050,'desktop-xl'],[1280,900,'desktop'],[1024,800,'laptop'],[768,1024,'tablet'],[390,844,'mobile']]
const ROUTES = ['/', '/organization', '/agents', '/value-realization', '/token-economics', '/observability', '/strategic-alignment', '/ai-playbook', '/administration']
for (const [w,h,name] of VIEWPORTS) {
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: h })
  const issues = []
  for (const r of ROUTES) {
    await page.goto(`http://localhost:3400/#${r}`, { waitUntil: 'networkidle0' })
    await new Promise(x => setTimeout(x, 900))
    const res = await page.evaluate(() => {
      const de = document.documentElement
      // horizontal page overflow is the failure mode that matters
      const overflow = de.scrollWidth - de.clientWidth
      // find elements wider than the viewport that are NOT inside an overflow-x container
      const wide = [...document.querySelectorAll('body *')].filter(el => {
        if (el.scrollWidth <= document.documentElement.clientWidth + 2) return false
        let p = el.parentElement
        while (p) { const s = getComputedStyle(p); if (s.overflowX === 'auto' || s.overflowX === 'scroll') return false; p = p.parentElement }
        return true
      }).slice(0,3).map(el => el.tagName + '.' + String(el.className).slice(0,30))
      return { overflow, wide }
    })
    if (res.overflow > 2) issues.push(`${r}: page overflows by ${res.overflow}px ${JSON.stringify(res.wide)}`)
  }
  console.log(`${name.padEnd(11)} ${w}x${h}  ${issues.length ? '⚠️\n   ' + issues.join('\n   ') : 'no horizontal overflow ✓'}`)
  await page.close()
}
await browser.close()
