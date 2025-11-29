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
 */
export const getProPrograms = async (
  req: AuthRequest,
  res: Response<ApiResponse<ProProgram[]>>
): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pro_programs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pro programs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch pro programs',
      });
      return;
    }

    res.json({
      success: true,
      data: data || [],
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
        workout_templates!pro_program_days_template_id_fkey (
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
        ...day,
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
      days: transformedDays || [],
    };

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
    const { title, description, level, days_per_week, images, days }: CreateProProgramRequest = req.body;

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

    const { data: daysData, error: daysError } = await supabaseAdmin
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

