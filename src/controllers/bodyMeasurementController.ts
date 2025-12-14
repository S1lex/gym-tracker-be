import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import {
  ApiResponse,
  BodyMeasurement,
  CreateMeasurementRequest,
  UpdateMeasurementRequest,
} from '../types';
import { AuthRequest } from '../middleware/auth';
import { getEffectiveDateRange } from '../utils/dateRangeHelper';
import { checkProEntitlement } from '../services/revenueCatService';

/**
 * Get all body measurements for the authenticated user
 * GET /api/body-measurements
 * Query params:
 * - type: Filter by measurement type (optional)
 * - startDate: Start date for filtering (ISO date string, optional)
 * - endDate: End date for filtering (ISO date string, optional)
 * - range: Predefined range ('all', 'year', '6months', '3months', 'month', 'week') - optional
 * 
 * Note: For free users, the date range is automatically clamped to the last 3 months
 */
export const getMeasurements = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ measurements: BodyMeasurement[]; effectiveDateRange: { startDate: string; endDate: string } }>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { type, startDate, endDate, range } = req.query;

    // Check if user is Pro
    let isPro = false;
    try {
      isPro = await checkProEntitlement(userId);
    } catch (error) {
      console.warn('Error checking Pro entitlement, defaulting to free user:', error);
    }

    // Determine date range based on user plan
    let effectiveStartDate: string | null = startDate as string | null;
    let effectiveEndDate: string | null = endDate as string | null;

    // Handle predefined ranges
    if (range && !startDate && !endDate) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      switch (range) {
        case 'all':
          effectiveStartDate = null; // Will be clamped for free users
          effectiveEndDate = null;
          break;
        case 'year':
          const oneYearAgo = new Date(today);
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          effectiveStartDate = oneYearAgo.toISOString().split('T')[0];
          effectiveEndDate = null;
          break;
        case '6months':
          const sixMonthsAgo = new Date(today);
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          effectiveStartDate = sixMonthsAgo.toISOString().split('T')[0];
          effectiveEndDate = null;
          break;
        case '3months':
          const threeMonthsAgo = new Date(today);
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          effectiveStartDate = threeMonthsAgo.toISOString().split('T')[0];
          effectiveEndDate = null;
          break;
        case 'month':
          const oneMonthAgo = new Date(today);
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          effectiveStartDate = oneMonthAgo.toISOString().split('T')[0];
          effectiveEndDate = null;
          break;
        case 'week':
          const oneWeekAgo = new Date(today);
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          effectiveStartDate = oneWeekAgo.toISOString().split('T')[0];
          effectiveEndDate = null;
          break;
        default:
          // Invalid range, use defaults
          break;
      }
    }

    // Clamp date range for free users (3 months limit)
    const { startDate: clampedStartDate, endDate: clampedEndDate } = getEffectiveDateRange(
      isPro,
      effectiveStartDate,
      effectiveEndDate
    );

    // Build query
    let query = supabaseAdmin
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .gte('date', clampedStartDate)
      .lte('date', clampedEndDate)
      .order('date', { ascending: false });

    // Filter by type if provided
    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching body measurements:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch body measurements',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        measurements: data || [],
        effectiveDateRange: {
          startDate: clampedStartDate,
          endDate: clampedEndDate,
        },
      },
    });
  } catch (error) {
    console.error('Error in getMeasurements:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get a single body measurement by ID
 * GET /api/body-measurements/:id
 */
export const getMeasurementById = async (
  req: AuthRequest,
  res: Response<ApiResponse<BodyMeasurement>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('body_measurements')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({
          success: false,
          error: 'Measurement not found',
        });
        return;
      }
      console.error('Error fetching measurement:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch measurement',
      });
      return;
    }

    res.json({
      success: true,
      data: data as BodyMeasurement,
    });
  } catch (error) {
    console.error('Error in getMeasurementById:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Create multiple body measurements in a single request
 * POST /api/body-measurements/batch
 * 
 * Free users can log unlimited measurements (only viewing is limited)
 */
export const createMeasurementsBatch = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ measurements: BodyMeasurement[]; created: number }>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { date, measurements }: { date: string; measurements: Array<{ type: string; value: number; unit: string }> } = req.body;

    // Validation
    if (!date || !measurements || !Array.isArray(measurements) || measurements.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: date and measurements array',
      });
      return;
    }

    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
      return;
    }

    // Validate all measurements
    const validTypes = [
      'weight',
      'body_fat_percentage',
      'neck',
      'shoulders',
      'chest',
      'left_bicep',
      'right_bicep',
      'left_forearm',
      'right_forearm',
      'waist',
      'hips',
      'glutes',
      'left_thigh',
      'right_thigh',
      'left_calf',
      'right_calf',
    ];
    const validUnits = ['kg', 'lbs', 'cm', 'in', '%'];

    const measurementsToInsert = measurements
      .filter((m) => m.value !== undefined && m.value !== null && m.value !== '')
      .map((m) => {
        if (!validTypes.includes(m.type)) {
          throw new Error(`Invalid measurement type: ${m.type}`);
        }
        if (!validUnits.includes(m.unit)) {
          throw new Error(`Invalid unit: ${m.unit}`);
        }
        if (typeof m.value !== 'number' || m.value < 0) {
          throw new Error(`Invalid value for ${m.type}: must be a positive number`);
        }
        return {
          user_id: userId,
          date: date.split('T')[0],
          type: m.type,
          value: m.value,
          unit: m.unit,
        };
      });

    if (measurementsToInsert.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No valid measurements to create',
      });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('body_measurements')
      .insert(measurementsToInsert)
      .select();

    if (error) {
      console.error('Error creating measurements batch:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create measurements',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        measurements: data as BodyMeasurement[],
        created: data.length,
      },
    });
  } catch (error: any) {
    console.error('Error in createMeasurementsBatch:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Invalid request',
    });
  }
};

