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

  // Buscar anos disponíveis
  const queryAnos = new Parse.Query(Despesa);
  queryAnos.select('data');
  queryAnos.ascending('data');
  const despesas = await queryAnos.find();
  const anos = [...new Set(despesas.map(d => d.get('data').getFullYear()))];

  // Filtro por ano
  const query = new Parse.Query(Despesa);
  if (anoSelecionado !== '0') {
    const startDate = new Date(`${anoSelecionado}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${anoSelecionado}-12-31T23:59:59.999Z`);
    query.greaterThanOrEqualTo('data', startDate);
    query.lessThanOrEqualTo('data', endDate);
  }
  const despesasFiltradas = await query.find();

  // Agrupar por categoria
  const relatorio = {};
  for (const despesa of despesasFiltradas) {
    const categoriaObj = despesa.get('categoria');
    console.log(categoriaObj);
    let categoriaNome = '';
    if (categoriaObj && categoriaObj.get) {
      categoriaNome = categoriaObj.get('descricao'); // ou 'nome', conforme seu modelo
    } else {
      categoriaNome = 'Sem categoria';
    }
    const valor = despesa.get('valor') || 0;
    console.log(categoriaNome + ' - ' + valor);
    relatorio[categoriaNome] = (relatorio[categoriaNome] || 0) + valor;
  }

  res.render('relatorios/despesasPorCategoria', {
    relatorio,
    anos,
    anoSelecionado
  });
});

module.exports = router;
