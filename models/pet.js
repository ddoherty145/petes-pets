"use strict";

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

mongoosePaginate.paginate.options = {
  limit: 10 // 10 pets per page
};

const PetSchema = new Schema({
  name: { type: String, required: true },
  species: { type: String },
  birthday: { type: Date },
  picUrl: { type: String },
  picUrlSq: { type: String },
  favoriteFood: { type: String },
  description: { type: String }
}, {
  timestamps: true
});

PetSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Pet', PetSchema);