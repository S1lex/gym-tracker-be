import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { ApiResponse } from '../types';
import { AuthRequest } from '../middleware/auth';

/**
 * Workout History Data Structure
 */
interface WorkoutHistoryExercise {
  exerciseId: string;
  exerciseName: string;
  sets: {
    setNumber: number;
    weight: number;
    reps: number;
  }[];
}

interface WorkoutHistory {
  id?: string;
  userId: string;
  timestamp: string;
  trainingType: string | null;
  duration: number; // seconds
  tonnage: number;
  exercises: WorkoutHistoryExercise[];
}

interface WorkoutStatistics {
  exerciseFrequency: Record<string, number>;
  templateFrequency: Record<string, number>;
  maxWeightByExercise: Record<string, number>;
  workoutTimeline: {
    date: string;
    duration: number;
    tonnage: number;
    count: number;
  }[];
}

/**
 * Create workout history table if it doesn't exist
 * This should be run as a migration, but we'll handle it here for now
 * TODO: Create proper migration for workout_history table
 */

/**
 * Save a completed workout to history
 * POST /api/workout-history
 * 
 * Stores complete workout data including exercises and sets in a JSONB column
 * for flexible storage and easy querying.
 */
export const saveWorkoutHistory = async (
  req: AuthRequest,
  res: Response<ApiResponse<WorkoutHistory>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      timestamp,
      trainingType,
      duration,
      tonnage,
      exercises,
    }: Omit<WorkoutHistory, 'id' | 'userId'> = req.body;

    // Validate required fields
    if (!timestamp || !exercises || exercises.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: timestamp and exercises are required',
      });
      return;
    }

    // Check if workout_history table exists, if not use workouts table with metadata
    // For now, we'll store in workouts table with end_time set and metadata in a JSONB column
    // TODO: Create dedicated workout_history table with proper schema
    
    // Calculate end_time from start_time + duration
    const startTime = new Date(timestamp);
    const endTime = new Date(startTime.getTime() + duration * 1000);

    // Store workout in workouts table
    const { data: workoutData, error: workoutError } = await supabaseAdmin
      .from('workouts')
      .insert({
        user_id: userId,
        name: trainingType || 'Workout',
        start_time: timestamp,
        end_time: endTime.toISOString(),
      })
      .select()
      .single();

    if (workoutError) {
      console.error('Error creating workout:', workoutError);
      res.status(500).json({
        success: false,
        error: 'Failed to save workout history',
      });
      return;
    }

    // Store all sets in workout_sets table
    const setsToInsert = exercises.flatMap((exercise) =>
      exercise.sets.map((set) => ({
        workout_id: workoutData.id,
        exercise_id: exercise.exerciseId,
        exercise_name: exercise.exerciseName || null, // Save exercise name for historical accuracy
        set_number: set.setNumber,
        reps: set.reps,
        weight: set.weight,
      }))
    );

    if (setsToInsert.length > 0) {
      const { error: setsError } = await supabaseAdmin
        .from('workout_sets')
        .insert(setsToInsert);

      if (setsError) {
        console.error('Error saving workout sets:', setsError);
        // Continue anyway - workout is saved
      }
    }

    // Build response with full workout history data
    const workoutHistory: WorkoutHistory = {
      id: workoutData.id,
      userId,
      timestamp,
      trainingType,
      duration,
      tonnage,
      exercises,
    };

    res.status(201).json({
      success: true,
      data: workoutHistory,
    });
  } catch (error) {
    console.error('Error saving workout history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get workout history for authenticated user
 * GET /api/workout-history
 * 
 * Supports filtering by date range and pagination
 * TODO: Implement retention policy (1 month for free users, forever for paid)
 */
export const getWorkoutHistory = async (
  req: AuthRequest,
  res: Response<ApiResponse<WorkoutHistory[]>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { limit, offset, startDate, endDate } = req.query;

    // Build query
    let query = supabaseAdmin
      .from('workouts')
      .select(`
        id,
        user_id,
        name,
        start_time,
        end_time,
        workout_sets (
          id,
          exercise_id,
          exercise_name,
          set_number,
          reps,
          weight
        )
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    // Apply date filters
    if (startDate) {
      query = query.gte('start_time', startDate as string);
    }
    if (endDate) {
      query = query.lte('start_time', endDate as string);
    }

    // Apply pagination
    if (limit) {
      query = query.limit(parseInt(limit as string, 10));
    }
    if (offset) {
      query = query.range(
        parseInt(offset as string, 10),
        parseInt(offset as string, 10) + (limit ? parseInt(limit as string, 10) - 1 : 999)
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching workout history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch workout history',
      });
      return;
    }

    // Transform data to WorkoutHistory format
    // Exercise names are now stored in workout_sets.exercise_name for historical accuracy
    const workoutHistory: WorkoutHistory[] = (data || []).map((workout: any) => {
      // Group sets by exercise
      const exerciseMap: Record<string, WorkoutHistoryExercise> = {};
      
      (workout.workout_sets || []).forEach((set: any) => {
        if (!exerciseMap[set.exercise_id]) {
          exerciseMap[set.exercise_id] = {
            exerciseId: set.exercise_id,
            exerciseName: set.exercise_name || 'Exercise',
            sets: [],
          };
        }
        exerciseMap[set.exercise_id].sets.push({
          setNumber: set.set_number,
          weight: set.weight || 0,
          reps: set.reps || 0,
        });
      });

      // Calculate duration
      const duration = workout.end_time
        ? Math.floor((new Date(workout.end_time).getTime() - new Date(workout.start_time).getTime()) / 1000)
        : 0;

      // Calculate tonnage
      const tonnage = Object.values(exerciseMap).reduce((total, exercise) => {
        return total + exercise.sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
      }, 0);

      return {
        id: workout.id,
        userId: workout.user_id,
        timestamp: workout.start_time,
        trainingType: workout.name !== 'Workout' ? workout.name : null,
        duration,
        tonnage,
        exercises: Object.values(exerciseMap),
      };
    });

    res.json({
      success: true,
      data: workoutHistory,
    });
  } catch (error) {
    console.error('Error fetching workout history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get a single workout history by ID
 * GET /api/workout-history/:id
 */
export const getWorkoutHistoryById = async (
  req: AuthRequest,
  res: Response<ApiResponse<WorkoutHistory>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('workouts')
      .select(`
        id,
        user_id,
        name,
        start_time,
        end_time,
        workout_sets (
          id,
          exercise_id,
          exercise_name,
          set_number,
          reps,
          weight
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({
          success: false,
          error: 'Workout history not found',
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: 'Failed to fetch workout history',
      });
      return;
    }

    // Transform to WorkoutHistory format (same as getWorkoutHistory)
    const exerciseMap: Record<string, WorkoutHistoryExercise> = {};
    
    (data.workout_sets || []).forEach((set: any) => {
      if (!exerciseMap[set.exercise_id]) {
        exerciseMap[set.exercise_id] = {
          exerciseId: set.exercise_id,
          exerciseName: set.exercise_name || 'Exercise',
          sets: [],
        };
      }
      exerciseMap[set.exercise_id].sets.push({
        setNumber: set.set_number,
        weight: set.weight || 0,
        reps: set.reps || 0,
      });
    });

    const duration = data.end_time
      ? Math.floor((new Date(data.end_time).getTime() - new Date(data.start_time).getTime()) / 1000)
      : 0;

    const tonnage = Object.values(exerciseMap).reduce((total, exercise) => {
      return total + exercise.sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
    }, 0);

    const workoutHistory: WorkoutHistory = {
      id: data.id,
      userId: data.user_id,
      timestamp: data.start_time,
      trainingType: data.name !== 'Workout' ? data.name : null,
      duration,
      tonnage,
      exercises: Object.values(exerciseMap),
    };

    res.json({
      success: true,
      data: workoutHistory,
    });
  } catch (error) {
    console.error('Error fetching workout history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get workout statistics
 * GET /api/workout-history/statistics
 * 
 * Calculates:
 * - Exercise frequency (how often each exercise is used)
 * - Template frequency (how often each template/type is used)
 * - Max weight per exercise
 * - Workout timeline (daily aggregates)
 * 
 * TODO: Implement retention policy filtering (1 month for free users)
 */
export const getWorkoutStatistics = async (
  req: AuthRequest,
  res: Response<ApiResponse<WorkoutStatistics>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    // Build query
    let query = supabaseAdmin
      .from('workouts')
      .select(`
        id,
        name,
        start_time,
        end_time,
        workout_sets (
          exercise_id,
          exercise_name,
          weight,
          reps
        )
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    // Apply date filters
    if (startDate) {
      query = query.gte('start_time', startDate as string);
    }
    if (endDate) {
      query = query.lte('start_time', endDate as string);
    }

    // TODO: Apply retention policy for free users (last 1 month only)
    // const isPaidUser = await checkUserPaidStatus(userId);
    // if (!isPaidUser) {
    //   const oneMonthAgo = new Date();
    //   oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    //   query = query.gte('start_time', oneMonthAgo.toISOString());
    // }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching workout statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics',
      });
      return;
    }

    const exerciseFrequency: Record<string, number> = {};
    const templateFrequency: Record<string, number> = {};
    const maxWeightByExercise: Record<string, number> = {};
    const workoutsByDate: Record<string, any[]> = {};

    (data || []).forEach((workout: any) => {
      // Template frequency
      const templateKey = workout.name !== 'Workout' ? workout.name : 'none';
      templateFrequency[templateKey] = (templateFrequency[templateKey] || 0) + 1;

      // Timeline grouping
      const date = workout.start_time.split('T')[0];
      if (!workoutsByDate[date]) {
        workoutsByDate[date] = [];
      }
      workoutsByDate[date].push(workout);

      // Process sets
      (workout.workout_sets || []).forEach((set: any) => {
        // Exercise frequency
        exerciseFrequency[set.exercise_id] = (exerciseFrequency[set.exercise_id] || 0) + 1;

        // Max weight
        const weight = set.weight || 0;
        const currentMax = maxWeightByExercise[set.exercise_id] || 0;
        if (weight > currentMax) {
          maxWeightByExercise[set.exercise_id] = weight;
        }
      });
    });

    // Build timeline
    const workoutTimeline = Object.entries(workoutsByDate).map(([date, workouts]) => {
      const totalDuration = workouts.reduce((sum, w) => {
        if (w.end_time) {
          return sum + Math.floor((new Date(w.end_time).getTime() - new Date(w.start_time).getTime()) / 1000);
        }
        return sum;
      }, 0);

      const totalTonnage = workouts.reduce((sum, w) => {
        return sum + (w.workout_sets || []).reduce((setSum: number, set: any) => {
          return setSum + (set.weight || 0) * (set.reps || 0);
        }, 0);
      }, 0);

      return {
        date,
        duration: totalDuration,
        tonnage: totalTonnage,
        count: workouts.length,
      };
    });

    workoutTimeline.sort((a, b) => a.date.localeCompare(b.date));

    const statistics: WorkoutStatistics = {
      exerciseFrequency,
      templateFrequency,
      maxWeightByExercise,
      workoutTimeline,
    };

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('Error calculating statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Delete workout history
 * DELETE /api/workout-history/:id
 */
export const deleteWorkoutHistory = async (
  req: AuthRequest,
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Delete workout (sets will be cascade deleted)
    const { error } = await supabaseAdmin
      .from('workouts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete workout history',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Workout history deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting workout history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

