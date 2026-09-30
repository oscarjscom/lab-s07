const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const os = require('os');
const fs = require('fs');
const path = require('path');

if (fs.existsSync(path.join(__dirname, '.env'))) {
  for (const l of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}
const { PORT = 3001, DB_HOST = 'localhost', DB_USER = 'labuser', DB_PASS = 'labpass',
  DB_NAME = 'labdb', JWT_SECRET = 'dev-secret' } = process.env;

const pool = mysql.createPool({ host: DB_HOST, user: DB_USER, password: DB_PASS, database: DB_NAME, connectionLimit: 10 });
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Identifica qué instancia respondió (útil para ver el balanceo)
app.use((req, res, next) => { res.set('X-Served-By', `${os.hostname()}:${PORT}`); next(); });

app.get('/health', (req, res) => res.send('OK'));
app.get('/api/instancia', (req, res) => res.json({ host: os.hostname(), port: Number(PORT) }));

const auth = (req, res, next) => {
  try { req.user = jwt.verify(req.cookies.token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'No autenticado' }); }
};

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password || password.length < 4) return res.status(400).json({ error: 'Datos inválidos' });
  try {
    await pool.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, await bcrypt.hash(password, 10)]);
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(e.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ error: e.code === 'ER_DUP_ENTRY' ? 'Usuario ya existe' : 'Error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  if (!rows.length || !(await bcrypt.compare(password || '', rows[0].password_hash)))
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  const token = jwt.sign({ id: rows[0].id, username }, JWT_SECRET, { expiresIn: '2h' });
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax' }).json({ ok: true, username });
});

app.post('/api/logout', (req, res) => res.clearCookie('token').json({ ok: true }));
app.get('/api/me', auth, (req, res) => res.json({ username: req.user.username }));

// CRUD productos
app.get('/api/productos', auth, async (req, res) => res.json((await pool.query('SELECT * FROM productos ORDER BY id'))[0]));
const valid = (b) => b && b.nombre && !isNaN(b.precio) && Number.isInteger(Number(b.stock));
app.post('/api/productos', auth, async (req, res) => {
  if (!valid(req.body)) return res.status(400).json({ error: 'Datos inválidos' });
  const [r] = await pool.query('INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)', [req.body.nombre, req.body.precio, req.body.stock]);
  res.status(201).json({ id: r.insertId });
});
app.put('/api/productos/:id', auth, async (req, res) => {
  if (!valid(req.body)) return res.status(400).json({ error: 'Datos inválidos' });
  const [r] = await pool.query('UPDATE productos SET nombre=?, precio=?, stock=? WHERE id=?', [req.body.nombre, req.body.precio, req.body.stock, req.params.id]);
  r.affectedRows ? res.json({ ok: true }) : res.status(404).json({ error: 'No existe' });
});
app.delete('/api/productos/:id', auth, async (req, res) => {
  const [r] = await pool.query('DELETE FROM productos WHERE id=?', [req.params.id]);
  r.affectedRows ? res.json({ ok: true }) : res.status(404).json({ error: 'No existe' });
});

async function initDb() {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(100) NOT NULL)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0)`);
}
initDb().catch(e => console.error('initDb:', e.message));

app.listen(PORT, () => console.log(`App escuchando en puerto ${PORT}`));
