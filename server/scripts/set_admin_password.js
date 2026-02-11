const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

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
        const newPass = '123456';
        const hashed = bcrypt.hashSync(newPass, 10);
        const [result] = await conn.execute('UPDATE users SET password = ? WHERE email = ?', [hashed, 'admin@gmail.com']);
        console.log('Affected rows:', result.affectedRows);
        if (result.affectedRows === 0) console.log('No user updated — check that admin@gmail.com exists.');
        else console.log('Admin password updated to 123456');
    }catch(e){
        console.error('Update error:', e.message);
    }finally{
        if (conn) await conn.end();
    }
}

run();
