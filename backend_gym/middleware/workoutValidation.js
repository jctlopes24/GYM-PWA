import { body, param, query, validationResult } from 'express-validator';

// Middleware para processar erros de validação
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados de entrada inválidos',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Validações para criação de plano de treino
export const validateWorkoutPlan = [
  body('name')
    .isLength({ min: 3, max: 100 })
    .withMessage('Nome do plano deve ter entre 3 e 100 caracteres')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descrição não pode ter mais de 500 caracteres')
    .trim(),
  
  body('clientId')
    .isMongoId()
    .withMessage('ID do cliente inválido'),
  
  body('frequency')
    .isIn(['3x', '4x', '5x'])
    .withMessage('Frequência deve ser 3x, 4x ou 5x'),
  
  body('sessions')
    .isArray({ min: 1, max: 5 })
    .withMessage('Deve ter entre 1 e 5 sessões de treino'),
  
  body('sessions.*.dayOfWeek')
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Dia da semana inválido'),
  
  body('sessions.*.exercises')
    .isArray({ min: 1, max: 10 })
    .withMessage('Cada sessão deve ter entre 1 e 10 exercícios'),
  
  body('sessions.*.exercises.*.exercise')
    .isMongoId()
    .withMessage('ID do exercício inválido'),
  
  body('sessions.*.exercises.*.sets')
    .isInt({ min: 1, max: 20 })
    .withMessage('Número de séries deve estar entre 1 e 20'),
  
  body('sessions.*.exercises.*.reps')
    .isLength({ min: 1, max: 50 })
    .withMessage('Repetições devem ter entre 1 e 50 caracteres'),
  
  body('sessions.*.exercises.*.weight')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Peso não pode ter mais de 50 caracteres'),
  
  body('sessions.*.exercises.*.restTime')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Tempo de descanso não pode ter mais de 50 caracteres'),
  
  body('sessions.*.exercises.*.notes')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Notas não podem ter mais de 200 caracteres'),
  
  body('sessions.*.exercises.*.order')
    .isInt({ min: 1, max: 10 })
    .withMessage('Ordem deve estar entre 1 e 10'),
  
  body('sessions.*.sessionNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notas da sessão não podem ter mais de 500 caracteres'),
  
  body('sessions.*.estimatedDuration')
    .optional()
    .isInt({ min: 10, max: 180 })
    .withMessage('Duração estimada deve estar entre 10 e 180 minutos'),
  
  body('sessions.*.difficulty')
    .optional()
    .isIn(['fácil', 'médio', 'difícil'])
    .withMessage('Dificuldade deve ser fácil, médio ou difícil'),
  
  body('startDate')
    .isISO8601()
    .withMessage('Data de início inválida')
    .custom((value) => {
      const startDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        throw new Error('Data de início não pode ser no passado');
      }
      return true;
    }),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Data de fim inválida')
    .custom((value, { req }) => {
      if (value && req.body.startDate) {
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('Data de fim deve ser posterior à data de início');
        }
      }
      return true;
    }),
  
  body('goals')
    .optional()
    .isArray()
    .withMessage('Objetivos devem ser um array'),
  
  body('goals.*')
    .isIn([
      'perda_peso', 'ganho_massa', 'força', 'resistência', 'flexibilidade',
      'condicionamento', 'reabilitação', 'manutenção', 'performance', 'outros'
    ])
    .withMessage('Objetivo inválido'),
  
  body('level')
    .optional()
    .isIn(['iniciante', 'intermediário', 'avançado'])
    .withMessage('Nível deve ser iniciante, intermediário ou avançado'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notas não podem ter mais de 1000 caracteres'),
  
  body('totalWeeks')
    .optional()
    .isInt({ min: 1, max: 52 })
    .withMessage('Total de semanas deve estar entre 1 e 52'),
  
  body('isTemplate')
    .optional()
    .isBoolean()
    .withMessage('isTemplate deve ser um boolean'),
  
  body('templateName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Nome do template não pode ter mais de 100 caracteres'),
  
  handleValidationErrors
];

