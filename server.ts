import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import dotenv from "dotenv";
import fs from "fs";

// 1. Cargar las contraseñas secretas de tu archivo .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Configurar la conexión con el "Bot" de Google
const auth = new google.auth.GoogleAuth({
  keyFile: "google-credentials.json", // El archivo clave que descargaste
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file"
  ],
});

const sheets = google.sheets({ version: "v4", auth });
const drive = google.drive({ version: "v3", auth });

// Traemos los IDs que guardaste en el .env
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = process.env.PORT || 3000;

  // --- RUTAS API (Ahora conectadas a Google Sheets) ---

  // CLIENTES
  app.get("/api/clients", async (req, res) => {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Clientes!A2:G", // Lee desde la fila 2 para no traer los títulos
      });
      const rows = response.data.values || [];
      const clients = rows.map(row => ({
        id: row[0], name: row[1], cuit: row[2], address: row[3],
        phone: row[4], contact_person: row[5], created_at: row[6]
      }));
      res.json(clients);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al leer clientes del Excel" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    const { name, cuit, address, phone, contact_person } = req.body;
    const id = Date.now().toString(); // ID único automático
    const date = new Date().toISOString().split('T')[0];

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Clientes!A:G",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[id, name, cuit, address, phone, contact_person, date]] }
      });
      res.json({ id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error guardando cliente en Excel" });
    }
  });

  // TAREAS
  app.get("/api/tasks", async (req, res) => {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Tareas!A2:G",
      });
      const rows = response.data.values || [];
      const tasks = rows.map(row => ({
        id: row[0], client_id: row[1], description: row[2], 
        status: row[3], priority: row[4], technician_name: row[5], created_at: row[6]
      }));
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Error leyendo tareas" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    const { client_id, description, status, priority, technician_name } = req.body;
    const id = Date.now().toString();
    const date = new Date().toISOString().split('T')[0];

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Tareas!A:G",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[id, client_id, description, status || 'Pendiente', priority || 'Media', technician_name, date]] }
      });
      res.json({ id });
    } catch (error) {
      res.status(500).json({ error: "Error guardando tarea" });
    }
  });

  // PRESUPUESTOS (Guarda los datos en Excel, luego sumaremos Drive)
  app.post("/api/budgets", async (req, res) => {
    const { client_id, date, subtotal, total, technician_name } = req.body;
    const id = Date.now().toString();
    const budget_number = `ILI-${id.slice(-4)}`; 
    
    const linkPdf = "Pendiente de subida"; // Pronto programaremos la subida a Drive

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Presupuestos!A:G",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[budget_number, client_id, date, subtotal, total, technician_name, linkPdf]] }
      });
      res.json({ id, budget_number });
    } catch (error) {
      res.status(500).json({ error: "Error guardando presupuesto" });
    }
  });

 // --- SERVIR FRONTEND ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // COMODÍN: Si la ruta no es una API, fuerza a cargar la pantalla de React
    app.use("*", async (req, res, next) => {
      try {
        let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n--- SISTEMA ILI INICIADO ---`);
    console.log(`Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`Conectado a Google Sheets ID: ${SPREADSHEET_ID ? 'OK' : 'FALTA ID'}`);
    console.log(`----------------------------\n`);
  });
}

startServer();