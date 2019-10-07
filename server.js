const { RSocketServer } = require('rsocket-core');
const RSocketWebsocketServer = require('rsocket-websocket-server').default;
const { Flowable } = require('rsocket-flowable');
const LetterEmitter = require('./lib/LetterEmitter');
const Queue = require('./lib/Queue');
const { buildMessage } = require('./lib/util');

const QUEUE_FLUSH_INTERVAL = 100;
const EMIT_LETTER_INTERVAL = 250;

const q = new Queue(10);
const letterEmitter = new LetterEmitter(EMIT_LETTER_INTERVAL);
letterEmitter.on(LetterEmitter.LETTER_EVENT, (letter) => {
  q.add(letter);
});

const getRequestHandler = () => {
  return {
    requestChannel: (clientFlowable) => {

      let subscription;

      return new Flowable((subscriber) => {

        let canceled = false;

        /**
         * The stream of messages the client wants the server to send to it.
         */
        subscriber.onSubscribe({

          cancel: () => {
            canceled = true;
            console.log("Subscription was canceled.");
          },

          request: (maxSupportedStreamSize) => {
            let streamed = 0;

            const flushQueue = () => {
              if (!canceled) {
                while(q.size() && streamed < maxSupportedStreamSize && !canceled) {
                  streamed++;
                  const nextMessage = buildMessage(q.remove());
                  subscriber.onNext(nextMessage);
                  console.log(`Server transmitted payload ${streamed}.`, nextMessage);
                }
                scheduleQueueFlush();
              }
            };

            const scheduleQueueFlush = () => {
              setTimeout(() => {
                flushQueue();
              }, QUEUE_FLUSH_INTERVAL);
            };

            scheduleQueueFlush();
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
            console.log('Server received payload.', clientPayload);
            subscription.request(1);
          },

          onComplete: () => {
            console.log('Server received end of client stream');
          }
        });
      });
    }
  }
};

const transport = new RSocketWebsocketServer({
  host: 'localhost',
  port: 7777
});

const server = new RSocketServer({ transport, getRequestHandler });

server.start();
