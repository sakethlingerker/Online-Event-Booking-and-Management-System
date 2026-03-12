const { pool } = require('../config/db');

exports.getDashboardData = async (req, res) => {
    const organizerId = req.session.user.id;

    try {
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(e.id) as total_events,
                COALESCE(SUM(e.total_seats - e.available_seats), 0) as total_tickets_sold,
                COALESCE(SUM(b.total_amount), 0) as total_revenue,
                COALESCE(AVG(e.total_seats - e.available_seats), 0) as avg_attendance
            FROM events e 
            LEFT JOIN bookings b ON e.id = b.event_id 
            WHERE e.organizer_id = ?
        `, [organizerId]);

        const [recentBookings] = await pool.execute(`
            SELECT b.*, e.title as event_title, u.name as user_name, u.email as user_email
            FROM bookings b 
            JOIN events e ON b.event_id = e.id 
            LEFT JOIN users u ON b.user_id = u.id
            WHERE e.organizer_id = ?
            ORDER BY b.booking_date DESC 
            LIMIT 10
        `, [organizerId]);

        const [upcomingEvents] = await pool.execute(`
            SELECT * FROM events 
            WHERE organizer_id = ? AND date > NOW() 
            ORDER BY date ASC 
            LIMIT 5
        `, [organizerId]);

        res.json({
            stats: {
                total_events: parseInt(stats[0].total_events) || 0,
                total_tickets_sold: parseInt(stats[0].total_tickets_sold) || 0,
                total_revenue: parseFloat(stats[0].total_revenue) || 0,
                avg_attendance: parseFloat(stats[0].avg_attendance) || 0
            },
            recentBookings: recentBookings || [],
            upcomingEvents: upcomingEvents || []
        });
    } catch (error) {
        console.error('Error fetching organizer dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
};

exports.getOrganizerEvents = async (req, res) => {
    const organizerId = req.session.user.id;

    try {
        const [events] = await pool.execute(`
            SELECT e.*, 
                   COUNT(b.id) as total_bookings,
                   COALESCE(SUM(b.tickets), 0) as total_tickets_sold,
                   COALESCE(SUM(b.total_amount), 0) as total_revenue,
                   ROUND((COALESCE(SUM(b.tickets), 0) / e.total_seats) * 100, 2) as occupancy_rate
            FROM events e 
            LEFT JOIN bookings b ON e.id = b.event_id 
            WHERE e.organizer_id = ?
            GROUP BY e.id
            ORDER BY e.date DESC
        `, [organizerId]);

        const processedEvents = events.map(event => ({
            ...event,
            total_bookings: parseInt(event.total_bookings) || 0,
            total_tickets_sold: parseInt(event.total_tickets_sold) || 0,
            total_revenue: parseFloat(event.total_revenue) || 0,
            occupancy_rate: parseFloat(event.occupancy_rate) || 0
        }));

        res.json(processedEvents);
    } catch (error) {
        console.error('Error fetching organizer events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};
