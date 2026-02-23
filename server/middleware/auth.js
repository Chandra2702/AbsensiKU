// Authentication middleware - checks if user is logged in via session
const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        req.user = req.session.user;
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized. Silakan login terlebih dahulu.' });
};

// Admin-only middleware
const requireAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        req.user = req.session.user;
        return next();
    }
    return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang dapat mengakses.' });
};

export { requireAuth, requireAdmin };
