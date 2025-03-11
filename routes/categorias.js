const express = require('express');
const router = express.Router();
const Parse = require('parse/node');
const Categoria = require('../models/categoria');

// Rota para criar uma nova categoria
router.post('/', async (req, res) => {
    const { descricao } = req.body;
    const newCategoria = new Categoria();
    newCategoria.set('descricao', descricao);

    try {
        const savedCategoria = await newCategoria.save();
        res.status(201).json(savedCategoria);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Rota para listar todas as categorias
router.get('/json', async (req, res) => {
    const query = new Parse.Query(Categoria);
    try {
        const categorias = await query.find();
        res.status(200).json(categorias);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Rota para renderizar a view com a lista de categorias
router.get('/', async (req, res) => {
    const query = new Parse.Query(Categoria);
    try {
        const categorias = await query.find();
        res.render('categorias', { categorias });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Rota para exibir o formulário de inserção de categorias
router.get('/add', function(req, res, next) {
  res.render('addCategoria');
});

// Rota para processar o formulário de inserção de categorias
router.post('/add', function(req, res, next) {
  const { descricao } = req.body;

  // Supondo que você esteja usando Parse para salvar os dados
  const categoria = new Categoria();

  categoria.set('descricao', descricao);

  categoria.save()
    .then(() => res.redirect('/categorias'))
    .catch(error => next(error));
});

// Rota para excluir uma categoria
router.post('/:id/delete', function(req, res, next) {
  const categoriaId = req.params.id;

  const query = new Parse.Query(Categoria);

  query.get(categoriaId)
    .then(categoria => {
      return categoria.destroy();
    })
    .then(() => res.redirect('/categorias'))
    .catch(error => next(error));
});

// Rota para exibir o formulário de edição de categorias
router.get('/:id/edit', function(req, res, next) {
  const categoriaId = req.params.id;

  const query = new Parse.Query(Categoria);

  query.get(categoriaId)
    .then(categoria => {
      res.render('editCategoria', { categoria });
    })
    .catch(error => next(error));
});

// Rota para processar o formulário de edição de categorias
router.post('/:id/edit', function(req, res, next) {
  const categoriaId = req.params.id;
  const { descricao } = req.body;

  const query = new Parse.Query(Categoria);

  query.get(categoriaId)
    .then(categoria => {
      categoria.set('descricao', descricao);
      return categoria.save();
    })
    .then(() => res.redirect('/categorias'))
    .catch(error => next(error));
});

module.exports = router;