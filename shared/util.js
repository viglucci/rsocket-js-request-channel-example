const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

module.exports = {
  getRandomLetter: () => {
    return alphabet[Math.floor(Math.random() * alphabet.length)];
  },
  buildMessage: (payload) => {
    return {
      data: payload
    };
  }
};
