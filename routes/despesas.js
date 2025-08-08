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
  const Despesa = Parse.Object.extend('Despesa');
  const Categoria = Parse.Object.extend('Categoria');
  const anos = [];
  let anoSelecionado = req.query.ano;
  if (anoSelecionado == 0) {
    anoSelecionado = null;
  } else if (!anoSelecionado) {
    anoSelecionado = new Date().getFullYear().toString();
  }

  try {
    const queryAnos = new Parse.Query(Despesa);
    queryAnos.ascending('data');
    let anoInicial = await queryAnos.first();
    if(!anoInicial) {
      anoInicial = new Date().getFullYear().toString();
    } else {
      anoInicial = anoInicial.get('data').getFullYear();
    }
    const anoAtual = new Date().getFullYear();
    for (let ano = anoInicial; ano <= anoAtual; ano++) {
      anos.push(ano);
    }

    const query = new Parse.Query(Despesa);
    // Filtra por ano no backend
    if (anoSelecionado) {
      const startDate = new Date(`${anoSelecionado}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${anoSelecionado}-12-31T23:59:59.999Z`);
      query.greaterThanOrEqualTo('data', startDate);
      query.lessThanOrEqualTo('data', endDate);
    }
    query.include('categoria');
    query.limit(1000); // Limita o número de resultados para evitar problemas de performance
    const despesas = await query.find();
    console.log('Total de despesas: ' + despesas.length);
    const categoriasQuery = new Parse.Query(Categoria);
    const categorias = await categoriasQuery.find();
    const categoriasMap = {};
    categorias.forEach(categoria => {
      categoriasMap[categoria.id] = categoria.get('descricao');
    });
    
    // Ordena despesas pela data (mais recente primeiro)
    despesas.sort((a, b) => new Date(b.get('data')) - new Date(a.get('data')));

    despesas.forEach(despesa => {
      let dataString = despesa.get('data');
      dataString = dataString.toISOString().replace('T', ' ').replace('Z', '');
      const dataOriginal = new Date(dataString);
      console.log(despesa.get('vl_total') ? despesa.get('vl_total') : 'N/A');
      despesa.set('dataFormatada', dataOriginal.toLocaleDateString('pt-BR'));
      
      const categoriaObj = despesa.get('categoria');
      if (categoriaObj) {
        despesa.set('categoriaNome', categoriasMap[categoriaObj.id]);
      }
    });
    
    res.render('despesas/index', { despesas, anoSelecionado, anos });
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao listar despesas', error: err });
  }
});

// Rota para exibir o formulário de inserção de despesas
router.get('/add', async function(req, res, next) {
    const query = new Parse.Query(Categoria);
    try {
        const categorias = await query.find();
        res.render('despesas/add', { categorias });
    } catch (error) {
        next(error);
    }
});

// Rota para processar o formulário de inserção de despesas
router.post('/add', async (req, res) => {
  const { data, descricao, quantidade, vl_unitario, categoriaId } = req.body;

  const categoria = new Categoria();
  categoria.id = categoriaId;

  const despesa = new Despesa();
  despesa.set('data', new Date(data));
  despesa.set('descricao', descricao);
  despesa.set('quantidade', parseFloat(quantidade));
  despesa.set('vl_unitario', parseFloat(vl_unitario));
  despesa.set('vl_total', parseFloat(quantidade) * parseFloat(vl_unitario));
  despesa.set('categoria', categoria);
  try {
    await despesa.save();
    res.redirect('/despesas');
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao adicionar despesa', error: err });
  }
});

// Rota para excluir uma despesa
router.post('/:id/delete', async (req, res) => {
  const Despesa = Parse.Object.extend('Despesa');
  const query = new Parse.Query(Despesa);
  try {
    const despesa = await query.get(req.params.id);
    await despesa.destroy();
    res.redirect('/despesas');
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao excluir despesa', error: err });
  }
});

// Rota para exibir o formulário de edição de despesas
router.get('/:id/edit', async function(req, res, next) {
  const despesaId = req.params.id;

  const queryDespesa = new Parse.Query(Despesa);
  const queryCategoria = new Parse.Query(Categoria);

  try {
    const despesa = await queryDespesa.get(despesaId);
    const categorias = await queryCategoria.find();
    res.render('despesas/edit', { despesa, categorias });
  } catch (error) {
    next(error);
  }
});

// Rota para processar o formulário de edição de despesas
router.post('/:id/edit', async (req, res) => {
  const { data, descricao, quantidade, vl_unitario, categoriaId } = req.body;
  const Despesa = Parse.Object.extend('Despesa');
  const query = new Parse.Query(Despesa);
  const categoria = new Categoria();
  categoria.id = categoriaId;
  try {
    const despesa = await query.get(req.params.id);
    despesa.set('data', new Date(data));
    despesa.set('descricao', descricao);
    despesa.set('quantidade', parseFloat(quantidade));
    despesa.set('vl_unitario', parseFloat(vl_unitario));
    despesa.set('vl_total', parseFloat(quantidade) * parseFloat(vl_unitario));
    despesa.set('categoria', categoria);
    await despesa.save();
    res.redirect('/despesas');
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao editar despesa', error: err });
  }
});

module.exports = router;
