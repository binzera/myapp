const Parse = require('parse/node');

class Pessoa extends Parse.Object {
  constructor() {
    super('Pessoa');
  }
}

Parse.Object.registerSubclass('Pessoa', Pessoa);

module.exports = Pessoa;
