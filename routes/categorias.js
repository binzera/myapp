const express = require('express');
const router = express.Router();
const Parse = require('parse/node');
const Categoria = require('../models/categoria');

// Função utilitária para buscar categoria por ID
async function getCategoriaById(id) {
  const query = new Parse.Query(Categoria);
  return await query.get(id);
}

// Rota para criar uma nova categoria (apenas /add)
router.post('/add', async (req, res, next) => {
  const { descricao } = req.body;
  if (!descricao) {
    return res.status(400).render('error', { message: 'Descrição é obrigatória' });
  }
  const categoria = new Categoria();
  categoria.set('descricao', descricao);
  try {
    await categoria.save();
    res.redirect('/categorias');
  } catch (error) {
    res.status(400).render('error', { message: 'Erro ao criar categoria', error });
  }
});

// Rota para listar todas as categorias (json)
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
    res.status(400).render('error', { message: 'Erro ao listar categorias', error });
  }
});

// Rota para exibir o formulário de inserção de categorias
router.get('/add', (req, res) => {
  res.render('categorias/add');
});

// Rota para excluir uma categoria
router.post('/:id/delete', async (req, res, next) => {
  try {
    const categoria = await getCategoriaById(req.params.id);
    await categoria.destroy();
    res.redirect('/categorias');
  } catch (error) {
    res.status(400).render('error', { message: 'Erro ao excluir categoria', error });
  }
});

// Rota para exibir o formulário de edição de categorias
router.get('/:id/edit', async (req, res, next) => {
  try {
    const categoria = await getCategoriaById(req.params.id);
    res.render('categorias/edit', { categoria });
  } catch (error) {
    res.status(400).render('error', { message: 'Erro ao buscar categoria', error });
  }
});

// Rota para processar o formulário de edição de categorias
router.post('/:id/edit', async (req, res, next) => {
  const { descricao } = req.body;
  try {
    const categoria = await getCategoriaById(req.params.id);
    categoria.set('descricao', descricao);
    await categoria.save();
    res.redirect('/categorias');
  } catch (error) {
    res.status(400).render('error', { message: 'Erro ao editar categoria', error });
  }
});

module.exports = router;