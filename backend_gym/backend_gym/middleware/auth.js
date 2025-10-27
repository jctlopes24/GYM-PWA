import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware para verificar JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token de acesso necessário' 
      });
    }

    // Usar chave temporária se JWT_SECRET não estiver definido
    const secret = process.env.JWT_SECRET || 'my_super_secret_jwt_key_2024_gym_management_system_xyz123';
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utilizador não encontrado' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Conta desativada' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado' 
      });
    }
    
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
};

// Middleware para verificar roles específicas
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Não autorizado' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Permissões insuficientes.' 
      });
    }

    next();
  };
};

// Middleware para verificar se é admin
export const requireAdmin = authorizeRoles('admin');

// Middleware para verificar se é trainer
export const requireTrainer = authorizeRoles('trainer', 'admin');

// Middleware para verificar se é cliente
export const requireClient = authorizeRoles('client', 'trainer', 'admin');

// Middleware para verificar se o trainer está aprovado
export const requireApprovedTrainer = async (req, res, next) => {
  if (req.user.role === 'trainer' && !req.user.isApproved) {
    return res.status(403).json({ 
      success: false, 
      message: 'Personal trainer não aprovado' 
    });
  }
  next();
};

// Middleware para verificar se pode aceder aos dados do cliente
export const canAccessClientData = async (req, res, next) => {
  const clientId = req.params.id || req.params.clientId;
  
  if (req.user.role === 'admin') {
    return next();
  }
  
  if (req.user.role === 'trainer') {
    // Verificar se o cliente está atribuído a este trainer
    const client = await User.findById(clientId);
    if (client && client.assignedTrainer?.toString() === req.user._id.toString()) {
      return next();
    }
  }
  
  if (req.user.role === 'client' && req.user._id.toString() === clientId) {
    return next();
  }
  
  return res.status(403).json({ 
    success: false, 
    message: 'Acesso negado aos dados deste cliente' 
  });
};

// Middleware para verificar se pode aceder aos dados do trainer
export const canAccessTrainerData = async (req, res, next) => {
  const trainerId = req.params.id || req.params.trainerId;
  
  if (req.user.role === 'admin') {
    return next();
  }
  
  if (req.user.role === 'trainer' && req.user._id.toString() === trainerId) {
    return next();
  }
  
  if (req.user.role === 'client') {
    // Verificar se o cliente está atribuído a este trainer
    const trainer = await User.findById(trainerId);
    if (trainer && req.user.assignedTrainer?.toString() === trainerId) {
      return next();
    }
  }
  
  return res.status(403).json({ 
    success: false, 
    message: 'Acesso negado aos dados deste personal trainer' 
  });
};

// Middleware para rate limiting personalizado
export const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Limpar requisições antigas
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    } else {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    
    if (userRequests.length >= max) {
      return res.status(429).json({ 
        success: false, 
        message: 'Muitas requisições. Tente novamente mais tarde.' 
      });
    }
    
    userRequests.push(now);
    requests.set(key, userRequests);
    
    next();
  };
};
