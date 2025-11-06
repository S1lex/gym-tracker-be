import { Router } from 'express';
import * as authController from '../controllers/authController';
import * as workoutController from '../controllers/workoutController';
import * as setController from '../controllers/setController';
import * as exerciseController from '../controllers/exerciseController';
import * as templateController from '../controllers/templateController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes (no authentication required)
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/google', authController.initiateGoogleOAuth);
router.get('/auth/google/callback', authController.handleGoogleOAuthCallback);
router.get('/exercises', exerciseController.getExercises);

// Protected routes (require authentication)
router.get('/workouts', authenticate, workoutController.getWorkouts);
router.get('/workouts/:id', authenticate, workoutController.getWorkoutById);
router.post('/workouts', authenticate, workoutController.createWorkout);
router.put('/workouts/:id', authenticate, workoutController.updateWorkout);
router.delete('/workouts/:id', authenticate, workoutController.deleteWorkout);
router.post('/sets', authenticate, setController.createSet);

// Template routes
router.get('/templates', authenticate, templateController.getTemplates);
router.get('/templates/:id', authenticate, templateController.getTemplateById);
router.post('/templates', authenticate, templateController.createTemplate);
router.put('/templates/:id', authenticate, templateController.updateTemplate);
router.delete('/templates/:id', authenticate, templateController.deleteTemplate);

export default router;
