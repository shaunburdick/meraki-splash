var express = require('express'),
  app = express(),
  body_parser = require('body-parser'),
  session = require('express-session'),
  fs = require('fs'),
  morgan = require('morgan'),
  winston = require('winston'),
  nexudus = require('./nexudus'),
  config = require('./config');

// Add the body parser
app.use(body_parser.json());

// Start the session
app.use(session({
  secret: 'lkjahsdfaklshfaskdjfhasdfkjhl',
  resave: false,
  saveUninitialized: true
}));

// Configure logging
var accessLogStream = fs.createWriteStream(config.logs.http.path, {flags: 'a'});
app.use(morgan('combined', {stream: accessLogStream}));

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      timestamp: true,
      prettyPrint: true
    }),
    new (winston.transports.File)({
      filename: config.logs.access.path,
      maxSize: config.logs.access.maxSize,
      maxFiles: config.logs.access.maxFiles,
      tailable: true
    })
  ]
});

// Parse get vals for redirect
app.use(function (req, res, next) {
  if (!req.session.hasOwnProperty('base_grant_url')
      || !req.session.base_grant_url
  ) {
    req.session.base_grant_url = req.query.base_grant_url;
  }

  if (!req.session.hasOwnProperty('user_continue_url')
      || !req.session.user_continue_url
  ) {
    req.session.user_continue_url = req.query.user_continue_url;
  }

  if (!req.session.hasOwnProperty('node_id')
      || !req.session.node_id
  ) {
    req.session.node_id = req.query.node_id;
  }

  if (!req.session.hasOwnProperty('node_mac')
      || !req.session.node_mac
  ) {
    req.session.node_mac = req.query.node_mac;
  }

  if (!req.session.hasOwnProperty('gateway_id')
      || !req.session.gateway_id
  ) {
    req.session.gateway_id = req.query.gateway_id;
  }

  if (!req.session.hasOwnProperty('client_ip')
      || !req.session.client_ip
  ) {
    req.session.client_ip = req.query.client_ip;
  }

  if (!req.session.hasOwnProperty('client_mac')
      || !req.session.client_mac
  ) {
    req.session.client_mac = req.query.client_mac;
  }

  next();
});

app.use(express.static(__dirname + '/pub'));

app.post('/auth', function(req, res) {
  logger.info('Granted access to %s', req.body.username, {session: req.session})
  res.json({
    success: true,
    session: req.session,
    redirect: req.session.base_grant_url + '?continue_url=' + req.session.user_continue_url
  });
  req.session.destroy();
});

app.get('/session', function(req, res) {
  res.json(req.session);
});

app.get('/splash', function(req, res) {
  logger.info('Splashdown', {session: req.session});
  res.redirect('/');
});

app.listen(config.server.port, function() {
  logger.info("Started server. Listening on %d", config.server.port);
});