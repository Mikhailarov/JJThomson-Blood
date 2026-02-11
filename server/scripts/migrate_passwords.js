const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcryptjs');
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
        const [rows] = await conn.execute('SELECT user_id, email, password FROM users');
        const toUpdate = rows.filter(r => !(String(r.password || '').startsWith('$2')));
        if (toUpdate.length === 0){
            console.log('No plaintext passwords found. Nothing to do.');
            return;
        }

        console.log('Will migrate', toUpdate.length, 'users.');
        for (const r of toUpdate){
            const hashed = bcrypt.hashSync(String(r.password || ''), 10);
            await conn.execute('UPDATE users SET password = ? WHERE user_id = ?', [hashed, r.user_id]);
            console.log(`Migrated user ${r.user_id} (${r.email})`);
        }

        console.log('Migration complete.');
    }catch(e){
        console.error('Error during migration:', e.message);
    }finally{
        if (conn) await conn.end();
    }
}

run();
