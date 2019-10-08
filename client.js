const { RSocketClient } = require('rsocket-core');
const RSocketWebsocketClient = require('rsocket-websocket-client').default;
const WebSocket = require('ws');
const { Flowable } = require('rsocket-flowable');
const logger = require('./lib/logger');

const transportOptions = {
  url: 'ws://localhost:7777',
  wsCreator: (url) => {
    return new WebSocket(url);
  }
};

const setup = {
  keepAlive: 60000,
  lifetime: 180000,
  dataMimeType: 'text/plain',
  metadataMimeType: 'text/plain'
};

const transport = new RSocketWebsocketClient(transportOptions);
const client = new RSocketClient({ setup, transport });

client.connect().subscribe({
  onComplete: (socket) => {
    logger.info('Client connected to the RSocket server');

    let clientRequests = ['a', 'b', 'c'];

    clientRequests = clientRequests.map((req) => {
      return {
        data: req
      };
    });

    let subscription;

    const stream = Flowable.just(...clientRequests);

    socket.requestChannel(stream).subscribe({
      onSubscribe: (sub) => {
        subscription = sub;
        logger.info(`Client is establishing a channel`);
        subscription.request(0x7fffffff);
      },
      onNext: (response) => {
        logger.info(`Client recieved: ${JSON.stringify(response)}`);
      },
      onComplete: () => {
        logger.info(`Client received end of server stream`);
      }
    });
  }
});
