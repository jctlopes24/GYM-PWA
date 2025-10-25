import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: [true, 'Username é obrigatório'], 
    unique: true,
    trim: true,
    minlength: [3, 'Username deve ter pelo menos 3 caracteres'],
    maxlength: [30, 'Username não pode ter mais de 30 caracteres']
  },
  email: { 
    type: String, 
    required: [true, 'Email é obrigatório'], 
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  password: { 
    type: String, 
    required: [true, 'Password é obrigatória'],
    minlength: [6, 'Password deve ter pelo menos 6 caracteres']
  },
  firstName: { 
    type: String, 
    required: [true, 'Nome é obrigatório'],
    trim: true,
    maxlength: [50, 'Nome não pode ter mais de 50 caracteres']
  },
  lastName: { 
    type: String, 
    required: [true, 'Apelido é obrigatório'],
    trim: true,
    maxlength: [50, 'Apelido não pode ter mais de 50 caracteres']
  },
  phone: { 
    type: String, 
    trim: true,
    match: [/^[0-9]{9}$/, 'Número de telefone deve ter 9 dígitos']
  },
  dateOfBirth: { 
    type: Date 
  },
  gender: { 
    type: String, 
    enum: ['male', 'female', 'other'] 
  },
  role: { 
    type: String, 
    enum: ['client', 'trainer', 'admin'], 
    default: 'client' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  profileImage: { 
    type: String 
  },
  qrCode: { 
    type: String 
  },
  // Para clientes
  assignedTrainer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  trainerChangeRequest: {
    requestedTrainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    requestedAt: { type: Date },
    processedAt: { type: Date },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  // Para personal trainers
  specialization: { 
    type: [String] 
  },
  experience: { 
    type: Number, 
    min: 0 
  },
  certification: { 
    type: [String] 
  },
  bio: { 
    type: String, 
    maxlength: [500, 'Bio não pode ter mais de 500 caracteres'] 
  },
  hourlyRate: { 
    type: Number, 
    min: 0 
  },
  isApproved: { 
    type: Boolean, 
    default: false 
  },
  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  approvedAt: { 
    type: Date 
  },
  // Campos comuns
  lastLogin: { 
    type: Date 
  },
  loginAttempts: { 
    type: Number, 
    default: 0 
  },
  lockUntil: { 
    type: Date 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Índices para melhor performance
userSchema.index({ role: 1 });
userSchema.index({ assignedTrainer: 1 });

// Hash da senha antes de salvar
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Atualizar updatedAt antes de salvar
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Verificar senha
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Verificar se conta está bloqueada
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Incrementar tentativas de login
userSchema.methods.incLoginAttempts = function() {
  // Se temos uma tentativa anterior que expirou e não está bloqueada, reiniciar
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Bloquear conta após 5 tentativas por 2 horas
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 horas
  }
  
  return this.updateOne(updates);
};

// Reset tentativas de login
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Método para obter nome completo
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Método para obter dados públicos do utilizador
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  return userObject;
};

export default mongoose.model('User', userSchema);
