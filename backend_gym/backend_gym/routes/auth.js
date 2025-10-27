import express from "express";
import authController from "../controllers/authController.js";
import { 
  validateUserRegistration, 
  validateLogin 
} from "../middleware/validation.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Rotas públicas
router.post("/register", validateUserRegistration, authController);
router.post("/login", validateLogin, authController);
router.post("/login/qr", authController);

// Rotas protegidas
router.get("/verify", authenticateToken, authController);
router.post("/logout", authenticateToken, authController);
router.post("/refresh", authenticateToken, authController);
router.post("/qr/generate", authenticateToken, authController);

export default router;
