# rsocket-js-request-channel-example

This project demonstrates a simple requestChannel setup over a websocket between two Node servers.

## Setup

```
npm install
```

```
npm run server
```

```
npm run client
```

## How it works

Once connected to the server, the client hands off a Flowable of requests. The server receives the Flowable, subscribes to it, and requests a payload from the Flowable. The server also returns a Flowable to the client.

The server has implemented an emitter that will generate a random letter (A-Z) on a set interval, and push those letter 'payloads' to a queue. The server will then flush this queue to any clients that connect until the number of requests requested by the client is reached, indicated by the client invoking `request(n)`.