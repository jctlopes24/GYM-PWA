import express from "express";
import userController from "../controllers/userController.js";
import {
  validateProfileUpdate,
  validateTrainerData,
  validateTrainerChangeRequest,
  validateTrainerApproval,
  validateObjectId,
  validatePagination,
  validateUserFilters
} from "../middleware/validation.js";
import {
  authenticateToken,
  requireAdmin,
  requireTrainer,
  requireClient,
  requireApprovedTrainer,
  canAccessClientData,
  canAccessTrainerData
} from "../middleware/auth.js";

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rotas do perfil atual
router.get("/profile", userController);
router.put("/profile", validateProfileUpdate, userController);

// Rotas específicas para personal trainers
router.put("/profile/trainer", validateTrainerData, userController);

// Rotas para obter utilizadores
router.get("/", validatePagination, validateUserFilters, userController);
router.get("/trainers", validatePagination, userController);
router.get("/:id", validateObjectId, userController);

// Rotas para personal trainers
router.get("/trainer/clients", requireTrainer, validatePagination, userController);
router.post("/trainer/assign-client", requireTrainer, userController);

// Rotas para clientes
router.post("/client/request-trainer-change", requireClient, validateTrainerChangeRequest, userController);

// Rotas administrativas
router.put("/trainer/:id/approve", requireAdmin, validateObjectId, validateTrainerApproval, userController);
router.get("/admin/trainer-change-requests", requireAdmin, validatePagination, userController);
router.put("/admin/trainer-change/:clientId", requireAdmin, validateObjectId, userController);
router.put("/admin/user/:id/toggle-status", requireAdmin, validateObjectId, userController);

export default router;
