// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Please login to access this resource' });
    }
};

const requireOrganizer = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'organizer') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Organizer role required.' });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
};

module.exports = {
    requireAuth,
    requireOrganizer,
    requireAdmin
};
