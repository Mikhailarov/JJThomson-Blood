const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'dev.db');

if (!fs.existsSync(dbPath)) {
    console.error('No SQLite DB found at', dbPath);
    process.exit(1);
}

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Failed to open DB:', err.message);
        process.exit(1);
    }
});

db.all('SELECT user_id, email, password, role_id FROM users', [], (err, rows) => {
    if (err) {
        console.error('Query error:', err.message);
        process.exit(1);
    }

    if (!rows || rows.length === 0) {
        console.log('No users found.');
        process.exit(0);
    }

    console.log('user_id | email | role_id | password_sample');
    rows.forEach(r => {
        const pwd = String(r.password || '');
        const isHash = pwd.startsWith('$2');
        console.log(`${r.user_id} | ${r.email} | ${r.role_id} | ${isHash ? 'bcrypt-hash' : 'plaintext'} | ${isHash ? pwd.slice(0,15)+'...' : pwd}`);
    });

    db.close();
});
