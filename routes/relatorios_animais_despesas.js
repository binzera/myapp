const express = require('express');
const router = express.Router();
const Parse = require('parse/node');
const ComercioAnimais = require('../models/comercio_animais');
const Despesa = require('../models/despesa');

router.get('/', async (req, res) => {
  const anoSelecionado = req.query.ano || '0';
  let anos = [];

  // Buscar anos disponíveis (baseado em ComercioAnimais)
  const queryAnos = new Parse.Query(ComercioAnimais);
  queryAnos.ascending('data');
  let anoInicial = await queryAnos.first();
  if (!anoInicial) {
    anoInicial = new Date().getFullYear().toString();
  } else {
    anoInicial = anoInicial.get('data').getFullYear();
  }
  const anoAtual = new Date().getFullYear();
  for (let ano = anoInicial; ano <= anoAtual; ano++) {
    anos.push(ano);
  }

  // Filtro por ano
  let vendasTotal = 0;
  let despesasTotal = 0;

  // Vendas de animais
  const queryVendas = new Parse.Query(ComercioAnimais);
  queryVendas.equalTo('tipo', 'Venda');
  queryVendas.limit(10000);
  if (anoSelecionado !== '0') {
    const startDate = new Date(`${anoSelecionado}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${anoSelecionado}-12-31T23:59:59.999Z`);
    queryVendas.greaterThanOrEqualTo('data', startDate);
    queryVendas.lessThanOrEqualTo('data', endDate);
  }
  const vendas = await queryVendas.find();
  vendas.forEach(venda => {
    if (venda.get('tipo') === 'Venda') {
      const quantidade = parseFloat(venda.get('quantidade')) || 0;
      const valor = parseFloat(venda.get('valor')) || 0;
      vendasTotal += quantidade * valor;
    }
  });

  // Despesas
  const queryDespesas = new Parse.Query(Despesa);
  queryDespesas.limit(10000);
  if (anoSelecionado !== '0') {
    const startDate = new Date(`${anoSelecionado}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${anoSelecionado}-12-31T23:59:59.999Z`);
    queryDespesas.greaterThanOrEqualTo('data', startDate);
    queryDespesas.lessThanOrEqualTo('data', endDate);
  }
  const despesas = await queryDespesas.find();
  despesas.forEach(despesa => {
    despesasTotal += parseFloat(despesa.get('vl_total')) || 0;
  });

  res.render('relatorios/animaisDespesas.pug', {
    vendasTotal,
    despesasTotal,
    anos,
    anoSelecionado
  });
});

module.exports = router;
