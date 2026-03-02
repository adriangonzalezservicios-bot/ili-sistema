const fs = require('fs');
const path = require('path');

const files = {
    'package.json': `{
  "name": "sistema-ili",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch server.ts",
    "build": "vite build",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "better-sqlite3": "^11.3.0",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "lucide-react": "^0.446.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.11",
    "@types/express": "^4.17.21",
    "@types/react": "^18.3.10",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "tsx": "^4.19.1",
    "typescript": "^5.6.2",
    "vite": "^5.4.8"
  }
}`,
    'server.ts': `import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const db = new Database('ili_management.db');

app.use(express.json());

db.exec(\`
  CREATE TABLE IF NOT EXISTS clientes (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT, telefono TEXT);
  CREATE TABLE IF NOT EXISTS tareas (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT, estado TEXT DEFAULT 'pendiente', cliente_id INTEGER);
  CREATE TABLE IF NOT EXISTS presupuestos (id INTEGER PRIMARY KEY AUTOINCREMENT, cliente_id INTEGER, monto REAL, estado TEXT DEFAULT 'borrador');
\`);

app.get('/api/tareas', (req, res) => {
  res.json(db.prepare('SELECT t.*, c.nombre as cliente_nombre FROM tareas t LEFT JOIN clientes c ON t.cliente_id = c.id').all());
});

app.get('/api/presupuestos', (req, res) => {
  res.json(db.prepare('SELECT p.*, c.nombre as cliente_nombre FROM presupuestos p JOIN clientes c ON p.cliente_id = c.id').all());
});

app.listen(3000, () => console.log('Servidor en http://localhost:3000'));`,
    'index.html': `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ILI - Gestión</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
    'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}`,
    'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)`,
    'src/index.css': `@tailwind base; @tailwind components; @tailwind utilities;
body { @apply bg-slate-50; font-family: sans-serif; }`
};

// Crear carpetas y archivos
Object.entries(files).forEach(([name, content]) => {
    const dir = path.dirname(name);
    if (dir !== '.') fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(name, content);
    console.log(\`Creado: \${name}\`);
});

console.log('\\n¡Archivos creados! Ahora ejecuta: npm install && npm run dev');