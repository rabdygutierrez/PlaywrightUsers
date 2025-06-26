import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  const minutos = 5;
   await page.goto('https://livetest.harvestful.org/videos?token=eXwELJBTcPPAV8rZcdCwNXjwKW8bdur87chS4UJxczReoofaGNkva7ndXITa1Y5XjzPJ1G0dUeUEuqVKGYIgFhTBe0ItjXSsc6Um2r3NyGc3ma9ohosA11VFsAxppE63');
  for (let i = 0; i < minutos; i++) {
   await page.waitForLoadState();
      await page.waitForTimeout(60000); 
    const isVisible = await page.locator('.video-id').isVisible();
    if (isVisible) {
      const id = await page.locator('.video-id').textContent();
      console.log(`ID del video: ${id}`);
    await page.reload();  
    } else {
      console.log('El ID del video no está visible en la página.');
    }
  }
});