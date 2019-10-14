const { MAX_STREAM_ID } = require('rsocket-core');
const { Flowable } = require('rsocket-flowable');
const { fromEvent, merge, Observable } = require('rxjs');
const LetterEmitter = require('../../shared/LetterEmitter');
const { buildMessage } = require('../../shared/util');
const logger = require('../../shared/logger');

const EMIT_LETTER_INTERVAL = 10;
const letterEmitter = new LetterEmitter(EMIT_LETTER_INTERVAL);
const streamFromServer$ = fromEvent(letterEmitter, LetterEmitter.LETTER_EVENT);

let streamFromClientSub = null;
const streamFromClients$ = new Observable((subscriber) => {
  streamFromClientSub = subscriber;
});

const letterStream$ = merge(streamFromServer$, streamFromClients$);

let nextClientId = 0;

module.exports = {
  requestChannel: (clientFlowable) => {
    let subscription;
    const clientId = ++nextClientId;

    return new Flowable((subscriber) => {
      let letterSourceSubscription = null;

      /**
       * The stream of messages the client wants the server to send to it.
       */
      subscriber.onSubscribe({
        cancel: () => {
          letterSourceSubscription.unsubscribe();
          logger.info('Client cancelled subscription.');
        },

        request: (maxSupportedStreamSize) => {
          logger.info(
            `Client requesting up to ${maxSupportedStreamSize} payloads.`
          );

          let streamed = 0;
          letterSourceSubscription = letterStream$.subscribe((letter) => {
            setTimeout(() => {
              streamed++;

              const nextMessage = buildMessage(letter);
              subscriber.onNext(nextMessage);

              logger.info(
                `Server transmitted payload ${streamed} ` +
                  `${JSON.stringify(nextMessage)}` +
                  ` to client ${clientId}`
              );

              if (streamed === maxSupportedStreamSize) {
                logger.info('Max transmitted limit reached.');
                letterSourceSubscription.unsubscribe();
              }
            }, 0);
          });
        }
      });

      /**
       * The stream of messages the server wants the client to send to it.
       */
      clientFlowable.subscribe({
        onSubscribe: (sub) => {
          subscription = sub;
          logger.info('Server subscribed to client channel.');
          subscription.request(MAX_STREAM_ID);
        },

        onNext: (clientPayload) => {
          logger.info(
            `Server received payload ${JSON.stringify(
              clientPayload
            )} from client ${clientId}.`
          );
          setTimeout(() => {
            if (streamFromClientSub.onNext) {
              streamFromClientSub.onNext(clientPayload.data);
            }
          }, 0);
        },

        onComplete: () => {
          logger.info('Server received end of client stream');
        },

        onError: (e) => {
          logger.error(e);
        }
      });
    });
  }
};
