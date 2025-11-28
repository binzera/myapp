const express = require('express');
const router = express.Router();
const Parse = require('parse/node');
const Despesa = require('../models/despesa');
const Categoria = require('../models/categoria');
const { isAdmin } = require('../middlewares/auth');

// Rota para criar uma nova despesa
router.post('/', isAdmin, async (req, res) => {
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
    
    // Filtro de descrição
    const descricaoFiltro = req.query.descricaoFiltro ? req.query.descricaoFiltro.trim() : '';
    if (descricaoFiltro) {
      query.matches('descricao', descricaoFiltro, 'i');
    }
    
  // Paginação no backend
  const page = parseInt(req.query.page) || 1;
  const perPage = 15;
  query.descending('data');
  query.skip((page - 1) * perPage);
  query.limit(perPage);
    
    const despesas = await query.find();
    // Buscar o total de registros para calcular totalPages
    const count = await query.count();
    const totalPages = Math.ceil(count / perPage);
    
    const categoriasQuery = new Parse.Query(Categoria);
    const categorias = await categoriasQuery.find();
    const categoriasMap = {};
    categorias.forEach(categoria => {
      categoriasMap[categoria.id] = categoria.get('descricao');
    });
    

    // Ordena despesas pela data (mais recente primeiro)
    //despesas.sort((a, b) => new Date(b.get('data')) - new Date(a.get('data')));

    let vlTotalDespesas = 0;
    despesas.forEach(despesa => {
      let dataString = despesa.get('data');
      dataString = dataString.toISOString().replace('T', ' ').replace('Z', '');
      const dataOriginal = new Date(dataString);
      despesa.set('dataFormatada', dataOriginal.toLocaleDateString('pt-BR'));
      vlTotalDespesas += despesa.get('vl_total') ? despesa.get('vl_total') : 0;
      const categoriaObj = despesa.get('categoria');
      if (categoriaObj) {
        despesa.set('categoriaNome', categoriasMap[categoriaObj.id]);
      }
    });
    
    res.render('despesas/index', {
      despesas,
      anoSelecionado,
      anos,
      page,
      totalPages,
      totalDespesas: count,
      descricaoFiltro,
      vlTotalDespesas
    });
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
router.post('/add', isAdmin, async (req, res) => {
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
    // Recupera ano e página da query string
    const ano = req.body.ano || '';
    const page = req.body.page || '';
    let redirectUrl = '/despesas';
    const params = [];
    if (ano) params.push(`ano=${ano}`);
    if (page) params.push(`page=${page}`);
    if (params.length) redirectUrl += '?' + params.join('&');
    res.redirect(redirectUrl);
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao adicionar despesa', error: err });
  }
});

// Rota para excluir uma despesa
router.post('/:id/delete', isAdmin, async (req, res) => {
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
  const anoSelecionado = req.query.ano || '';
  const page = req.query.page || '';

  const queryDespesa = new Parse.Query(Despesa);
  const queryCategoria = new Parse.Query(Categoria);

  try {
    const despesa = await queryDespesa.get(despesaId);
    const categorias = await queryCategoria.find();
    res.render('despesas/edit', { despesa, categorias, anoSelecionado, page });
  } catch (error) {
    next(error);
  }
});

// Rota para processar o formulário de edição de despesas
router.post('/:id/edit', isAdmin, async (req, res) => {
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
    // Recupera ano e página da query string
    const ano = req.body.ano || '';
    const page = req.body.page || '';
    let redirectUrl = '/despesas';
    const params = [];
    if (ano) params.push(`ano=${ano}`);
    if (page) params.push(`page=${page}`);
    if (params.length) redirectUrl += '?' + params.join('&');
    res.redirect(redirectUrl);
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao editar despesa', error: err });
  }
});

module.exports = router;
