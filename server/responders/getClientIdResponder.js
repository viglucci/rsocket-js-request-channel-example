const { Single } = require('rsocket-flowable');
const { buildMessage } = require('../../shared/util');

let nextclientId = 0;

module.exports = {
  requestResponse: () => {
    return new Single((subscriber) => {
        subscriber.onSubscribe();
        subscriber.onComplete(buildMessage({
            clientId: ++nextclientId
        }));
    });
  }
};
