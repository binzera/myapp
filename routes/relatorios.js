const express = require('express');
const router = express.Router();
const Parse = require('parse/node');
const Despesa = require('../models/despesa');
const Categoria = require('../models/categoria');

// Relatório: valor total das despesas por categoria
router.get('/despesas-por-categoria', async (req, res) => {
  const Despesa = Parse.Object.extend('Despesa');
  const Categoria = Parse.Object.extend('Categoria');
  const anoSelecionado = req.query.ano || '0';
  let anos = [];

  // Buscar anos disponíveis
  const queryAnos = new Parse.Query(Despesa);
  queryAnos.select('data');
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

  // Filtro por ano
  const query = new Parse.Query(Despesa);
  if (anoSelecionado !== '0') {
    const startDate = new Date(`${anoSelecionado}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${anoSelecionado}-12-31T23:59:59.999Z`);
    query.greaterThanOrEqualTo('data', startDate);
    query.lessThanOrEqualTo('data', endDate);
  }

  query.include('categoria');
  query.limit(10000); // Ajuste conforme necessário
  const despesasFiltradas = await query.find();
  console.log(`Despesas filtradas: ${despesasFiltradas.length}`);

  // Agrupar por categoria
  const relatorio = {};
  for (const despesa of despesasFiltradas) {
    const categoriaObj = despesa.get('categoria');
    let categoriaNome = '';
    if (categoriaObj && categoriaObj.get) {
      categoriaNome = categoriaObj.get('descricao'); // ou 'nome', conforme seu modelo
    } else {
      categoriaNome = 'Sem categoria';
    }
    const valor = despesa.get('vl_total') || 0;
    relatorio[categoriaNome] = (relatorio[categoriaNome] || 0) + valor;
  }

  res.render('relatorios/despesasPorCategoria', {
    relatorio,
    anos,
    anoSelecionado
  });
});

// Relatório: Soma das vendas agrupadas por vendedor
const Pessoa = require('../models/pessoa');
const ComercioAnimais = require('../models/comercio_animais');

router.get('/vendas-por-vendedor', async (req, res) => {
  try {
    // Buscar anos disponíveis
    const queryAnos = new Parse.Query(ComercioAnimais);
    queryAnos.select('data');
    queryAnos.ascending('data');
    let anoInicial = await queryAnos.first();
    let anos = [];
    if(!anoInicial) {
      anoInicial = new Date().getFullYear().toString();
    } else {
      anoInicial = anoInicial.get('data').getFullYear();
    }
    const anoAtual = new Date().getFullYear();
    for (let ano = anoInicial; ano <= anoAtual; ano++) {
      anos.push(ano);
    }

    // Filtro por ano
    const anoSelecionado = req.query.ano || '0';
    const query = new Parse.Query(ComercioAnimais);
    query.equalTo('tipo', 'Venda');
    if (anoSelecionado !== '0') {
      const startDate = new Date(`${anoSelecionado}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${anoSelecionado}-12-31T23:59:59.999Z`);
      query.greaterThanOrEqualTo('data', startDate);
      query.lessThanOrEqualTo('data', endDate);
    }
    query.select(['vendedor', 'quantidade', 'valor']);
    query.limit(10000);
    const vendas = await query.find();

    // Agrupa por vendedor, soma total e soma quantidade
    const resultado = {};
    vendas.forEach(venda => {
      const vendedorId = venda.get('vendedor');
      const quantidade = parseFloat(venda.get('quantidade')) || 0;
      const valor = parseFloat(venda.get('valor')) || 0;
      const total = quantidade * valor;
      if (!resultado[vendedorId]) {
        resultado[vendedorId] = { total: 0, quantidade: 0 };
      }
      resultado[vendedorId].total += total;
      resultado[vendedorId].quantidade += quantidade;
    });

    // Buscar nomes dos vendedores
    const vendedoresIds = Object.keys(resultado);
    const pessoasQuery = new Parse.Query(Pessoa);
    pessoasQuery.containedIn('objectId', vendedoresIds);
    const pessoas = await pessoasQuery.find();
    pessoas.forEach(pessoa => {
      resultado[pessoa.id].nome = pessoa.get('nome');
    });

    // Prepara dados para a view
    const relatorio = vendedoresIds.map(id => ({
      vendedor: resultado[id].nome || id,
      total: resultado[id].total,
      quantidade: resultado[id].quantidade
    }));

    res.render('relatorios/vendasPorVendedor', { relatorio, anos, anoSelecionado });
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao gerar relatório', error: err });
  }
});

module.exports = router;