/**
 * Create a new body measurement
 * POST /api/body-measurements
 * 
 * Free users can log unlimited measurements (only viewing is limited)
 */
export const createMeasurement = async (
  req: AuthRequest,
  res: Response<ApiResponse<BodyMeasurement>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { date, type, value, unit, notes }: CreateMeasurementRequest = req.body;

    // Validation
    if (!date || !type || value === undefined || !unit) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: date, type, value, unit',
      });
      return;
    }

    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
      return;
    }

    // Validate measurement type
    const validTypes = [
      'weight',
      'body_fat_percentage',
      'neck',
      'shoulders',
      'chest',
      'left_bicep',
      'right_bicep',
      'left_forearm',
      'right_forearm',
      'waist',
      'hips',
      'glutes',
      'left_thigh',
      'right_thigh',
      'left_calf',
      'right_calf',
    ];
    if (!validTypes.includes(type)) {
      res.status(400).json({
        success: false,
        error: `Invalid measurement type. Must be one of: ${validTypes.join(', ')}`,
      });
      return;
    }

    // Validate unit
    const validUnits = ['kg', 'lbs', 'cm', 'in', '%'];
    if (!validUnits.includes(unit)) {
      res.status(400).json({
        success: false,
        error: `Invalid unit. Must be one of: ${validUnits.join(', ')}`,
      });
      return;
    }

    // Validate value
    if (typeof value !== 'number' || value < 0) {
      res.status(400).json({
        success: false,
        error: 'Value must be a positive number',
      });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('body_measurements')
      .insert({
        user_id: userId,
        date: date.split('T')[0], // Ensure we only use the date part
        type,
        value,
        unit,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating measurement:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create measurement',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: data as BodyMeasurement,
    });
  } catch (error) {
    console.error('Error in createMeasurement:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Update an existing body measurement
 * PUT /api/body-measurements/:id
 */
export const updateMeasurement = async (
  req: AuthRequest,
  res: Response<ApiResponse<BodyMeasurement>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { date, type, value, unit, notes }: UpdateMeasurementRequest = req.body;

    // Check if measurement exists and belongs to user
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('body_measurements')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({
        success: false,
        error: 'Measurement not found',
      });
      return;
    }

    // Build update object
    const updateData: any = {};
    if (date !== undefined) {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD',
        });
        return;
      }
      updateData.date = date.split('T')[0];
    }
    if (type !== undefined) {
      const validTypes = [
        'weight',
        'body_fat_percentage',
        'neck',
        'shoulders',
        'chest',
        'left_bicep',
        'right_bicep',
        'left_forearm',
        'right_forearm',
        'waist',
        'hips',
        'glutes',
        'left_thigh',
        'right_thigh',
        'left_calf',
        'right_calf',
      ];
      if (!validTypes.includes(type)) {
        res.status(400).json({
          success: false,
          error: `Invalid measurement type. Must be one of: ${validTypes.join(', ')}`,
        });
        return;
      }
      updateData.type = type;
    }
    if (value !== undefined) {
      if (typeof value !== 'number' || value < 0) {
        res.status(400).json({
          success: false,
          error: 'Value must be a positive number',
        });
        return;
      }
      updateData.value = value;
    }
    if (unit !== undefined) {
      const validUnits = ['kg', 'lbs', 'cm', 'in', '%'];
      if (!validUnits.includes(unit)) {
        res.status(400).json({
          success: false,
          error: `Invalid unit. Must be one of: ${validUnits.join(', ')}`,
        });
        return;
      }
      updateData.unit = unit;
    }
    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    const { data, error } = await supabaseAdmin
      .from('body_measurements')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating measurement:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update measurement',
      });
      return;
    }

    res.json({
      success: true,
      data: data as BodyMeasurement,
    });
  } catch (error) {
    console.error('Error in updateMeasurement:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Delete a body measurement
 * DELETE /api/body-measurements/:id
 */
export const deleteMeasurement = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ id: string }>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Check if measurement exists and belongs to user
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('body_measurements')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({
        success: false,
        error: 'Measurement not found',
      });
      return;
    }

    const { error } = await supabaseAdmin
      .from('body_measurements')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting measurement:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete measurement',
      });
      return;
    }

    res.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error in deleteMeasurement:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get measurement statistics/analytics
 * GET /api/body-measurements/analytics
 * Query params:
 * - type: Measurement type (required)
 * - startDate: Start date (optional)
 * - endDate: End date (optional)
 * - range: Predefined range (optional)
 * 
 * Returns aggregated data for charting
 */
