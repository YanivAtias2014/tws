require('colors');
var _ = require('lodash');
var log4js = require('log4js');
var tools = require ('./tools');
var globals = require('./globals');
log4js.loadAppender('file');
var d = new Date().getTime();
log4js.addAppender(log4js.appenders.file('logs/'+ d +'.log'), 'stocks');

globals.logger = log4js.getLogger('stocks');


var ib = new (require('..'))({
  clientId: 0,
  host: 'localhost',
  port: 7497
}).on('error', function (err) {
  console.error(err.message.red);
}).on('result', function (event, args) {
  if (!_.includes(['nextValidId', 'openOrder', 'openOrderEnd', 'orderStatus'], event)) {
    //logger('%s %s', (event + ':').yellow, JSON.stringify(args));
  }
}).on('nextValidId', function (orderId) {
  console.log(
    '%s %s%d',
    '[nextValidId]'.cyan,
    'orderId='.bold, orderId
  );
}).on('openOrder', function (orderId, contract, order, orderState) {
}).on('openOrderEnd', function (id) {
}).on('orderStatus', function (id, status, filled, remaining, avgFillPrice, permId,
                               parentId, lastFillPrice, clientId, whyHeld) {
  if (globals.orders[id] && globals.orders[id].status == globals.status.PENDING) {
    switch (globals.orders[id].order) {
      case globals.actions.BUY:
        if (filled == globals.trades[globals.trade_counter].num_of_stocks) {
          globals.orders[id].status = globals.status.DONE;
          globals.logger.info('orderID : ' + id + ' is filled,closing it');
          globals.logger.info("We bought at and average price of :" + avgFillPrice);
          globals.trades[globals.trade_counter]['price'] = avgFillPrice;
          stopLoss = tools.calculate_stop_loss();
          tools.placeStopLoss(ib);
        }
        break;
      case globals.actions.SELL:
        if (filled == globals.trades[globals.trade_counter].num_of_stocks) {
          globals.orders[id].status = globals.status.DONE;
          globals.logger.info('orderID (sell) : ' + id + ' is filled,closing it');
          tools.remove_all_open_orders(ib);
        }
        break;
      case globals.actions.STOPLOSS:
        if (filled == globals.trades[globals.trade_counter].num_of_stocks) {
          globals.logger.info("Stop loss sold the stocks :" + avgFillPrice);
          globals.logger.info('orderID : ' + id + ' is filled,closing it');
          globals.orders[id].status = globals.status.DONE;
          tools.remove_all_open_orders(ib);
          
        }
    }
  }
}).on('contractDetails', function (reqId, contract) {
  logger('sss')
}).on('tickPrice', function (tickerId, tickType, price, canAutoExecute) {
  if (getDataNow) {
    getDataNow = false;
    globals.ticker_counter++;
    globals.logger.info("Got price!  place :" + globals.ticker_counter + ", price :" + price);
    globals.stockData[globals.ticker_counter] = {'price': price};
    tools.get_all_emas(globals.ticker_counter);
    var action = tools.decide_action(globals.ticker_counter);
    if (action == globals.actions.BUY && !globals.in_trade) {
      globals.logger.info("Placing a buy order");
      var num_of_stocks = tools.how_many_stocks_to_buy(price);
      globals.logger.info('We should buy :' + num_of_stocks + ' stocks.');
      globals.trades[++globals.trade_counter] = {
        'num_of_stocks' : num_of_stocks,
        'fiiled' : 0
      };
      var order = ib.order.market('BUY',num_of_stocks);
      globals.orders[globals.my_order_id] = { 'order' : globals.actions.BUY , 'num_of_stocks' : num_of_stocks, 'status' : globals.status.PENDING}
      globals.logger.info('placeing orderID : ' + globals.my_order_id + 'BUY stocks: ' + num_of_stocks);
      ib.placeOrder(globals.my_order_id++, ib.contract.stock(globals.stock), order);
      globals.in_trade = true;
    } else if (globals.in_trade) {
      if (action == globals.actions.SELL) {
        globals.logger.info("Placing a sell order");
        var order = ib.order.market('SELL', globals.trades[globals.trade_counter].num_of_stocks);
        globals.orders[globals.my_order_id] = {
          'order': globals.actions.SELL,
          'num_of_stocks': globals.trades[globals.trade_counter].num_of_stocks,
          'status': globals.status.PENDING
        };
        globals.logger.info('placeing orderID : ' + globals.my_order_id + 'SELL stocks: ' + globals.trades[globals.trade_counter].num_of_stocks);
        ib.placeOrder(globals.my_order_id++, ib.contract.stock(globals.stock), order);
        globals.in_trade = false;
      } else
        if (action == globals.actions.NONE) {
        stopLoss = tools.calculate_stop_loss();
        tools.placeStopLoss(ib);
      }
    }
  }
  
});


getDataNow = false;


setInterval(function (){
  getDataNow = true;
}, globals.interval);

ib.on('nextValidId', function (orderId) {
  globals.globals.logger.info("Got an order id :" + orderId);
  globals.my_order_id = orderId;
  ib.reqMktData(++globals.tickerId, {
    currency: 'USD',
    exchange: 'SMART',
    secType: 'STK',
    symbol: globals.stock
  },'',false)
});

ib.connect()
  .reqIds(1);


