var createError = require('http-errors');
var express = require('express');
var path = require('path');
require('dotenv').config();
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var Parse = require('parse/node');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var despesasRouter = require('./routes/despesas');
var categoriasRouter = require('./routes/categorias');
var comercioAnimaisRouter = require('./routes/comercio_animais');
var pessoasRouter = require('./routes/pessoas');
var relatoriosRouter = require('./routes/relatorios');
var relatoriosAnimaisDespesasRouter = require('./routes/relatorios_animais_despesas');
var authRouter = require('./routes/auth');
var rebanhoRouter = require('./routes/rebanho');

var app = express();
var session = require('express-session');

// Configurar Parse
Parse.initialize(process.env.PARSE_APP_ID, process.env.PARSE_JS_KEY);
Parse.serverURL = process.env.PARSE_SERVER_URL;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Sessão - use uma SECRET forte via variável de ambiente
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  console.warn('Warning: SESSION_SECRET não está definida. Usando segredo inseguro para desenvolvimento. Defina SESSION_SECRET no .env ou nas variáveis de ambiente.');
}
app.use(session({
  secret: sessionSecret || 'minha_chave_secreta',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // somente HTTPS em produção
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 dia
  }
  // Atenção: o store padrão (MemoryStore) não é adequado para produção.
  // Para produção, configure um store persistente (redis, connect-mongo, etc.).
}));


app.use(function(req, res, next) {
  res.locals.user = req.session.user;
  // Permitir acesso livre apenas às rotas de login/logout
  if (
    req.path.startsWith('/auth/login') ||
    req.path.startsWith('/auth/logout') ||
    req.path.startsWith('/auth') && req.method === 'POST' && req.originalUrl.includes('/login')
  ) {
    return next();
  }
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/despesas', despesasRouter);
app.use('/categorias', categoriasRouter);
app.use('/comercio_animais', comercioAnimaisRouter);
app.use('/pessoas', pessoasRouter);
app.use('/relatorios', relatoriosRouter);
app.use('/relatorios/animais-despesas', relatoriosAnimaisDespesasRouter);
app.use('/auth', authRouter);
app.use('/rebanho', rebanhoRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
