import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Ensure data folder and database file exist
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'campusbite_database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed data for students
const INITIAL_STUDENTS = [
  {
    id: 'EST-2024-491',
    name: 'Valentina Torres',
    email: 'valentina@universidad.edu.co',
    password: '1234',
    walletBalance: 45000,
    transactions: [
      {
        id: 'tx-init-1',
        description: 'Bono de bienvenida CampusPay',
        amount: 45000,
        date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'EST-2023-118',
    name: 'Camilo Rodríguez',
    email: 'camilo@universidad.edu.co',
    password: '1234',
    walletBalance: 30000,
    transactions: [
      {
        id: 'tx-init-2',
        description: 'Recarga PSE Nequi',
        amount: 30000,
        date: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

interface DatabaseSchema {
  students: typeof INITIAL_STUDENTS;
  updatedAt: string;
}

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.students)) {
        // Ensure initial demo students are always available
        const existingEmails = new Set(parsed.students.map((s: any) => s.email.toLowerCase()));
        let merged = false;
        for (const init of INITIAL_STUDENTS) {
          if (!existingEmails.has(init.email.toLowerCase())) {
            parsed.students.push(init);
            merged = true;
          }
        }
        if (merged) {
          saveDatabase(parsed);
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('[DB] Error reading database file:', err);
  }

  const initialDb: DatabaseSchema = {
    students: INITIAL_STUDENTS,
    updatedAt: new Date().toISOString(),
  };
  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(dbData: DatabaseSchema) {
  try {
    dbData.updatedAt = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Error saving database file:', err);
  }
}

// In-memory cache synced with disk
let db = loadDatabase();

// Middleware
app.use(express.json());

// CORS configuration for cross-device & mobile access
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API Routes
// 1. Health check
app.get('/api/health', (_req, res) => {
  db = loadDatabase();
  res.json({
    status: 'ok',
    version: '1.5.0-centralized-auth',
    timestamp: new Date().toISOString(),
    studentsCount: db.students.length,
    message: 'CampusBite Cloud Central API is operational.',
  });
});

// 2. Register Student (Global, Cross-device persistent)
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Nombre, correo electrónico universitario y contraseña son obligatorios.',
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = String(name).trim();
  const cleanPass = String(password).trim();

  // Fresh reload from disk to ensure concurrency sync across tabs/devices
  db = loadDatabase();

  const existing = db.students.find((s) => s.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'Este correo electrónico ya está registrado en la base de datos de CampusBite. Por favor inicia sesión.',
    });
  }

  const newStudent = {
    id: `EST-2026-${Math.floor(100 + Math.random() * 900)}`,
    name: cleanName,
    email: cleanEmail,
    password: cleanPass,
    walletBalance: 25000, // Bono de $25.000 COP al registrarse
    transactions: [
      {
        id: `tx-welcome-${Date.now()}`,
        description: 'Bono de bienvenida por nuevo registro CampusPay',
        amount: 25000,
        date: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  };

  db.students.unshift(newStudent);
  saveDatabase(db);

  console.log(`[AUTH CENTRAL] Nuevo estudiante registrado globalmente: ${cleanEmail} (ID: ${newStudent.id})`);

  return res.status(201).json({
    success: true,
    user: newStudent,
    message: 'Estudiante registrado exitosamente en la base de datos central.',
  });
});

// 3. Login Student (Global, Cross-device persistent)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Por favor ingresa tu correo y contraseña.',
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPass = String(password).trim();

  db = loadDatabase();

  const found = db.students.find(
    (s) => s.email.toLowerCase() === cleanEmail && s.password === cleanPass
  );

  if (!found) {
    return res.status(401).json({
      success: false,
      error: 'Correo o contraseña incorrectos. Verifica tus datos o regístrate si es tu primera vez.',
    });
  }

  console.log(`[AUTH CENTRAL] Login verificado desde dispositivo: ${cleanEmail} (ID: ${found.id})`);

  return res.json({
    success: true,
    user: found,
  });
});

// 4. Get Student profile & updated wallet balance
app.get('/api/students/:id', (req, res) => {
  const query = req.params.id;
  db = loadDatabase();
  const student = db.students.find(
    (s) => s.id === query || s.email.toLowerCase() === query.toLowerCase()
  );
  if (!student) {
    return res.status(404).json({ success: false, error: 'Estudiante no encontrado en la base central.' });
  }
  return res.json({ success: true, user: student });
});

// 5. Top-up Student Wallet
app.post('/api/students/:id/topup', (req, res) => {
  const studentId = req.params.id;
  const { amount, method = 'PSE / Tarjeta' } = req.body || {};

  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Monto de recarga inválido.' });
  }

  db = loadDatabase();
  const studentIndex = db.students.findIndex(
    (s) => s.id === studentId || s.email.toLowerCase() === studentId.toLowerCase()
  );

  if (studentIndex === -1) {
    return res.status(404).json({ success: false, error: 'Estudiante no encontrado.' });
  }

  const student = db.students[studentIndex];
  const updatedStudent = {
    ...student,
    walletBalance: student.walletBalance + numericAmount,
    transactions: [
      {
        id: `tx-top-${Date.now()}`,
        description: `Recarga de saldo vía ${method}`,
        amount: numericAmount,
        date: new Date().toISOString(),
      },
      ...(student.transactions || []),
    ],
  };

  db.students[studentIndex] = updatedStudent;
  saveDatabase(db);

  return res.json({ success: true, user: updatedStudent });
});

// 6. Debit Student Wallet (Payment)
app.post('/api/students/:id/debit', (req, res) => {
  const studentId = req.params.id;
  const { amount, orderCode } = req.body || {};

  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Monto a debitar inválido.' });
  }

  db = loadDatabase();
  const studentIndex = db.students.findIndex(
    (s) => s.id === studentId || s.email.toLowerCase() === studentId.toLowerCase()
  );

  if (studentIndex === -1) {
    return res.status(404).json({ success: false, error: 'Estudiante no encontrado.' });
  }

  const student = db.students[studentIndex];
  if (student.walletBalance < numericAmount) {
    return res.status(400).json({
      success: false,
      error: 'Saldo insuficiente en tu monedero CampusPay.',
    });
  }

  const updatedStudent = {
    ...student,
    walletBalance: student.walletBalance - numericAmount,
    transactions: [
      {
        id: `tx-pay-${Date.now()}`,
        description: `Pago Pedido #${orderCode || 'Bite'}`,
        amount: -numericAmount,
        date: new Date().toISOString(),
      },
      ...(student.transactions || []),
    ],
  };

  db.students[studentIndex] = updatedStudent;
  saveDatabase(db);

  return res.json({ success: true, user: updatedStudent });
});

// Start Full-Stack Server
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CampusBite Full-Stack] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[CampusBite] Error starting server:', err);
  process.exit(1);
});
