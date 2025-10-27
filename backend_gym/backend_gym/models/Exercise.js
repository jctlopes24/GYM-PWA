import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do exercício é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome do exercício não pode ter mais de 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  },
  muscleGroups: [{
    type: String,
    enum: [
      'peito', 'costas', 'ombros', 'bíceps', 'tríceps', 'antebraços',
      'quadríceps', 'posteriores', 'glúteos', 'panturrilhas', 'abdômen',
      'core', 'cardio', 'funcional', 'outros'
    ]
  }],
  equipment: [{
    type: String,
    enum: [
      'peso_livre', 'halteres', 'barra', 'máquina', 'cabo', 'elástico',
      'corpo_livre', 'kettlebell', 'medicine_ball', 'step', 'outros'
    ]
  }],
  difficulty: {
    type: String,
    enum: ['iniciante', 'intermediário', 'avançado'],
    default: 'iniciante'
  },
  instructions: {
    type: String,
    trim: true,
    maxlength: [1000, 'Instruções não podem ter mais de 1000 caracteres']
  },
  videoUrl: {
    type: String,
    match: [/^https?:\/\/.+/, 'URL do vídeo deve ser válida']
  },
  imageUrl: {
    type: String,
    match: [/^https?:\/\/.+/, 'URL da imagem deve ser válida']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Índices para melhor performance
exerciseSchema.index({ name: 1 });
exerciseSchema.index({ muscleGroups: 1 });
exerciseSchema.index({ equipment: 1 });
exerciseSchema.index({ difficulty: 1 });
exerciseSchema.index({ createdBy: 1 });

export default mongoose.model('Exercise', exerciseSchema);
