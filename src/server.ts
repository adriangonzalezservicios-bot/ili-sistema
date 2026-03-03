import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || "ili_management.db";
const db = new Database(dbPath);

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cuit TEXT,
    address TEXT,
    phone TEXT,
    contact_person TEXT,
    location_lat REAL,
    location_lng REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL, -- admin, technician
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    ticket_number TEXT UNIQUE,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'Pendiente', -- Pendiente, En Proceso, Finalizado
    priority TEXT DEFAULT 'Media',
    type TEXT DEFAULT 'Espontáneo', -- Espontáneo, Programado, Presupuestado
    technician_name TEXT,
    budget_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    finished_at DATETIME,
    FOREIGN KEY(client_id) REFERENCES clients(id),
    FOREIGN KEY(budget_id) REFERENCES budgets(id)
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    task_id INTEGER,
    budget_number TEXT UNIQUE,
    date TEXT,
    validity_days INTEGER DEFAULT 15,
    subtotal REAL,
    total REAL,
    signature_data TEXT,
    photo_url TEXT,
    technician_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS accounting (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- income, expense
    amount REAL NOT NULL,
    description TEXT,
    category TEXT,
    date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS budget_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budget_id INTEGER,
    description TEXT,
    quantity REAL,
    unit_price REAL,
    FOREIGN KEY(budget_id) REFERENCES budgets(id)
  );

  CREATE TABLE IF NOT EXISTS agenda (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    title TEXT,
    description TEXT,
    start_time DATETIME,
    end_time DATETIME,
    type TEXT, -- Visita, Mantenimiento
    FOREIGN KEY(client_id) REFERENCES clients(id)
  );
