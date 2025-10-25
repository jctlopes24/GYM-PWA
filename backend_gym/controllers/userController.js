import express from "express";
import User from "../models/User.js";
import { validationResult } from "express-validator";

const router = express.Router();

// Obter perfil do utilizador atual
router.get("/profile", async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      message: 'Perfil obtido com sucesso',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Atualizar perfil do utilizador atual
router.put("/profile", async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados de entrada inválidos',
        errors: errors.array()
      });
    }

    const userId = req.user._id;
    const updateData = req.body;

    // Remover campos que não devem ser atualizados diretamente
    delete updateData.password;
    delete updateData.role;
    delete updateData.isActive;
    delete updateData.isVerified;
    delete updateData.isApproved;
    delete updateData.loginAttempts;
    delete updateData.lockUntil;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    
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

// Obter utilizador por ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password -loginAttempts -lockUntil');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Utilizador obtido com sucesso',
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Erro ao obter utilizador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Listar utilizadores (com filtros e paginação)
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Construir filtros
    const filters = {};
    
    if (req.query.role) {
      filters.role = req.query.role;
    }
    
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }
    
    if (req.query.isApproved !== undefined) {
      filters.isApproved = req.query.isApproved === 'true';
    }
    
    if (req.query.search) {
      filters.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { username: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Construir query
    const query = User.find(filters)
      .select('-password -loginAttempts -lockUntil')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Executar query e contar total
    const [users, total] = await Promise.all([
      query.exec(),
      User.countDocuments(filters)
    ]);

    res.json({
      success: true,
      message: 'Utilizadores obtidos com sucesso',
      data: {
        users: users.map(user => user.getPublicProfile()),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Erro ao obter utilizadores:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Listar personal trainers
router.get("/trainers", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filters = { role: 'trainer' };
    
    if (req.query.isApproved !== undefined) {
      filters.isApproved = req.query.isApproved === 'true';
    }
    
    if (req.query.search) {
      filters.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { username: { $regex: req.query.search, $options: 'i' } },
        { specialization: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    const query = User.find(filters)
      .select('-password -loginAttempts -lockUntil')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const [trainers, total] = await Promise.all([
      query.exec(),
      User.countDocuments(filters)
    ]);

    res.json({
      success: true,
      message: 'Personal trainers obtidos com sucesso',
      data: {
        trainers: trainers.map(trainer => trainer.getPublicProfile()),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalTrainers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Erro ao obter personal trainers:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Listar clientes de um personal trainer
router.get("/trainer/clients", async (req, res) => {
  try {
    const trainerId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filters = { 
      role: 'client',
      assignedTrainer: trainerId
    };
    
    if (req.query.search) {
      filters.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { username: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const query = User.find(filters)
      .select('-password -loginAttempts -lockUntil')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const [clients, total] = await Promise.all([
      query.exec(),
      User.countDocuments(filters)
    ]);

    res.json({
      success: true,
      message: 'Clientes obtidos com sucesso',
      data: {
        clients: clients.map(client => client.getPublicProfile()),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalClients: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Erro ao obter clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Atribuir cliente a personal trainer
router.post("/trainer/assign-client", async (req, res) => {
  try {
    const { clientId, trainerId } = req.body;

    // Verificar se cliente existe
    const client = await User.findById(clientId);
    if (!client || client.role !== 'client') {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }

    // Verificar se trainer existe e está aprovado
    const trainer = await User.findById(trainerId);
    if (!trainer || trainer.role !== 'trainer' || !trainer.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Personal trainer não encontrado ou não aprovado'
      });
    }

    // Atribuir cliente ao trainer
    client.assignedTrainer = trainerId;
    await client.save();

    res.json({
      success: true,
      message: 'Cliente atribuído ao personal trainer com sucesso',
      data: {
        client: client.getPublicProfile(),
        trainer: trainer.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Erro ao atribuir cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Solicitar mudança de personal trainer
router.post("/client/request-trainer-change", async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados de entrada inválidos',
        errors: errors.array()
      });
    }

    const { requestedTrainerId, reason } = req.body;
    const clientId = req.user._id;

    // Verificar se cliente já tem um pedido pendente
    const client = await User.findById(clientId);
    if (client.trainerChangeRequest && client.trainerChangeRequest.status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Já existe um pedido de mudança de trainer pendente'
      });
    }

    // Verificar se novo trainer existe e está aprovado
    const newTrainer = await User.findById(requestedTrainerId);
    if (!newTrainer || newTrainer.role !== 'trainer' || !newTrainer.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Personal trainer não encontrado ou não aprovado'
      });
    }

    // Criar pedido de mudança
    client.trainerChangeRequest = {
      requestedTrainer: requestedTrainerId,
      reason,
      status: 'pending',
      requestedAt: new Date()
    };

    await client.save();

    res.json({
      success: true,
      message: 'Pedido de mudança de trainer enviado com sucesso',
      data: {
        request: client.trainerChangeRequest
      }
    });

  } catch (error) {
    console.error('Erro ao solicitar mudança de trainer:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Aprovar/rejeitar personal trainer (apenas admin)
router.put("/trainer/:id/approve", async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados de entrada inválidos',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { isApproved, reason } = req.body;
    const adminId = req.user._id;

    const trainer = await User.findById(id);
    if (!trainer || trainer.role !== 'trainer') {
      return res.status(404).json({
        success: false,
        message: 'Personal trainer não encontrado'
      });
    }

    trainer.isApproved = isApproved;
    trainer.approvedBy = adminId;
    trainer.approvedAt = new Date();

    await trainer.save();

    res.json({
      success: true,
      message: `Personal trainer ${isApproved ? 'aprovado' : 'rejeitado'} com sucesso`,
      data: {
        trainer: trainer.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Erro ao aprovar trainer:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Processar pedidos de mudança de trainer (apenas admin)
router.get("/admin/trainer-change-requests", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {
      'trainerChangeRequest.status': 'pending'
    };

    const query = User.find(filters)
      .populate('trainerChangeRequest.requestedTrainer', 'firstName lastName username email')
      .select('-password -loginAttempts -lockUntil')
      .sort({ 'trainerChangeRequest.requestedAt': -1 })
      .skip(skip)
      .limit(limit);

    const [requests, total] = await Promise.all([
      query.exec(),
      User.countDocuments(filters)
    ]);

    res.json({
      success: true,
      message: 'Pedidos de mudança obtidos com sucesso',
      data: {
        requests: requests.map(request => ({
          client: request.getPublicProfile(),
          requestedTrainer: request.trainerChangeRequest.requestedTrainer,
          reason: request.trainerChangeRequest.reason,
          requestedAt: request.trainerChangeRequest.requestedAt
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRequests: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Erro ao obter pedidos de mudança:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Aprovar/rejeitar pedido de mudança de trainer (apenas admin)
router.put("/admin/trainer-change/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const { approved, reason } = req.body;
    const adminId = req.user._id;

    const client = await User.findById(clientId);
    if (!client || !client.trainerChangeRequest || client.trainerChangeRequest.status !== 'pending') {
      return res.status(404).json({
        success: false,
        message: 'Pedido de mudança não encontrado'
      });
    }

    if (approved) {
      // Aprovar mudança
      client.assignedTrainer = client.trainerChangeRequest.requestedTrainer;
    }

    // Atualizar status do pedido
    client.trainerChangeRequest.status = approved ? 'approved' : 'rejected';
    client.trainerChangeRequest.processedAt = new Date();
    client.trainerChangeRequest.processedBy = adminId;

    await client.save();

    res.json({
      success: true,
      message: `Pedido de mudança ${approved ? 'aprovado' : 'rejeitado'} com sucesso`,
      data: {
        client: client.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Erro ao processar pedido de mudança:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Desativar/ativar utilizador (apenas admin)
router.put("/admin/user/:id/toggle-status", async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: `Utilizador ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Erro ao alterar status do utilizador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
