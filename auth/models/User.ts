
import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcryptjs';
export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: {
    streetAddress: string;
    city: string;
    stateProvince: string;
    zipCode: string;
  };
  role: 'user';
  isEmailVerified: boolean;
  emailConfirmationToken?: string;
  emailConfirmationExpires?: Date;
  lastLogin?: Date;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateRefreshToken(): string;
  removeRefreshToken(token: string): void;
}

const userSchema = new mongoose.Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  address: {
    streetAddress: {
      type: String,
      trim: true,
      maxlength: [100, 'Street address cannot exceed 100 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [50, 'City cannot exceed 50 characters']
    },
    stateProvince: {
      type: String,
      trim: true,
      maxlength: [50, 'State/Province cannot exceed 50 characters']
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: [20, 'Zip code cannot exceed 20 characters']
    }
  },
  role: {
    type: String,
    enum: ['user'] as const,
    default: 'user'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailConfirmationToken: {
    type: String,
    select: false
  },
  emailConfirmationExpires: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date
  },
  refreshTokens: [{
    type: String,
    select: false
  }]
}, {
  timestamps: true,
  toJSON: {
  transform: function(doc: any, ret: any) {
      delete ret.password;
      delete ret.refreshTokens;
      delete ret.emailConfirmationToken;
      delete ret.emailConfirmationExpires;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better performance
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function(this: IUser, next: (err?: Error) => void) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(this: IUser, candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Generate refresh token method
userSchema.methods.generateRefreshToken = function(this: IUser): string {
  const token = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
  this.refreshTokens.push(token);
  
  // Keep only the last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
  
  return token;
};

// Remove refresh token method
userSchema.methods.removeRefreshToken = function(this: IUser, token: string): void {
  this.refreshTokens = this.refreshTokens.filter((t: string) => t !== token);
};

export const User = mongoose.model<IUser>('User', userSchema);
