var db = {
    'host': 'localhost',
    'user' : 'root',
    'password' : '',
    'database' : 'tws',
    'connected' : false
};

db.mysql = require('mysql');

db.pool = db.mysql.createPool({
    connectionLimit : 10,
    host     : db.host,
    user     : db.user,
    password : db.password,
    database : db.database
});
module.exports = db;