// Validações para criação de exercício
export const validateExercise = [
  body('name')
    .isLength({ min: 3, max: 100 })
    .withMessage('Nome do exercício deve ter entre 3 e 100 caracteres')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descrição não pode ter mais de 500 caracteres')
    .trim(),
  
  body('muscleGroups')
    .optional()
    .isArray()
    .withMessage('Grupos musculares devem ser um array'),
  
  body('muscleGroups.*')
    .isIn([
      'peito', 'costas', 'ombros', 'bíceps', 'tríceps', 'antebraços',
      'quadríceps', 'posteriores', 'glúteos', 'panturrilhas', 'abdômen',
      'core', 'cardio', 'funcional', 'outros'
    ])
    .withMessage('Grupo muscular inválido'),
  
  body('equipment')
    .optional()
    .isArray()
    .withMessage('Equipamentos devem ser um array'),
  
  body('equipment.*')
    .isIn([
      'peso_livre', 'halteres', 'barra', 'máquina', 'cabo', 'elástico',
      'corpo_livre', 'kettlebell', 'medicine_ball', 'step', 'outros'
    ])
    .withMessage('Equipamento inválido'),
  
  body('difficulty')
    .optional()
    .isIn(['iniciante', 'intermediário', 'avançado'])
    .withMessage('Dificuldade deve ser iniciante, intermediário ou avançado'),
  
  body('instructions')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Instruções não podem ter mais de 1000 caracteres'),
  
  body('videoUrl')
    .optional()
    .isURL()
    .withMessage('URL do vídeo inválida'),
  
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('URL da imagem inválida'),
  
  handleValidationErrors
];

// Validações para atualização de plano de treino
export const validateWorkoutPlanUpdate = [
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Nome do plano deve ter entre 3 e 100 caracteres')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descrição não pode ter mais de 500 caracteres')
    .trim(),
  
  body('frequency')
    .optional()
    .isIn(['3x', '4x', '5x'])
    .withMessage('Frequência deve ser 3x, 4x ou 5x'),
  
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Data de início inválida'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Data de fim inválida'),
  
  body('goals')
    .optional()
    .isArray()
    .withMessage('Objetivos devem ser um array'),
  
  body('level')
    .optional()
    .isIn(['iniciante', 'intermediário', 'avançado'])
    .withMessage('Nível deve ser iniciante, intermediário ou avançado'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notas não podem ter mais de 1000 caracteres'),
  
  body('totalWeeks')
    .optional()
    .isInt({ min: 1, max: 52 })
    .withMessage('Total de semanas deve estar entre 1 e 52'),
  
  handleValidationErrors
];

// Validações para parâmetros de ID
export const validateWorkoutPlanId = [
  param('id')
    .isMongoId()
    .withMessage('ID do plano de treino inválido'),
  
  handleValidationErrors
];

// Validações para filtros de planos de treino
export const validateWorkoutPlanFilters = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número maior que 0'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser um número entre 1 e 100'),
  
  query('clientId')
    .optional()
    .isMongoId()
    .withMessage('ID do cliente inválido'),
  
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive deve ser um boolean'),
  
  query('frequency')
    .optional()
    .isIn(['3x', '4x', '5x'])
    .withMessage('Frequência inválida'),
  
  query('level')
    .optional()
    .isIn(['iniciante', 'intermediário', 'avançado'])
    .withMessage('Nível inválido'),
  
  query('goals')
    .optional()
    .isString()
    .withMessage('Objetivos devem ser uma string separada por vírgulas'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Termo de pesquisa não pode ter mais de 100 caracteres'),
  
  query('sortBy')
    .optional()
    .isIn(['name', 'createdAt', 'startDate', 'frequency', 'level'])
    .withMessage('Campo de ordenação inválido'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Ordem de classificação deve ser asc ou desc'),
  
  handleValidationErrors
];

// Validações para filtros de exercícios
export const validateExerciseFilters = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número maior que 0'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser um número entre 1 e 100'),
  
  query('muscleGroups')
    .optional()
    .isString()
    .withMessage('Grupos musculares devem ser uma string separada por vírgulas'),
  
  query('equipment')
    .optional()
    .isString()
    .withMessage('Equipamentos devem ser uma string separada por vírgulas'),
  
  query('difficulty')
    .optional()
    .isIn(['iniciante', 'intermediário', 'avançado'])
    .withMessage('Dificuldade inválida'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Termo de pesquisa não pode ter mais de 100 caracteres'),
  
  handleValidationErrors
];

