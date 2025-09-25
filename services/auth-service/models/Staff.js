const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'manager', 'employee','owner']
  },
  avatar: {
    type: String,
    trim: true
  },
  workingStore: [{
    storeId: {
      type: String,
      required: true,
      trim: true
    },
    storeName: {
      type: String,
      required: true,
      trim: true
    }
  }],
  managedStore: [{
    storeId: {
      type: String,
      required: true,
      trim: true
    },
    storeName: {
      type: String,
      required: true,
      trim: true
    }
  }],
  ownedStore: [{
    storeId: {
      type: String,
      required: true,
      trim: true
    },
    storeName: {
      type: String,
      required: true,
      trim: true
    }
  }],
  addresses: [{
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    addressType: {
      type: String,
      enum: ['home', 'work', 'billing', 'shipping'],
      default: 'home'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
staffSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Remove password from JSON output
staffSchema.methods.toJSON = function() {
  const staff = this.toObject();
  delete staff.password;
  return staff;
};

module.exports = mongoose.model('Staff', staffSchema);
