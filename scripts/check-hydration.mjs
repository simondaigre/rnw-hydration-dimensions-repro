// Opens the page in headless Chromium and prints the hydration errors React reports, then what the page shows.
// Usage: node scripts/check-hydration.mjs [url]   (CHROME_PATH defaults to /usr/bin/chromium)
import puppeteer from 'puppeteer-core';

const url = process.argv[2] ?? 'http://localhost:8081/';
const browser = await puppeteer.launch({
	executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium',
	headless: true,
	args: ['--no-sandbox'],
});
try {
	const page = await browser.newPage();
	await page.setViewport({ width: 1024, height: 768 });
	await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
	const errors = [];
	page.on('console', (message) => {
		if (message.type() === 'error') errors.push(message.text().split('\n')[0]);
	});
	page.on('pageerror', (error) => errors.push(error.message.split('\n')[0]));

	const response = await page.goto(url, { waitUntil: 'networkidle0' });
	const html = await response.text();
	const serverText = (id) => html.match(new RegExp(`data-testid="${id}"[^>]*>([^<]*)<`))?.[1];
	await new Promise((resolve) => setTimeout(resolve, 500));
	const text = (id) => page.$eval(`[data-testid="${id}"]`, (element) => element.textContent);

	console.log(`server HTML: ${serverText('dimensions')} / ${serverText('color-scheme')}`);
	console.log(`hydrated:    ${await text('dimensions')} / ${await text('color-scheme')}`);
	// Production React reports them minified: #418 is "Hydration failed because the server rendered text didn't match the client".
	const hydrationErrors = errors.filter((error) => /hydrat|React error #(418|419|423|425)\b/i.test(error));
	console.log(`hydration errors: ${hydrationErrors.length}`);
	for (const error of hydrationErrors) console.log(`  ${error}`);
	process.exitCode = hydrationErrors.length ? 1 : 0;
} finally {
	await browser.close();
}
