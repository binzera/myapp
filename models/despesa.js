const Parse = require('parse/node');

const Despesa = Parse.Object.extend('Despesa', {
  // Instance methods
}, {
  // Class methods
  create: function(data, descricao, quantidade, vl_unitario, categoria) {
    const despesa = new Despesa();
    despesa.set('data', new Date(data));
    despesa.set('descricao', descricao);
    despesa.set('quantidade', quantidade);
    despesa.set('vl_unitario', vl_unitario);
    despesa.set('vl_total', quantidade * vl_unitario);
    despesa.set('categoria', categoria);
    return despesa;
  }
});

module.exports = Despesa;
