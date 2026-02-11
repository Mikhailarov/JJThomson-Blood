const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const cfg = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'blood_bank'
};

async function run(){
    let conn;
    try{
        conn = await mysql.createConnection(cfg);
    }catch(e){
        console.error('MySQL connect failed:', e.message);
        process.exit(1);
    }

    try{
        const [rows] = await conn.execute('SELECT user_id, email, password, role_id FROM users');
        if (!rows || rows.length === 0){
            console.log('No users found in MySQL users table.');
        } else {
            console.log('user_id | email | role_id | password_sample');
            rows.forEach(r => {
                const pwd = String(r.password || '');
                const isHash = pwd.startsWith('$2');
                console.log(`${r.user_id} | ${r.email} | ${r.role_id} | ${isHash ? 'bcrypt-hash' : 'plaintext'} | ${isHash ? pwd.slice(0,15)+'...' : pwd}`);
            });
        }
    }catch(e){
        console.error('Query error:', e.message);
    }finally{
        if (conn) await conn.end();
    }
}

run();
