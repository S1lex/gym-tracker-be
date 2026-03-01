import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { ApiResponse } from '../types';
import { AuthRequest } from '../middleware/auth';

/**
 * Submit onboarding data
 * POST /api/user/onboarding
 */
export const submitOnboarding = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ message: string }>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      gender,
      current_weight,
      current_weight_unit,
      target_weight,
      target_weight_unit,
      problem_zones,
      training_preference,
    } = req.body;

    // Validate required fields
    if (!gender || !current_weight || !current_weight_unit || !target_weight || !target_weight_unit || !training_preference) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: gender, current_weight, current_weight_unit, target_weight, target_weight_unit, and training_preference are required',
      });
      return;
    }

    // Validate gender
    if (!['male', 'female', 'other'].includes(gender)) {
      res.status(400).json({
        success: false,
        error: 'Invalid gender. Must be one of: male, female, other',
      });
      return;
    }

    // Validate weight units
    if (!['kg', 'lbs'].includes(current_weight_unit) || !['kg', 'lbs'].includes(target_weight_unit)) {
      res.status(400).json({
        success: false,
        error: 'Invalid weight unit. Must be kg or lbs',
      });
      return;
    }

    // Validate training preference
    if (!['gym', 'home'].includes(training_preference)) {
      res.status(400).json({
        success: false,
        error: 'Invalid training preference. Must be gym or home',
      });
      return;
    }

    // Validate problem_zones is an array if provided
    if (problem_zones && !Array.isArray(problem_zones)) {
      res.status(400).json({
        success: false,
        error: 'problem_zones must be an array',
      });
      return;
    }

    // Update user profile with onboarding data
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        gender,
        current_weight: parseFloat(current_weight),
        current_weight_unit,
        target_weight: parseFloat(target_weight),
        target_weight_unit,
        problem_zones: problem_zones || [],
        training_preference,
        onboarding_completed_at: new Date().toISOString(),
        onboarding_filled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile with onboarding data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save onboarding data',
      });
      return;
    }

    // Insert onboarding current weight into body_measurements so it appears on Log Measurement / history
    const today = new Date().toISOString().split('T')[0];
    const { error: measurementError } = await supabaseAdmin
      .from('body_measurements')
      .insert({
        user_id: userId,
        date: today,
        type: 'weight',
        value: parseFloat(current_weight),
        unit: current_weight_unit,
        notes: null,
      });

    if (measurementError) {
      // Log but don't fail onboarding - profile is already saved
      console.error('Error creating initial weight measurement from onboarding:', measurementError);
    }

    res.json({
      success: true,
      data: {
        message: 'Onboarding data saved successfully',
      },
    });
  } catch (error) {
    console.error('Error in submitOnboarding:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get onboarding data for the authenticated user
 * GET /api/user/onboarding
 */
export const getOnboarding = async (
  req: AuthRequest,
  res: Response<ApiResponse<{
    gender: string | null;
    current_weight: number | null;
    current_weight_unit: string | null;
    target_weight: number | null;
    target_weight_unit: string | null;
    problem_zones: string[] | null;
    training_preference: string | null;
    onboarding_completed_at: string | null;
    onboardingFilled: boolean;
  }>>
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('gender, current_weight, current_weight_unit, target_weight, target_weight_unit, problem_zones, training_preference, onboarding_completed_at, onboarding_filled')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching onboarding data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch onboarding data',
      });
      return;
    }

    // No profile row (e.g. new user) or new user: onboardingFilled = false
    const onboardingFilled = data?.onboarding_filled === true || !!(data?.onboarding_completed_at);

    res.json({
      success: true,
      data: {
        gender: data?.gender || null,
        current_weight: data?.current_weight ?? null,
        current_weight_unit: data?.current_weight_unit || null,
        target_weight: data?.target_weight ?? null,
        target_weight_unit: data?.target_weight_unit || null,
        problem_zones: data?.problem_zones || null,
        training_preference: data?.training_preference || null,
        onboarding_completed_at: data?.onboarding_completed_at || null,
        onboardingFilled,
      },
    });
  } catch (error) {
    console.error('Error in getOnboarding:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