`);

// Migration: Add budget_id to tasks if it doesn't exist
try {
  db.prepare("SELECT budget_id FROM tasks LIMIT 1").get();
} catch (e) {
  console.log("Adding budget_id column to tasks table...");
  db.exec("ALTER TABLE tasks ADD COLUMN budget_id INTEGER REFERENCES budgets(id)");
}

// Create default admin if no users exist
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run('admin', 'admin123', 'admin');
  console.log("Default admin user created: admin / admin123");
}

async function startServer() {
  // 1. Inicializar la app de Express y definir el puerto dinámico
  const app = express();
  const PORT = process.env.PORT || 3000;

  // 2. Middleware crucial para que req.body funcione en los POST
  app.use(express.json());

  // --- API Routes ---
  
  // Clients
  app.get("/api/clients", (req, res) => {
    const clients = db.prepare("SELECT * FROM clients ORDER BY name ASC").all();
    res.json(clients);
  });

  app.post("/api/clients", (req, res) => {
    const { name, cuit, address, phone, contact_person, location_lat, location_lng } = req.body;
    const info = db.prepare(
      "INSERT INTO clients (name, cuit, address, phone, contact_person, location_lat, location_lng) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(name, cuit, address, phone, contact_person, location_lat, location_lng);
    res.json({ id: info.lastInsertRowid });
  });

  // Users
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, username, role, created_at FROM users").all();
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    const { username, password, role } = req.body;
    try {
      const info = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run(username, password, role);
      res.json({ id: info.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    const { id } = req.params;
    try {
      // Don't allow deleting the main admin
      const user = db.prepare("SELECT username FROM users WHERE id = ?").get(id);
      if (user && user.username === 'admin') {
        return res.status(403).json({ error: "No se puede eliminar el administrador principal" });
      }
      db.prepare("DELETE FROM users WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar usuario" });
    }
  });

  // Tasks (Tickets)
  app.get("/api/tasks", (req, res) => {
    const tasks = db.prepare(`
      SELECT tasks.*, clients.name as client_name, budgets.budget_number
      FROM tasks 
      LEFT JOIN clients ON tasks.client_id = clients.id 
      LEFT JOIN budgets ON tasks.budget_id = budgets.id
      ORDER BY tasks.created_at DESC
    `).all();
    res.json(tasks);
  });

  app.post("/api/tasks", (req, res) => {
    const { client_id, description, status, priority, technician_name, type, budget_id } = req.body;
    
    // Generate ticket number
    const lastTask = db.prepare("SELECT ticket_number FROM tasks WHERE ticket_number LIKE 'TK-%' ORDER BY id DESC LIMIT 1").get();
    let nextNum = 1;
    if (lastTask && lastTask.ticket_number) {
      const parts = lastTask.ticket_number.split('-');
      if (parts.length > 1) {
        const num = parseInt(parts[1]);
        if (!isNaN(num)) nextNum = num + 1;
      }
    }
    const ticket_number = `TK-${nextNum.toString().padStart(5, '0')}`;

    const info = db.prepare(
      "INSERT INTO tasks (client_id, ticket_number, description, status, priority, technician_name, type, budget_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(client_id, ticket_number, description, status || 'Pendiente', priority || 'Media', technician_name, type || 'Espontáneo', budget_id);
    res.json({ id: info.lastInsertRowid, ticket_number });
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const { status, technician_name, priority } = req.body;
    const updates: string[] = [];
    const values: any[] = [];

    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
      if (status === 'Finalizado') {
        updates.push("finished_at = ?");
        values.push(new Date().toISOString());
      } else {
        updates.push("finished_at = ?");
        values.push(null);
      }
    }

    if (technician_name !== undefined) {
      updates.push("technician_name = ?");
      values.push(technician_name);
    }

    if (priority !== undefined) {
      updates.push("priority = ?");
      values.push(priority);
    }

    if (updates.length === 0) {
      return res.json({ success: true });
    }

    const query = `UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`;
    db.prepare(query).run(...values, req.params.id);
    res.json({ success: true });
  });

  // Accounting
  app.get("/api/accounting", (req, res) => {
    const transactions = db.prepare("SELECT * FROM accounting ORDER BY date DESC").all();
    res.json(transactions);
  });

  app.post("/api/accounting", (req, res) => {
    const { type, amount, description, category, date } = req.body;
    const info = db.prepare(
      "INSERT INTO accounting (type, amount, description, category, date) VALUES (?, ?, ?, ?, ?)"
    ).run(type, amount, description, category, date);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/accounting/summary", (req, res) => {
    const summary = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses
      FROM accounting
    `).get();
    res.json(summary);
  });

  // Budgets
  app.get("/api/budgets", (req, res) => {
    const budgets = db.prepare(`
      SELECT budgets.*, clients.name as client_name 
      FROM budgets 
      LEFT JOIN clients ON budgets.client_id = clients.id 
      ORDER BY budgets.created_at DESC
    `).all();
    res.json(budgets);
  });

  app.get("/api/budgets/:id", (req, res) => {
    const budget = db.prepare("SELECT * FROM budgets WHERE id = ?").get(req.params.id);
    const items = db.prepare("SELECT * FROM budget_items WHERE budget_id = ?").all(req.params.id);
    res.json({ ...budget, items });
  });

  app.post("/api/budgets", (req, res) => {
    const { client_id, task_id, date, validity_days, items, signature_data, photo_url, technician_name } = req.body;
    
    // Generate budget number (simple correlative)
    const lastBudget = db.prepare("SELECT budget_number FROM budgets ORDER BY id DESC LIMIT 1").get();
    let nextNum = 1;
    if (lastBudget && lastBudget.budget_number) {
      nextNum = parseInt(lastBudget.budget_number.split('-')[1]) + 1;
    }
    const budget_number = `ILI-${nextNum.toString().padStart(4, '0')}`;

    const subtotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0);
    const total = subtotal; // Add tax logic if needed

    const insertBudget = db.prepare(`
      INSERT INTO budgets (client_id, task_id, budget_number, date, validity_days, subtotal, total, signature_data, photo_url, technician_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = insertBudget.run(client_id, task_id, budget_number, date, validity_days, subtotal, total, signature_data, photo_url, technician_name);
    const budgetId = info.lastInsertRowid;

    // Link budget back to task if task_id is provided
    if (task_id) {
      db.prepare("UPDATE tasks SET budget_id = ? WHERE id = ?").run(budgetId, task_id);
    }

    // Automatically add income to accounting
    db.prepare("INSERT INTO accounting (type, amount, description, category, date) VALUES (?, ?, ?, ?, ?)")
      .run('income', total, `Presupuesto ${budget_number}`, 'Presupuesto', date);

    const insertItem = db.prepare(`
      INSERT INTO budget_items (budget_id, description, quantity, unit_price)
      VALUES (?, ?, ?, ?)
    `);

    for (const item of items) {
      insertItem.run(budgetId, item.description, item.quantity, item.unit_price);
    }

    res.json({ id: budgetId, budget_number });
  });

  // Agenda
  app.get("/api/agenda", (req, res) => {
    const events = db.prepare(`
      SELECT agenda.*, clients.name as client_name 
      FROM agenda 
      LEFT JOIN clients ON agenda.client_id = clients.id
    `).all();
    res.json(events);
  });

  app.post("/api/agenda", (req, res) => {
    const { client_id, title, description, start_time, end_time, type } = req.body;
    const info = db.prepare(
      "INSERT INTO agenda (client_id, title, description, start_time, end_time, type) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(client_id, title, description, start_time, end_time, type);
    res.json({ id: info.lastInsertRowid });
  });

  // Client Portal specific
  app.get("/api/portal/:clientId", (req, res) => {
    const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.clientId);
    if (!client) return res.status(404).json({ error: "Client not found" });
    
    const tasks = db.prepare("SELECT * FROM tasks WHERE client_id = ? ORDER BY created_at DESC").all(req.params.clientId);
    const budgets = db.prepare("SELECT * FROM budgets WHERE client_id = ? ORDER BY created_at DESC").all(req.params.clientId);
    
    res.json({ client, tasks, budgets });
  });

  // --- Vite middleware for development y Static Serving para Producción ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  // 3. Un solo app.listen al final, escuchando en 0.0.0.0
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();