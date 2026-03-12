const { pool } = require('../config/db');

exports.bookEvent = async (req, res) => {
    try {
        const { eventId, tickets, userName, userEmail } = req.body;

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const [events] = await connection.execute(
                'SELECT * FROM events WHERE id = ? AND available_seats >= ? AND status = "approved"',
                [eventId, tickets]
            );

            if (events.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ error: 'Not enough seats available or event not approved' });
            }

            const event = events[0];
            const totalAmount = event.price * tickets;

            let userId = null;
            if (req.session.user) {
                userId = req.session.user.id;
            }

            const [bookingResult] = await connection.execute(
                'INSERT INTO bookings (user_id, event_id, tickets, total_amount, guest_name, guest_email) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, eventId, tickets, totalAmount, userName, userEmail]
            );

            await connection.execute(
                'UPDATE events SET available_seats = available_seats - ? WHERE id = ?',
                [tickets, eventId]
            );

            await connection.commit();
            connection.release();

            res.json({
                message: 'Booking confirmed!',
                totalAmount: totalAmount,
                eventTitle: event.title,
                success: true
            });
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ error: 'Booking failed: ' + error.message });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        let bookings = [];

        if (req.session.user) {
            const userId = req.session.user.id;
            const [userBookings] = await pool.execute(`
                SELECT b.*, e.title as event_title, e.date as event_date, e.location, e.price
                FROM bookings b 
                JOIN events e ON b.event_id = e.id 
                WHERE b.user_id = ? 
                ORDER BY b.booking_date DESC
            `, [userId]);
            bookings = userBookings;
        }

        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const [bookings] = await pool.execute(`
            SELECT b.*, e.title as event_title, e.date as event_date, e.location,
                   u.name as user_name, u.email as user_email
            FROM bookings b 
            JOIN events e ON b.event_id = e.id 
            LEFT JOIN users u ON b.user_id = u.id
            ORDER BY b.booking_date DESC
        `);

        res.json(bookings);
    } catch (error) {
        console.error('Error fetching all bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};
