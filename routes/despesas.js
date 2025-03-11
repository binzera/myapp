const express = require('express');
const router = express.Router();
const Parse = require('parse/node');
const Despesa = require('../models/despesa');
const Categoria = require('../models/categoria');

// Rota para criar uma nova despesa
router.post('/', async (req, res) => {
    const { data, descricao, quantidade, vl_unitario, categoriaId } = req.body;
    const categoria = new Parse.Object('Categoria');
    categoria.id = categoriaId;

    const newDespesa = new Despesa();
    newDespesa.set('data', new Date(data));
    newDespesa.set('descricao', descricao);
    newDespesa.set('quantidade', quantidade);
    newDespesa.set('vl_unitario', vl_unitario);
    newDespesa.set('vl_total', quantidade * vl_unitario);
    newDespesa.set('categoria', categoria);

    try {
        const savedDespesa = await newDespesa.save();
        res.status(201).json(savedDespesa);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Rota para listar todas as despesas
router.get('/json', async (req, res) => {
    const query = new Parse.Query(Despesa);
    query.include('categoria');
    try {
        const despesas = await query.find();
        res.status(200).json(despesas);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Rota para renderizar a view com a lista de despesas
router.get('/', async (req, res) => {
    const query = new Parse.Query(Despesa);
    query.include('categoria');
    try {
        const despesas = await query.find();
        res.render('despesas', { despesas });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Rota para exibir o formulário de inserção de despesas
router.get('/add', async function(req, res, next) {
    const query = new Parse.Query(Categoria);
    try {
        const categorias = await query.find();
        res.render('addDespesa', { categorias });
    } catch (error) {
        next(error);
    }
});

// Rota para processar o formulário de inserção de despesas
router.post('/add', async function(req, res, next) {
    const { data, descricao, quantidade, vl_unitario, categoriaId } = req.body;
    const categoria = new Parse.Object('Categoria');
    categoria.id = categoriaId;

    const newDespesa = new Despesa();
    newDespesa.set('data', new Date(data));
    newDespesa.set('descricao', descricao);
    newDespesa.set('quantidade', parseInt(quantidade));
    newDespesa.set('vl_unitario', parseFloat(vl_unitario));
    newDespesa.set('vl_total', quantidade * vl_unitario);
    newDespesa.set('categoria', categoria);

    try {
        await newDespesa.save();
        res.redirect('/despesas');
    } catch (error) {
        next(error);
    }
});

// Rota para excluir uma despesa
router.post('/:id/delete', function(req, res, next) {
  const despesaId = req.params.id;

  const Despesa = Parse.Object.extend('Despesa');
  const query = new Parse.Query(Despesa);

  query.get(despesaId)
    .then(despesa => {
      return despesa.destroy();
    })
    .then(() => res.redirect('/despesas'))
    .catch(error => next(error));
});

// Rota para exibir o formulário de edição de despesas
router.get('/:id/edit', async function(req, res, next) {
  const despesaId = req.params.id;

  const queryDespesa = new Parse.Query(Despesa);
  const queryCategoria = new Parse.Query(Categoria);

  try {
    const despesa = await queryDespesa.get(despesaId);
    const categorias = await queryCategoria.find();
    res.render('editDespesa', { despesa, categorias });
  } catch (error) {
    next(error);
  }
});

// Rota para processar o formulário de edição de despesas
router.post('/:id/edit', async function(req, res, next) {
  const despesaId = req.params.id;
  const { data, descricao, quantidade, vl_unitario, categoriaId } = req.body;
  const categoria = new Parse.Object('Categoria');
  categoria.id = categoriaId;

  const query = new Parse.Query(Despesa);

  try {
    const despesa = await query.get(despesaId);
    despesa.set('data', new Date(data));
    despesa.set('descricao', descricao);
    despesa.set('quantidade', parseInt(quantidade));
    despesa.set('vl_unitario', parseFloat(vl_unitario));
    despesa.set('vl_total', quantidade * vl_unitario);
    despesa.set('categoria', categoria);

    await despesa.save();
    res.redirect('/despesas');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
