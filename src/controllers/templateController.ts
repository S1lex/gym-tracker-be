import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import {
  ApiResponse,
  WorkoutTemplate,
  WorkoutTemplateWithExercises,
  CreateTemplateRequest,
  UpdateTemplateRequest,
} from '../types';
import { AuthRequest } from '../middleware/auth';

/**
 * Get all templates for the authenticated user
 * GET /api/templates
 * Supports pagination
 * Query params:
 * - page: page number (default: 1)
 * - limit: items per page (default: 6)
 */
export const getTemplates = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ templates: WorkoutTemplate[]; total: number; page: number; limit: number; hasMore: boolean }>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = '1', limit = '6' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 6;
    const offset = (pageNum - 1) * limitNum;

    const { data, error, count } = await supabaseAdmin
      .from('workout_templates')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch templates',
      });
      return;
    }

    const total = count || 0;
    const hasMore = offset + limitNum < total;

    res.json({
      success: true,
      data: {
        templates: data || [],
        total,
        page: pageNum,
        limit: limitNum,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Error in getTemplates:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get a single template by ID, including all associated exercises
 * GET /api/templates/:id
 */
export const getTemplateById = async (
  req: AuthRequest,
  res: Response<ApiResponse<WorkoutTemplateWithExercises>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Get template with exercises
    const { data, error } = await supabaseAdmin
      .from('workout_templates')
      .select(
        `
        *,
        template_exercises (
          id,
          exercise_id,
          exercise_order,
          sets,
          reps,
          weight,
          rest_seconds,
          exercise:exercise_id (
            id,
            name,
            category,
            primaryMuscles,
            equipment,
            instructions
          )
        )
      `
      )
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({
          success: false,
          error: 'Template not found',
        });
        return;
      }
      console.error('Error fetching template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch template',
      });
      return;
    }

    res.json({
      success: true,
      data: data as WorkoutTemplateWithExercises,
    });
  } catch (error) {
    console.error('Error in getTemplateById:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Create a new template with exercises
 * POST /api/templates
 * Uses a transaction to ensure atomicity
 */
export const createTemplate = async (
  req: AuthRequest,
  res: Response<ApiResponse<WorkoutTemplateWithExercises>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, description, training_type, exercises }: CreateTemplateRequest = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({
        success: false,
        error: 'Template name is required',
      });
      return;
    }

    if (!exercises || exercises.length === 0) {
      res.status(400).json({
        success: false,
        error: 'At least one exercise is required',
      });
      return;
    }

    // Ensure profile exists before creating template
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!profile) {
      // Create profile if it doesn't exist
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          username: req.user!.email?.split('@')[0] || `user_${userId.slice(0, 8)}`,
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        res.status(500).json({
          success: false,
          error: 'Failed to create user profile. Please try logging out and back in.',
        });
        return;
      }
    }

    // Step 1: Create the template
    const { data: templateData, error: templateError } = await supabaseAdmin
      .from('workout_templates')
      .insert({
        user_id: userId,
        name: name.trim(),
        description: description?.trim() || null,
        training_type: training_type || null,
      })
      .select()
      .single();

    if (templateError) {
      console.error('Error creating template:', templateError);
      res.status(500).json({
        success: false,
        error: 'Failed to create template',
      });
      return;
    }

    // Step 2: Convert exercise names/IDs to UUIDs using the mapping table
    // The exercises.exercise table uses text IDs (like "Ab_Crunch_Machine")
    // but template_exercises needs UUIDs that reference public.exercises
    const exerciseIds = exercises.map((ex) => ex.exercise_id);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Get exercise IDs that need conversion (not already UUIDs)
    const exerciseIdsToConvert = exerciseIds.filter((id) => !uuidRegex.test(id));

    // Build a map of exercise identifier -> UUID
    const exerciseIdMap: { [key: string]: string } = {};

    if (exerciseIdsToConvert.length > 0) {
      // Query the exercise_id_mapping table to get UUIDs
      const { data: mappingData, error: mappingError } = await supabaseAdmin
        .from('exercise_id_mapping')
        .select('original_id, exercise_name, uuid_id')
        .in('original_id', exerciseIdsToConvert);

      if (mappingError) {
        console.error('Error fetching exercise mappings:', mappingError);
      } else if (mappingData) {
        // Build the map from mapping table
        mappingData.forEach((mapping) => {
          exerciseIdMap[mapping.original_id] = mapping.uuid_id;
          exerciseIdMap[mapping.exercise_name] = mapping.uuid_id;
        });
      }

      // If still missing some, try direct lookup in public.exercises by name
      const missingIds = exerciseIdsToConvert.filter((id) => !exerciseIdMap[id]);
      if (missingIds.length > 0) {
        // Get exercise names from exercises.exercise table first
        const { data: exercisesSchemaData } = await supabaseAdmin
          .schema('exercises')
          .from('exercise')
          .select('id, name')
          .in('id', missingIds);

        if (exercisesSchemaData) {
          const exerciseNames = exercisesSchemaData.map((ex) => ex.name);
          
          // Then look up UUIDs from public.exercises by name
          const { data: publicExercisesData } = await supabaseAdmin
            .from('exercises')
            .select('id, name')
            .in('name', exerciseNames);

          if (publicExercisesData) {
            publicExercisesData.forEach((ex) => {
              // Map by both original ID and name
              const originalId = exercisesSchemaData.find((e) => e.name === ex.name)?.id;
              if (originalId) {
                exerciseIdMap[originalId] = ex.id;
              }
              exerciseIdMap[ex.name] = ex.id;
            });
          }
        }
      }
    }

    // Map exercise IDs to UUIDs
    const templateExercises = exercises.map((ex) => {
      let exerciseId = ex.exercise_id;

      // If exercise_id is not a UUID, convert it using the map
      if (!uuidRegex.test(exerciseId)) {
        const uuid = exerciseIdMap[exerciseId];
        if (uuid && uuidRegex.test(uuid)) {
          exerciseId = uuid;
        } else {
          console.error(`Exercise "${ex.exercise_id}" not found in exercise mapping.`);
          throw new Error(`Exercise "${ex.exercise_id}" not found. Please ensure the exercise exists in public.exercises.`);
        }
      }

      return {
        template_id: templateData.id,
        exercise_id: exerciseId, // Now guaranteed to be a UUID
        exercise_order: ex.exercise_order,
        sets: ex.sets || 3,
        reps: ex.reps || null,
        weight: ex.weight || null,
        rest_seconds: ex.rest_seconds || null,
      };
    });

    const { error: exercisesError } = await supabaseAdmin
      .from('template_exercises')
      .insert(templateExercises);

    if (exercisesError) {
      console.error('Error creating template exercises:', exercisesError);
      // Rollback: delete the template if exercises insertion fails
      await supabaseAdmin
        .from('workout_templates')
        .delete()
        .eq('id', templateData.id);

      res.status(500).json({
        success: false,
        error: 'Failed to create template exercises',
      });
      return;
    }

    // Step 3: Fetch the complete template with exercises
    const { data: completeTemplate, error: fetchError } = await supabaseAdmin
      .from('workout_templates')
      .select(
        `
        *,
        template_exercises (
          id,
          exercise_id,
          exercise_order,
          sets,
          reps,
          weight,
          rest_seconds,
          exercise:exercise_id (
            id,
            name,
            category,
            primaryMuscles,
            equipment,
            instructions
          )
        )
      `
      )
      .eq('id', templateData.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete template:', fetchError);
      res.status(500).json({
        success: false,
        error: 'Template created but failed to fetch complete data',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: completeTemplate as WorkoutTemplateWithExercises,
    });
  } catch (error) {
    console.error('Error in createTemplate:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Update a template
 * PUT /api/templates/:id
 */
export const updateTemplate = async (
  req: AuthRequest,
  res: Response<ApiResponse<WorkoutTemplateWithExercises>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const updates: UpdateTemplateRequest = req.body;

    // First, verify the template belongs to the user
    const { data: existingTemplate, error: checkError } = await supabaseAdmin
      .from('workout_templates')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (checkError || !existingTemplate) {
      res.status(404).json({
        success: false,
        error: 'Template not found',
      });
      return;
    }

    // Update template basic info if provided
    const templateUpdates: Partial<WorkoutTemplate> = {};
    if (updates.name !== undefined) {
      templateUpdates.name = updates.name.trim();
    }
    if (updates.description !== undefined) {
      templateUpdates.description = updates.description?.trim() || null;
    }
    if (updates.training_type !== undefined) {
      templateUpdates.training_type = updates.training_type || null;
    }

    if (Object.keys(templateUpdates).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('workout_templates')
        .update(templateUpdates)
        .eq('id', id);

      if (updateError) {
        console.error('Error updating template:', updateError);
        res.status(500).json({
          success: false,
          error: 'Failed to update template',
        });
        return;
      }
    }

    // Update exercises if provided
    if (updates.exercises && updates.exercises.length > 0) {
      // Delete existing exercises
      const { error: deleteError } = await supabaseAdmin
        .from('template_exercises')
        .delete()
        .eq('template_id', id);

      if (deleteError) {
        console.error('Error deleting existing exercises:', deleteError);
        res.status(500).json({
          success: false,
          error: 'Failed to update template exercises',
        });
        return;
      }

      // Insert new exercises
      const templateExercises = updates.exercises.map((ex) => ({
        template_id: id,
        exercise_id: ex.exercise_id,
        exercise_order: ex.exercise_order,
        sets: ex.sets || 3,
        reps: ex.reps || null,
        weight: ex.weight || null,
        rest_seconds: ex.rest_seconds || null,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('template_exercises')
        .insert(templateExercises);

      if (insertError) {
        console.error('Error inserting new exercises:', insertError);
        res.status(500).json({
          success: false,
          error: 'Failed to update template exercises',
        });
        return;
      }
    }

    // Fetch updated template
    const { data: completeTemplate, error: fetchError } = await supabaseAdmin
      .from('workout_templates')
      .select(
        `
        *,
        template_exercises (
          id,
          exercise_id,
          exercise_order,
          sets,
          reps,
          weight,
          rest_seconds,
          exercise:exercise_id (
            id,
            name,
            category,
            primaryMuscles,
            equipment,
            instructions
          )
        )
      `
      )
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching updated template:', fetchError);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch updated template',
      });
      return;
    }

    res.json({
      success: true,
      data: completeTemplate as WorkoutTemplateWithExercises,
    });
  } catch (error) {
    console.error('Error in updateTemplate:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Delete a template and all associated exercises
 * DELETE /api/templates/:id
 */
export const deleteTemplate = async (
  req: AuthRequest,
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Verify template belongs to user
    const { data: existingTemplate, error: checkError } = await supabaseAdmin
      .from('workout_templates')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (checkError || !existingTemplate) {
      res.status(404).json({
        success: false,
        error: 'Template not found',
      });
      return;
    }

    // Delete template (exercises will be cascade deleted)
    const { error } = await supabaseAdmin
      .from('workout_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete template',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteTemplate:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

