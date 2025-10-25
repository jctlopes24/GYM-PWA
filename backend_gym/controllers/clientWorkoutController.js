import express from "express";
import WorkoutPlan from "../models/WorkoutPlan.js";
import WorkoutLog from "../models/WorkoutLog.js";
import { validationResult } from "express-validator";

const router = express.Router();

// Obter planos de treino do cliente
router.get("/plans", async (req, res) => {
  try {
    const clientId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Construir filtros
    const filters = { client: clientId };
    
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }
    
    if (req.query.frequency) {
      filters.frequency = req.query.frequency;
    }
    
    if (req.query.level) {
      filters.level = req.query.level;
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
      .populate('trainer', 'firstName lastName username email')
      .populate({
        path: 'sessions',
        populate: {
          path: 'exercises.exercise',
          model: 'Exercise'
        }
      })
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

// Obter plano de treino específico do cliente
router.get("/plans/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user._id;

    const plan = await WorkoutPlan.findOne({ _id: id, client: clientId })
      .populate('trainer', 'firstName lastName username email phone')
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

// Obter treino do dia
router.get("/today", async (req, res) => {
  try {
    const clientId = req.user._id;
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Encontrar plano ativo do cliente
    const activePlan = await WorkoutPlan.findOne({ 
      client: clientId, 
      isActive: true 
    }).populate({
      path: 'sessions',
      match: { dayOfWeek: dayOfWeek },
      populate: {
        path: 'exercises.exercise',
        model: 'Exercise'
      }
    });

    if (!activePlan || !activePlan.sessions.length) {
      return res.json({
        success: true,
        message: 'Nenhum treino agendado para hoje',
        data: { workout: null }
      });
    }

    const todayWorkout = activePlan.sessions[0];

    res.json({
      success: true,
      message: 'Treino do dia obtido com sucesso',
      data: { 
        workout: todayWorkout,
        plan: {
          id: activePlan._id,
          name: activePlan.name,
          week: activePlan.currentWeek,
          totalWeeks: activePlan.totalWeeks
        }
      }
    });

  } catch (error) {
    console.error('Erro ao obter treino do dia:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Registrar conclusão de treino
router.post("/logs", async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados de entrada inválidos',
        errors: errors.array()
      });
    }

    const clientId = req.user._id;
    const {
      workoutPlanId,
      sessionId,
      week,
      dayOfWeek,
      actualDuration,
      exercises,
      overallNotes,
      difficulty,
      energy,
      mood,
      painLevel
    } = req.body;

    // Verificar se o plano pertence ao cliente
    const plan = await WorkoutPlan.findById(workoutPlanId);
    if (!plan || plan.client.toString() !== clientId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Plano de treino não encontrado'
      });
    }

    // Criar log do treino
    const workoutLog = new WorkoutLog({
      client: clientId,
      trainer: plan.trainer,
      workoutPlan: workoutPlanId,
      session: sessionId,
      week,
      dayOfWeek,
      completedAt: new Date(),
      actualDuration,
      exercises,
      overallNotes,
      difficulty,
      energy,
      mood,
      painLevel
    });

    await workoutLog.save();

    // Atualizar estatísticas do plano
    await plan.markSessionCompleted(sessionId, week);

    res.status(201).json({
      success: true,
      message: 'Treino registrado com sucesso',
      data: { workoutLog }
    });

  } catch (error) {
    console.error('Erro ao registrar treino:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obter histórico de treinos
router.get("/logs", async (req, res) => {
  try {
    const clientId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Construir filtros
    const filters = { client: clientId };
    
    if (req.query.week) {
      filters.week = parseInt(req.query.week);
    }
    
    if (req.query.dayOfWeek) {
      filters.dayOfWeek = req.query.dayOfWeek;
    }
    
    if (req.query.startDate && req.query.endDate) {
      filters.completedAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const query = WorkoutLog.find(filters)
      .populate('trainer', 'firstName lastName username')
      .populate('workoutPlan', 'name')
      .populate('session', 'dayOfWeek')
      .populate('exercises.exercise', 'name')
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(limit);

    const [logs, total] = await Promise.all([
      query.exec(),
      WorkoutLog.countDocuments(filters)
    ]);

    res.json({
      success: true,
      message: 'Histórico de treinos obtido com sucesso',
      data: {
        logs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalLogs: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Erro ao obter histórico de treinos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obter estatísticas do cliente
router.get("/stats", async (req, res) => {
  try {
    const clientId = req.user._id;

    const [
      totalPlans,
      activePlans,
      totalWorkouts,
      completedWorkouts,
      avgDuration,
      streak
    ] = await Promise.all([
      WorkoutPlan.countDocuments({ client: clientId }),
      WorkoutPlan.countDocuments({ client: clientId, isActive: true }),
      WorkoutLog.countDocuments({ client: clientId }),
      WorkoutLog.countDocuments({ client: clientId, isCompleted: true }),
      WorkoutLog.aggregate([
        { $match: { client: clientId, actualDuration: { $exists: true } } },
        { $group: { _id: null, avgDuration: { $avg: '$actualDuration' } } }
      ]),
      WorkoutLog.aggregate([
        { $match: { client: clientId, isCompleted: true } },
        { $sort: { completedAt: -1 } },
        { $group: { _id: null, lastWorkout: { $first: '$completedAt' } } }
      ])
    ]);

    res.json({
      success: true,
      message: 'Estatísticas obtidas com sucesso',
      data: {
        totalPlans,
        activePlans,
        totalWorkouts,
        completedWorkouts,
        completionRate: totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0,
        avgDuration: avgDuration[0]?.avgDuration || 0,
        lastWorkout: streak[0]?.lastWorkout || null
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
