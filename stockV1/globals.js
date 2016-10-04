

var Globals = {
  'higher_ema': null,
  'emas_got' : 0,
  'in_trade' : false,
  'stockData' : {},
  'trades' : {},
  'trade_counter' : 0,
  'EMAS' : [10,20],
  'ticker_counter' : 0,
  'tickerId' : 0,
  'my_order_id' : null,
  'actions' : {},
  'status' : {},
  'orders' : {},
  'stock' : 'TNA',
  'interval' : 60000,
  'max_loss' : 100,
  'moving_stop_loss' : 45/100,
  'percent_of_stop_loss' : 50/100,
  'money_in_hand' : 20000,
  'logger' : 0
};

Globals.actions.BUY = 'buy';
Globals.actions.SELL = 'sell';
Globals.actions.STOPLOSS = 'stoploss';
Globals.actions.NONE = 'none';
Globals.status.PENDING = 'pending';
Globals.status.DONE = 'done';
Globals.status.CANCELED = 'canceled';
module.exports = Globals;
