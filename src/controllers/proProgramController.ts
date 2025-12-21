import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { ApiResponse } from '../types';
import { AuthRequest } from '../middleware/auth';

// Types for Pro Programs
export interface ProProgramDayExercise {
  id: string;
  pro_program_day_id: string;
  exercise_id: string;
  exercise_order: number;
  sets: number;
  reps?: string;
  weight?: number;
  rest_seconds?: number;
  exercise?: {
    id: string;
    name: string;
    category?: string;
    primaryMuscles?: string[];
    equipment?: string;
    instructions?: string;
    images?: string[];
    video_url?: string;
  };
}

export interface ProProgramDay {
  id: string;
  pro_program_id: string;
  day_number: number;
  name: string;
  template_id: string | null;
  created_at: string;
  template?: {
    id: string;
    name: string;
    description?: string;
    training_type?: string | null;
  };
}

export interface ProProgram {
  id: string;
  title: string;
  description?: string;
  level: string;
  days_per_week: number;
  images?: string[];
  free_plan?: boolean;
  created_at: string;
  updated_at: string;
  days?: ProProgramDay[];
}

export interface CreateProProgramRequest {
  title: string;
  description?: string;
  level: string;
  days_per_week: number;
  images?: string[];
  free_plan?: boolean;
  days: {
    day_number: number;
    name: string;
    template_id: string; // Reference to existing template
  }[];
}

/**
 * Get all pro programs
 * GET /api/pro-programs
 * Public endpoint - no authentication required
 * If user is authenticated, includes progress data
 */
