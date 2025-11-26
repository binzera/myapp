const express = require('express');
const router = express.Router();
const Parse = require('parse/node');
const Rebanho = require('../models/rebanho');
const Pessoa = require('../models/pessoa');
const { isAdmin } = require('../middlewares/auth');

// Listagem
router.get('/', async (req, res) => {
  const RebanhoObj = Parse.Object.extend('Rebanho');
  try {
    const query = new Parse.Query(RebanhoObj);
    query.descending('createdAt');
    const rebanhos = await query.find();

    // buscar nomes de proprietários
    const pessoasQuery = new Parse.Query(Pessoa);
    const pessoas = await pessoasQuery.find();
    const pessoasMap = {};
    pessoas.forEach(p => { pessoasMap[p.id] = p.get('nome'); });
    rebanhos.forEach(r => {
      r.set('proprietarioNome', pessoasMap[r.get('proprietario')] || 'N/A');
    });

    res.render('rebanho/index', { rebanhos });
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao listar rebanhos', error: err });
  }
});

// Form add
router.get('/add', isAdmin, async (req, res) => {
  try {
    const pessoasQuery = new Parse.Query(Pessoa);
    const pessoas = await pessoasQuery.find();
    res.render('rebanho/add', { pessoas });
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao carregar formulário', error: err });
  }
});

// Process add (protected)
router.post('/add', isAdmin, async (req, res) => {
  const { sexo, idade, proprietario, quantidade, ano } = req.body;
  const errors = [];
  if (!sexo || !['M', 'F'].includes(sexo)) errors.push('Sexo inválido.');
  if (!idade || String(idade).trim() === '') errors.push('Idade é obrigatória.');
  if (!proprietario || String(proprietario).trim() === '') errors.push('Proprietário é obrigatório.');
  const qtd = parseFloat(quantidade);
  if (isNaN(qtd) || qtd <= 0) errors.push('Quantidade deve ser maior que zero.');
  const currentYear = new Date().getFullYear();
  const anoInt = parseInt(ano, 10);
  if (isNaN(anoInt) || anoInt < 1900 || anoInt > currentYear) errors.push(`Ano inválido. Informe entre 1900 e ${currentYear}.`);

  if (errors.length) {
    try {
      const pessoasQuery = new Parse.Query(Pessoa);
      const pessoas = await pessoasQuery.find();
      return res.status(400).render('rebanho/add', { pessoas, errors, form: { sexo, idade, proprietario, quantidade, ano } });
    } catch (err) {
      return res.status(500).render('error', { message: 'Erro ao carregar formulário', error: err });
    }
  }

  const rebanho = new Rebanho();
  rebanho.set('sexo', sexo);
  rebanho.set('idade', idade);
  rebanho.set('proprietario', proprietario);
  rebanho.set('quantidade', qtd);
  rebanho.set('ano', anoInt);
  try {
    await rebanho.save();
    res.redirect('/rebanho');
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao criar rebanho', error: err });
  }
});

// Delete
router.post('/:id/delete', isAdmin, async (req, res) => {
  const query = new Parse.Query(Rebanho);
  try {
    const obj = await query.get(req.params.id);
    await obj.destroy();
    res.redirect('/rebanho');
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao excluir rebanho', error: err });
  }
});

// Edit form
router.get('/:id/edit', isAdmin, async (req, res) => {
  try {
    const query = new Parse.Query(Rebanho);
    const rebanho = await query.get(req.params.id);
    const pessoasQuery = new Parse.Query(Pessoa);
    const pessoas = await pessoasQuery.find();
    res.render('rebanho/edit', { rebanho, pessoas });
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao carregar edição', error: err });
  }
});

// Process edit
router.post('/:id/edit', isAdmin, async (req, res) => {
  const { sexo, idade, proprietario, quantidade, ano } = req.body;
  const errors = [];
  if (!sexo || !['M', 'F'].includes(sexo)) errors.push('Sexo inválido.');
  if (!idade || String(idade).trim() === '') errors.push('Idade é obrigatória.');
  if (!proprietario || String(proprietario).trim() === '') errors.push('Proprietário é obrigatório.');
  const qtd = parseFloat(quantidade);
  if (isNaN(qtd) || qtd <= 0) errors.push('Quantidade deve ser maior que zero.');
  const currentYear = new Date().getFullYear();
  const anoInt = parseInt(ano, 10);
  if (isNaN(anoInt) || anoInt < 1900 || anoInt > currentYear) errors.push(`Ano inválido. Informe entre 1900 e ${currentYear}.`);

  try {
    const query = new Parse.Query(Rebanho);
    const rebanho = await query.get(req.params.id);

    if (errors.length) {
      const pessoasQuery = new Parse.Query(Pessoa);
      const pessoas = await pessoasQuery.find();
      return res.status(400).render('rebanho/edit', { rebanho, pessoas, errors, form: { sexo, idade, proprietario, quantidade, ano } });
    }

    rebanho.set('sexo', sexo);
    rebanho.set('idade', idade);
    rebanho.set('proprietario', proprietario);
    rebanho.set('quantidade', qtd);
    rebanho.set('ano', anoInt);
    await rebanho.save();
    res.redirect('/rebanho');
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao editar rebanho', error: err });
  }
});

module.exports = router;
