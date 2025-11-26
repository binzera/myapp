module.exports = {
  isAuthenticated: function(req, res, next) {
    if (req.session && req.session.user) return next();
    return res.redirect('/auth/login');
  },
  isAdmin: function(req, res, next) {
    if (req.session && req.session.user && Array.isArray(req.session.user.roles) && req.session.user.roles.includes('ROLE_ADMIN')) {
      return next();
    }
    res.status(403).render('error', { message: 'Acesso negado: é necessário ser administrador.' });
  }
};
