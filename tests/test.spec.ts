import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Ruta del archivo con tokens
const TOKENS_FILE_PATH = path.join(__dirname, 'todos_los_tokens.txt');
let tokens: string[] = [];

// Cargar tokens una sola vez por worker
try {
  let fileContent = fs.readFileSync(TOKENS_FILE_PATH, 'utf-8');
  fileContent = fileContent.replace(/^\uFEFF/, '');
  tokens = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');

  // Eliminar tokens duplicados
  tokens = Array.from(new Set(tokens));

  if (process.env.PW_WORKER_ID === '0') {
    console.log(`✅ Tokens cargados y únicos: ${tokens.length} desde "${TOKENS_FILE_PATH}"`);
  }
} catch (error) {
  console.error(`❌ ERROR al leer tokens: ${error.message}`);
  tokens = [];
}

// Filtrar tokens por rango si se definieron variables de entorno TOKEN_START y TOKEN_END
const start = process.env.TOKEN_START ? parseInt(process.env.TOKEN_START, 10) - 1 : 0;
const end = process.env.TOKEN_END ? parseInt(process.env.TOKEN_END, 10) - 1 : tokens.length - 1;

if (start < 0 || end >= tokens.length || start > end) {
  throw new Error(`Rango inválido para tokens: start=${start + 1}, end=${end + 1}, total=${tokens.length}`);
}

tokens = tokens.slice(start, end + 1);

if (process.env.PW_WORKER_ID === '0') {
  console.log(`⚙️ Ejecutando solo tokens del ${start + 1} al ${end + 1} (total ${tokens.length})`);
}

// Lista de tokens exitosos
const tokensExitosos: string[] = [];

test.describe.parallel('🔁 Validación de tokens LIVE', () => {
  tokens.forEach((rawToken, index) => {
    const token = rawToken.trim();
    if (!token) return;

    test(`Token #${start + index + 1}`, async ({ page }) => {
      const url = `https://livetest.harvestful.org/videos?token=${token}`;
      let accessBlocked = false;

      console.log(`
🧪 TEST ${start + index + 1}
🔑 Token: ${token}
🌐 URL: ${url}
===============================`);

      // Paso 1: Navegar
      await test.step('1. Navegar a la URL con el token', async () => {
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 160000 });
          const blocked = page.locator('text=Access denied');
          if (await blocked.isVisible()) {
            accessBlocked = true;
            console.warn(`[TEST ${start + index + 1}] 🚫 Acceso bloqueado.`);
            test.skip();
          }
          console.log(`[TEST ${start + index + 1}] ✅ Navegación exitosa.`);
        } catch (e) {
          console.error(`[TEST ${start + index + 1}] ❌ ERROR de navegación: ${e.message}`);
          throw e;
        }
      });

      if (accessBlocked) return;

      // Paso 2: Verificar título
      await test.step('2. Verificar título', async () => {
        try {
          await expect(page).toHaveTitle('HF Live', { timeout: 160000 });
          console.log(`[TEST ${start + index + 1}] ✅ Título verificado.`);
        } catch (e) {
          console.error(`[TEST ${start + index + 1}] ❌ ERROR en título: ${e.message}`);
          throw e;
        }
      });

      // Paso 3: Verificar ID del video
      await test.step('3. Capturar y verificar ID del video', async () => {
        const videoIdSelector = '#container-player > span.video-id';
        const videoIdElement = page.locator(videoIdSelector);

        try {
          const isVisible = await videoIdElement.isVisible({ timeout: 160000 });
          if (!isVisible) {
            console.warn(`[TEST ${start + index + 1}] ⚠️ No se encontró el ID del video.`);
            return;
          }

          const videoId = await videoIdElement.textContent();
          console.log(`[TEST ${start + index + 1}] 🎥 ID de video: ${videoId}`);
          expect(videoId).not.toBeNull();
          expect(videoId?.trim()).toMatch(/^\d+$/);

          tokensExitosos.push(token);
        } catch (e) {
          console.error(`[TEST ${start + index + 1}] ❌ ERROR al capturar/verificar ID: ${e.message}`);
          throw e;
        }
      });

      
      // Paso 4: Mantener sesión activa 5 min (comentado)
      await test.step('4. Mantener sesión activa 5 min', async () => {
        for (let i = 0; i < 5; i++) {
          await page.mouse.move(100 + i * 10, 100 + i * 10);
          console.log(`[TEST ${start + index + 1}] ⏳ Sesión activa minuto ${i + 1}/5`);
          await page.waitForTimeout(60 * 6000);
        }
      });
    });
  });

  test.afterAll(() => {
    if (process.env.PW_WORKER_ID === '0') {
      console.log(`\n====================`);
      console.log(`✅ Tokens exitosos: ${tokensExitosos.length}`);
      tokensExitosos.forEach((t, i) => console.log(`✔️ ${i + 1}: ${t}`));
      console.log(`====================`);
    }
  });
});