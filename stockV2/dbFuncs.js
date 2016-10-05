// tools.js
// ========
var dbFuncs = require('./dbFuncs');
var db = require('./db');
module.exports = {
    insert_new_data : function (data) {
        var post  = {stock: data.stock, price: data.price, action : data.action, emas : JSON.stringify(data.ema)};
        console.log(JSON.stringify(post));
        var query = db.pool.query('INSERT INTO data SET ?', post, function(err, result) {
        });
    }
};
