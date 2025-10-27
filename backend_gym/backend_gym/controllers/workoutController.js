import express from "express";
import WorkoutPlan from "../models/WorkoutPlan.js";
import WorkoutSession from "../models/WorkoutSession.js";
import Exercise from "../models/Exercise.js";
import WorkoutLog from "../models/WorkoutLog.js";
import User from "../models/User.js";
import { validationResult } from "express-validator";

const router = express.Router();

// Criar novo plano de treino
router.post("/plans", async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados de entrada inválidos',
        errors: errors.array()
      });
    }

    const trainerId = req.user._id;
    const { 
      name, 
      description, 
      clientId, 
      frequency, 
      sessions, 
      startDate, 
      endDate, 
      goals, 
      level, 
      notes, 
      totalWeeks,
      isTemplate,
      templateName 
    } = req.body;

    // Verificar se o cliente existe e está atribuído ao trainer
    const client = await User.findById(clientId);
    if (!client || client.role !== 'client') {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }

    if (client.assignedTrainer?.toString() !== trainerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cliente não está atribuído a este personal trainer'
      });
    }

    // Criar sessões de treino
    const createdSessions = [];
    for (const sessionData of sessions) {
      const session = new WorkoutSession(sessionData);
      await session.save();
      createdSessions.push(session._id);
    }

    // Criar plano de treino
    const workoutPlan = new WorkoutPlan({
      name,
      description,
      client: clientId,
      trainer: trainerId,
      frequency,
      sessions: createdSessions,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      goals,
      level,
      notes,
      totalWeeks: totalWeeks || 4,
      isTemplate: isTemplate || false,
      templateName
    });

    await workoutPlan.save();

    // Popular dados para resposta
    await workoutPlan.populate([
      { path: 'client', select: 'firstName lastName username email' },
      { path: 'trainer', select: 'firstName lastName username email' },
      { path: 'sessions', populate: { path: 'exercises.exercise', model: 'Exercise' } }
    ]);

    res.status(201).json({
      success: true,
      message: 'Plano de treino criado com sucesso',
      data: { workoutPlan }
    });

  } catch (error) {
    console.error('Erro ao criar plano de treino:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obter planos de treino do trainer
router.get("/plans", async (req, res) => {
  try {
    const trainerId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Construir filtros
    const filters = { trainer: trainerId };
    
    if (req.query.clientId) {
      filters.client = req.query.clientId;
    }
    
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }
    
    if (req.query.frequency) {
      filters.frequency = req.query.frequency;
    }
    
    if (req.query.level) {
      filters.level = req.query.level;
    }
    
    if (req.query.goals) {
      filters.goals = { $in: req.query.goals.split(',') };
    }
    
    if (req.query.search) {
      filters.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Ordenação
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const query = WorkoutPlan.find(filters)
      .populate('client', 'firstName lastName username email')
      .populate('trainer', 'firstName lastName username email')
      .populate('sessions')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const [plans, total] = await Promise.all([
      query.exec(),
      WorkoutPlan.countDocuments(filters)
    ]);

    res.json({
      success: true,
      message: 'Planos de treino obtidos com sucesso',
      data: {
        plans,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalPlans: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Erro ao obter planos de treino:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obter plano de treino específico
router.get("/plans/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const trainerId = req.user._id;

    const plan = await WorkoutPlan.findOne({ _id: id, trainer: trainerId })
      .populate('client', 'firstName lastName username email phone')
      .populate('trainer', 'firstName lastName username email')
      .populate({
        path: 'sessions',
        populate: {
          path: 'exercises.exercise',
          model: 'Exercise'
        }
      });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plano de treino não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Plano de treino obtido com sucesso',
      data: { plan }
    });

  } catch (error) {
    console.error('Erro ao obter plano de treino:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Atualizar plano de treino
router.put("/plans/:id", async (req, res) => {
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
    const trainerId = req.user._id;
    const updateData = req.body;

    const plan = await WorkoutPlan.findOne({ _id: id, trainer: trainerId });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plano de treino não encontrado'
      });
    }

    // Se estão sendo atualizadas as sessões, criar novas sessões
    if (updateData.sessions) {
      // Deletar sessões antigas
      await WorkoutSession.deleteMany({ _id: { $in: plan.sessions } });
      
      // Criar novas sessões
      const createdSessions = [];
      for (const sessionData of updateData.sessions) {
        const session = new WorkoutSession(sessionData);
        await session.save();
        createdSessions.push(session._id);
      }
      updateData.sessions = createdSessions;
    }

    // Atualizar plano
    Object.assign(plan, updateData);
    await plan.save();

    // Popular dados para resposta
    await plan.populate([
      { path: 'client', select: 'firstName lastName username email' },
      { path: 'trainer', select: 'firstName lastName username email' },
      { path: 'sessions', populate: { path: 'exercises.exercise', model: 'Exercise' } }
    ]);

    res.json({
      success: true,
      message: 'Plano de treino atualizado com sucesso',
      data: { plan }
    });

  } catch (error) {
    console.error('Erro ao atualizar plano de treino:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Ativar/desativar plano de treino
router.put("/plans/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    const trainerId = req.user._id;
    const { isActive } = req.body;

    const plan = await WorkoutPlan.findOne({ _id: id, trainer: trainerId });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plano de treino não encontrado'
      });
    }

    plan.isActive = isActive;
    await plan.save();

    res.json({
      success: true,
      message: `Plano de treino ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      data: { plan }
    });

  } catch (error) {
    console.error('Erro ao alterar status do plano:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obter exercícios disponíveis
router.get("/exercises", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Construir filtros
    const filters = { isActive: true };
    
    if (req.query.muscleGroups) {
      filters.muscleGroups = { $in: req.query.muscleGroups.split(',') };
    }
    
    if (req.query.equipment) {
      filters.equipment = { $in: req.query.equipment.split(',') };
    }
    
    if (req.query.difficulty) {
      filters.difficulty = req.query.difficulty;
    }
    
    if (req.query.search) {
      filters.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const query = Exercise.find(filters)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const [exercises, total] = await Promise.all([
      query.exec(),
      Exercise.countDocuments(filters)
    ]);

    res.json({
      success: true,
      message: 'Exercícios obtidos com sucesso',
      data: {
        exercises,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalExercises: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Erro ao obter exercícios:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Criar novo exercício
router.post("/exercises", async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados de entrada inválidos',
        errors: errors.array()
      });
    }

    const trainerId = req.user._id;
    const exerciseData = {
      ...req.body,
      createdBy: trainerId
    };

    const exercise = new Exercise(exerciseData);
    await exercise.save();

    res.status(201).json({
      success: true,
      message: 'Exercício criado com sucesso',
      data: { exercise }
    });

  } catch (error) {
    console.error('Erro ao criar exercício:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obter estatísticas dos planos de treino
router.get("/stats", async (req, res) => {
  try {
    const trainerId = req.user._id;

    const [
      totalPlans,
      activePlans,
      completedPlans,
      totalClients,
      avgCompletionRate
    ] = await Promise.all([
      WorkoutPlan.countDocuments({ trainer: trainerId }),
      WorkoutPlan.countDocuments({ trainer: trainerId, isActive: true }),
      WorkoutPlan.countDocuments({ trainer: trainerId, 'progress.completionRate': 100 }),
      WorkoutPlan.distinct('client', { trainer: trainerId }),
      WorkoutPlan.aggregate([
        { $match: { trainer: trainerId } },
        { $group: { _id: null, avgRate: { $avg: '$progress.completionRate' } } }
      ])
    ]);

    res.json({
      success: true,
      message: 'Estatísticas obtidas com sucesso',
      data: {
        totalPlans,
        activePlans,
        completedPlans,
        totalClients: totalClients.length,
        avgCompletionRate: avgCompletionRate[0]?.avgRate || 0
      }
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
