const CONFIG = require('../../config/config');
const logger = require('./Loggers');
const Util = require('./Util');
// const Binance = require('node-binance-api');
// const Binance = require('binance');

const { Spot } = require('@binance/connector');

const client = new Spot(CONFIG.KEYS.API, CONFIG.KEYS.SECRET);
// Get account information

const getFieldOr = (obj, field, orVal) => obj && obj[field] ? obj[field] : orVal;
const getAssetWallet = (list, asset) => list.find(row => row.asset === asset);
const getAssetBalance = (list, asset) => getFieldOr(getAssetWallet(list, asset), 'free', 0);

const getCommisions = (account) => {
  const { takerCommission, buyerCommission, sellerCommission } = account;
  return { takerCommission, buyerCommission, sellerCommission };
};

const accountReader = (responce, cb) => {
  const data = responce.data;
  const foundBtc = getAssetBalance(data.balances, 'BTC');
  console.log('found btc ', foundBtc);
};

const getResponce = api => {
  // console.log('xxxxxx', api);
  return api.then(responce => responce.data);
};
/*
const binance = new Binance().options(Object.assign({
    APIKEY: CONFIG.KEYS.API,
    APISECRET: CONFIG.KEYS.SECRET,
    test: !CONFIG.EXECUTION.ENABLED,
    log: (...args) => logger.binance.info(args.length > 1 ? args : args[0]),
    verbose: true
}, CONFIG.BINANCE_OPTIONS));
*/

const BinanceApi =(options) => {
    return false;
  return {
    sortedDepthCache: {},

    exchangeInfo() {
      return getResponce(client.exchangeInfo());
    },

    getBalances() {
    // return binance.balance(null)
      return getResponce(client.account()).then(accountReader)
        .then(balances => {
        // console.log('getAccount', balances);
          Object.values(balances).forEach(balance => {
            balance.available = parseFloat(balance.available);
            balance.onOrder = parseFloat(balance.onOrder);
          });
          return balances;
        });
    },

    marketBuy(ticker, quantity) {
      logger.execution.info(`Buying' ${quantity} ${ticker} @ market price`);
      const before = Date.now();
      return  getResponce(client.marketBuy(ticker, quantity, { type: 'MARKET' }))
        .then(response => {
          options.test ?
            logger.execution.info(`Test: Successfully bought ${ticker} @ market price`)
            : logger.execution.info(`Successfully bought ${response.executedQty} ${ticker} @ a quote of ${response.cummulativeQuoteQty} in ${Util.millisecondsSince(before)} ms`);
          return response;
        })
        .catch(BinanceApi.handleBuyOrSellError);
    },

    marketSell(ticker, quantity) {
      logger.execution.info(`${options.test ? 'Test: Selling' : 'Selling'} ${quantity} ${ticker} @ market price`);
      const before = Date.now();
      return getResponce(client.marketSell(ticker, quantity, { type: 'MARKET' }))
        .then(response => {
          logger.execution.info(options.test ?
            `Test: Successfully sold ${ticker} @ market price`
            : logger.execution.info(`Successfully sold ${response.executedQty} ${ticker} @ a quote of ${response.cummulativeQuoteQty} in ${Util.millisecondsSince(before)} ms`)
          );

          return response;
        })
        .catch(BinanceApi.handleBuyOrSellError);
    },

    marketBuyOrSell(method) {
      return method === 'BUY' ? BinanceApi.marketBuy : BinanceApi.marketSell;
    },

    handleBuyOrSellError(error) {
      try {
        return Promise.reject(new Error(JSON.parse(error.body).msg));
      } catch (e) {
        logger.execution.error(error);
        return Promise.reject(new Error(error.body));
      }
    },

    time() {
      return client.time(); //binance.time(null);
    },

    getDepthCacheSorted(ticker, max = CONFIG.SCANNING.DEPTH) {
    // let depthCache = binance.depthCache(ticker);
    // depthCache.bids = BinanceApi.sortBids(depthCache.bids, max);
    // depthCache.asks = BinanceApi.sortAsks(depthCache.asks, max);
    // return depthCache;
    },

    getDepthCacheUnsorted(ticker) {
    //  return binance.depthCache(ticker);
    },

    sortBids(cache, max = Infinity) {
      let depth = {};
      Object.keys(cache)
        .sort((a, b) => parseFloat(b) - parseFloat(a))
        .slice(0, max)
        .forEach(price => depth[price] = cache[price]);
      return depth;
    },

    sortAsks(cache, max = Infinity) {
      let depth = {};
      Object.keys(cache)
        .sort((a, b) => parseFloat(a) - parseFloat(b))
        .slice(0, max)
        .forEach(price => depth[price] = cache[price]);
      return depth;
    },

    trade(cand, time){
      if (!cand || !cand.a_step_type) return false;
      const op = BinanceApi.marketBuyOrSell(cand.a_step_type);
      const price = cand.a_bid_price;
    //  const res = op(cand.a_symbol, );
    },

  };
};

module.exports = BinanceApi;
