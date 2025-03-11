const express = require('express');
const router = express.Router();
const Parse = require('parse/node');

// Listar todas as pessoas
router.get('/', async (req, res) => {
  const Pessoa = Parse.Object.extend('Pessoa');
  const query = new Parse.Query(Pessoa);
  try {
    const pessoas = await query.find();
    res.render('pessoas/index', { pessoas });
  } catch (err) {
    res.status(500).send(err);
  }
});

// Formulário para adicionar uma nova pessoa
router.get('/add', (req, res) => {
  res.render('pessoas/add');
});

// Adicionar uma nova pessoa
router.post('/add', async (req, res) => {
  const { nome, tipo } = req.body;
  const Pessoa = Parse.Object.extend('Pessoa');
  const pessoa = new Pessoa();
  pessoa.set('nome', nome);
  pessoa.set('tipo', tipo);
  try {
    await pessoa.save();
    res.redirect('/pessoas');
  } catch (err) {
    res.status(500).send(err);
  }
});

// Formulário para editar uma pessoa
router.get('/:id/edit', async (req, res) => {
  const Pessoa = Parse.Object.extend('Pessoa');
  const query = new Parse.Query(Pessoa);
  try {
    const pessoa = await query.get(req.params.id);
    res.render('pessoas/edit', { pessoa });
  } catch (err) {
    res.status(500).send(err);
  }
});

// Editar uma pessoa
router.post('/:id/edit', async (req, res) => {
  const { nome, tipo } = req.body;
  const Pessoa = Parse.Object.extend('Pessoa');
  const query = new Parse.Query(Pessoa);
  try {
    const pessoa = await query.get(req.params.id);
    pessoa.set('nome', nome);
    pessoa.set('tipo', tipo);
    await pessoa.save();
    res.redirect('/pessoas');
  } catch (err) {
    res.status(500).send(err);
  }
});

// Excluir uma pessoa
router.post('/:id/delete', async (req, res) => {
  const Pessoa = Parse.Object.extend('Pessoa');
  const query = new Parse.Query(Pessoa);
  try {
    const pessoa = await query.get(req.params.id);
    await pessoa.destroy();
    res.redirect('/pessoas');
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;
