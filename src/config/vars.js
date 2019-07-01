const path = require('path');

// import .env variables
require('dotenv-safe').load({
  path: path.join(__dirname, '../../.env'),
  sample: path.join(__dirname, '../../.env.example'),
});

module.exports = {
  env: process.env.NODE_ENV,

  client:{
    email:process.env.EMAIL,
    password:process.env.PASSWORD,
    mailBox : process.env.MAIL_BOX,
    destEmail : process.env.DEST_EMAIL
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    tls: process.env.EMAIL_TLS,
    clientSecret: process.env.CLIENT_SECRET,
    clientId : process.env.CLIENT_ID,
    refreshToken : process.env.REFRESH_TOKEN,
    gmail:process.env.GMAIL
  },
  logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
};
