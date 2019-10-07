const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

const getRandomLetter = () => {
  return alphabet[Math.floor(Math.random() * alphabet.length)];
};

module.exports = getRandomLetter;
