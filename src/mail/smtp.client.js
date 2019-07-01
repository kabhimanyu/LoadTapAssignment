const Nodemailer = require('nodemailer');
const { client,email } = require('../config/vars');

class SMTP{
  constructor(commander){
    this.c = commander;
    this.email = client.email;
    this.password = client.password;
    this.mailBox = client.mailBox;
    this.destEmail = client.destEmail;
    this.host = email.host;
    this.port = email.port
    this.tls = email.tls;
    this.transporter = null;
    this.clientId = email.clientId;
    this.clientSecret = email.clientSecret;
    this.refreshToken = email.refreshToken;
  }

  init(){
    this.transporter = Nodemailer.createTransport({
      host : this.host,
      secure : true,
      port : '465',
      auth : {
        type : 'Oauth2',
        user : this.email,
        clientId : this.clientId,
        clientSecret : this.clientSecret,
        refreshToken : this.refreshToken
      }
    });
  }

  sendMail(text,file){
    let mailOptions = {
      from : this.email,
      to : this.destEmail,
      subject : 'Load Update',
      text : 'Please find the attached email',
      attachments : [{
        filename : 'test.csv',
        content  : file,
        contentType : 'text/csv'
      }]
    }
    if(!this.transporter) this.init();
    this.transporter.sendMail(mailOptions,(e,r)=>{
      if(e) logger.error(e);
      logger.info('Email Sent');
      this.transporter.close()
    })
  }
}

module.exports = SMTP
