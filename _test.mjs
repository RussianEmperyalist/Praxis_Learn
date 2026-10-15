import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(`[${msg.type()}] ${msg.text().substring(0, 200)}`));
  page.on('pageerror', error => consoleErrors.push(error.message));
  
  console.log('Navigating to lesson...');
  await page.goto('http://localhost:3000/lesson.html?course=python&lesson=01-intro', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('\n=== Page Errors ===');
  if (consoleErrors.length === 0) console.log('NONE - no JavaScript errors!');
  else consoleErrors.forEach(e => console.log(e));
  
  console.log('\n=== Console Warnings ===');
  const warnings = consoleMessages.filter(m => m.includes('[warning]'));
  if (warnings.length === 0) console.log('No warnings');
  else warnings.forEach(m => console.log(m));
  
  await browser.close();
})();
