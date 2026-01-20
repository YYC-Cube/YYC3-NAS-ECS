module.exports = {
  login: {
    email: { type: 'string', format: 'email', required: true },
    password: { type: 'string', minLength: 6, required: true }
  },
  register: {
    email: { type: 'string', format: 'email', required: true },
    password: { type: 'string', minLength: 6, required: true },
    name: { type: 'string', minLength: 2, required: true }
  }
};
