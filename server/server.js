const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');

app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }
}));

const useMySQL = process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME;
let db;
let isSqlite = false;
let rolesCol = null;

function log(msg){
    console.log(msg);
}

if (useMySQL) {
    db = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    db.connect(err => {
        if (err) {
            console.error('MySQL connect failed, falling back to SQLite:', err.message);
            initSqlite();
            return;
        }
        log('--- MySQL Database Connected Successfully! ---');
        rolesCol = 'name';
    });
} else {
    initSqlite();
}

function initSqlite(){
    const sqlite3 = require('sqlite3').verbose();
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const dbPath = path.join(dataDir, 'dev.db');
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) console.error('SQLite open error:', err.message);
        else log('--- SQLite DB ready at ' + dbPath + ' ---');
    });
    isSqlite = true;

    const createStatements = [
        `CREATE TABLE IF NOT EXISTS roles (role_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE)` ,
        `CREATE TABLE IF NOT EXISTS users (user_id INTEGER PRIMARY KEY AUTOINCREMENT, full_name TEXT, email TEXT UNIQUE, password TEXT, id_card TEXT, phone TEXT, gender TEXT, blood_type TEXT, role_id INTEGER DEFAULT 2)` ,
        `CREATE TABLE IF NOT EXISTS posts (post_id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, content TEXT, image_data TEXT, status TEXT DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)` ,
        `CREATE TABLE IF NOT EXISTS faqs (faq_id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, question TEXT, answer TEXT, status TEXT DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)` ,
        `CREATE TABLE IF NOT EXISTS reports (report_id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, issue_type TEXT, detail TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`
    ];

    db.serialize(() => {
        createStatements.forEach(sql => db.run(sql));
    });
}

function dbQuery(sql, params, cb){
    if (!cb && typeof params === 'function') { cb = params; params = [] }
    params = params || [];
    if (isSqlite){
        const trimmed = sql.trim().toUpperCase();
        if (trimmed.startsWith('SELECT')){
            db.all(sql, params, (err, rows) => cb(err, rows));
        } else {
            db.run(sql, params, function(err){
                if (err) return cb(err);
                cb(null, { insertId: this.lastID, affectedRows: this.changes });
            });
        }
    } else {
        db.query(sql, params, cb);
    }
}

function requireAuth(req, res, next){
    if (req.session && req.session.user) {
        req.user = req.session.user;
        return next();
    }
    res.status(401).json({ success: false, message: 'Unauthorized' });
}

function requireAdmin(req, res, next){
    if (req.session && req.session.user && req.session.user.role_id === 1) {
        req.user = req.session.user;
        return next();
    }
    res.status(403).json({ success: false, message: 'Forbidden' });
}

app.get('/api/health', (req, res) => {
    dbQuery('SELECT 1', (err, results) => {
        if (err) {
            return res.status(500).json({ 
                status: 'Database Connection Failed',
                error: err.message 
            });
        }
        res.json({ 
            status: 'Database Connected Successfully!',
            database: process.env.DB_NAME || 'sqlite',
            time: new Date()
        });
    });
});

app.get('/api/posts', (req, res) => {
    dbQuery('SELECT p.*, u.full_name FROM posts p LEFT JOIN users u ON p.user_id = u.user_id ORDER BY p.created_at DESC', 
    (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/posts', (req, res) => {
    const { user_id, content, image_data, status } = req.body;
    dbQuery('INSERT INTO posts (user_id, content, image_data, status) VALUES (?, ?, ?, ?)', 
    [user_id, content, image_data, status || 'pending'], 
    (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true, post_id: result.insertId });
    });
});

app.get('/api/users', (req, res) => {
    dbQuery('SELECT user_id, full_name, email, blood_type, phone, gender FROM users', 
    (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'อีเมลและรหัสผ่านจำเป็นต้องระบุ' });
    }

    dbQuery('SELECT user_id, full_name, email, role_id, password FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'ข้อผิดพลาดดาต้าเบส' });
        if (results && results.length > 0) {
            const userRow = results[0];
            const match = bcrypt.compareSync(password, userRow.password);
            if (!match) return res.status(401).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

            const user = { user_id: userRow.user_id, full_name: userRow.full_name, email: userRow.email, role_id: userRow.role_id };
            req.session.user = user;
            res.json({ success: true, user });
        } else {
            res.status(401).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }
    });
});

