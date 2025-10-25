import mongoose from 'mongoose';

const workoutSessionSchema = new mongoose.Schema({
  dayOfWeek: {
    type: String,
    required: [true, 'Dia da semana é obrigatório'],
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  },
  exercises: [{
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true
    },
    sets: {
      type: Number,
      required: [true, 'Número de séries é obrigatório'],
      min: [1, 'Mínimo 1 série'],
      max: [20, 'Máximo 20 séries']
    },
    reps: {
      type: String, // Pode ser "8-12" ou "até falha" ou "30 segundos"
      required: [true, 'Repetições são obrigatórias'],
      maxlength: [50, 'Repetições não podem ter mais de 50 caracteres']
    },
    weight: {
      type: String, // Pode ser "peso corporal" ou "10kg" ou "até falha"
      maxlength: [50, 'Peso não pode ter mais de 50 caracteres']
    },
    restTime: {
      type: String, // "60 segundos" ou "2 minutos"
      maxlength: [50, 'Tempo de descanso não pode ter mais de 50 caracteres']
    },
    notes: {
      type: String,
      maxlength: [200, 'Notas não podem ter mais de 200 caracteres']
    },
    order: {
      type: Number,
      required: true,
      min: 1,
      max: 10 // Máximo 10 exercícios por sessão
    }
  }],
  sessionNotes: {
    type: String,
    maxlength: [500, 'Notas da sessão não podem ter mais de 500 caracteres']
  },
  estimatedDuration: {
    type: Number, // em minutos
    min: [10, 'Duração mínima é 10 minutos'],
    max: [180, 'Duração máxima é 180 minutos']
  },
  difficulty: {
    type: String,
    enum: ['fácil', 'médio', 'difícil'],
    default: 'médio'
  }
}, {
  timestamps: true
});

// Validação para máximo 10 exercícios por sessão
workoutSessionSchema.pre('save', function(next) {
  if (this.exercises.length > 10) {
    return next(new Error('Máximo 10 exercícios por sessão de treino'));
  }
  next();
});

// Índices
workoutSessionSchema.index({ dayOfWeek: 1 });

export default mongoose.model('WorkoutSession', workoutSessionSchema);
