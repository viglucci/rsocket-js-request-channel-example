const {
  RSocketClient,
  JsonSerializer,
  MAX_STREAM_ID
} = require('rsocket-core');
const RSocketWebsocketClient = require('rsocket-websocket-client').default;
const WebSocket = require('ws');
const { Flowable } = require('rsocket-flowable');
const logger = require('../shared/logger');
const { fromEvent } = require('rxjs');
const { buildMessage } = require('../shared/util');
const LetterEmitter = require('../shared/LetterEmitter');
const { MetaData, JsonMetadataSerializer } = require('../shared/MetaData');

const EMIT_LETTER_INTERVAL = 10;
const letterEmitter = new LetterEmitter(EMIT_LETTER_INTERVAL);
const letterSource$ = fromEvent(letterEmitter, LetterEmitter.LETTER_EVENT);

const transportOptions = {
  url: 'ws://localhost:7777',
  wsCreator: (url) => {
    return new WebSocket(url);
  }
};

const setup = {
  keepAlive: 60000,
  lifetime: 180000,
  dataMimeType: 'applicaiton/json',
  metadataMimeType: 'applicaiton/json'
};

const transport = new RSocketWebsocketClient(transportOptions);
const client = new RSocketClient({
  serializers: {
    data: JsonSerializer,
    metadata: JsonMetadataSerializer
  },
  setup,
  transport
});

client.connect().then((socket) => {
  logger.info('Client connected to the RSocket server');

  let clientRequests = ['a', 'b', 'c'];

  clientRequests = clientRequests.map(buildMessage);

  let subscription;

  const letterStream = new Flowable((subscriber) => {
    let letterSourceSubscription = null;

    subscriber.onSubscribe({
      cancel: () => {
        letterSourceSubscription.unsubscribe();
        logger.info('Client cancelled subscription.');
      },

      request: (maxSupportedStreamSize) => {

        logger.info(`Server asked for ${maxSupportedStreamSize} messages.`);

        let streamed = 0;
        letterSourceSubscription = letterSource$.subscribe((letter) => {
          setTimeout(() => {
            streamed++;

            const nextMessage = buildMessage(letter);
            subscriber.onNext(nextMessage);

            logger.info(
              `Client transmitted payload ${streamed} ` +
                `${JSON.stringify(nextMessage)}` +
                ` to server.`
            );

            if (streamed === maxSupportedStreamSize) {
              logger.info('Max transmitted limit reached.');
              letterSourceSubscription.unsubscribe();
            }
          }, 0);
        });
      }
    });
  });

  const metadata = new MetaData();
  metadata.set(MetaData.ROUTE, 'GET_CLIENT_ID');

  socket
    .requestResponse({
      data: null,
      metadata
    })
    .subscribe({
      onSubscribe: (cancel) => {
        /** */
      },
      onNext: (response) => {
        logger.info(`onNext called`, response);
      },
      onComplete: (response) => {
        logger.info(`requestResponse done`);
        const clientId = response.data.clientId;
        logger.info(JSON.stringify(response));
      },
      onError: (e) => {
        logger.error(e);
      }
    });

  socket.requestChannel(letterStream).subscribe({
    onSubscribe: (sub) => {
      subscription = sub;
      logger.info(`Client is establishing a channel`);
      subscription.request(MAX_STREAM_ID);
    },
    onNext: (response) => {
      logger.info(`Client recieved payload ${JSON.stringify(response)}`);
    },
    onComplete: () => {
      logger.info(`Client received end of server stream`);
    }
  });
});
