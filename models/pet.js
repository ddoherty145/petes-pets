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
  picUrl: { type: String }, // Legacy field - optional
  picUrlSq: { type: String }, // Legacy field - optional
  avatarUrl: { 
    type: String, 
    required: [true, 'Avatar URL is required'],
    match: [/^https?:\/\/.+/i, 'Avatar URL must be a valid URL']
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

// Pre-remove middleware to delete S3 files when pet is deleted
PetSchema.pre('findOneAndDelete', async function() {
  const pet = await this.model.findOne(this.getQuery());
  if (pet) {
    const { deleteFromS3 } = require('../config/s3');
    
    // Extract S3 key from URL
    const extractS3Key = (url) => {
      if (url && url.includes('.amazonaws.com/')) {
        return url.split('.amazonaws.com/')[1];
      }
      return null;
    };
    
    try {
      // Delete avatar image (primary)
      const avatarKey = extractS3Key(pet.avatarUrl);
      if (avatarKey) {
        await deleteFromS3(avatarKey);
      }
      
      // Delete legacy rectangular image (if exists)
      const picUrlKey = extractS3Key(pet.picUrl);
      if (picUrlKey) {
        await deleteFromS3(picUrlKey);
      }
      
      // Delete legacy square image (if exists)
      const picUrlSqKey = extractS3Key(pet.picUrlSq);
      if (picUrlSqKey) {
        await deleteFromS3(picUrlSqKey);
      }
    } catch (error) {
      console.error('Error deleting S3 files:', error);
      // Don't throw error to prevent pet deletion failure
    }
  }
});

module.exports = mongoose.model('Pet', PetSchema);