const mysql = require('mysql2/promise');
const fs = require('fs');

async function dumpUsers() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'saketh123',
            database: 'online_events'
        });

        const [users] = await connection.execute('SELECT id, name, email, role, password FROM users');
        fs.writeFileSync('users_dump.json', JSON.stringify(users, null, 2));
        console.log('✅ Users dumped to users_dump.json');
        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

dumpUsers();
