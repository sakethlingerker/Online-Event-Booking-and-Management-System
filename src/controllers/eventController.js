const { pool } = require('../config/db');

exports.getAllEvents = async (req, res) => {
    try {
        const [events] = await pool.execute(`
            SELECT e.*, u.name as organizer_name 
            FROM events e 
            LEFT JOIN users u ON e.organizer_id = u.id 
            WHERE e.status = 'approved'
            ORDER BY e.date ASC
        `);
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const [events] = await pool.execute(`
            SELECT e.*, u.name as organizer_name 
            FROM events e 
            LEFT JOIN users u ON e.organizer_id = u.id 
            WHERE e.id = ?
        `, [req.params.id]);

        if (events.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(events[0]);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
};

exports.createEvent = async (req, res) => {
    const { title, description, date, location, price, total_seats, image_url } = req.body;
    const organizerId = req.session.user.id;
    const eventImage = image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500&h=300&fit=crop';

    try {
        const [result] = await pool.execute(
            'INSERT INTO events (title, description, date, location, price, total_seats, available_seats, organizer_id, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "pending")',
            [title, description, date, location, price, total_seats, total_seats, organizerId, eventImage]
        );

        res.json({
            message: 'Event created successfully and sent for admin approval',
            eventId: result.insertId,
            success: true
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
};

exports.updateEvent = async (req, res) => {
    const { title, description, date, location, price, total_seats, image_url } = req.body;
    const eventId = req.params.id;
    const organizerId = req.session.user.id;

    try {
        const [events] = await pool.execute(
            'SELECT id FROM events WHERE id = ? AND organizer_id = ?',
            [eventId, organizerId]
        );

        if (events.length === 0) {
            return res.status(404).json({ error: 'Event not found or access denied' });
        }

        await pool.execute(
            'UPDATE events SET title = ?, description = ?, date = ?, location = ?, price = ?, total_seats = ?, image_url = ? WHERE id = ?',
            [title, description, date, location, price, total_seats, image_url, eventId]
        );

        res.json({
            message: 'Event updated successfully',
            success: true
        });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
};

exports.deleteEvent = async (req, res) => {
    const eventId = req.params.id;
    const organizerId = req.session.user.id;

    try {
        const [events] = await pool.execute(
            'SELECT id FROM events WHERE id = ? AND organizer_id = ?',
            [eventId, organizerId]
        );

        if (events.length === 0) {
            return res.status(404).json({ error: 'Event not found or access denied' });
        }

        const [bookings] = await pool.execute(
            'SELECT id FROM bookings WHERE event_id = ?',
            [eventId]
        );

        if (bookings.length > 0) {
            return res.status(400).json({ error: 'Cannot delete event with existing bookings' });
        }

        await pool.execute('DELETE FROM events WHERE id = ?', [eventId]);

        res.json({
            message: 'Event deleted successfully',
            success: true
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
};
