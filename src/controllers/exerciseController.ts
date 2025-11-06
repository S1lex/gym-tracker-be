import { Response, Request } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { ApiResponse, Exercise } from '../types';

/**
 * Get a list of all available exercises from the exercises table
 * GET /api/exercises
 * This endpoint is PUBLIC (no authentication required)
 * Supports pagination, search, and filtering by primaryMuscles
 * Query params:
 * - page: page number (default: 1)
 * - limit: items per page (default: 20)
 * - search: search term for exercise name
 * - primaryMuscle: filter by primary muscle group
 */
export const getExercises = async (
  req: Request,
  res: Response<ApiResponse<{ exercises: Exercise[]; total: number; page: number; limit: number; hasMore: boolean }>>
): Promise<void> => {
  try {
    const { search, primaryMuscle, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    // Query from 'exercise' table
    // Try exercises schema first (as per import script), fallback to public schema
    let query = supabaseAdmin
      .schema('exercises')
      .from('exercise')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.ilike('name', `%${search as string}%`);
    }

    if (primaryMuscle) {
      // Filter by primaryMuscles array containing the muscle group
      query = query.contains('primaryMuscles', [primaryMuscle as string]);
    }

    // Apply pagination
    const { data, error, count } = await query
      .order('name', { ascending: true })
      .range(offset, offset + limitNum - 1);

    // If query failed, try public schema as fallback
    if (error && error.code === 'PGRST116') {
      console.log('Exercises schema not found, using public schema');
      let fallbackQuery = supabaseAdmin
        .from('exercise')
        .select('*', { count: 'exact' });

      if (search) {
        fallbackQuery = fallbackQuery.ilike('name', `%${search as string}%`);
      }

      if (primaryMuscle) {
        fallbackQuery = fallbackQuery.contains('primaryMuscles', [primaryMuscle as string]);
      }

      const fallbackResult = await fallbackQuery
        .order('name', { ascending: true })
        .range(offset, offset + limitNum - 1);

      if (fallbackResult.error) {
        console.error('Error fetching exercises:', fallbackResult.error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch exercises',
        });
        return;
      }

      const total = fallbackResult.count || 0;
      const hasMore = offset + limitNum < total;

      res.json({
        success: true,
        data: {
          exercises: fallbackResult.data || [],
          total,
          page: pageNum,
          limit: limitNum,
          hasMore,
        },
      });
      return;
    }

    if (error) {
      console.error('Error fetching exercises:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch exercises',
      });
      return;
    }

    const total = count || 0;
    const hasMore = offset + limitNum < total;

    res.json({
      success: true,
      data: {
        exercises: data || [],
        total,
        page: pageNum,
        limit: limitNum,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Error in getExercises:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
