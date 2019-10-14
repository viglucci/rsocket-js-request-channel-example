const { RSocketServer, JsonSerializer } = require('rsocket-core');
const RSocketWebsocketServer = require('rsocket-websocket-server').default;
const getClientIdResponder = require('./responders/getClientIdResponder');
const letterStreamResponder = require('./responders/letterStreamResponder');

const getRequestHandler = () => {
  return {
    requestResponse: ({ data, metadata }) => {
      switch (metadata.route) {
        case 'GET_CLIENT_ID':
          return getClientIdResponder.requestResponse();
      }
    },
    requestChannel: (clientFlowable) => {
      return letterStreamResponder.requestChannel(clientFlowable);
    }
  };
};

const transport = new RSocketWebsocketServer({
  host: 'localhost',
  port: 7777
});

const server = new RSocketServer({
  transport,
  getRequestHandler,
  serializers: {
    data: JsonSerializer,
    metadata: JsonSerializer
  }
});

server.start();
