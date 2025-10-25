import express from "express";
import clientWorkoutController from "../controllers/clientWorkoutController.js";
import {
  validateWorkoutPlanId,
  validateWorkoutPlanFilters,
  validateWorkoutLog,
  validateWorkoutLogFilters
} from "../middleware/workoutValidation.js";
import {
  authenticateToken,
  requireClient
} from "../middleware/auth.js";

const router = express.Router();

// Todas as rotas requerem autenticação e ser cliente
router.use(authenticateToken);
router.use(requireClient);

// Rotas de planos de treino para clientes
router.get("/plans", validateWorkoutPlanFilters, clientWorkoutController);
router.get("/plans/:id", validateWorkoutPlanId, clientWorkoutController);

// Rotas de treinos
router.get("/today", clientWorkoutController);
router.post("/logs", validateWorkoutLog, clientWorkoutController);
router.get("/logs", validateWorkoutLogFilters, clientWorkoutController);

// Rotas de estatísticas
router.get("/stats", clientWorkoutController);

export default router;
