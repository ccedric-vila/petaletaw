const admin = (req, res, next) => {
  // Sample check
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Admins only.' });
};

module.exports = admin;