require('colors');
var _ = require('lodash');
var log4js = require('log4js');
var globals = require('./globals');
var tools = require ('./tools');
var tools = require ('./api');
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
          api.placeStopLoss(ib);
        }
        break;
      case globals.actions.SELL:
        if (filled == globals.trades[globals.trade_counter].num_of_stocks) {
          globals.orders[id].status = globals.status.DONE;
          globals.logger.info('orderID (sell) : ' + id + ' is filled,closing it');
          api.remove_all_open_orders(ib);
        }
        break;
      case globals.actions.STOPLOSS:
        if (filled == globals.trades[globals.trade_counter].num_of_stocks) {
          globals.logger.info("Stop loss sold the stocks :" + avgFillPrice);
          globals.logger.info('orderID : ' + id + ' is filled,closing it');
          globals.orders[id].status = globals.status.DONE;
          api.remove_all_open_orders(ib);
          
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
      globals.trades[++globals.trade_counter] = { 'num_of_stocks' : num_of_stocks };
      api.place_buy_order(ib,num_of_stocks, globals.stock);
    } else if (globals.in_trade) {
      if (action == globals.actions.SELL) {
        globals.logger.info("Placing a sell order");
        api.place_sell_order(ib,globals.stock,trades[globals.trade_counter].num_of_stocks)
        globals.in_trade = false;
      } else
        if (action == globals.actions.NONE) {
        stopLoss = tools.calculate_stop_loss();
        api.placeStopLoss(ib);
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


