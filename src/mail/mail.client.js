const { client,email } = require('../config/vars');
const Imap = require('imap');
const fs = require('fs');
const simpleParser = require('mailparser').simpleParser;
const Logger = require('../config/logger');

class MailClient{
  constructor(commander,token){
    this.c = commander;
    this.email = client.email;
    this.password = client.password;
    this.mailBox = client.mailBox;
    this.host = email.host;
    this.port = email.port
    this.tls = email.tls;
    this.ready = true;
    this.token = token;
    this.processedMessageQueue = [];
    this.connect();
  }

  connect(){
    this.imap = new Imap({
      xoauth2 : this.token,
      user: this.email,
      password:this.password,
      host: this.host,
      port: this.port,
      tls: this.tls
    });

    this.imap.once('ready',()=>{
      Logger.info(`Mail Client Ready. Monitoring ${this.email}`);
      this.monitorMailBox();
    });
    this.imap.once('end',function(){
      Logger.info('Closing Mail Client');
    });
    this.imap.once('error',function(err){
      Logger.error(`Error connecting to the mail client ${err}`)
    });

    this.imap.connect();
  }

  monitorMailBox(){
    const readyInterval = setInterval(()=> {
      if(!this.ready){
        clearInterval(readyInterval);
      } else {
        Logger.info(`Checking Mail Box ${this.mailBox}`)
        this.checkMail();
      }
    },50000);
  }
  checkMail(){
    this.openInbox((error, box)=> {
      if(error){
        console.log(error);
      }
      this.imap.search(['ALL',['SINCE','28 JUNE, 2019']],(err,results)=>{
        if(error) {
          Logger.error(error)
        }else {
          var f = this.imap.fetch(results,{bodies : ''});
          f.on('message',(msg,seqno)=>{
            msg.on('body',(stream,info)=>{
              simpleParser(stream,(err,mail)=>{
                if(mail.attachments){
                  mail.attachments.forEach((attachment)=>{
                    if(attachment['headers'].get('content-type')['value'] === 'text/xml'){
                      if(this.processedMessageQueue.indexOf(seqno) === -1){
                        Logger.info(`Processing Message ${seqno} : ${mail.subject}`);
                        this.processedMessageQueue.push(seqno)
                        this.c.emit('mail',mail,attachment);
                      } else {
                        Logger.info(`Message Already Processed ${seqno} : ${mail.subject}`);
                      }
                    }
                  });
                }
              })
            });
            msg.once('end',()=>{
              // Logger.info('Finished Processing Mails');y
            });
          });
          f.once('error',(err)=>{
            Logger.error(err);
          });
        }
      })
    });
  }

  imapClose(){
    Logger.info('MailBox Closed');
  }

  imapError(err){
    Logger.error(err);
  }

  openInbox(cb) {
    Logger.info(`Opening MailBox ${this.mailBox}`);
  this.imap.openBox(this.mailBox, true, cb);
}
}

module.exports = MailClient;
