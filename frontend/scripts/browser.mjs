// Shared browser launcher for the verification scripts.
//
// `puppeteer-core` deliberately ships no browser, so it needs to be pointed at
// one. The path was hardcoded to macOS in each script, which made them
// unrunnable anywhere else; this resolves the first Chrome it can find and lets
// CHROME_PATH override.
import { existsSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean)

export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3400'

export function chromePath() {
  const found = CANDIDATES.find((p) => existsSync(p))
  if (!found) {
    console.error('No Chrome found. Set CHROME_PATH to your browser binary.')
    process.exit(1)
  }
  return found
}

export async function launch() {
  return puppeteer.launch({
    executablePath: chromePath(),
    headless: 'new',
    args: ['--no-sandbox'],
  })
}

/** Fail fast with a clear message rather than a wall of timeouts. */
export async function requireServer() {
  try {
    const res = await fetch(BASE_URL)
    if (!res.ok) throw new Error(String(res.status))
  } catch {
    console.error(`No dev server at ${BASE_URL}. Start it with: npm run dev`)
    process.exit(1)
  }
}
