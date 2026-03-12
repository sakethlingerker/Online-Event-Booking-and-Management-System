const { pool } = require('../config/db');

exports.getAllEventsForAdmin = async (req, res) => {
    try {
        const [events] = await pool.execute(`
            SELECT e.*, u.name as organizer_name, u.email as organizer_email
            FROM events e 
            JOIN users u ON e.organizer_id = u.id 
            ORDER BY 
                CASE e.status 
                    WHEN 'pending' THEN 1
                    WHEN 'approved' THEN 2
                    WHEN 'rejected' THEN 3
                END,
                e.created_at DESC
        `);

        res.json(events);
    } catch (error) {
        console.error('Error fetching admin events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

exports.approveEvent = async (req, res) => {
    const eventId = req.params.id;
    const { admin_notes } = req.body;

    try {
        const [events] = await pool.execute('SELECT id FROM events WHERE id = ?', [eventId]);
        if (events.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        await pool.execute(
            'UPDATE events SET status = "approved", admin_notes = ? WHERE id = ?',
            [admin_notes || 'Event approved by admin', eventId]
        );

        res.json({
            message: 'Event approved successfully',
            success: true
        });
    } catch (error) {
        console.error('Error approving event:', error);
        res.status(500).json({ error: 'Failed to approve event' });
    }
};

exports.rejectEvent = async (req, res) => {
    const eventId = req.params.id;
    const { admin_notes } = req.body;

    try {
        const [events] = await pool.execute('SELECT id FROM events WHERE id = ?', [eventId]);
        if (events.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        await pool.execute(
            'UPDATE events SET status = "rejected", admin_notes = ? WHERE id = ?',
            [admin_notes || 'Event rejected by admin', eventId]
        );

        res.json({
            message: 'Event rejected successfully',
            success: true
        });
    } catch (error) {
        console.error('Error rejecting event:', error);
        res.status(500).json({ error: 'Failed to reject event' });
    }
};
