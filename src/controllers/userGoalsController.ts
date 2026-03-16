import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import {
  ApiResponse,
  UserGoal,
  CreateGoalRequest,
  UpdateGoalRequest,
} from '../types';
import { AuthRequest } from '../middleware/auth';

/**
 * Get all active goals for the authenticated user
 * GET /api/user-goals
 */
export const getUserGoals = async (
  req: AuthRequest,
  res: Response<ApiResponse<UserGoal[]>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { active_only } = req.query;

    let query = supabaseAdmin
      .from('user_goals')
      .select('*')
      .eq('user_id', userId);

    if (active_only === 'true') {
      query = query.eq('is_active', true);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user goals:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user goals',
      });
      return;
    }

    res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Error in getUserGoals:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get a single goal by ID
 * GET /api/user-goals/:id
 */
export const getGoalById = async (
  req: AuthRequest,
  res: Response<ApiResponse<UserGoal>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('user_goals')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({
          success: false,
          error: 'Goal not found',
        });
        return;
      }
      console.error('Error fetching goal:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch goal',
      });
      return;
    }

    res.json({
      success: true,
      data: data as UserGoal,
    });
  } catch (error) {
    console.error('Error in getGoalById:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Create a new goal
 * POST /api/user-goals
 */
export const createGoal = async (
  req: AuthRequest,
  res: Response<ApiResponse<UserGoal>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const goalData = req.body as CreateGoalRequest;

    // Validation
    if (!goalData.goal_type || !goalData.goal_title || goalData.target_value === undefined || !goalData.unit) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: goal_type, goal_title, target_value, unit',
      });
      return;
    }

    // Validate goal_type
    const validGoalTypes = ['body_weight', 'exercise_weight', 'exercise_reps', 'body_measurement', 'custom', 'training_count_per_week'];
    if (!validGoalTypes.includes(goalData.goal_type)) {
      res.status(400).json({
        success: false,
        error: `Invalid goal_type. Must be one of: ${validGoalTypes.join(', ')}`,
      });
      return;
    }

    // Validate unit
    const validUnits = ['kg', 'lbs', 'cm', 'in', '%', 'reps', 'sets', 'workouts'];
    if (!validUnits.includes(goalData.unit)) {
      res.status(400).json({
        success: false,
        error: `Invalid unit. Must be one of: ${validUnits.join(', ')}`,
      });
      return;
    }

    // Validate target_value
    if (typeof goalData.target_value !== 'number' || goalData.target_value <= 0) {
      res.status(400).json({
        success: false,
        error: 'target_value must be a positive number',
      });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('user_goals')
      .insert({
        user_id: userId,
        goal_type: goalData.goal_type,
        goal_title: goalData.goal_title,
        target_value: goalData.target_value,
        current_value: goalData.current_value || null,
        unit: goalData.unit,
        exercise_id: goalData.exercise_id || null,
        measurement_type: goalData.measurement_type || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating goal:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error hint:', error.hint);
      console.error('Goal data:', JSON.stringify(goalData, null, 2));
      
      // Check for constraint violation errors
      if (error.code === '23514' || error.message?.includes('check constraint')) {
        res.status(400).json({
          success: false,
          error: `Database constraint violation: ${error.message || 'Invalid goal_type or unit value. Please ensure the database has been updated with the latest schema.'}`,
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create goal',
      });
      return;
    }

    res.json({
      success: true,
      data: data as UserGoal,
    });
  } catch (error: any) {
    console.error('Error in createGoal:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * Update a goal
 * PUT /api/user-goals/:id
 */
export const updateGoal = async (
  req: AuthRequest,
  res: Response<ApiResponse<UserGoal>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const updateData = req.body as UpdateGoalRequest;

    const { data, error } = await supabaseAdmin
      .from('user_goals')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({
          success: false,
          error: 'Goal not found',
        });
        return;
      }
      console.error('Error updating goal:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update goal',
      });
      return;
    }

    res.json({
      success: true,
      data: data as UserGoal,
    });
  } catch (error) {
    console.error('Error in updateGoal:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Delete a goal
 * DELETE /api/user-goals/:id
 */
export const deleteGoal = async (
  req: AuthRequest,
  res: Response<ApiResponse<void>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('user_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting goal:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete goal',
      });
      return;
    }

    res.json({
      success: true,
    });
  } catch (error) {
    console.error('Error in deleteGoal:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Update current value for a goal based on latest measurement/workout
 * This endpoint can be called to sync current_value with latest data
 * PUT /api/user-goals/:id/update-current
 */
export const updateGoalCurrentValue = async (
  req: AuthRequest,
  res: Response<ApiResponse<UserGoal>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Get the goal first
    const { data: goal, error: goalError } = await supabaseAdmin
      .from('user_goals')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (goalError || !goal) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[updateGoalCurrentValue] Goal not found:', { id, userId, goalError: goalError?.message });
      }
      res.status(404).json({
        success: false,
        error: 'Goal not found',
      });
      return;
    }

    let currentValue: number | null = null;

    // Fetch current value based on goal type
    if (goal.goal_type === 'body_weight' || goal.goal_type === 'body_measurement') {
      // Get latest body measurement
      const measurementType = goal.goal_type === 'body_weight' ? 'weight' : (goal.measurement_type || 'weight');
      const { data: measurement } = await supabaseAdmin
        .from('body_measurements')
        .select('value')
        .eq('user_id', userId)
        .eq('type', measurementType)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (measurement) {
        currentValue = parseFloat(measurement.value);
      }
    } else if (goal.goal_type === 'training_count_per_week') {
      // Calculate workouts per week from workout history
      // Get workouts from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: recentWorkouts } = await supabaseAdmin
        .from('workouts')
        .select('start_time')
        .eq('user_id', userId)
        .not('end_time', 'is', null) // Only completed workouts
        .gte('start_time', sevenDaysAgo.toISOString());

      if (recentWorkouts && recentWorkouts.length > 0) {
        // Count unique days with workouts
        const workoutDays = new Set<string>();
        recentWorkouts.forEach((workout: any) => {
          const date = new Date(workout.start_time);
          const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          workoutDays.add(dayKey);
        });
        currentValue = workoutDays.size;
      } else {
        currentValue = 0;
      }
    } else if (goal.goal_type === 'exercise_weight' || goal.goal_type === 'exercise_reps') {
      // Get latest workout set for this exercise
      if (goal.exercise_id) {
        // First get user's workout IDs
        const { data: userWorkouts } = await supabaseAdmin
          .from('workouts')
          .select('id')
          .eq('user_id', userId);

        if (userWorkouts && userWorkouts.length > 0) {
          const workoutIds = userWorkouts.map(w => w.id);
          
          // Get latest workout set for this exercise
          const { data: workoutSets } = await supabaseAdmin
            .from('workout_sets')
            .select('weight, reps')
            .eq('exercise_id', goal.exercise_id)
            .in('workout_id', workoutIds)
            .order('id', { ascending: false })
            .limit(1);

          if (workoutSets && workoutSets.length > 0) {
            const workoutSet = workoutSets[0];
            if (goal.goal_type === 'exercise_weight') {
              currentValue = parseFloat(workoutSet.weight) || null;
            } else {
              currentValue = parseFloat(workoutSet.reps) || null;
            }
          }
        }
      }
    }

    // Update the goal with current value
    const { data: updatedGoal, error: updateError } = await supabaseAdmin
      .from('user_goals')
      .update({
        current_value: currentValue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating goal current value:', updateError);
      res.status(500).json({
        success: false,
        error: 'Failed to update goal current value',
      });
      return;
    }

    res.json({
      success: true,
      data: updatedGoal as UserGoal,
    });
  } catch (error) {
    console.error('Error in updateGoalCurrentValue:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

