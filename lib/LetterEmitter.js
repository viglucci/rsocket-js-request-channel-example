const EventEmitter = require('events');
const { getRandomLetter } = require('./util');

class LetterEmitter extends EventEmitter {
  constructor(interval) {
    super();
    setInterval(() => {
      this.emit('LETTER', getRandomLetter());
    }, interval);
  }
}

LetterEmitter.LETTER_EVENT = 'LETTER';

module.exports = LetterEmitter;
