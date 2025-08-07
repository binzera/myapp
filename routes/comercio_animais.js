const express = require('express');
const router = express.Router();
const Parse = require('parse/node');
const Pessoa = require('../models/pessoa');
const ComercioAnimais = require('../models/comercio_animais');

// Rota para criar um novo comércio de animais
router.post('/', async (req, res) => {
    const { data, tipo, sexo, vendedor, comprador, quantidade, valor, peso, idade } = req.body;
    const newComercioAnimais = new ComercioAnimais();
    newComercioAnimais.set('data', new Date(data));
    newComercioAnimais.set('tipo', tipo);
    newComercioAnimais.set('sexo', sexo);
    newComercioAnimais.set('vendedor', vendedor);
    newComercioAnimais.set('comprador', comprador);
    newComercioAnimais.set('quantidade', quantidade);
    newComercioAnimais.set('valor', valor);
    newComercioAnimais.set('peso', peso);
    newComercioAnimais.set('idade', idade);

    try {
        const savedComercioAnimais = await newComercioAnimais.save();
        res.status(201).json(savedComercioAnimais);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Rota para listar todos os comércios de animais
router.get('/json', async (req, res) => {
    const query = new Parse.Query(ComercioAnimais);
    try {
        const comercioAnimais = await query.find();
        res.status(200).json(comercioAnimais);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Rota para listar todos os comércios de animais
router.get('/', async (req, res) => {
  const ComercioAnimal = Parse.Object.extend('ComercioAnimais');
  const anos = [];
  let anoSelecionado = req.query.ano;

  if (anoSelecionado == 0) {
    anoSelecionado = null;
  } else if (!anoSelecionado) {
    anoSelecionado = new Date().getFullYear().toString();
  }

  try {
    const queryAnos = new Parse.Query(ComercioAnimal);
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

    const query = new Parse.Query(ComercioAnimal);
    if (anoSelecionado) {
      const startDate = new Date(`${anoSelecionado}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${anoSelecionado}-12-31T23:59:59.999Z`);
      query.greaterThanOrEqualTo('data', startDate);
      query.lessThanOrEqualTo('data', endDate);
    }

    const comercioAnimais = await query.find();
    const pessoasQuery = new Parse.Query(Pessoa);
    const pessoas = await pessoasQuery.find();
    const pessoasMap = {};
    pessoas.forEach(pessoa => {
      pessoasMap[pessoa.id] = pessoa.get('nome');
    });
    comercioAnimais.forEach(comercioAnimal => {
      comercioAnimal.set('vendedorNome', pessoasMap[comercioAnimal.get('vendedor')]);
      comercioAnimal.set('compradorNome', pessoasMap[comercioAnimal.get('comprador')]);
    });
    res.render('comercioAnimais/index', { comercioAnimais, anoSelecionado, anos });
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao listar negócios', error: err });
  }
});

// Rota para exibir o formulário de inserção de comércios de animais
router.get('/add', async function(req, res, next) {
  const Pessoa = Parse.Object.extend('Pessoa');
  const query = new Parse.Query(Pessoa);
  try {
    const pessoas = await query.find();
    res.render('comercioAnimais/add', { pessoas });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Rota para processar o formulário de inserção de comércios de animais
router.post('/add', function(req, res, next) {
  const { data, tipo, sexo, vendedor, comprador, quantidade, valor, peso, idade } = req.body;

  const comercioAnimais = new ComercioAnimais();
  comercioAnimais.set('data', new Date(data));
  comercioAnimais.set('tipo', tipo);
  comercioAnimais.set('sexo', sexo);
  comercioAnimais.set('vendedor', vendedor);
  comercioAnimais.set('comprador', comprador);
  comercioAnimais.set('quantidade', parseInt(quantidade));
  comercioAnimais.set('valor', parseFloat(valor));
  comercioAnimais.set('peso', parseFloat(peso));
  comercioAnimais.set('idade', idade);

  comercioAnimais.save()
    .then(() => res.redirect('/comercio_animais'))
    .catch(error => next(error));
});

// Rota para excluir um comércio de animais
router.post('/:id/delete', function(req, res, next) {
  const comercioAnimaisId = req.params.id;

  const query = new Parse.Query(ComercioAnimais);

  query.get(comercioAnimaisId)
    .then(comercioAnimais => {
      return comercioAnimais.destroy();
    })
    .then(() => res.redirect('/comercio_animais'))
    .catch(error => next(error));
});

// Rota para exibir o formulário de edição de comércios de animais
router.get('/:id/edit', function(req, res, next) {
  const comercioAnimaisId = req.params.id;

  const query = new Parse.Query(ComercioAnimais);

  query.get(comercioAnimaisId)
    .then(comercioAnimais => {
      res.render('comercioAnimais/edit', { comercioAnimais });
    })
    .catch(error => next(error));
});

// Rota para processar o formulário de edição de comércios de animais
router.post('/:id/edit', function(req, res, next) {
  const comercioAnimaisId = req.params.id;
  const { data, tipo, sexo, vendedor, comprador, quantidade, valor, peso, idade } = req.body;

  const query = new Parse.Query(ComercioAnimais);

  query.get(comercioAnimaisId)
    .then(comercioAnimais => {
      comercioAnimais.set('data', new Date(data));
      comercioAnimais.set('tipo', tipo);
      comercioAnimais.set('sexo', sexo);
      comercioAnimais.set('vendedor', vendedor);
      comercioAnimais.set('comprador', comprador);
      comercioAnimais.set('quantidade', parseInt(quantidade));
      comercioAnimais.set('valor', parseFloat(valor));
      comercioAnimais.set('peso', parseFloat(peso));
      comercioAnimais.set('idade', idade);

      return comercioAnimais.save();
    })
    .then(() => res.redirect('/comercio_animais'))
    .catch(error => next(error));
});

module.exports = router;
