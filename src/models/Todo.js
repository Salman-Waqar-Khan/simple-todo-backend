const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
      maxlength: [200, 'Title cannot be longer than 200 characters.'],
      validate: {
        validator: (value) => value.trim().length > 0,
        message: 'Title cannot be empty.'
      }
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot be longer than 2000 characters.']
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model('Todo', todoSchema);
