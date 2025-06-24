import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const TOKENS_FILE_PATH = path.join(__dirname, 'todos_los_tokens.txt');
let tokens: string[] = [];

try {
  let fileContent = fs.readFileSync(TOKENS_FILE_PATH, 'utf-8');
  fileContent = fileContent.replace(/^﻿/, '');
  tokens = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');
  tokens = Array.from(new Set(tokens));

  if (process.env.PW_WORKER_ID === '0') {
    console.log(`✅ Tokens cargados y únicos: ${tokens.length} desde "${TOKENS_FILE_PATH}"`);
  }
} catch (error) {
  console.error(`❌ ERROR al leer tokens: ${error.message}`);
  tokens = [];
}

const start = process.env.TOKEN_START ? parseInt(process.env.TOKEN_START, 10) - 1 : 0;
const end = process.env.TOKEN_END ? parseInt(process.env.TOKEN_END, 10) - 1 : tokens.length - 1;

if (start < 0 || end >= tokens.length || start > end) {
  throw new Error(`Rango inválido para tokens: start=${start + 1}, end=${end + 1}, total=${tokens.length}`);
}

tokens = tokens.slice(start, end + 1);

if (process.env.PW_WORKER_ID === '0') {
  console.log(`⚙️ Ejecutando solo tokens del ${start + 1} al ${end + 1} (total ${tokens.length})`);
}

const tokensExitosos: string[] = [];
const tokensFallidos: string[] = [];

const GLOBAL_TIMEOUT = 10 * 60 * 1000;

test.describe.parallel('🔁 Validación de tokens LIVE', () => {
  tokens.forEach((rawToken, index) => {
    const token = rawToken.trim();
    if (!token) return;

    test(`Token #${start + index + 1}`, async ({ page }) => {
      test.setTimeout(GLOBAL_TIMEOUT);
      const url = `https://livetest.harvestful.org/videos?token=${token}`;
      let accessBlocked = false;

      console.log(`\n🧪 TEST ${start + index + 1}\n🔑 Token: ${token}\n🌐 URL: ${url}\n===============================`);

      await test.step('1. Navegar a la URL con el token', async () => {
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: GLOBAL_TIMEOUT });
          const blocked = page.locator('text=Access denied');
          if (await blocked.isVisible()) {
            accessBlocked = true;
            console.warn(`[TEST ${start + index + 1}] 🚫 Acceso bloqueado.`);
            tokensFallidos.push(token);
            test.skip();
          }
          console.log(`[TEST ${start + index + 1}] ✅ Navegación exitosa.`);
        } catch (e) {
          console.error(`[TEST ${start + index + 1}] ❌ ERROR de navegación: ${e.message}`);
          tokensFallidos.push(token);
          throw e;
        }
      });

      if (accessBlocked) return;

      await test.step('2. Verificar título', async () => {
        try {
          await expect(page).toHaveTitle('HF Live', { timeout: GLOBAL_TIMEOUT });
          console.log(`[TEST ${start + index + 1}] ✅ Título verificado.`);
        } catch (e) {
          console.error(`[TEST ${start + index + 1}] ❌ ERROR en título: ${e.message}`);
          tokensFallidos.push(token);
          throw e;
        }
      });

      await test.step('3-4. Mantener sesión activa y verificar ID del video dinámicamente', async () => {
        const videoIdSelector = '#container-player > span.video-id';
        const videoIdElement = page.locator(videoIdSelector);

        let lastId = '';
        let idVisto = false;

        for (let minute = 0; minute < 15; minute++) {
          let idEncontradoEsteMinuto = false;

          for (let intento = 0; intento < 3; intento++) {
            try {
              await page.mouse.move(100 + minute * 10, 100 + intento * 10);
              const isVisible = await videoIdElement.isVisible({ timeout: 20000 });
              if (isVisible) {
                const currentId = (await videoIdElement.textContent())?.trim();
                if (currentId && currentId !== lastId) {
                  lastId = currentId;
                  console.log(`[TEST ${start + index + 1}] 🎥 ID actualizado (min ${minute + 1}, intento ${intento + 1}): ${lastId}`);
                  if (!tokensExitosos.includes(token)) {
                    tokensExitosos.push(token);
                  }
                  idVisto = true;
                  idEncontradoEsteMinuto = true;
                  break;
                }
              }
            } catch (e) {
              // ignorar errores por intento
            }
            await page.waitForTimeout(10000);
          }

          if (!idEncontradoEsteMinuto) {
            console.warn(`[TEST ${start + index + 1}] ⚠️ ID de video no visible en minuto ${minute + 1}`);
          }

          await page.waitForTimeout(30000);
        }

        if (!idVisto) {
          console.warn(`❌ El token falló completamente:`);
          console.warn(`🔑 Token: ${token}`);
          console.warn(`🌐 URL: ${url}`);
          tokensFallidos.push(token);
        }
      });
    });
  });

  test.afterAll(() => {
    if (process.env.PW_WORKER_ID === '0') {
      console.log(`\n====================`);
      console.log(`✅ Tokens exitosos: ${tokensExitosos.length}`);
      tokensExitosos.forEach((t, i) => console.log(`✔️ ${i + 1}: ${t}`));

      console.log(`\n❌ Tokens fallidos: ${tokensFallidos.length}`);
      tokensFallidos.forEach((t, i) => console.log(`✖️ ${i + 1}: ${t}`));
      console.log(`====================`);
    }
  });
});