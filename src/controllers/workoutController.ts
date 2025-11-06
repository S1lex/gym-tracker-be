import { Response } from 'express';
import { supabaseClient, supabaseAdmin } from '../utils/supabaseClient';
import { ApiResponse, Workout, WorkoutWithSets, CreateWorkoutRequest, UpdateWorkoutRequest } from '../types';
import { AuthRequest } from '../middleware/auth';

/**
 * Get all workouts for the authenticated user
 * GET /api/workouts
 * Uses req.user.id from auth middleware to enforce user-specific data access
 */
export const getWorkouts = async (
  req: AuthRequest,
  res: Response<ApiResponse<Workout[]>>
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const { data, error } = await supabaseAdmin
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch workouts',
      });
      return;
    }

    res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get a single workout by ID, including all associated workout_sets
 * GET /api/workouts/:id
 */
export const getWorkoutById = async (
  req: AuthRequest,
  res: Response<ApiResponse<WorkoutWithSets>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Get workout with all sets
    const { data, error } = await supabaseAdmin
      .from('workouts')
      .select(`
        *,
        workout_sets (
          id,
          exercise_id,
          set_number,
          reps,
          weight,
          duration_seconds
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({
          success: false,
          error: 'Workout not found',
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: 'Failed to fetch workout',
      });
      return;
    }

    res.json({
      success: true,
      data: data as WorkoutWithSets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Create a new workout session for the authenticated user
 * POST /api/workouts
 * Uses req.user.id from auth middleware
 */
export const createWorkout = async (
  req: AuthRequest,
  res: Response<ApiResponse<Workout>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, start_time }: CreateWorkoutRequest = req.body;

    const { data, error } = await supabaseAdmin
      .from('workouts')
      .insert({
        user_id: userId,
        name: name || 'New Workout',
        start_time: start_time || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create workout',
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

/**
 * Update a workout (e.g., to set the end_time)
 * PUT /api/workouts/:id
 */
export const updateWorkout = async (
  req: AuthRequest,
  res: Response<ApiResponse<Workout>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const updates: UpdateWorkoutRequest = req.body;

    const { data, error } = await supabaseAdmin
      .from('workouts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({
          success: false,
          error: 'Workout not found',
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: 'Failed to update workout',
      });
      return;
    }

    res.json({
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

/**
 * Delete a workout and all of its associated sets
 * DELETE /api/workouts/:id
 */
export const deleteWorkout = async (
  req: AuthRequest,
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Delete workout (sets will be cascade deleted if foreign key constraint is set up)
    const { error } = await supabaseAdmin
      .from('workouts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete workout',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Workout deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
