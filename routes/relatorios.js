const express = require('express');
const router = express.Router();
const Parse = require('parse/node');
const Despesa = require('../models/despesa');
const Categoria = require('../models/categoria');

// Relatório: valor total das despesas por categoria
router.get('/despesas-por-categoria', async (req, res) => {
  const anoSelecionado = req.query.ano;
  const query = new Parse.Query(Despesa);
  if (anoSelecionado) {
    const startDate = new Date(`${anoSelecionado}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${anoSelecionado}-12-31T23:59:59.999Z`);
    query.greaterThanOrEqualTo('data', startDate);
    query.lessThanOrEqualTo('data', endDate);
  }
  query.include('categoria');
  const despesas = await query.find();
  const categoriasQuery = new Parse.Query(Categoria);
  const categorias = await categoriasQuery.find();
  const categoriasMap = {};
  categorias.forEach(categoria => {
    categoriasMap[categoria.id] = categoria.get('descricao');
  });
  // Agrupa e soma
  const relatorio = {};
  despesas.forEach(despesa => {
    const categoriaObj = despesa.get('categoria');
    const categoriaNome = categoriaObj ? categoriasMap[categoriaObj.id] : 'Sem categoria';
    const valor = despesa.get('vl_total') || 0;
    if (!relatorio[categoriaNome]) relatorio[categoriaNome] = 0;
    relatorio[categoriaNome] += valor;
  });

  res.render('relatorios/despesasPorCategoria', { relatorio, anoSelecionado });
});

module.exports = router;
