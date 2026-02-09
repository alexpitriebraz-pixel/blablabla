const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const generateRoomCode = () => {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
};

module.exports = { generateRoomCode };
