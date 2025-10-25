import mongoose from 'mongoose';

const workoutLogSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Cliente é obrigatório']
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Personal trainer é obrigatório']
  },
  workoutPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutPlan',
    required: [true, 'Plano de treino é obrigatório']
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutSession',
    required: [true, 'Sessão de treino é obrigatória']
  },
  week: {
    type: Number,
    required: [true, 'Semana é obrigatória'],
    min: 1
  },
  dayOfWeek: {
    type: String,
    required: [true, 'Dia da semana é obrigatório'],
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  },
  completedAt: {
    type: Date,
    required: [true, 'Data de conclusão é obrigatória']
  },
  actualDuration: {
    type: Number, // em minutos
    min: [1, 'Duração mínima é 1 minuto']
  },
  exercises: [{
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true
    },
    sets: [{
      setNumber: {
        type: Number,
        required: true,
        min: 1
      },
      reps: {
        type: Number,
        required: true,
        min: 0
      },
      weight: {
        type: String,
        maxlength: [50, 'Peso não pode ter mais de 50 caracteres']
      },
      restTime: {
        type: Number // em segundos
      },
      notes: {
        type: String,
        maxlength: [200, 'Notas não podem ter mais de 200 caracteres']
      },
      completed: {
        type: Boolean,
        default: true
      }
    }],
    notes: {
      type: String,
      maxlength: [200, 'Notas não podem ter mais de 200 caracteres']
    }
  }],
  overallNotes: {
    type: String,
    maxlength: [500, 'Notas gerais não podem ter mais de 500 caracteres']
  },
  difficulty: {
    type: String,
    enum: ['muito_fácil', 'fácil', 'médio', 'difícil', 'muito_difícil']
  },
  energy: {
    type: String,
    enum: ['muito_baixa', 'baixa', 'média', 'alta', 'muito_alta']
  },
  mood: {
    type: String,
    enum: ['muito_ruim', 'ruim', 'neutro', 'bom', 'muito_bom']
  },
  painLevel: {
    type: String,
    enum: ['nenhuma', 'leve', 'moderada', 'intensa', 'insuportável']
  },
  isCompleted: {
    type: Boolean,
    default: true
  },
  // Para avaliação do trainer
  trainerNotes: {
    type: String,
    maxlength: [500, 'Notas do trainer não podem ter mais de 500 caracteres']
  },
  trainerRating: {
    type: Number,
    min: 1,
    max: 5
  }
}, {
  timestamps: true
});

// Índices para melhor performance
workoutLogSchema.index({ client: 1 });
workoutLogSchema.index({ trainer: 1 });
workoutLogSchema.index({ workoutPlan: 1 });
workoutLogSchema.index({ completedAt: -1 });
workoutLogSchema.index({ week: 1 });
workoutLogSchema.index({ dayOfWeek: 1 });
workoutLogSchema.index({ isCompleted: 1 });

// Índice composto para consultas eficientes
workoutLogSchema.index({ client: 1, completedAt: -1 });
workoutLogSchema.index({ trainer: 1, completedAt: -1 });
workoutLogSchema.index({ workoutPlan: 1, week: 1, dayOfWeek: 1 });

// Método para calcular estatísticas do treino
workoutLogSchema.methods.getStats = function() {
  const totalSets = this.exercises.reduce((total, exercise) => {
    return total + exercise.sets.length;
  }, 0);
  
  const completedSets = this.exercises.reduce((total, exercise) => {
    return total + exercise.sets.filter(set => set.completed).length;
  }, 0);
  
  const totalReps = this.exercises.reduce((total, exercise) => {
    return total + exercise.sets.reduce((exerciseTotal, set) => {
      return exerciseTotal + (set.reps || 0);
    }, 0);
  }, 0);
  
  return {
    totalExercises: this.exercises.length,
    totalSets: totalSets,
    completedSets: completedSets,
    completionRate: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
    totalReps: totalReps,
    duration: this.actualDuration,
    difficulty: this.difficulty,
    energy: this.energy,
    mood: this.mood,
    painLevel: this.painLevel
  };
};

export default mongoose.model('WorkoutLog', workoutLogSchema);