app.post('/api/logout', requireAuth, (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ success: false, message: 'ไม่สามารถออกจากระบบได้' });
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

app.post('/api/register', (req, res) => {
    const { email, password, full_name, id_card, phone, gender, blood_type } = req.body;
    
    if (!email || !password || !full_name || !id_card) {
        return res.status(400).json({ success: false, message: 'ข้อมูลที่จำเป็นหายไป' });
    }
    
    if (!/\w+@\w+\.\w+/.test(email)) {
        return res.status(400).json({ success: false, message: 'อีเมลไม่ถูกต้อง' });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร' });
    }

    dbQuery('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'ข้อผิดพลาดฐานข้อมูล' });

        if (results && results.length > 0) {
            return res.status(400).json({ success: false, message: 'อีเมลนี้ถูกใช้งานไปแล้ว' });
        }
        const hashed = bcrypt.hashSync(password, 10);
        dbQuery('INSERT INTO users (email, password, full_name, id_card, phone, gender, blood_type, role_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [email, hashed, full_name, id_card, phone, gender, blood_type, 2],
        (err, result) => {
            if (err) {
                console.error('Registration error:', err);
                return res.status(500).json({ success: false, message: 'ไม่สามารถสมัครสมาชิกได้' });
            }
            res.json({ success: true, user_id: result.insertId });
        });
    });
});

app.get('/api/faqs', (req, res) => {
    dbQuery('SELECT f.*, u.full_name FROM faqs f LEFT JOIN users u ON f.user_id = u.user_id ORDER BY f.created_at DESC', 
    (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/faqs', (req, res) => {
    const { user_id, question, answer, status } = req.body;
    dbQuery('INSERT INTO faqs (user_id, question, answer, status) VALUES (?, ?, ?, ?)', 
    [user_id, question, answer, status || 'pending'], 
    (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true, faq_id: result.insertId });
    });
});

app.get('/api/reports', (req, res) => {
    dbQuery('SELECT r.*, u.full_name FROM reports r LEFT JOIN users u ON r.user_id = u.user_id ORDER BY r.created_at DESC', 
    (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/reports', (req, res) => {
    const { user_id, issue_type, detail } = req.body;
    dbQuery('INSERT INTO reports (user_id, issue_type, detail) VALUES (?, ?, ?)', 
    [user_id, issue_type, detail], 
    (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true, report_id: result.insertId });
    });
});

app.put('/api/posts/:id', requireAdmin, (req, res) => {
    const { status } = req.body;
    dbQuery('UPDATE posts SET status = ? WHERE post_id = ?', 
    [status, req.params.id], 
    (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

app.delete('/api/posts/:id', requireAdmin, (req, res) => {
    dbQuery('DELETE FROM posts WHERE post_id = ?', [req.params.id], 
    (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

app.put('/api/faqs/:id', requireAdmin, (req, res) => {
    const { answer, status } = req.body;
    dbQuery('UPDATE faqs SET answer = ?, status = ? WHERE faq_id = ?', 
    [answer, status, req.params.id], 
    (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

app.delete('/api/faqs/:id', requireAdmin, (req, res) => {
    dbQuery('DELETE FROM faqs WHERE faq_id = ?', [req.params.id], 
    (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

 
app.use(express.static(path.join(__dirname, '..', 'public'))); 
app.use('/public', express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..', 'views')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'admin.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'register.html'));
});

app.get('/report', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'indexแจ้งปัญหาการใช้งาน.html'));
});

app.get('/faq', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'indexคำถามที่พบบ่อย.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'indexเกี่ยวกับ.html'));
});

app.get(/^\/views\/(.*)$/, (req, res) => {
    const target = req.params[0] || '';
    res.redirect('/' + target);
});

app.listen(3000, () => console.log('Server is running on http://localhost:3000'));