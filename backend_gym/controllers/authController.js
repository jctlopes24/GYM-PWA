import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import { validationResult } from "express-validator";

const router = express.Router();

// Gerar token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Registro de utilizador
router.post("/register", async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados de entrada inválidos',
        errors: errors.array()
      });
    }

    const { username, email, password, firstName, lastName, phone, dateOfBirth, gender, role = 'client' } = req.body;

    // Verificar se utilizador já existe
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? 'Email já registado' : 'Username já existe'
      });
    }

    // Criar utilizador
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      role
    });

    // Gerar QR Code para login
    const qrData = JSON.stringify({
      userId: user._id,
      username: user.username,
      timestamp: Date.now()
    });
    
    const qrCodeUrl = await QRCode.toDataURL(qrData);
    user.qrCode = qrCodeUrl;
    await user.save();

    // Gerar token
    const token = generateToken(user._id);

    // Atualizar último login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Utilizador registado com sucesso',
      data: {
        token,
        user: user.getPublicProfile(),
        qrCode: qrCodeUrl
      }
    });

  } catch (error) {
    console.error('Erro no registo:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} já existe`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login de utilizador
router.post("/login", async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados de entrada inválidos',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Encontrar utilizador
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar se conta está bloqueada
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Conta temporariamente bloqueada devido a muitas tentativas de login'
      });
    }

    // Verificar se conta está ativa
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Conta desativada'
      });
    }

    // Verificar password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Reset tentativas de login
    await user.resetLoginAttempts();

    // Gerar token
    const token = generateToken(user._id);

    // Atualizar último login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token,
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login por QR Code
router.post("/login/qr", async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'Dados do QR Code são obrigatórios'
      });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'QR Code inválido'
      });
    }

    const { userId, timestamp } = parsedData;
    
    // Verificar se QR Code não é muito antigo (5 minutos)
    const now = Date.now();
    if (now - timestamp > 5 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: 'QR Code expirado'
      });
    }

    // Encontrar utilizador
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    // Verificar se conta está ativa
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Conta desativada'
      });
    }

    // Gerar token
    const token = generateToken(user._id);

    // Atualizar último login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login por QR Code realizado com sucesso',
      data: {
        token,
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Erro no login por QR Code:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Gerar novo QR Code
router.post("/qr/generate", async (req, res) => {
  try {
    const user = req.user;

    const qrData = JSON.stringify({
      userId: user._id,
      username: user.username,
      timestamp: Date.now()
    });
    
    const qrCodeUrl = await QRCode.toDataURL(qrData);
    
    // Atualizar QR Code no utilizador
    user.qrCode = qrCodeUrl;
    await user.save();

    res.json({
      success: true,
      message: 'QR Code gerado com sucesso',
      data: {
        qrCode: qrCodeUrl
      }
    });

  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verificar token
router.get("/verify", async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      message: 'Token válido',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Logout (opcional - para invalidar tokens no futuro)
router.post("/logout", async (req, res) => {
  try {
    // Em uma implementação mais avançada, poderíamos manter uma blacklist de tokens
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Refresh token (opcional)
router.post("/refresh", async (req, res) => {
  try {
    const user = req.user;
    
    // Gerar novo token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Token renovado com sucesso',
      data: {
        token,
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
