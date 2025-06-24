import { test, expect } from '@playwright/test'; // <-- ¡IMPORTANTE! Asegúrate de que esta línea esté presente y correcta.
import * as fs from 'fs';
import * as path from 'path';

// ********************************************************************************
// ** CONFIGURACIÓN DE RUTA DEL ARCHIVO DE TOKENS **
// ********************************************************************************
// Asegúrate de que 'todos_los_tokens.txt' esté en la MISMA CARPETA que este script.
// Ejemplo: D:\Harvestful\Playwright\tests\test-tokens.spec.ts
//          D:\Harvestful\Playwright\tests\todos_los_tokens.txt
const TOKENS_FILE_PATH = path.join(__dirname, 'todos_los_tokens.txt'); 
// ********************************************************************************

let tokens: string[] = []; 

// Lee los tokens de forma síncrona al cargar el script.
try {
    let fileContent = fs.readFileSync(TOKENS_FILE_PATH, 'utf-8');
    
    // Eliminar el carácter BOM (Byte Order Mark) si está presente.
    fileContent = fileContent.replace(/^\uFEFF/, ''); 

    tokens = fileContent.split(/\r?\n/).filter(line => line.trim() !== ''); 
    
    if (tokens.length === 0) {
        console.warn(`Advertencia: El archivo de tokens "${TOKENS_FILE_PATH}" está vacío o no contiene tokens válidos. No se ejecutarán tests de navegación.`);
    } else {
        console.log(`Tokens leídos exitosamente del archivo "${TOKENS_FILE_PATH}": ${tokens.length}`);
    }
} catch (error) {
    console.error(`Error FATAL al leer el archivo de tokens "${TOKENS_FILE_PATH}": ${error.message}`);
    tokens = []; 
}

// --------------------------------------------------------------------------------
// Define los tests de navegación solo si se pudieron cargar tokens.
// --------------------------------------------------------------------------------
if (tokens.length > 0) {
    test.describe('Navegar a URLs con múltiples tokens (3 Pasos)', () => {

        test.setTimeout(90000); 

        for (let i = 0; i < tokens.length; i++) { 
            const token = tokens[i];
            
            if (!token || token.trim() === '') {
                console.warn(`Saltando test para índice ${i} porque el token es nulo o vacío después de la limpieza.`);
                continue; 
            }
            
            const cleanedToken = token.trim();

            // ********************************************************************************
            // ** ¡LA CLAVE ESTÁ AQUÍ! --> 'async ({ page }) => {' **
            // Asegúrate de que esta línea NO esté alterada y contenga '{ page }'.
            // ********************************************************************************
            test(`Navegar con Token #${i + 1}: ${cleanedToken.substring(0, 10)}...`, async ({ page }) => {
                const url = `https://livetest.harvestful.org/videos?token=${cleanedToken}`;
                console.log(`[Test ${i + 1}] Intentando navegar a: ${url.substring(0, 70)}...`);
                let accessBlocked = false;
                // 1. Navegar a la URL con el token
                await test.step('1. Navegar a la URL con el token', async () => {
                    try {
                        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); 
                        console.log(`[Test ${i + 1}] Navegación exitosa.`);
                    } catch (e) {
                        console.error(`[Test ${i + 1}] ERROR al navegar a ${url}: ${e.message}`);
                        throw e; 
                    }
                });
        if (accessBlocked) {
         return; // Detiene la ejecución de los pasos restantes para este test y pasa al siguiente token
        }
                // 2. Verificar el título de la página
                await test.step('2. Verificar el título de la página', async () => {
                    try {
                        await expect(page).toHaveTitle('HF Live', { timeout: 60000 }); 
                        console.log(`[Test ${i + 1}] Título de página "HF Live" verificado.`);
                    } catch (e) {
                        console.error(`[Test ${i + 1}] ERROR al verificar título para ${url}: ${e.message}`);
                        throw e; 
                    }
                });

                // 3. Capturar y verificar el ID del video
                await test.step('3. Capturar y verificar el ID del video', async () => {
                    const videoIdSpanSelector = '#container-player > span.video-id';
                    
                    try {
                        const videoIdElement = page.locator(videoIdSpanSelector);
                        await expect(videoIdElement).toBeVisible({ timeout: 60000 }); 
                        
                        const videoId = await videoIdElement.textContent(); 
                        
                        console.log(`[Test ${i + 1}] ID del video capturado: ${videoId}`);
                        
                        expect(videoId).not.toBeNull();
                        expect(videoId?.trim()).toMatch(/^\d+$/); 
                        
                    } catch (e) {
                        console.error(`[Test ${i + 1}] ERROR al capturar/verificar el ID del video: ${e.message}`);
                        throw e; 
                    }
                });

                // Pausa opcional para depuración (comentar en producción)
                 await page.waitForTimeout(2000); 
            }); 
        } 
    });
} else {
    console.log("No hay tests definidos para ejecutar ya que no se encontraron tokens válidos en el archivo.");
}