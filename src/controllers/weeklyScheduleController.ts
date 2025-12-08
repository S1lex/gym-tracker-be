import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import {
  ApiResponse,
  WeeklySchedule,
  WeeklyScheduleWithTemplate,
  UpdateWeeklyScheduleRequest,
} from '../types';
import { AuthRequest } from '../middleware/auth';

/**
 * Get weekly schedule for the authenticated user
 * GET /api/weekly-schedule
 */
export const getWeeklySchedule = async (
  req: AuthRequest,
  res: Response<ApiResponse<WeeklyScheduleWithTemplate[]>>
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const { data, error } = await supabaseAdmin
      .from('weekly_schedule')
      .select(`
        *,
        template:template_id (
          id,
          name,
          description,
          training_type
        )
      `)
      .eq('user_id', userId)
      .order('day_of_week', { ascending: true });

    if (error) {
      console.error('Error fetching weekly schedule:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch weekly schedule',
      });
      return;
    }

    res.json({
      success: true,
      data: (data || []) as WeeklyScheduleWithTemplate[],
    });
  } catch (error) {
    console.error('Error in getWeeklySchedule:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Update weekly schedule for the authenticated user
 * PUT /api/weekly-schedule
 * Body: { schedule: [{ day_of_week: string, template_id: string | null }] }
 */
export const updateWeeklySchedule = async (
  req: AuthRequest,
  res: Response<ApiResponse<WeeklySchedule[]>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { schedule } = req.body as UpdateWeeklyScheduleRequest;

    if (!schedule || !Array.isArray(schedule)) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body. Expected schedule array.',
      });
      return;
    }

    // Validate day_of_week values
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const invalidDays = schedule.filter(s => !validDays.includes(s.day_of_week));
    if (invalidDays.length > 0) {
      res.status(400).json({
        success: false,
        error: `Invalid day_of_week values: ${invalidDays.map(d => d.day_of_week).join(', ')}`,
      });
      return;
    }

    // Use a transaction-like approach: delete existing and insert new
    // First, delete all existing schedule entries for this user
    const { error: deleteError } = await supabaseAdmin
      .from('weekly_schedule')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting existing schedule:', deleteError);
      res.status(500).json({
        success: false,
        error: 'Failed to update weekly schedule',
      });
      return;
    }

    // Insert new schedule entries (only if template_id is provided)
    const entriesToInsert = schedule
      .filter(s => s.template_id !== null && s.template_id !== undefined)
      .map(s => ({
        user_id: userId,
        day_of_week: s.day_of_week,
        template_id: s.template_id,
      }));

    if (entriesToInsert.length > 0) {
      const { data, error: insertError } = await supabaseAdmin
        .from('weekly_schedule')
        .insert(entriesToInsert)
        .select();

      if (insertError) {
        console.error('Error inserting new schedule:', insertError);
        res.status(500).json({
          success: false,
          error: 'Failed to update weekly schedule',
        });
        return;
      }

      res.json({
        success: true,
        data: data || [],
      });
    } else {
      // No entries to insert, return empty array
      res.json({
        success: true,
        data: [],
      });
    }
  } catch (error) {
    console.error('Error in updateWeeklySchedule:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

