import express from "express";
import workoutController from "../controllers/workoutController.js";
import {
  validateWorkoutPlan,
  validateWorkoutPlanUpdate,
  validateWorkoutPlanId,
  validateWorkoutPlanFilters,
  validateExercise,
  validateExerciseFilters,
  validateToggleStatus
} from "../middleware/workoutValidation.js";
import {
  authenticateToken,
  requireTrainer,
  requireApprovedTrainer
} from "../middleware/auth.js";

const router = express.Router();

// Todas as rotas requerem autenticação e ser trainer aprovado
router.use(authenticateToken);
router.use(requireApprovedTrainer);

// Rotas de planos de treino
router.post("/plans", validateWorkoutPlan, workoutController);
router.get("/plans", validateWorkoutPlanFilters, workoutController);
router.get("/plans/:id", validateWorkoutPlanId, workoutController);
router.put("/plans/:id", validateWorkoutPlanId, validateWorkoutPlanUpdate, workoutController);
router.put("/plans/:id/toggle", validateWorkoutPlanId, validateToggleStatus, workoutController);

// Rotas de exercícios
router.get("/exercises", validateExerciseFilters, workoutController);
router.post("/exercises", validateExercise, workoutController);

// Rotas de estatísticas
router.get("/stats", workoutController);

export default router;
