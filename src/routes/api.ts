import { Router } from 'express';
import * as authController from '../controllers/authController';
import * as workoutController from '../controllers/workoutController';
import * as workoutHistoryController from '../controllers/workoutHistoryController';
import * as setController from '../controllers/setController';
import * as exerciseController from '../controllers/exerciseController';
import * as templateController from '../controllers/templateController';
import * as proProgramController from '../controllers/proProgramController';
import * as stripeController from '../controllers/stripeController';
import { authenticate } from '../middleware/auth';
import i18nRouter from './i18n';

const router = Router();

// Public routes (no authentication required)
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/google', authController.initiateGoogleOAuth);
router.get('/auth/google/callback', authController.handleGoogleOAuthCallback);
router.get('/exercises', exerciseController.getExercises);

// i18n translation routes (public - no auth required)
router.use('/i18n', i18nRouter);

// Protected routes (require authentication)
router.get('/workouts', authenticate, workoutController.getWorkouts);
router.get('/workouts/:id', authenticate, workoutController.getWorkoutById);
router.post('/workouts', authenticate, workoutController.createWorkout);
router.put('/workouts/:id', authenticate, workoutController.updateWorkout);
router.delete('/workouts/:id', authenticate, workoutController.deleteWorkout);
router.post('/sets', authenticate, setController.createSet);

// Workout History routes
router.post('/workout-history', authenticate, workoutHistoryController.saveWorkoutHistory);
router.get('/workout-history', authenticate, workoutHistoryController.getWorkoutHistory);
router.get('/workout-history/statistics', authenticate, workoutHistoryController.getWorkoutStatistics);
router.get('/workout-history/:id', authenticate, workoutHistoryController.getWorkoutHistoryById);
router.delete('/workout-history/:id', authenticate, workoutHistoryController.deleteWorkoutHistory);

// Template routes
router.get('/templates', authenticate, templateController.getTemplates);
router.get('/templates/:id', authenticate, templateController.getTemplateById);
router.post('/templates', authenticate, templateController.createTemplate);
router.put('/templates/:id', authenticate, templateController.updateTemplate);
router.delete('/templates/:id', authenticate, templateController.deleteTemplate);

// Pro Programs routes (public - no auth required for viewing)
router.get('/pro-programs', proProgramController.getProPrograms);
router.get('/pro-programs/:id', proProgramController.getProProgramById);
// Admin routes (require authentication)
router.post('/pro-programs', authenticate, proProgramController.createProProgram);

// Stripe routes (require authentication)
router.post('/stripe/create-portal-session', authenticate, stripeController.createPortalSession);
router.get('/stripe/config', authenticate, stripeController.getStripeConfig);
router.get('/stripe/subscription-status', authenticate, stripeController.getSubscriptionStatus);
router.get('/stripe/products', authenticate, stripeController.getProducts);
router.post('/stripe/create-checkout-session', authenticate, stripeController.createCheckoutSession);

export default router;
