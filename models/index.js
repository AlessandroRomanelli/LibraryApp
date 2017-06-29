'use strict';

var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var basename  = path.basename(module.filename);
var env       = process.env.NODE_ENV || 'development';
var config    = require(__dirname + '/../config/config.json')[env];
var db        = {};

if (config.use_env_variable) {
  var sequelize = new Sequelize(process.env[config.use_env_variable]);
} else {
  var sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(function(file) {
    var model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.books = require('./books.js')(sequelize, Sequelize);
db.loans = require('./loans.js')(sequelize, Sequelize);
db.patrons = require('./patrons.js')(sequelize, Sequelize);

db.loans.belongsTo(db.books);
db.loans.belongsTo(db.patrons);

db.patrons.hasMany(db.loans, {foreignKey: "patron_id", targetKey: "patron_id"});

db.books.hasMany(db.loans, {foreignKey: "book_id", targetKey: "book_id"});

module.exports = db;
