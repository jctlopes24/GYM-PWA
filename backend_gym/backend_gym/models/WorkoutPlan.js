import mongoose from 'mongoose';

const workoutPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do plano é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome do plano não pode ter mais de 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  },
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
  frequency: {
    type: String,
    required: [true, 'Frequência é obrigatória'],
    enum: ['3x', '4x', '5x'],
    default: '3x'
  },
  sessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutSession'
  }],
  startDate: {
    type: Date,
    required: [true, 'Data de início é obrigatória']
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isTemplate: {
    type: Boolean,
    default: false // Se true, pode ser usado como template para outros clientes
  },
  templateName: {
    type: String,
    trim: true,
    maxlength: [100, 'Nome do template não pode ter mais de 100 caracteres']
  },
  goals: [{
    type: String,
    enum: [
      'perda_peso', 'ganho_massa', 'força', 'resistência', 'flexibilidade',
      'condicionamento', 'reabilitação', 'manutenção', 'performance', 'outros'
    ]
  }],
  level: {
    type: String,
    enum: ['iniciante', 'intermediário', 'avançado'],
    default: 'iniciante'
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notas não podem ter mais de 1000 caracteres']
  },
  // Para controle de semanas
  currentWeek: {
    type: Number,
    default: 1,
    min: 1
  },
  totalWeeks: {
    type: Number,
    default: 4,
    min: 1,
    max: 52
  },
  // Para acompanhamento
  lastCompletedSession: {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkoutSession'
    },
    completedAt: Date,
    week: Number
  },
  progress: {
    totalSessionsCompleted: {
      type: Number,
      default: 0
    },
    totalSessionsPlanned: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true
});

// Validação para garantir que o trainer está aprovado
workoutPlanSchema.pre('save', async function(next) {
  if (this.isNew) {
    const trainer = await mongoose.model('User').findById(this.trainer);
    if (!trainer || trainer.role !== 'trainer' || !trainer.isApproved) {
      return next(new Error('Personal trainer deve estar aprovado para criar planos'));
    }
    
    const client = await mongoose.model('User').findById(this.client);
    if (!client || client.role !== 'client') {
      return next(new Error('Cliente inválido'));
    }
    
    // Verificar se o cliente está atribuído a este trainer
    if (client.assignedTrainer?.toString() !== this.trainer.toString()) {
      return next(new Error('Cliente não está atribuído a este personal trainer'));
    }
  }
  next();
});

// Validação para máximo de sessões baseado na frequência
workoutPlanSchema.pre('save', function(next) {
  const maxSessions = {
    '3x': 3,
    '4x': 4,
    '5x': 5
  };
  
  if (this.sessions.length > maxSessions[this.frequency]) {
    return next(new Error(`Máximo ${maxSessions[this.frequency]} sessões para frequência ${this.frequency}`));
  }
  
  // Calcular total de sessões planejadas
  this.progress.totalSessionsPlanned = this.sessions.length * this.totalWeeks;
  
  next();
});

// Índices para melhor performance
workoutPlanSchema.index({ client: 1 });
workoutPlanSchema.index({ trainer: 1 });
workoutPlanSchema.index({ isActive: 1 });
workoutPlanSchema.index({ isTemplate: 1 });
workoutPlanSchema.index({ startDate: 1 });
workoutPlanSchema.index({ frequency: 1 });
workoutPlanSchema.index({ goals: 1 });
workoutPlanSchema.index({ level: 1 });

// Método para calcular taxa de conclusão
workoutPlanSchema.methods.calculateCompletionRate = function() {
  if (this.progress.totalSessionsPlanned === 0) {
    this.progress.completionRate = 0;
  } else {
    this.progress.completionRate = Math.round(
      (this.progress.totalSessionsCompleted / this.progress.totalSessionsPlanned) * 100
    );
  }
  return this.progress.completionRate;
};

// Método para marcar sessão como concluída
workoutPlanSchema.methods.markSessionCompleted = function(sessionId, week) {
  this.progress.totalSessionsCompleted += 1;
  this.lastCompletedSession = {
    session: sessionId,
    completedAt: new Date(),
    week: week
  };
  this.calculateCompletionRate();
  return this.save();
};

// Método para obter estatísticas do plano
workoutPlanSchema.methods.getStats = function() {
  return {
    totalSessions: this.progress.totalSessionsPlanned,
    completedSessions: this.progress.totalSessionsCompleted,
    completionRate: this.progress.completionRate,
    currentWeek: this.currentWeek,
    totalWeeks: this.totalWeeks,
    frequency: this.frequency,
    isActive: this.isActive
  };
};

export default mongoose.model('WorkoutPlan', workoutPlanSchema);
