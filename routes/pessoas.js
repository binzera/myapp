const express = require('express');
const router = express.Router();
const Parse = require('parse/node');
const Pessoa = require('../models/pessoa');
const { isAdmin } = require('../middlewares/auth');

// Listar todas as pessoas
router.get('/', async (req, res) => {
  const query = new Parse.Query(Pessoa);
  try {
    const pessoas = await query.find();
    res.render('pessoas/index', { pessoas });
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao listar pessoas', error: err });
  }
});

// Exibir formulário de cadastro
router.get('/add', (req, res) => {
  res.render('pessoas/add');
});

// Cadastrar nova pessoa
router.post('/add', isAdmin, async (req, res) => {
  const { tipo, nome } = req.body;
  const pessoa = new Pessoa();
  pessoa.set('tipo', tipo);
  pessoa.set('nome', nome);
  try {
    await pessoa.save();
    res.redirect('/pessoas');
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao cadastrar pessoa', error: err });
  }
});

// Exibir formulário de edição
router.get('/:id/edit', async (req, res) => {
  const query = new Parse.Query(Pessoa);
  try {
    const pessoa = await query.get(req.params.id);
    res.render('pessoas/edit', { pessoa });
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao buscar pessoa', error: err });
  }
});

// Editar pessoa
router.post('/:id/edit', isAdmin, async (req, res) => {
  const { tipo, nome } = req.body;
  const query = new Parse.Query(Pessoa);
  try {
    const pessoa = await query.get(req.params.id);
    pessoa.set('tipo', tipo);
    pessoa.set('nome', nome);
    await pessoa.save();
    res.redirect('/pessoas');
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao editar pessoa', error: err });
  }
});

// Excluir pessoa
router.post('/:id/delete', isAdmin, async (req, res) => {
  const query = new Parse.Query(Pessoa);
  try {
    const pessoa = await query.get(req.params.id);
    await pessoa.destroy();
    res.redirect('/pessoas');
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao excluir pessoa', error: err });
  }
});

module.exports = router;
