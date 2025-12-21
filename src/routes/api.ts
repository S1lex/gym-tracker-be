import { Router } from 'express';
import * as authController from '../controllers/authController';
import * as workoutController from '../controllers/workoutController';
import * as workoutHistoryController from '../controllers/workoutHistoryController';
import * as setController from '../controllers/setController';
import * as exerciseController from '../controllers/exerciseController';
import * as templateController from '../controllers/templateController';
import * as proProgramController from '../controllers/proProgramController';
import * as stripeController from '../controllers/stripeController';
import * as bodyMeasurementController from '../controllers/bodyMeasurementController';
import * as weeklyScheduleController from '../controllers/weeklyScheduleController';
import * as userGoalsController from '../controllers/userGoalsController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
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

// Pro Programs routes (public - but include progress if authenticated)
router.get('/pro-programs', optionalAuthenticate, proProgramController.getProPrograms);
router.get('/pro-programs/:id', optionalAuthenticate, proProgramController.getProProgramById);
// Pro Program progress routes (require authentication)
router.get('/pro-programs/progress', authenticate, proProgramController.getUserProProgramProgress);
router.post('/pro-programs/:programId/days/:dayId/complete', authenticate, proProgramController.markProProgramDayComplete);
// Admin routes (require authentication)
router.post('/pro-programs', authenticate, proProgramController.createProProgram);

// Stripe routes (require authentication)
router.post('/stripe/create-portal-session', authenticate, stripeController.createPortalSession);
router.get('/stripe/config', authenticate, stripeController.getStripeConfig);
router.get('/stripe/subscription-status', authenticate, stripeController.getSubscriptionStatus);
router.get('/stripe/products', authenticate, stripeController.getProducts);
router.post('/stripe/create-checkout-session', authenticate, stripeController.createCheckoutSession);
router.get('/stripe/verify-checkout-session', authenticate, stripeController.verifyCheckoutSession);

// Body Measurements routes (require authentication)
router.get('/body-measurements', authenticate, bodyMeasurementController.getMeasurements);
router.get('/body-measurements/analytics', authenticate, bodyMeasurementController.getMeasurementAnalytics);
router.get('/body-measurements/:id', authenticate, bodyMeasurementController.getMeasurementById);
router.post('/body-measurements', authenticate, bodyMeasurementController.createMeasurement);
router.post('/body-measurements/batch', authenticate, bodyMeasurementController.createMeasurementsBatch);
router.put('/body-measurements/:id', authenticate, bodyMeasurementController.updateMeasurement);
router.delete('/body-measurements/:id', authenticate, bodyMeasurementController.deleteMeasurement);

// Weekly Schedule routes (require authentication)
router.get('/weekly-schedule', authenticate, weeklyScheduleController.getWeeklySchedule);
router.put('/weekly-schedule', authenticate, weeklyScheduleController.updateWeeklySchedule);

// User Goals routes (require authentication)
router.get('/user-goals', authenticate, userGoalsController.getUserGoals);
router.get('/user-goals/:id', authenticate, userGoalsController.getGoalById);
router.post('/user-goals', authenticate, userGoalsController.createGoal);
router.put('/user-goals/:id', authenticate, userGoalsController.updateGoal);
router.put('/user-goals/:id/update-current', authenticate, userGoalsController.updateGoalCurrentValue);
router.delete('/user-goals/:id', authenticate, userGoalsController.deleteGoal);

export default router;
