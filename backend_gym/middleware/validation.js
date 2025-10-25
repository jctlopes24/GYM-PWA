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

// Validações para registo de utilizador
export const validateUserRegistration = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username é obrigatório')
    .isLength({ min: 3, max: 30 }).withMessage('Username deve ter entre 3 e 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username pode conter apenas letras, números e _'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password é obrigatória')
    .isLength({ min: 6 }).withMessage('Password deve ter pelo menos 6 caracteres'),
  
  body('firstName')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório')
    .isLength({ max: 50 }).withMessage('Nome não pode ter mais de 50 caracteres'),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('Apelido é obrigatório')
    .isLength({ max: 50 }).withMessage('Apelido não pode ter mais de 50 caracteres'),
  
  body('phone')
    .optional()
    .matches(/^[0-9]{9}$/)
    .withMessage('Número de telefone deve ter exatamente 9 dígitos'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Data de nascimento inválida')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13 || age > 120) {
        throw new Error('Idade deve estar entre 13 e 120 anos');
      }
      return true;
    }),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Género deve ser male, female ou other'),
  
  body('role')
    .optional()
    .isIn(['client', 'trainer'])
    .withMessage('Role deve ser client ou trainer'),
  
  handleValidationErrors
];

// Validações para login
export const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('Username é obrigatório'),
  
  body('password')
    .notEmpty()
    .withMessage('Password é obrigatória'),
  
  handleValidationErrors
];

// Validações para atualização de perfil
export const validateProfileUpdate = [
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Nome deve ter entre 1 e 50 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome só pode conter letras e espaços'),
  
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Apelido deve ter entre 1 e 50 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Apelido só pode conter letras e espaços'),
  
  body('phone')
    .optional()
    .matches(/^[0-9]{9}$/)
    .withMessage('Número de telefone deve ter exatamente 9 dígitos'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Data de nascimento inválida'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Género deve ser male, female ou other'),
  
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio não pode ter mais de 500 caracteres'),
  
  handleValidationErrors
];

// Validações para dados de personal trainer
export const validateTrainerData = [
  body('specialization')
    .optional()
    .isArray()
    .withMessage('Especialização deve ser um array'),
  
  body('experience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experiência deve ser um número entre 0 e 50'),
  
  body('certification')
    .optional()
    .isArray()
    .withMessage('Certificação deve ser um array'),
  
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Taxa horária deve ser um número entre 0 e 1000'),
  
  handleValidationErrors
];

// Validações para mudança de password
export const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Password atual é obrigatória'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Nova password deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nova password deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Confirmação de password não coincide');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Validações para pedido de mudança de trainer
export const validateTrainerChangeRequest = [
  body('requestedTrainerId')
    .isMongoId()
    .withMessage('ID do trainer inválido'),
  
  body('reason')
    .isLength({ min: 10, max: 500 })
    .withMessage('Motivo deve ter entre 10 e 500 caracteres'),
  
  handleValidationErrors
];

// Validações para aprovação/rejeição de trainer
export const validateTrainerApproval = [
  body('isApproved')
    .isBoolean()
    .withMessage('isApproved deve ser um boolean'),
  
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Motivo não pode ter mais de 500 caracteres'),
  
  handleValidationErrors
];

// Validações para parâmetros de ID
export const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('ID inválido'),
  
  handleValidationErrors
];

// Validações para query parameters
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número maior que 0'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser um número entre 1 e 100'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Termo de pesquisa não pode ter mais de 100 caracteres'),
  
  handleValidationErrors
];

// Validações para filtros de utilizadores
export const validateUserFilters = [
  query('role')
    .optional()
    .isIn(['client', 'trainer', 'admin'])
    .withMessage('Role inválido'),
  
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive deve ser um boolean'),
  
  query('isApproved')
    .optional()
    .isBoolean()
    .withMessage('isApproved deve ser um boolean'),
  
  handleValidationErrors
];
