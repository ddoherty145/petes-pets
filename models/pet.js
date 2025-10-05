"use strict";

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

mongoosePaginate.paginate.options = {
  limit: 10 // 10 pets per page
};

const PetSchema = new Schema({
  name: { type: String, required: [true, 'Name is required'] },
  species: { type: String, required: [true, 'Species is required'] },
  birthday: { type: Date, required: [true, 'Birthday is required'] },
  picUrl: { 
    type: String, 
    required: [true, 'Rectangular Image URL is required'],
    match: [/^https?:\/\/.+/i, 'Rectangular Image URL must be a valid URL']
  },
  picUrlSq: { 
    type: String, 
    required: [true, 'Square Image URL is required'],
    match: [/^https?:\/\/.+/i, 'Square Image URL must be a valid URL']
  },
  favoriteFood: { type: String, required: [true, 'Favorite Food is required'] },
  description: { 
    type: String, 
    required: [true, 'Description is required'],
    minlength: [140, 'Description must be at least 140 characters']
  }
}, {
  timestamps: true
});

PetSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Pet', PetSchema);