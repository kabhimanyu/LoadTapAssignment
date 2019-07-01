const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { omitBy, isNil } = require('lodash');
const APIError = require('../utils/APIError');
const moment = require('moment');

const optionsType = ["CALLS","PUTS"];
/**
 * options Schema
 * @private
 */
const optionsSchema = new mongoose.Schema({
  name: {
    type : String
  },
  symbol : {
    type : String
  },
  oi: {
    type : Number
  },
  changeInOI :  {
    type : Number
  },
  volume : {
    type : Number
  },
  ltp : {
    type : Number
  },
  netChange : {
    type : Number
  },
  bidQty : {
    type : Number
  },
  bidPrice : {
    type : Number
  },
  askPrice : {
    type : Number
  },
  askQty : {
    type : Number
  },
  strikePrice : {
    type : Number
  },
  type : {
    type : String,
    enum : optionsType,
    default : "CALLS"
  },
  isDeleted: {
    type : Boolean,
    default : false
  }
}, {
  timestamps: true,
  usePushEach: true
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
// courseSchema.pre('save', async function save(next) {

// });

/**
 * Methods
 */
optionsSchema.method({
  transform() {
    const transformed = {};
    const fields = ['id','name','oi','symbol','changeInOI','volume','ltp','netChange','strikePrice','type','createdAt','isDeleted'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },
});

/**
 * Statics
 */
optionsSchema.statics = {


  /**
   * Get Options
   *
   * @param {ObjectId} id - The objectId of course.
   * @returns {Promise<User, APIError>}
   */
  async get(id) {
    try {
      let options;
      if (mongoose.Types.ObjectId.isValid(id)) {
        options = await this.findById(id).exec();
      }
      if (options) {
        return options;
      }

      throw new APIError({
        message: 'Options does not exist',
        status: httpStatus.NOT_FOUND,
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Return new validation error
   * if error is a mongoose duplicate key error
   *
   * @param {Error} error
   * @returns {Error|APIError}
   */
  checkDuplicateName(error) {
    if (error.name === 'MongoError' && error.code === 11000) {
      return new APIError({
        message: 'Validation Error',
        errors: [{
          field: 'name',
          location: 'body',
          messages: ['"name" already exists'],
        }],
        status: httpStatus.CONFLICT,
        isPublic: true,
        stack: error.stack,
      });
    }
    return error;
  },

  /**
   * List optionss in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<Subject[]>}
   */
  async list({
    page = 1, perPage = 100 , name,type,symbol,from,to
  }) {
    try{
      const option = omitBy({name,type,symbol}, isNil);

      var options =await this.find(option)
        .sort({ createdAt: -1 })
        .skip(perPage * (page - 1))
        .limit(perPage*1)
        .exec();

      if(from && to){
        console.log(from, moment(from))
        option.createdAt = {$gte : moment(from),$lte : moment(to)}
      }
      options = options.map(i => i.transform())
      var count =await this.find(option).exec();
      count = count.length;
      var pages =  Math.ceil(count/perPage);
      return {options,count,pages}
    } catch(error){
        throw error
      }
  },
};

/**
 * @typedef Options
 */
module.exports = mongoose.model('Options', optionsSchema);
