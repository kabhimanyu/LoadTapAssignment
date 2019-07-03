// const parser = require('fast-xml-parser');
const XmlParser = require('xml2js');
const parser = new XmlParser.Parser({ attrkey: "key" });
const jsonexport = require('jsonexport');
const Logger = require('../config/logger');

class MailParser{
  constructor(commander){
    this.c = commander;
  }

  parseMail(mail,buffer){
    try{
      let headers = mail.headers;
      parser.parseString(buffer.content.toString('utf-8'),(error,result)=>{
        let packageDetails = this.prepareJson(result);
        jsonexport([packageDetails],(err, csv)=>{
          if(err) return Logger.error(err);
          this.c.emit('parsedEvent',csv);
        });
       });

    } catch(error){
      Logger.error(error);
    }
  }

  prepareJson(result){
    let packageDetails = {};
    let mailAddress;
    packageDetails['LoadId'] = this.getValue(result,'Load ID','MercuryGate','MasterBillOfLading',0,'ReferenceNumbers',0,'ReferenceNumber');
    packageDetails['DriverName'] = this.getValue(result,'Driver Name','MercuryGate','MasterBillOfLading',0,'ReferenceNumbers',0,'ReferenceNumber');
    packageDetails['DriverNumber'] = this.getValue(result,'Driver Phone Number','MercuryGate','MasterBillOfLading',0,'ReferenceNumbers',0,'ReferenceNumber');
    packageDetails['AccountManagerPhone '] = this.getValue(result,'Phone','MercuryGate','Header',0,'ExtractRequest',0,'User',0,'ContactMethods',0,'ContactMethod')
    packageDetails['AccountManagerEmail'] = this.getValue(result,'ACT','MercuryGate','MasterBillOfLading',0,'ReferenceNumbers',0,'ReferenceNumber');
    mailAddress = packageDetails['AccountManagerEmail'] ? packageDetails['AccountManagerEmail'].split('@')[1] : ''
    packageDetails['AccountCSREmail'] = `${this.getValue(result,'ASG','MercuryGate','MasterBillOfLading',0,'ReferenceNumbers',0,'ReferenceNumber')}@${mailAddress}`;
    packageDetails['BrokerName'] =  mailAddress ? mailAddress.split('.')[0] : "";
    packageDetails['TripMiles'] = this.getValue(result,null,'MercuryGate','MasterBillOfLading',0,'Carriers',0,'Carrier',0,'Distance',0);
    packageDetails['DispatcherName'] = this.getValue(result,null,'MercuryGate','MasterBillOfLading',0,'Carriers',0,'Carrier',0,'Address',0,'Contacts',0,'Contact',0,'Name',0);
    packageDetails['DispatcherPhone'] = this.getValue(result,'Phone','MercuryGate','MasterBillOfLading',0,'Carriers',0,'Carrier',0,'Address',0,'Contacts',0,'Contact',0,'ContactMethods',0,'ContactMethod');
    packageDetails['DispatcherInfo'] = this.getDispatchInfo(result);
    packageDetails['TotalStops'] = this.getValue(result,null,'MercuryGate','MasterBillOfLading',0,'Plan',0,'Events',0,'key','count');
    packageDetails['LoadStatus1'] = this.getValue(result,null,'MercuryGate','MasterBillOfLading',0,'Status',0);
    packageDetails['LoadStatus2'] = ''
    packageDetails['Weight'] = this.getValue(result,'actual','MercuryGate','MasterBillOfLading',0,'Weights',0,'Weight');
    Object.assign(packageDetails,this.getPickupDropArray(result))
    packageDetails['Special Comments'] = this.getValue(result,'SpecialInstructions','MercuryGate','MasterBillOfLading',0,'Comments',0,'Comment');
    return packageDetails;
  }
  getValue(data,search,...args){
    if(args.length > 0){
      let value = data[args[0]];
      for(var i=1; i< args.length;i++){
        if(value && value[args[i]]){
            value = value[args[i]];
        } else {
          return '';
        }
      }
      if(search){
        value = this.search(value,search);
      }
      return value;
    } else{
      return '';
    }
  }

  search(data,key){
    for(var i=0;i<data.length;i++){
      if(data[i] && data[i]['key'] && data[i]['key']['type']){
        if(data[i]['key']['type'] === key){
          return data[i]['_'];
        }
      }
    }
    return '';
  }

