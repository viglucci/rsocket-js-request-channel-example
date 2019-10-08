const { RSocketServer } = require('rsocket-core');
const RSocketWebsocketServer = require('rsocket-websocket-server').default;
const { Flowable } = require('rsocket-flowable');
const { fromEvent } = require('rxjs');
const LetterEmitter = require('./lib/LetterEmitter');
const { buildMessage } = require('./lib/util');

const EMIT_LETTER_INTERVAL = 250;
const letterEmitter = new LetterEmitter(EMIT_LETTER_INTERVAL);
const letterSource$ = fromEvent(letterEmitter, LetterEmitter.LETTER_EVENT);

const getRequestHandler = () => {
  return {
    requestChannel: (clientFlowable) => {
      let subscription;

      return new Flowable((subscriber) => {

        const letterSourceSubscription = null;

        /**
         * The stream of messages the client wants the server to send to it.
         */
        subscriber.onSubscribe({
          cancel: () => {
            letterSourceSubscription.unsubscribe();
            console.log('Client cancelled subscription.');
          },

          request: (maxSupportedStreamSize) => {

            console.log(`Client requesting up to ${maxSupportedStreamSize} payloads.`);

            let streamed = 0;

            letterSourceSubscription = letterSource$.subscribe((letter) => {

              streamed++;

              const nextMessage = buildMessage(letter);
              // subscriber.onNext(nextMessage);

              console.log(
                `Server transmitted payload ${streamed}.`,
                nextMessage
              );
              // if (streamed === maxSupportedStreamSize) {
              //   console.log('Max transmitted limit reached.');
              //   letterSourceSubscription.unsubscribe();
              // }
            });
          }
        });

        /**
         * The stream of messages the server wants the client to send to it.
         */
        clientFlowable.subscribe({
          onSubscribe: (sub) => {
            subscription = sub;
            console.log('Server subscribed to client channel.');
            subscription.request(1);
          },

          onNext: (clientPayload) => {
            console.log('Server received payload from client.', clientPayload);
            subscription.request(1);
          },

          onComplete: () => {
            console.log('Server received end of client stream');
          }
        });
      });
    }
  };
};

const transport = new RSocketWebsocketServer({
  host: 'localhost',
  port: 7777
});

const server = new RSocketServer({ transport, getRequestHandler });

server.start();