export const getProPrograms = async (
  req: AuthRequest,
  res: Response<ApiResponse<ProProgram[] | (ProProgram & { progress?: { completedDays: number; totalDays: number } })[]>>
): Promise<void> => {
  try {
    // First, get all pro programs
    const { data: programsData, error: programsError } = await supabaseAdmin
      .from('pro_programs')
      .select('*')
      .order('created_at', { ascending: false });

    if (programsError) {
      console.error('Error fetching pro programs:', programsError);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch pro programs',
      });
      return;
    }

    if (!programsData || programsData.length === 0) {
      res.json({
        success: true,
        data: [],
      });
      return;
    }

    // Get all days for all programs
    const programIds = programsData.map((p: any) => p.id);
    const { data: daysData, error: daysError } = await supabaseAdmin
      .from('pro_program_days')
      .select('*')
      .in('pro_program_id', programIds)
      .order('day_number', { ascending: true });

    if (daysError) {
      console.error('Error fetching pro program days:', daysError);
      // Continue without days rather than failing completely
    }

    // Get all template IDs from days
    const templateIds = (daysData || [])
      .map((day: any) => day.template_id)
      .filter((id: any): id is string => id !== null && id !== undefined);
    
    // Fetch templates if we have any template IDs
    let templatesMap: { [key: string]: any } = {};
    if (templateIds.length > 0) {
      const { data: templatesData, error: templatesError } = await supabaseAdmin
        .from('workout_templates')
        .select('id, name, description, training_type')
        .in('id', templateIds);

      if (templatesError) {
        console.error('Error fetching templates:', templatesError);
      } else if (templatesData) {
        templatesMap = templatesData.reduce((acc: any, template: any) => {
          acc[template.id] = template;
          return acc;
        }, {});
      }
    }

    // Transform the data to match expected structure
    const transformedPrograms = programsData.map((program: any) => {
      const programDays = (daysData || []).filter((day: any) => day.pro_program_id === program.id);
      
      const transformedDays = programDays.map((day: any) => {
        const template = day.template_id ? templatesMap[day.template_id] || null : null;
        
        return {
          id: day.id,
          pro_program_id: day.pro_program_id,
          day_number: day.day_number,
          name: day.name,
          template_id: day.template_id,
          created_at: day.created_at,
          template: template,
        };
      });

      return {
        id: program.id,
        title: program.title,
        description: program.description,
        level: program.level,
        days_per_week: program.days_per_week,
        images: program.images,
        free_plan: program.free_plan || false,
        created_at: program.created_at,
        updated_at: program.updated_at,
        days: transformedDays,
      };
    });

    // If user is authenticated, include progress data
    if (req.user?.id) {
      try {
        const userId = req.user.id;
        console.log('getProPrograms: Fetching progress for authenticated user', { userId });
        const { data: progressData, error: progressError } = await supabaseAdmin
          .from('user_pro_program_progress')
          .select('pro_program_id, pro_program_day_id')
          .eq('user_id', userId);

        if (progressError) {
          console.error('Error fetching user progress:', progressError);
          // Continue without progress data if fetch fails
        } else {
          console.log('getProPrograms: Progress data fetched', { 
            progressCount: progressData?.length || 0,
            progressData: progressData 
          });
          
          // Group completed days by program
          const progressByProgram: { [key: string]: string[] } = {};
          (progressData || []).forEach((progress: any) => {
            if (!progressByProgram[progress.pro_program_id]) {
              progressByProgram[progress.pro_program_id] = [];
            }
            progressByProgram[progress.pro_program_id].push(progress.pro_program_day_id);
          });

          // Add progress to each program (even if no progress, show 0)
          const programsWithProgress = transformedPrograms.map((program: any) => {
            const completedDayIds = progressByProgram[program.id] || [];
            const progressInfo = {
              completedDays: completedDayIds.length,
              totalDays: program.days?.length || program.days_per_week,
            };
            console.log('getProPrograms: Program progress', {
              programId: program.id,
              programTitle: program.title,
              progress: progressInfo
            });
            return {
              ...program,
              progress: progressInfo,
            };
          });

          res.json({
            success: true,
            data: programsWithProgress,
          });
          return;
        }
      } catch (progressError) {
        console.error('Error fetching user progress:', progressError);
        // Continue without progress data if fetch fails
      }
    } else {
      console.log('getProPrograms: User not authenticated, returning programs without progress');
    }

    res.json({
      success: true,
      data: transformedPrograms,
    });
  } catch (error) {
    console.error('Error in getProPrograms:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get a single pro program by ID with all days and exercises
 * GET /api/pro-programs/:id
 * Public endpoint - no authentication required
 */
export const getProProgramById = async (
  req: AuthRequest,
  res: Response<ApiResponse<ProProgram>>
): Promise<void> => {
  try {
    const { id } = req.params;

    // Get pro program with days and exercises
    const { data: programData, error: programError } = await supabaseAdmin
      .from('pro_programs')
      .select('*')
      .eq('id', id)
      .single();

    if (programError || !programData) {
      if (programError?.code === 'PGRST116') {
        res.status(404).json({
          success: false,
          error: 'Pro program not found',
        });
        return;
      }
      console.error('Error fetching pro program:', programError);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch pro program',
      });
      return;
    }

    // Get all days for this program with their templates
    const { data: daysData, error: daysError } = await supabaseAdmin
      .from('pro_program_days')
      .select(
        `
        *,
        workout_templates (
          id,
          name,
          description,
          training_type
        )
      `
      )
      .eq('pro_program_id', id)
      .order('day_number', { ascending: true });
    
    // Transform the data to match expected structure
    // Supabase returns joined data as an array, we need to extract the first item
    const transformedDays = (daysData || []).map((day: any) => {
      // Handle both array and object formats from Supabase
      const templateData = Array.isArray(day.workout_templates) 
        ? day.workout_templates[0] 
        : day.workout_templates;
      
      return {
        id: day.id,
        pro_program_id: day.pro_program_id,
        day_number: day.day_number,
        name: day.name,
        template_id: day.template_id, // Explicitly include template_id
        created_at: day.created_at,
        template: templateData || null,
      };
    });

    if (daysError) {
      console.error('Error fetching pro program days:', daysError);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch pro program days',
      });
      return;
    }

    const result: ProProgram = {
      ...programData,
      free_plan: programData.free_plan || false,
      days: transformedDays || [],
    };

    // If user is authenticated, include progress data with completed day IDs
    if (req.user?.id) {
      try {
        const userId = req.user.id;
        const { data: progressData, error: progressError } = await supabaseAdmin
          .from('user_pro_program_progress')
          .select('pro_program_day_id')
          .eq('user_id', userId)
          .eq('pro_program_id', id);

        if (!progressError && progressData) {
          const completedDayIds = progressData.map((p: any) => p.pro_program_day_id);
          // Add progress object with completed day IDs
          (result as any).progress = {
            completedDays: completedDayIds.length,
            totalDays: transformedDays.length || programData.days_per_week,
            completedDayIds,
          };
        }
      } catch (progressError) {
        console.error('Error fetching progress for program:', progressError);
        // Continue without progress data
      }
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in getProProgramById:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Create a new pro program
 * POST /api/pro-programs
 * Admin only - requires authentication
 */
export const createProProgram = async (
  req: AuthRequest,
  res: Response<ApiResponse<ProProgram>>
): Promise<void> => {
  try {
    const { title, description, level, days_per_week, images, free_plan, days }: CreateProProgramRequest = req.body;

    // Validation
    if (!title || !title.trim()) {
      res.status(400).json({
        success: false,
        error: 'Title is required',
      });
      return;
    }

    if (!level || !['Beginner', 'Intermediate', 'Advanced'].includes(level)) {
      res.status(400).json({
        success: false,
        error: 'Level must be Beginner, Intermediate, or Advanced',
      });
      return;
    }

    if (!days_per_week || days_per_week < 3 || days_per_week > 5) {
      res.status(400).json({
        success: false,
        error: 'Days per week must be between 3 and 5',
      });
      return;
    }

    if (!days || days.length === 0 || days.length !== days_per_week) {
      res.status(400).json({
        success: false,
        error: `Must provide exactly ${days_per_week} days`,
      });
      return;
    }

    // Step 1: Create the pro program
    const { data: programData, error: programError } = await supabaseAdmin
      .from('pro_programs')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        level,
        days_per_week,
        images: images || [],
        free_plan: free_plan || false,
      })
      .select()
      .single();

    if (programError) {
      console.error('Error creating pro program:', programError);
      res.status(500).json({
        success: false,
        error: 'Failed to create pro program',
      });
      return;
    }

    // Step 2: Create days with template references
    const daysToInsert = days.map((day) => ({
      pro_program_id: programData.id,
      day_number: day.day_number,
      name: day.name.trim(),
      template_id: day.template_id,
    }));

    const { error: daysError } = await supabaseAdmin
      .from('pro_program_days')
      .insert(daysToInsert)
      .select();

    if (daysError) {
      console.error('Error creating pro program days:', daysError);
      // Rollback: delete the program
      await supabaseAdmin.from('pro_programs').delete().eq('id', programData.id);
      res.status(500).json({
        success: false,
        error: 'Failed to create pro program days',
      });
      return;
    }

    // Step 3: Fetch complete program with days and templates
    const { data: completeProgram, error: fetchError } = await supabaseAdmin
      .from('pro_programs')
      .select('*')
      .eq('id', programData.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete pro program:', fetchError);
      res.status(500).json({
        success: false,
        error: 'Pro program created but failed to fetch complete data',
      });
      return;
    }

    // Fetch days with templates
    const { data: allDaysData } = await supabaseAdmin
      .from('pro_program_days')
      .select(
        `
        *,
        template:template_id (
          id,
          name,
          description,
          training_type
        )
      `
      )
      .eq('pro_program_id', programData.id)
      .order('day_number', { ascending: true });

    const result: ProProgram = {
      ...completeProgram,
      days: allDaysData || [],
    };

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in createProProgram:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get user progress for PRO programs
 * GET /api/pro-programs/progress
 * Returns progress data for all PRO programs for the authenticated user
 */
export const getUserProProgramProgress = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ [programId: string]: { completedDays: number; totalDays: number; completedDayIds: string[] } }>>
): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get all completed days for this user
    const { data: progressData, error: progressError } = await supabaseAdmin
      .from('user_pro_program_progress')
      .select('pro_program_id, pro_program_day_id')
      .eq('user_id', userId);

    if (progressError) {
      console.error('Error fetching user progress:', progressError);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user progress',
      });
      return;
    }

    // Get all PRO programs to get total days count
    const { data: programsData, error: programsError } = await supabaseAdmin
      .from('pro_programs')
      .select('id, days_per_week');

    if (programsError) {
      console.error('Error fetching programs:', programsError);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch programs',
      });
      return;
    }

    // Group completed days by program
    const progressByProgram: { [key: string]: string[] } = {};
    (progressData || []).forEach((progress: any) => {
      if (!progressByProgram[progress.pro_program_id]) {
        progressByProgram[progress.pro_program_id] = [];
      }
      progressByProgram[progress.pro_program_id].push(progress.pro_program_day_id);
    });

    // Build result object
    const result: { [programId: string]: { completedDays: number; totalDays: number; completedDayIds: string[] } } = {};
    (programsData || []).forEach((program: any) => {
      const completedDayIds = progressByProgram[program.id] || [];
      result[program.id] = {
        completedDays: completedDayIds.length,
        totalDays: program.days_per_week,
        completedDayIds,
      };
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in getUserProProgramProgress:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Mark a PRO program day as completed
 * POST /api/pro-programs/:programId/days/:dayId/complete
 * Marks a specific PRO program day as completed for the authenticated user
 */
export const markProProgramDayComplete = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ success: boolean }>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { programId, dayId } = req.params;
    const { workoutHistoryId } = req.body; // Optional workout history ID

    // Verify that the day belongs to the program
    const { data: dayData, error: dayError } = await supabaseAdmin
      .from('pro_program_days')
      .select('pro_program_id')
      .eq('id', dayId)
      .eq('pro_program_id', programId)
      .single();

    if (dayError || !dayData) {
      res.status(404).json({
        success: false,
        error: 'PRO program day not found',
      });
      return;
    }

    // Check if already completed (upsert - insert or update if exists)
    const { data: existingProgress, error: checkError } = await supabaseAdmin
      .from('user_pro_program_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('pro_program_day_id', dayId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine
      console.error('Error checking existing progress:', checkError);
    }

    if (existingProgress) {
      // Already completed, just update the workout_history_id if provided
      if (workoutHistoryId) {
        const { error: updateError } = await supabaseAdmin
          .from('user_pro_program_progress')
          .update({
            workout_history_id: workoutHistoryId,
            completed_at: new Date().toISOString(),
          })
          .eq('id', existingProgress.id);

        if (updateError) {
          console.error('Error updating progress:', updateError);
          res.status(500).json({
            success: false,
            error: 'Failed to update progress',
          });
          return;
        }
      }

      res.json({
        success: true,
        data: { success: true },
      });
      return;
    }

    // Insert new progress record
    const { error: insertError } = await supabaseAdmin
      .from('user_pro_program_progress')
      .insert({
        user_id: userId,
        pro_program_id: programId,
        pro_program_day_id: dayId,
        workout_history_id: workoutHistoryId || null,
      });

    if (insertError) {
      console.error('Error marking day as complete:', insertError);
      res.status(500).json({
        success: false,
        error: 'Failed to mark day as complete',
      });
      return;
    }

    res.json({
      success: true,
      data: { success: true },
    });
  } catch (error) {
    console.error('Error in markProProgramDayComplete:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