  getDispatchInfo(result){
    let data = this.getValue(result,null,'MercuryGate','MasterBillOfLading',0,'Activities',0,'Activity');
    for(var i=0;i<data.length;i++){
      if(data[i] && data[i]['key'] && data[i]['key']['type']){
        if(data[i]['key']['type'] === 'Dispatch'){
          if(data[i]['Status'])return data[i]['Status'][0];
          else return '';
        }
      }
    }
  }

  getPickupDropArray(result){
    let plan = this.getValue(result,null,'MercuryGate','MasterBillOfLading',0,'Plan',0,'Events',0,'Event')
    let obj = {};
    let pickupIndex = 1;
    let dropIndex = 1;

    for(var i=0;i<plan.length;i++){
      let key;
      if(plan[i]['key'] && plan[i]['key']['type'] && plan[i]['key']['type'] === 'Pickup' ){
        key = `${plan[i]['key']['type']}_${pickupIndex}`;
        obj[`${key} Status`] = this.getValue(plan[i],null,'Activities',0,'Activity',0,'Status',0)
        obj[`${key} Address`] = `${this.getValue(plan[i],null,'Address',0,'Name',0)} \n${this.getValue(plan[i],null,'Address',0,'AddrLine1',0)}\n${this.getValue(plan[i],null,'Address',0,'AddrLine2',0)}\n${this.getValue(plan[i],null,'Address',0,'City',0)}\n${this.getValue(plan[i],null,'Address',0,'StateProvince',0)}\n${this.getValue(plan[i],null,'Address',0,'PostalCode',0)}`
        obj[`${key} Pickup Number`] = this.getValue(result,'Pickup Number','MercuryGate','MasterBillOfLading',0,'ReferenceNumbers',0,'ReferenceNumber');
        let appointmentDate = this.getValue(plan[i],'planned','Dates',0,'Date');
        if(appointmentDate){
          obj[`${key} Appointment Date`] = appointmentDate.split(' ')[0];
          obj[`${key} Appointment Time`] = appointmentDate.split(' ')[1];
        }
        obj[`${key} Arrival Time`] = this.getValue(plan[i],'actual','Dates',0,'Date')
        obj[`${key} Earliest Time`] = this.getValue(plan[i],'earliest','Dates',0,'Date')
        obj[`${key} Latest Time`] = this.getValue(plan[i],'latest','Dates',0,'Date')
        pickupIndex ++;

      } else if(plan[i]['key'] && plan[i]['key']['type'] && plan[i]['key']['type'] === 'Drop') {
        key = `${plan[i]['key']['type']}_${dropIndex}`;
        obj[`${key} Status`] = this.getValue(plan[i],null,'Activities',0,'Activity',0,'Status',0)
        obj[`${key} Address`] = `${this.getValue(plan[i],null,'Address',0,'Name',0)} \n${this.getValue(plan[i],null,'Address',0,'AddrLine1',0)}\n${this.getValue(plan[i],null,'Address',0,'AddrLine2',0)}\n${this.getValue(plan[i],null,'Address',0,'City',0)}\n${this.getValue(plan[i],null,'Address',0,'StateProvince',0)}\n${this.getValue(plan[i],null,'Address',0,'PostalCode',0)}`
        obj[`${key} Pickup Number`] = this.getValue(result,'Pickup Number','MercuryGate','MasterBillOfLading',0,'ReferenceNumbers',0,'ReferenceNumber');
        let appointmentDate = this.getValue(plan[i],'planned','Dates',0,'Date');
        if(appointmentDate){
          obj[`${key} Appointment Date`] = appointmentDate.split(' ')[0];
          obj[`${key} Appointment Time`] = appointmentDate.split(' ')[1];
        }
        obj[`${key} Unload Time`] = this.getValue(plan[i],'actual','Dates',0,'Date')
        obj[`${key} Earliest Time`] = this.getValue(plan[i],'earliest','Dates',0,'Date')
        obj[`${key} Latest Time`] = this.getValue(plan[i],'latest','Dates',0,'Date')
        dropIndex ++
      }
    }
    return obj;
  }
}

module.exports = MailParser;
