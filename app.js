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

var app = express();
var session = require('express-session');

// Configurar Parse
Parse.initialize(process.env.PARSE_APP_ID, process.env.PARSE_JS_KEY);
Parse.serverURL = process.env.PARSE_SERVER_URL;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'minha_chave_secreta',
  resave: false,
  saveUninitialized: false
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
