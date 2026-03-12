require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');

const { initializeDatabase, pool } = require('./src/config/db');

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const eventRoutes = require('./src/routes/eventRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const organizerRoutes = require('./src/routes/organizerRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'event-booking-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// HTML Page Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/events.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'events.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/booking.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'booking.html'));
});

app.get('/my-bookings.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'my-bookings.html'));
});

app.get('/organizer-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'organizer-dashboard.html'));
});

app.get('/admin-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// API Routes
app.use('/api', authRoutes);
app.use('/api', bookingRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/admin', adminRoutes);

// Debug endpoint to check database
app.get('/api/debug', async (req, res) => {
    try {
        const [events] = await pool.execute('SELECT * FROM events');
        const [bookings] = await pool.execute('SELECT * FROM bookings');
        const [users] = await pool.execute('SELECT * FROM users');

        res.json({
            events: events,
            bookings: bookings,
            users: users,
            eventsCount: events.length,
            bookingsCount: bookings.length,
            usersCount: users.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const [result] = await pool.execute('SELECT 1 as healthy');
        res.json({
            status: 'healthy',
            database: 'connected',
            session: req.session.user ? 'active' : 'inactive'
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('📊 Testing database connection...');
    await initializeDatabase();
    console.log(`💡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`💡 Debug info: http://localhost:${PORT}/api/debug`);
});