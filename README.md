# 🧪 PlaywrightUsers - Ejecución de pruebas end-to-end

Este repositorio contiene pruebas automatizadas utilizando [Playwright](https://playwright.dev/). A continuación se detalla el paso a paso para instalar dependencias y ejecutar el archivo `Usuarios.spec.ts` en un servidor Linux (como una instancia EC2 en AWS).

---

## 📦 Requisitos del sistema

- Node.js `v18.x` o superior
- npm `v9.x` o superior
- Git
- Acceso SSH al servidor

---

## 🚀 Clonar el proyecto

```bash
cd ~
mkdir playwright-tests && cd playwright-tests
git clone https://github.com/rabdygutierrez/PlaywrightUsers.git
cd PlaywrightUsers
```

---

## 📥 Instalación de dependencias

```bash
sudo apt update
sudo apt install -y nodejs npm
npm install
npx playwright install
```

---

## 🧪 Ejecución de pruebas

### ▶ Ejecutar `Usuarios.spec.ts`

```bash
npx playwright test tests/Usuarios.spec.ts
```

### ▶ Ejecutar en un navegador específico

```bash
npx playwright test tests/Usuarios.spec.ts --project=chromium
```

Otros navegadores disponibles:

```bash
--project=firefox
--project=webkit
```

### ▶ Ejecutar con interfaz visual (modo headed)

```bash
npx playwright test tests/Usuarios.spec.ts --project=chromium --headed
```

---

## 🛠️ Utilidades adicionales

### ▶ Generar reporte HTML

```bash
npx playwright test tests/Usuarios.spec.ts --reporter=html
npx playwright show-report
```

### ▶ Pasar variables de entorno (ejemplo con tokens)

```bash
TOKEN_START=1 TOKEN_END=100 npx playwright test tests/Usuarios.spec.ts
```

---

## ✅ Verificar instalación

```bash
node -v
npm -v
npx playwright --version
```

---

## 📁 Estructura esperada

```
PlaywrightUsers/
├── tests/
│   └── Usuarios.spec.ts
├── todos_los_tokens.txt
├── package.json
├── README.md
└── ...
```

---

## 🔐 Notas

- Si usás claves `.pem` para conectarte por SSH:  
  `ssh -i ~/ruta/claves/BAPTEA.pem ubuntu@<IP_PUBLICA>`

- Asegurate de dar permisos de ejecución si creás scripts `.sh`:  
  `chmod +x script.sh`

---