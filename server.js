// ============================================================
// S.N.G PUBLIC SCHOOL - BACKEND SERVER
// This file runs the whole website: serves pages, stores data
// in a real database (database.db), and handles admin login,
// notices, gallery uploads, student results/attendance, and
// contact messages.
// ============================================================

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// ------------------------------------------------------------
// DATABASE SETUP (SQLite - single file, no external service)
// ------------------------------------------------------------
const db = new Database(path.join(__dirname, 'database.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS students (
    roll_no TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    attendance INTEGER DEFAULT 0,
    subjects TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    caption TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    message TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS admin (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL
  );
`);

// Seed default admin (username: admin, password: sng@2026) - CHANGE THIS after first login
const adminExists = db.prepare('SELECT * FROM admin WHERE username = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('sng@2026', 10);
  db.prepare('INSERT INTO admin (username, password_hash) VALUES (?, ?)').run('admin', hash);
  console.log('Default admin created -> username: admin | password: sng@2026 (please change this!)');
}

// Seed sample notices if empty
const noticeCount = db.prepare('SELECT COUNT(*) as c FROM notices').get().c;
if (noticeCount === 0) {
  const insertNotice = db.prepare('INSERT INTO notices (title, date, description) VALUES (?, ?, ?)');
  insertNotice.run('Admissions Open 2026-27', '15 JUL', 'Admission enquiries for Nursery to Class 12th are now open. Visit the school office or message on WhatsApp.');
  insertNotice.run('Summer Break Ends', '01 JUL', 'School reopens after summer break. All students to report in proper uniform.');
  insertNotice.run('Fee Reminder', '20 JUN', 'Parents are requested to clear pending fees for this quarter at the earliest.');
}

// Seed sample students if empty
const studentCount = db.prepare('SELECT COUNT(*) as c FROM students').get().c;
if (studentCount === 0) {
  const insertStudent = db.prepare('INSERT INTO students (roll_no, name, class, attendance, subjects) VALUES (?, ?, ?, ?, ?)');
  insertStudent.run('101', 'Aarav Singh', '8th A', 92, JSON.stringify([['Hindi', 85], ['English', 78], ['Maths', 91], ['Science', 88], ['Social Science', 80]]));
  insertStudent.run('102', 'Priya Yadav', '10th B', 96, JSON.stringify([['Hindi', 90], ['English', 85], ['Maths', 94], ['Science', 92], ['Social Science', 87]]));
  insertStudent.run('103', 'Rohit Kumar', '5th A', 74, JSON.stringify([['Hindi', 70], ['English', 65], ['Maths', 72], ['EVS', 75]]));
}

// ------------------------------------------------------------
// MIDDLEWARE
// ------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'sng-school-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 hour login session
}));

// Serve uploaded images and the public website files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// File upload setup (photos go into /uploads with a safe unique name)
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Require login for admin API routes
function requireLogin(req, res, next) {
  if (req.session && req.session.loggedIn) return next();
  return res.status(401).json({ error: 'Not logged in' });
}

// ------------------------------------------------------------
// AUTH ROUTES
// ------------------------------------------------------------
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM admin WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  req.session.loggedIn = true;
  req.session.username = username;
  res.json({ success: true });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get('/api/session', (req, res) => {
  res.json({ loggedIn: !!(req.session && req.session.loggedIn) });
});

app.post('/api/change-password', requireLogin, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'Password too short' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admin SET password_hash = ? WHERE username = ?').run(hash, req.session.username);
  res.json({ success: true });
});

// ------------------------------------------------------------
// NOTICES API
// ------------------------------------------------------------
app.get('/api/notices', (req, res) => {
  const notices = db.prepare('SELECT * FROM notices ORDER BY id DESC').all();
  res.json(notices);
});

app.post('/api/notices', requireLogin, (req, res) => {
  const { title, date, description } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Title and date required' });
  const result = db.prepare('INSERT INTO notices (title, date, description) VALUES (?, ?, ?)').run(title, date, description || '');
  res.json({ success: true, id: result.lastInsertRowid });
});

app.delete('/api/notices/:id', requireLogin, (req, res) => {
  db.prepare('DELETE FROM notices WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ------------------------------------------------------------
// STUDENTS (RESULT / ATTENDANCE) API
// ------------------------------------------------------------
app.get('/api/students/:rollNo', (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE roll_no = ?').get(req.params.rollNo);
  if (!student) return res.status(404).json({ error: 'No record found for this roll number' });
  student.subjects = JSON.parse(student.subjects);
  res.json(student);
});

app.get('/api/students', requireLogin, (req, res) => {
  const students = db.prepare('SELECT * FROM students').all();
  res.json(students.map(s => ({ ...s, subjects: JSON.parse(s.subjects) })));
});

app.post('/api/students', requireLogin, (req, res) => {
  const { roll_no, name, class: className, attendance, subjects } = req.body;
  if (!roll_no || !name || !className) return res.status(400).json({ error: 'Roll number, name, and class required' });
  db.prepare(`
    INSERT INTO students (roll_no, name, class, attendance, subjects) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(roll_no) DO UPDATE SET name=excluded.name, class=excluded.class, attendance=excluded.attendance, subjects=excluded.subjects
  `).run(roll_no, name, className, attendance || 0, JSON.stringify(subjects || []));
  res.json({ success: true });
});

app.delete('/api/students/:rollNo', requireLogin, (req, res) => {
  db.prepare('DELETE FROM students WHERE roll_no = ?').run(req.params.rollNo);
  res.json({ success: true });
});

// ------------------------------------------------------------
// GALLERY API
// ------------------------------------------------------------
app.get('/api/gallery', (req, res) => {
  const items = db.prepare('SELECT * FROM gallery ORDER BY id DESC').all();
  res.json(items);
});

app.post('/api/gallery', requireLogin, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });
  const caption = req.body.caption || '';
  const result = db.prepare('INSERT INTO gallery (filename, caption) VALUES (?, ?)').run(req.file.filename, caption);
  res.json({ success: true, id: result.lastInsertRowid, filename: req.file.filename });
});

app.delete('/api/gallery/:id', requireLogin, (req, res) => {
  const item = db.prepare('SELECT * FROM gallery WHERE id = ?').get(req.params.id);
  if (item) {
    const filePath = path.join(__dirname, 'uploads', item.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    db.prepare('DELETE FROM gallery WHERE id = ?').run(req.params.id);
  }
  res.json({ success: true });
});

// ------------------------------------------------------------
// SITE PHOTOS (hero photo + QR code) - stored as key/value
// ------------------------------------------------------------
app.get('/api/settings/:key', (req, res) => {
  const row = db.prepare('SELECT * FROM site_settings WHERE key = ?').get(req.params.key);
  res.json({ value: row ? row.value : null });
});

app.post('/api/settings/:key', requireLogin, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });
  db.prepare(`
    INSERT INTO site_settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value
  `).run(req.params.key, req.file.filename);
  res.json({ success: true, filename: req.file.filename });
});

// ------------------------------------------------------------
// CONTACT MESSAGES API
// ------------------------------------------------------------
app.post('/api/messages', (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !message) return res.status(400).json({ error: 'Name and message required' });
  db.prepare('INSERT INTO messages (name, email, phone, message) VALUES (?, ?, ?, ?)').run(name, email || '', phone || '', message);
  res.json({ success: true });
});

app.get('/api/messages', requireLogin, (req, res) => {
  const messages = db.prepare('SELECT * FROM messages ORDER BY id DESC').all();
  res.json(messages);
});

app.delete('/api/messages/:id', requireLogin, (req, res) => {
  db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ------------------------------------------------------------
// START SERVER
// ------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\nS.N.G Public School website running!`);
  console.log(`Open in browser: http://localhost:${PORT}`);
  console.log(`Admin panel:     http://localhost:${PORT}/admin.html`);
  console.log(`Admin login ->   username: admin | password: sng@2026\n`);
});
