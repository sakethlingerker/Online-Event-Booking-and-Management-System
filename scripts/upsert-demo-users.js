require('dotenv').config();
const { pool } = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function upsertDemoUsers() {
    try {
        console.log('Resetting demo users to "password123"...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const demoUsers = [
            { name: 'Admin User', email: 'admin@eventhub.com', role: 'admin' },
            { name: 'Event Organizer', email: 'organizer@eventhub.com', role: 'organizer' },
            { name: 'Demo User', email: 'user@eventhub.com', role: 'user' }
        ];

        for (const user of demoUsers) {
            const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [user.email]);
            if (rows.length > 0) {
                await pool.execute('UPDATE users SET password = ?, role = ? WHERE email = ?', [hashedPassword, user.role, user.email]);
                console.log(`Updated password and role for ${user.email}`);
            } else {
                await pool.execute(
                    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                    [user.name, user.email, hashedPassword, user.role]
                );
                console.log(`Created user ${user.email}`);
            }
        }
        
        console.log('✅ Demo credentials successfully synced!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

upsertDemoUsers();
