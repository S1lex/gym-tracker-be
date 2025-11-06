import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { ApiResponse, WorkoutSet, CreateSetRequest } from '../types';
import { AuthRequest } from '../middleware/auth';

/**
 * Add a new set to a specific workout
 * POST /api/sets
 * Requires workout_id, exercise_id, and set data (reps, weight, etc.)
 * Uses req.user.id from auth middleware to verify workout ownership
 */
export const createSet = async (
  req: AuthRequest,
  res: Response<ApiResponse<WorkoutSet>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { workout_id, exercise_id, set_number, reps, weight, duration_seconds }: CreateSetRequest = req.body;

    if (!workout_id || !exercise_id || !set_number) {
      res.status(400).json({
        success: false,
        error: 'workout_id, exercise_id, and set_number are required',
      });
      return;
    }

    // Verify workout belongs to user using req.user.id
    const { data: workout } = await supabaseAdmin
      .from('workouts')
      .select('id')
      .eq('id', workout_id)
      .eq('user_id', userId)
      .single();

    if (!workout) {
      res.status(404).json({
        success: false,
        error: 'Workout not found',
      });
      return;
    }

    // Create the set
    const { data, error } = await supabaseAdmin
      .from('workout_sets')
      .insert({
        workout_id,
        exercise_id,
        set_number,
        reps,
        weight,
        duration_seconds,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create set',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
