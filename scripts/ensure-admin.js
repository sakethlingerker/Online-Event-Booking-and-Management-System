const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function ensureAdmin() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'saketh123',
            database: 'online_events'
        });

        const [users] = await connection.execute('SELECT id FROM users WHERE email = ?', ['admin@eventhub.com']);

        if (users.length === 0) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            await connection.execute(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['Admin User', 'admin@eventhub.com', hashedPassword, 'admin']
            );
            console.log('✅ Admin user created: admin@eventhub.com / password123');
        } else {
            console.log('ℹ️ Admin user already exists.');
            // Update password just in case
            const hashedPassword = await bcrypt.hash('password123', 10);
            await connection.execute(
                'UPDATE users SET password = ?, role = "admin" WHERE email = ?',
                [hashedPassword, 'admin@eventhub.com']
            );
            console.log('✅ Admin user updated: admin@eventhub.com / password123');
        }

        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

ensureAdmin();
