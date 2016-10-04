// tools.js
// ========
var globals = require('./globals');

module.exports = {
  calculate_ema: function (tickerId, emas) {
    if (tickerId == emas) {
      globals.emas_got++;
      globals.logger.info("Reached first point of ema " + emas);
      sum = 0;
      for (x in globals.stockData) {
        sum = sum + globals.stockData[x].price;
      }
      return sum/emas;
    } else {
      var strangeNumber = 2/(1+emas);
      var last_ema = globals.stockData[tickerId-1].ema[emas];
      return strangeNumber * (globals.stockData[tickerId].price - last_ema) + last_ema;
    }
  },
  get_all_emas : function (ticker_counter) {
    for (i = 0; i < globals.EMAS.length; i++) {
      if (ticker_counter >= globals.EMAS[i]) {
        ema = this.calculate_ema(ticker_counter, globals.EMAS[i]);
        globals.logger.info("Got an ema" + globals.EMAS[i] + ": " + ema);
        if (globals.stockData[ticker_counter].ema == undefined) {
          globals.stockData[ticker_counter].ema = {}
        }
        globals.stockData[ticker_counter].ema[globals.EMAS[i]] = ema;
      }
    }
    if (globals.emas_got== 2) {
      globals.stockData[ticker_counter].higher_ema = globals.stockData[ticker_counter].ema[globals.EMAS[0]] > globals.stockData[ticker_counter].ema[globals.EMAS[1]] ? globals.EMAS[0] : globals.EMAS[1];
    }
  },
  decide_action : function(ticker_counter) {
    if (globals.emas_got == 2) {
      if (globals.stockData[ticker_counter - 1].higher_ema != null) {
        globals.logger.info(globals.stockData[ticker_counter].higher_ema + " is the higher ema".underline.red)
        if (globals.stockData[ticker_counter - 1].higher_ema && globals.stockData[ticker_counter].higher_ema < globals.stockData[ticker_counter - 1].higher_ema) {
          globals.logger.info("EMAS HAVE SWITCHED, WE SHOULD BUY NOW!!".green);
          return globals.actions.BUY;
        }
        if (globals.stockData[ticker_counter - 1].higher_ema && globals.stockData[ticker_counter].higher_ema > globals.stockData[ticker_counter - 1].higher_ema) {
          if (globals.in_trade) {
            globals.logger.info("EMAS HAVE SWITCHED, WE SHOULD SELL NOW!!".green);
            return globals.actions.SELL;
          }
        }
      }
    }
    return globals.actions.NONE;
  },
  calculate_stop_loss : function () {
    if (globals.trades[globals.trade_counter]['current_price'] == undefined) { //just bought it
      globals.trades[globals.trade_counter].dataPoints = [];
      globals.trades[globals.trade_counter]['current_price'] = globals.trades[globals.trade_counter].price;
      globals.trades[globals.trade_counter]['min_profit_from_deal'] = -globals.max_loss;
      globals.trades[globals.trade_counter]['max_profit'] = 0;
      globals.trades[globals.trade_counter].dataPoints.push = { 'price' : globals.trades[globals.trade_counter].price , 'stop_loss_price' : globals.trades[globals.trade_counter]['stop_loss_price']};
      
    } else { // inside the trade
      var profit_in_trade = globals.trades[globals.trade_counter].num_of_stocks * (globals.stockData[globals.ticker_counter].price - globals.trades[globals.trade_counter].price);
      globals.trades[globals.trade_counter].max_profit = Math.max(globals.trades[globals.trade_counter].max_profit,profit_in_trade); // find the highest profit point
      globals.logger.info('Highest profit point is : ' + globals.trades[globals.trade_counter].max_profit);
      globals.trades[globals.trade_counter].min_profit_from_deal = globals.moving_stop_loss * globals.trades[globals.trade_counter].max_profit ;
      if (globals.trades[globals.trade_counter].min_profit_from_deal < globals.max_loss * globals.percent_of_stop_loss) {
        globals.trades[globals.trade_counter].min_profit_from_deal = -globals.max_loss;
      }
    }
    globals.logger.info('min_profit_from_deal: ' + globals.trades[globals.trade_counter]['min_profit_from_deal']);
    globals.trades[globals.trade_counter]['stop_loss_price'] = globals.trades[globals.trade_counter].price - ( - globals.trades[globals.trade_counter].min_profit_from_deal / globals.trades[globals.trade_counter].num_of_stocks ).toFixed(2);4
    globals.logger.info('stop_loss_price: ' + globals.trades[globals.trade_counter]['stop_loss_price']);
    return globals.trades[globals.trade_counter]['stop_loss_price'];
    
  },
  how_many_stocks_to_buy : function(price) {
    return Math.floor(globals.money_in_hand / price);
  },
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
  }};