// Validações para registro de treino
export const validateWorkoutLog = [
  body('workoutPlanId')
    .isMongoId()
    .withMessage('ID do plano de treino inválido'),
  
  body('sessionId')
    .isMongoId()
    .withMessage('ID da sessão inválido'),
  
  body('week')
    .isInt({ min: 1, max: 52 })
    .withMessage('Semana deve estar entre 1 e 52'),
  
  body('dayOfWeek')
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Dia da semana inválido'),
  
  body('actualDuration')
    .optional()
    .isInt({ min: 1, max: 300 })
    .withMessage('Duração deve estar entre 1 e 300 minutos'),
  
  body('exercises')
    .isArray({ min: 1 })
    .withMessage('Deve ter pelo menos 1 exercício'),
  
  body('exercises.*.exercise')
    .isMongoId()
    .withMessage('ID do exercício inválido'),
  
  body('exercises.*.sets')
    .isArray({ min: 1 })
    .withMessage('Deve ter pelo menos 1 série'),
  
  body('exercises.*.sets.*.setNumber')
    .isInt({ min: 1 })
    .withMessage('Número da série deve ser maior que 0'),
  
  body('exercises.*.sets.*.reps')
    .isInt({ min: 0 })
    .withMessage('Repetições devem ser um número positivo'),
  
  body('exercises.*.sets.*.weight')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Peso não pode ter mais de 50 caracteres'),
  
  body('exercises.*.sets.*.restTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Tempo de descanso deve ser um número positivo'),
  
  body('exercises.*.sets.*.notes')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Notas não podem ter mais de 200 caracteres'),
  
  body('exercises.*.sets.*.completed')
    .optional()
    .isBoolean()
    .withMessage('completed deve ser um boolean'),
  
  body('exercises.*.notes')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Notas do exercício não podem ter mais de 200 caracteres'),
  
  body('overallNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notas gerais não podem ter mais de 500 caracteres'),
  
  body('difficulty')
    .optional()
    .isIn(['muito_fácil', 'fácil', 'médio', 'difícil', 'muito_difícil'])
    .withMessage('Dificuldade inválida'),
  
  body('energy')
    .optional()
    .isIn(['muito_baixa', 'baixa', 'média', 'alta', 'muito_alta'])
    .withMessage('Energia inválida'),
  
  body('mood')
    .optional()
    .isIn(['muito_ruim', 'ruim', 'neutro', 'bom', 'muito_bom'])
    .withMessage('Humor inválido'),
  
  body('painLevel')
    .optional()
    .isIn(['nenhuma', 'leve', 'moderada', 'intensa', 'insuportável'])
    .withMessage('Nível de dor inválido'),
  
  handleValidationErrors
];

// Validações para filtros de logs
export const validateWorkoutLogFilters = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número maior que 0'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser um número entre 1 e 100'),
  
  query('week')
    .optional()
    .isInt({ min: 1, max: 52 })
    .withMessage('Semana deve estar entre 1 e 52'),
  
  query('dayOfWeek')
    .optional()
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Dia da semana inválido'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Data de início inválida'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Data de fim inválida'),
  
  handleValidationErrors
];

// Validações para toggle de status
export const validateToggleStatus = [
  body('isActive')
    .isBoolean()
    .withMessage('isActive deve ser um boolean'),
  
  handleValidationErrors
];

export default {
  handleValidationErrors,
  validateWorkoutPlan,
  validateWorkoutPlanUpdate,
  validateWorkoutPlanId,
  validateWorkoutPlanFilters,
  validateExercise,
  validateExerciseFilters,
  validateToggleStatus,
  validateWorkoutLog,
  validateWorkoutLogFilters
};
