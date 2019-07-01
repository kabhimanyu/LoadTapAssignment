const EventEmitter = require('events');
const MailClient = require('../mail/mail.client');
const xoauth2 = require("xoauth2");
const { email,client } = require('../config/vars');
const MailParser = require('../mail/mail.parser');
const SMTP = require('../mail/smtp.client');
const Logger = require('../config/logger');

class Commander extends EventEmitter{
  constructor(){
    super();
    this.mailClient = this.initMailClient();
    this.mailParser = new MailParser(this);
    this.SMTP = new SMTP(this);

    this.on('mail',(mail,attachment) => {
      this.mailParser.parseMail(mail,attachment)
    });
    this.on('parsedEvent',(event)=>{
      this.SMTP.sendMail('Load Update',event)
    });
  }

  initMailClient(){
    if(email.gmail){
      let xoauth2gen  = xoauth2.createXOAuth2Generator({
          user: client.email,
          clientId: email.clientId,
          clientSecret: email.clientSecret,
          refreshToken: email.refreshToken
        });
        xoauth2gen.getToken((err, token)=>{
          if(err){
              Logger.error(err);
          }
          return new MailClient(this,token)
      });
    } else {
      return new MailClient(this,null);
    }
  }
}

module.exports = Commander;
