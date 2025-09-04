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
      console.log('Usuário logado com sucesso:', user.get('username'));
      // Buscar roles do usuário
      const roleQuery = new Parse.Query(Parse.Role);
      roleQuery.equalTo('users', user);
      const roles = await roleQuery.find();
      const roleNames = roles.map(role => role.get('name'));
      console.log('Funções do usuário:', roleNames);
      req.session.user = {
        id: user.id,
        username: user.get('username'),
        email: user.get('email'),
        roles: roleNames
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
