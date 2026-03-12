const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'saketh123',
    database: process.env.DB_NAME || 'online_events',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Initialize database connection
async function initializeDatabase() {
    try {
        // Test the connection
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');

        // Initialize tables if they don't exist
        await initializeDatabaseAndTables(connection);

        connection.release();
        return true;

    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

// Initialize database and tables
async function initializeDatabaseAndTables(connection) {
    try {
        // Create users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('user', 'organizer', 'admin') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create events table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                date DATETIME NOT NULL,
                location VARCHAR(200) NOT NULL,
                price DECIMAL(10,2) NOT NULL DEFAULT 0,
                total_seats INT NOT NULL,
                available_seats INT NOT NULL,
                organizer_id INT,
                image_url VARCHAR(500),
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                admin_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organizer_id) REFERENCES users(id)
            )
        `);

        // Create bookings table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                event_id INT NOT NULL,
                tickets INT NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                guest_name VARCHAR(100),
                guest_email VARCHAR(100),
                status ENUM('confirmed', 'cancelled') DEFAULT 'confirmed',
                booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (event_id) REFERENCES events(id)
            )
        `);

        console.log('✅ Database tables initialized successfully');

        // Ensure status and admin_notes columns exist (Migration for existing databases)
        await ensureEventColumns(connection);

        // Insert sample data if tables are empty
        await insertSampleData(connection);

    } catch (error) {
        console.error('Error initializing database and tables:', error);
        throw error;
    }
}

// Ensure event columns exist (Migration)
async function ensureEventColumns(connection) {
    try {
        const [columns] = await connection.execute('SHOW COLUMNS FROM events');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('status')) {
            console.log('📥 Adding status column to events table...');
            await connection.execute("ALTER TABLE events ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' AFTER image_url");
        }

        if (!columnNames.includes('admin_notes')) {
            console.log('📥 Adding admin_notes column to events table...');
            await connection.execute("ALTER TABLE events ADD COLUMN admin_notes TEXT AFTER status");
        }

        // Update existing events to 'approved' if they were just migrated
        if (!columnNames.includes('status')) {
            await connection.execute("UPDATE events SET status = 'approved'");
        }

    } catch (error) {
        console.error('Error ensuring event columns:', error);
    }
}

// Insert sample data
async function insertSampleData(connection) {
    try {
        // Check if sample data already exists
        const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');

        if (users[0].count === 0) {
            console.log('📥 Inserting sample data...');

            // Insert sample users
            const hashedPassword = await bcrypt.hash('password123', 10);

            // Insert admin user
            await connection.execute(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['Admin User', 'admin@eventhub.com', hashedPassword, 'admin']
            );

            // Insert organizer
            const [organizerResult] = await connection.execute(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['Event Organizer', 'organizer@eventhub.com', hashedPassword, 'organizer']
            );

            const organizerId = organizerResult.insertId;

            // Insert regular user
            await connection.execute(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['John Doe', 'user@eventhub.com', hashedPassword, 'user']
            );

            // Insert sample events
            const sampleEvents = [
                [
                    'Tech Conference 2024',
                    'Annual technology conference featuring latest innovations in AI, Web Development, and Cloud Computing.',
                    '2024-12-15 09:00:00',
                    'Convention Center, New York',
                    199.99, 200, 200, organizerId,
                    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=300&fit=crop',
                    'approved'
                ],
                [
                    'Music Festival',
                    'Summer music festival with popular artists and bands. Food trucks, drinks, and amazing performances!',
                    '2024-07-20 14:00:00',
                    'Central Park, NYC',
                    79.99, 5000, 5000, organizerId,
                    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=500&h=300&fit=crop',
                    'approved'
                ],
                [
                    'Business Workshop',
                    'Leadership and management skills workshop for professionals. Learn from industry experts.',
                    '2024-08-10 10:00:00',
                    'Business Center, Chicago',
                    149.99, 50, 50, organizerId,
                    'https://images.unsplash.com/photo-1515168833906-d2d02d7b2b14?w=500&h=300&fit=crop',
                    'approved'
                ]
            ];

            for (const event of sampleEvents) {
                await connection.execute(
                    'INSERT INTO events (title, description, date, location, price, total_seats, available_seats, organizer_id, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    event
                );
            }

            console.log('✅ Sample data inserted successfully');
            console.log('👤 Demo accounts created with password: password123');
        } else {
            console.log('✅ Database already contains data');
        }
    } catch (error) {
        console.error('Error inserting sample data:', error);
    }
}

module.exports = {
    pool,
    initializeDatabase
};
