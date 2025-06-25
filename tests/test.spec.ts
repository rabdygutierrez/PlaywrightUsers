// Este es el script de prueba modificado para detectar ID vacíos
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
} catch (error) {
  console.error(`❌ ERROR al leer tokens: ${error.message}`);
  tokens = [];
}

const start = process.env.TOKEN_START ? parseInt(process.env.TOKEN_START, 10) - 1 : 0;
const end = process.env.TOKEN_END ? parseInt(process.env.TOKEN_END, 10) - 1 : tokens.length - 1;

tokens = tokens.slice(start, end + 1);

const tokensExitosos: string[] = [];
const tokensFallidos: string[] = [];

const GLOBAL_TIMEOUT = 10 * 60 * 1000;

// === Test principal ===
test.describe.parallel('🔁 Validación de tokens LIVE', () => {
  tokens.forEach((rawToken, index) => {
    const token = rawToken.trim();
    if (!token) return;

    test(`Token #${start + index + 1}`, async ({ page }) => {
      test.setTimeout(GLOBAL_TIMEOUT);
      const url = `https://livetest.harvestful.org/videos?token=${token}`;
      let accessBlocked = false;
      let idVacioCount = 0;

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
        // Validar antes si la sesión está expirada y salir si es así
        const sesionExpirada = page.locator('text=sesión expirada');
        if (await sesionExpirada.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.warn(`[TEST ${start + index + 1}] 🚫 Sesión expirada detectada antes de validación de ID.`);
          tokensFallidos.push(token);
          return;
        }

        const seleccionarBtn = page.locator('.container-button button.button', { hasText: 'Seleccionar' });
        if (await seleccionarBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await seleccionarBtn.click();
          console.log(`[TEST ${start + index + 1}] 🖱️ Botón 'Seleccionar' clickeado.`);
        }

        const videoIdSelector = '#container-player > span.video-id';
        const videoIdElement = page.locator(videoIdSelector);
        let lastId = '';
        let idDetectado = false;

        for (let minuto = 0; minuto < 5; minuto++) {
          if (await sesionExpirada.isVisible({ timeout: 1000 }).catch(() => false)) {
            console.warn(`[TEST ${start + index + 1}] 🚫 Sesión expirada detectada (min ${minuto + 1})`);
            tokensFallidos.push(token);
            break;
          }

          try {
            const visible = await videoIdElement.isVisible({ timeout: 30000 });
            if (visible) {
              const idActual = (await videoIdElement.textContent())?.trim();
              if (idActual) {
                if (idActual !== lastId) {
                  lastId = idActual;
                  console.log(`[TEST ${start + index + 1}] 🎥 ID nuevo en min ${minuto + 1}: ${idActual}`);
                  tokensExitosos.push(token);
                  idDetectado = true;
                }
              } else {
                console.log(`[TEST ${start + index + 1}] ⚠️ ID visible pero vacío (min ${minuto + 1})`);
                idVacioCount++;
              }
            } else {
              console.warn(`[TEST ${start + index + 1}] ⚠️ ID no visible (min ${minuto + 1})`);
            }
          } catch (e) {
            console.error(`[TEST ${start + index + 1}] ❌ ERROR al verificar ID: ${e.message}`);
            tokensFallidos.push(token);
            break;
          }

          if (idDetectado) break;

          await new Promise(resolve => setTimeout(resolve, 60 * 1000));
        }

        if (idVacioCount > 0) {
          console.warn(`[TEST ${start + index + 1}] ⚠️ Se detectaron ${idVacioCount} ID(s) vacío(s).`);
          tokensFallidos.push(token);
        }
      });

      await new Promise(resolve => setTimeout(resolve, 10 * 1000));
    });
  });
});
