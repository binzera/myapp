const express = require('express');
const router = express.Router();
const Parse = require('parse/node');

// Rota GET para exibir o formulário de login
router.get('/login', (req, res) => {
  res.render('auth/login', { error: null });
});

// Rota POST para processar o login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await Parse.User.logIn(username, password);
    req.session.user = {
      id: user.id,
      username: user.get('username'),
      email: user.get('email')
    };
    res.redirect('/');
  } catch (err) {
    res.render('auth/login', { error: 'Usuário ou senha inválidos.' });
  }
});

// Rota para logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});

module.exports = router;
