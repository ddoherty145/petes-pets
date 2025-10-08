"use strict";

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

mongoosePaginate.paginate.options = { limit: 10 };

const PetSchema = new Schema({
  name: { type: String, required: [true, 'Name is required'] },
  species: { type: String, required: [true, 'Species is required'] },
  birthday: { type: Date, required: [true, 'Birthday is required'] },
  picUrl: { type: String }, // Legacy
  picUrlSq: { type: String }, // Legacy
  avatarUrl: { type: String, required: [true, 'Avatar URL is required'] },
  favoriteFood: { type: String, required: [true, 'Favorite Food is required'] },
  description: { 
    type: String, 
    required: [true, 'Description is required'],
    minlength: [140, 'Description must be at least 140 characters']
  },
  price: { 
    type: Number, 
    required: [true, 'Price is required'],
    min: [0, 'Price must be non-negative']
  },
  purchasedAt: { type: Date }
}, { timestamps: true });

// Add weighted text index for full-text search
PetSchema.index(
  { name: 'text', species: 'text', favoriteFood: 'text', description: 'text' },
  {
    name: 'pet_text_index',
    weights: {
      name: 10,
      species: 4,
      favoriteFood: 2,
      description: 1
    }
  }
);

PetSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Pet', PetSchema);