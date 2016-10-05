// tools.js
// ========
var globals = require('./globals');

module.exports = {
  placeStopLoss : function(ib) {
    this.remove_all_open_orders(ib);
    var order = ib.order.limit('SELL', globals.trades[globals.trade_counter].num_of_stocks,globals.trades[globals.trade_counter].stop_loss_price);
    globals.orders[globals.my_order_id] = { 'order' : globals.actions.STOPLOSS , 'num_of_stocks' : globals.trades[globals.trade_counter].num_of_stocks, 'status' : globals.status.PENDING};
    order.auxPrice  = globals.trades[globals.trade_counter].stop_loss_price;
    order.orderType  = 'STP';
    globals.logger.info('placeing orderID : ' + globals.my_order_id + 'stoploss at ' + globals.trades[globals.trade_counter].stop_loss_price);
    ib.placeOrder(globals.my_order_id++, ib.contract.stock(globals.stock), order);
  },
  remove_all_open_orders : function (ib) {
    for (var order_id in globals.orders) {
      if (globals.orders[order_id].status == globals.status.PENDING) {
        globals.orders[order_id].status = globals.status.DONE;
        globals.logger.info('Canceling order :' + order_id);
        ib.cancelOrder(Number(order_id));
      }
    }
  },
  place_buy_order : function (ib,num_of_stocks, stock) {
    order = ib.order.market('BUY',num_of_stocks);
    globals.orders[globals.my_order_id] = { 'order' : globals.actions.BUY , 'num_of_stocks' : num_of_stocks, 'status' : globals.status.PENDING}
    globals.logger.info('placeing orderID : ' + globals.my_order_id + 'BUY stocks: ' + num_of_stocks);
    ib.placeOrder(globals.my_order_id++, ib.contract.stock(stock), order);
    globals.in_trade = true;
  },
  place_sell_order : function (ib,stock,num_of_stocks) {
    var order = ib.order.market('SELL', num_of_stocks);
    globals.orders[globals.my_order_id] = {'order': globals.actions.SELL,'num_of_stocks': num_of_stocks,'status': globals.status.PENDING};
    globals.logger.info('placeing orderID : ' + globals.my_order_id + 'SELL stocks: ' + num_of_stocks);
    ib.placeOrder(globals.my_order_id++, ib.contract.stock(stock), order);
  }
};