export const getMeasurementAnalytics = async (
  req: AuthRequest,
  res: Response<ApiResponse<{
    measurements: BodyMeasurement[];
    effectiveDateRange: { startDate: string; endDate: string };
    isClamped: boolean; // Whether the date range was clamped for free users
  }>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { type, startDate, endDate, range } = req.query;

    if (!type) {
      res.status(400).json({
        success: false,
        error: 'Measurement type is required',
      });
      return;
    }

    // Check if user is Pro
    let isPro = false;
    try {
      isPro = await checkProEntitlement(userId);
    } catch (error) {
      console.warn('Error checking Pro entitlement, defaulting to free user:', error);
    }

    // Determine date range
    let effectiveStartDate: string | null = startDate as string | null;
    let effectiveEndDate: string | null = endDate as string | null;

    // Handle predefined ranges
    if (range && !startDate && !endDate) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      switch (range) {
        case 'all':
          effectiveStartDate = null;
          effectiveEndDate = null;
          break;
        case 'year':
          const oneYearAgo = new Date(today);
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          effectiveStartDate = oneYearAgo.toISOString().split('T')[0];
          effectiveEndDate = null;
          break;
        case '6months':
          const sixMonthsAgo = new Date(today);
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          effectiveStartDate = sixMonthsAgo.toISOString().split('T')[0];
          effectiveEndDate = null;
          break;
        case '3months':
          const threeMonthsAgo = new Date(today);
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          effectiveStartDate = threeMonthsAgo.toISOString().split('T')[0];
          effectiveEndDate = null;
          break;
        case 'month':
          const oneMonthAgo = new Date(today);
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          effectiveStartDate = oneMonthAgo.toISOString().split('T')[0];
          effectiveEndDate = null;
          break;
        case 'week':
          const oneWeekAgo = new Date(today);
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          effectiveStartDate = oneWeekAgo.toISOString().split('T')[0];
          effectiveEndDate = null;
          break;
      }
    }

    // Store original requested dates to check if clamping occurred
    const originalStartDate = effectiveStartDate;
    
    // Clamp date range for free users
    const { startDate: clampedStartDate, endDate: clampedEndDate } = getEffectiveDateRange(
      isPro,
      effectiveStartDate,
      effectiveEndDate
    );

    // Check if clamping occurred (for free users requesting "all time" or dates beyond 3 months)
    const isClamped = !isPro && (
      !originalStartDate || 
      new Date(originalStartDate) < new Date(clampedStartDate)
    );

    // Fetch measurements
    const { data, error } = await supabaseAdmin
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .gte('date', clampedStartDate)
      .lte('date', clampedEndDate)
      .order('date', { ascending: true }); // Ascending for charting

    if (error) {
      console.error('Error fetching measurement analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch measurement analytics',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        measurements: data || [],
        effectiveDateRange: {
          startDate: clampedStartDate,
          endDate: clampedEndDate,
        },
        isClamped,
      },
    });
  } catch (error) {
    console.error('Error in getMeasurementAnalytics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
