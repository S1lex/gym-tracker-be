import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { ApiResponse } from '../types';
import { AuthRequest } from '../middleware/auth';

/**
 * Workout History Data Structure
 */
interface WorkoutHistoryExercise {
  exerciseId: string;
  exerciseName: string;
  sets: {
    setNumber: number;
    weight: number;
    reps: number;
  }[];
}

interface WorkoutHistory {
  id?: string;
  userId: string;
  timestamp: string;
  trainingType: string | null;
  duration: number; // seconds
  tonnage: number;
  exercises: WorkoutHistoryExercise[];
}

interface WorkoutStatistics {
  exerciseFrequency: Record<string, number>;
  templateFrequency: Record<string, number>;
  maxWeightByExercise: Record<string, number>;
  workoutTimeline: {
    date: string;
    duration: number;
    tonnage: number;
    count: number;
  }[];
}

/**
 * Create workout history table if it doesn't exist
 * This should be run as a migration, but we'll handle it here for now
 * TODO: Create proper migration for workout_history table
 */

/**
 * Save a completed workout to history
 * POST /api/workout-history
 * 
 * Stores complete workout data including exercises and sets in a JSONB column
 * for flexible storage and easy querying.
 */
export const saveWorkoutHistory = async (
  req: AuthRequest,
  res: Response<ApiResponse<WorkoutHistory>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      timestamp,
      trainingType,
      templateId,
      duration,
      tonnage,
      exercises,
    }: Omit<WorkoutHistory, 'id' | 'userId'> & { templateId?: string } = req.body;

    console.log('saveWorkoutHistory: Received request', {
      userId,
      timestamp,
      trainingType,
      templateId,
      duration,
      exercisesCount: exercises?.length || 0,
      exercises: exercises?.map(ex => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        setsCount: ex.sets?.length || 0
      }))
    });

    // Validate required fields
    if (!timestamp || !exercises || exercises.length === 0) {
      console.error('saveWorkoutHistory: Validation failed', {
        hasTimestamp: !!timestamp,
        hasExercises: !!exercises,
        exercisesLength: exercises?.length || 0
      });
      res.status(400).json({
        success: false,
        error: 'Missing required fields: timestamp and exercises are required',
      });
      return;
    }

    // Filter out exercises with no sets (they might have been filtered out if no sets were completed)
    const exercisesWithSets = exercises.filter(ex => ex.sets && ex.sets.length > 0);
    
    // Allow workouts with no sets (user might have started but not completed any sets)
    // But log a warning
    if (exercisesWithSets.length === 0) {
      console.warn('saveWorkoutHistory: No exercises with sets to save, but saving workout anyway', {
        totalExercises: exercises.length,
        exercises: exercises.map(ex => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          setsCount: ex.sets?.length || 0
        }))
      });
    }

    // Check if workout_history table exists, if not use workouts table with metadata
    // For now, we'll store in workouts table with end_time set and metadata in a JSONB column
    // TODO: Create dedicated workout_history table with proper schema
    
    // Calculate end_time from start_time + duration
    const startTime = new Date(timestamp);
    const endTime = new Date(startTime.getTime() + duration * 1000);

    // Store workout in workouts table
    const { data: workoutData, error: workoutError } = await supabaseAdmin
      .from('workouts')
      .insert({
        user_id: userId,
        name: trainingType || 'Workout',
        start_time: timestamp,
        end_time: endTime.toISOString(),
      })
      .select()
      .single();

    if (workoutError) {
      console.error('Error creating workout:', workoutError);
      res.status(500).json({
        success: false,
        error: 'Failed to save workout history',
      });
      return;
    }

    // Convert exercise IDs to UUIDs if they're strings (using exercise_id_mapping table)
    const exerciseIds = [...new Set(exercisesWithSets.map(ex => ex.exerciseId))];
    const exerciseIdMap: Record<string, string> = {};
    
    // Check which IDs are UUIDs and which need mapping
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const stringIds = exerciseIds.filter(id => !uuidRegex.test(id));
    
    if (stringIds.length > 0) {
      // Look up UUIDs for string IDs
      const { data: mappings, error: mappingError } = await supabaseAdmin
        .from('exercise_id_mapping')
        .select('original_id, uuid_id')
        .in('original_id', stringIds);
      
      if (mappingError) {
        console.error('Error fetching exercise ID mappings:', mappingError);
      } else if (mappings) {
        mappings.forEach((mapping: any) => {
          exerciseIdMap[mapping.original_id] = mapping.uuid_id;
        });
      }
      
      // For any string IDs not found in mapping, try to find by exercise name
      const unmappedIds = stringIds.filter(id => !exerciseIdMap[id]);
      if (unmappedIds.length > 0) {
        const exercisesToLookup = exercisesWithSets.filter(ex => unmappedIds.includes(ex.exerciseId));
        const exerciseNames = [...new Set(exercisesToLookup.map(ex => ex.exerciseName))];
        
        if (exerciseNames.length > 0) {
          const { data: exercisesByName, error: exercisesError } = await supabaseAdmin
            .from('exercises')
            .select('id, name')
            .in('name', exerciseNames);
          
          if (!exercisesError && exercisesByName) {
            exercisesByName.forEach((ex: any) => {
              // Find the exercise ID that matches this name
              const matchingExercise = exercisesToLookup.find(e => e.exerciseName === ex.name);
              if (matchingExercise) {
                exerciseIdMap[matchingExercise.exerciseId] = ex.id;
              }
            });
          }
        }
      }
    }
    
    // Add UUIDs that are already UUIDs to the map
    exerciseIds.forEach(id => {
      if (uuidRegex.test(id)) {
        exerciseIdMap[id] = id;
      }
    });

    // Store all sets in workout_sets table
    // Ensure reps and weight are numbers (they should be from frontend, but double-check)
    const setsToInsert = exercisesWithSets.flatMap((exercise) => {
      const exerciseUuid = exerciseIdMap[exercise.exerciseId];
      
      // Skip if we couldn't find a UUID for this exercise
      if (!exerciseUuid) {
        console.warn('saveWorkoutHistory: Could not find UUID for exercise', {
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName
        });
        return [];
      }
      
      return exercise.sets
        .filter((set) => {
          // Filter out sets with invalid data (both weight and reps should be valid numbers > 0)
          const weight = typeof set.weight === 'number' ? set.weight : parseFloat(String(set.weight)) || 0;
          const reps = typeof set.reps === 'number' ? set.reps : parseFloat(String(set.reps)) || 0;
          // Include sets that have at least weight OR reps > 0 (allow partial data)
          return weight > 0 || reps > 0;
        })
        .map((set) => ({
          workout_id: workoutData.id,
          exercise_id: exerciseUuid, // Use mapped UUID
          exercise_name: exercise.exerciseName || null, // Save exercise name for historical accuracy
          set_number: set.setNumber,
          reps: typeof set.reps === 'number' ? set.reps : parseFloat(String(set.reps)) || 0,
          weight: typeof set.weight === 'number' ? set.weight : parseFloat(String(set.weight)) || 0,
        }));
    });

    console.log('saveWorkoutHistory: Saving workout', {
      workoutId: workoutData.id,
      setsToInsertCount: setsToInsert.length,
      exercisesWithSetsCount: exercisesWithSets.length,
      totalExercises: exercises.length
    });

    if (setsToInsert.length > 0) {
      console.log('saveWorkoutHistory: Attempting to insert sets', {
        setsCount: setsToInsert.length,
        sampleSet: setsToInsert[0],
        allSets: setsToInsert.map(s => ({
          workout_id: s.workout_id,
          exercise_id: s.exercise_id,
          exercise_name: s.exercise_name,
          set_number: s.set_number,
          reps: s.reps,
          weight: s.weight,
          repsType: typeof s.reps,
          weightType: typeof s.weight
        }))
      });

      const { data: insertedSets, error: setsError } = await supabaseAdmin
        .from('workout_sets')
        .insert(setsToInsert)
        .select();

      if (setsError) {
        console.error('Error saving workout sets:', {
          error: setsError,
          message: setsError.message,
          details: setsError.details,
          hint: setsError.hint,
          code: setsError.code
        });
        // Continue anyway - workout is saved even if sets fail
      } else {
        console.log('saveWorkoutHistory: Sets saved successfully', {
          setsCount: setsToInsert.length,
          insertedCount: insertedSets?.length || 0,
          insertedSets: insertedSets
        });
      }
    } else {
      console.log('saveWorkoutHistory: No sets to save (workout will be saved without sets)', {
        exercisesWithSetsCount: exercisesWithSets.length,
        exercisesWithSets: exercisesWithSets.map(ex => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          setsCount: ex.sets.length,
          sets: ex.sets
        }))
      });
    }

    // Build response with full workout history data
    // Use exercisesWithSets (filtered) or empty array if no exercises with sets
    const workoutHistory: WorkoutHistory = {
      id: workoutData.id,
      userId,
      timestamp,
      trainingType,
      duration,
      tonnage,
      exercises: exercisesWithSets.length > 0 ? exercisesWithSets : [], // Use filtered exercises or empty array
    };

    console.log('saveWorkoutHistory: Workout saved successfully', {
      workoutId: workoutData.id,
      exercisesCount: exercisesWithSets.length,
      totalExercisesReceived: exercises.length,
      endTime: endTime.toISOString()
    });

    // If templateId is provided, check if it's from a PRO program and mark day as complete
    if (templateId) {
      console.log('saveWorkoutHistory: Checking if template belongs to PRO program day', { templateId });
      try {
        // Find if this template belongs to a PRO program day
        const { data: proProgramDay, error: dayError } = await supabaseAdmin
          .from('pro_program_days')
          .select('id, pro_program_id')
          .eq('template_id', templateId)
          .single();

        if (dayError) {
          console.log('saveWorkoutHistory: Template is not from a PRO program day (this is OK for regular templates)', { 
            templateId, 
            error: dayError.message 
          });
        }

        if (!dayError && proProgramDay) {
          console.log('saveWorkoutHistory: Found PRO program day', {
            programId: proProgramDay.pro_program_id,
            dayId: proProgramDay.id,
            templateId
          });
          // This template is from a PRO program day, mark it as completed
          // Check if already exists, then insert or update
          const { data: existingProgress } = await supabaseAdmin
            .from('user_pro_program_progress')
            .select('id')
            .eq('user_id', userId)
            .eq('pro_program_day_id', proProgramDay.id)
            .maybeSingle();

          let progressError;
          if (existingProgress) {
            // Update existing record
            const { error } = await supabaseAdmin
              .from('user_pro_program_progress')
              .update({
                workout_history_id: workoutData.id,
                completed_at: new Date().toISOString(),
              })
              .eq('id', existingProgress.id);
            progressError = error;
          } else {
            // Insert new record
            const { error } = await supabaseAdmin
              .from('user_pro_program_progress')
              .insert({
                user_id: userId,
                pro_program_id: proProgramDay.pro_program_id,
                pro_program_day_id: proProgramDay.id,
                workout_history_id: workoutData.id,
              });
            progressError = error;
          }

          if (progressError) {
            console.error('Error marking PRO program day as complete:', progressError);
            // Don't fail the workout save if progress tracking fails
          } else {
            console.log('PRO program day marked as complete:', {
              programId: proProgramDay.pro_program_id,
              dayId: proProgramDay.id,
              workoutId: workoutData.id,
            });
          }
        }
      } catch (progressError) {
        console.error('Error checking PRO program progress:', progressError);
        // Don't fail the workout save if progress tracking fails
      }
    }

    res.status(201).json({
      success: true,
      data: workoutHistory,
    });
  } catch (error) {
    console.error('Error saving workout history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get workout history for authenticated user
 * GET /api/workout-history
 * 
 * Supports filtering by date range and pagination
 * TODO: Implement retention policy (1 month for free users, forever for paid)
 */
export const getWorkoutHistory = async (
  req: AuthRequest,
  res: Response<ApiResponse<WorkoutHistory[]>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { limit, offset, startDate, endDate } = req.query;

    console.log('getWorkoutHistory: Fetching history for user', {
      userId,
      limit,
      offset,
      startDate,
      endDate
    });

    // Build query - only return completed workouts (with end_time)
    // Using .not('end_time', 'is', null) to filter out incomplete workouts
    let query = supabaseAdmin
      .from('workouts')
      .select(`
        id,
        user_id,
        name,
        start_time,
        end_time,
        workout_sets (
          id,
          exercise_id,
          exercise_name,
          set_number,
          reps,
          weight
        )
      `)
      .eq('user_id', userId)
      .not('end_time', 'is', null); // Only return completed workouts
    
    query = query.order('start_time', { ascending: false });
    
    // Debug: Also query all workouts to compare
    const { data: allWorkouts } = await supabaseAdmin
      .from('workouts')
      .select('id, user_id, start_time, end_time')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(10);
    
    console.log('getWorkoutHistory: All workouts (for debugging)', {
      total: allWorkouts?.length || 0,
      withEndTime: allWorkouts?.filter(w => w.end_time).length || 0,
      withoutEndTime: allWorkouts?.filter(w => !w.end_time).length || 0,
      recentWorkouts: allWorkouts?.slice(0, 5).map(w => ({
        id: w.id,
        start_time: w.start_time,
        hasEndTime: !!w.end_time
      }))
    });

    // Apply date filters
    if (startDate) {
      query = query.gte('start_time', startDate as string);
    }
    if (endDate) {
      query = query.lte('start_time', endDate as string);
    }

    // Apply pagination
    if (limit) {
      query = query.limit(parseInt(limit as string, 10));
    }
    if (offset) {
      query = query.range(
        parseInt(offset as string, 10),
        parseInt(offset as string, 10) + (limit ? parseInt(limit as string, 10) - 1 : 999)
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching workout history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch workout history',
      });
      return;
    }

    // If nested query didn't return sets, fetch them separately
    // This can happen with RLS policies even with admin client
    const workoutIds = (data || []).map((w: any) => w.id);
    let allSets: any[] = [];
    
    if (workoutIds.length > 0) {
      const { data: setsData, error: setsError } = await supabaseAdmin
        .from('workout_sets')
        .select('id, workout_id, exercise_id, exercise_name, set_number, reps, weight')
        .in('workout_id', workoutIds);
      
      if (setsError) {
        console.error('Error fetching workout sets separately:', setsError);
      } else {
        allSets = setsData || [];
        console.log('getWorkoutHistory: Fetched sets separately', {
          setsCount: allSets.length,
          workoutIds: workoutIds.length
        });
      }
    }

    // Attach sets to workouts if they weren't included in nested query
    const workoutsWithSets = (data || []).map((workout: any) => {
      if (!workout.workout_sets || workout.workout_sets.length === 0) {
        workout.workout_sets = allSets.filter((set: any) => set.workout_id === workout.id);
      }
      return workout;
    });

    console.log('getWorkoutHistory: Query result', {
      workoutsCount: data?.length || 0,
      hasData: !!data,
      setsFetchedSeparately: allSets.length,
      firstWorkout: workoutsWithSets[0] ? {
        id: workoutsWithSets[0].id,
        name: workoutsWithSets[0].name,
        start_time: workoutsWithSets[0].start_time,
        end_time: workoutsWithSets[0].end_time,
        setsCount: workoutsWithSets[0].workout_sets?.length || 0,
        sets: workoutsWithSets[0].workout_sets || []
      } : null,
      allWorkoutsWithSets: workoutsWithSets.map((w: any) => ({
        id: w.id,
        setsCount: w.workout_sets?.length || 0,
        sets: w.workout_sets || []
      }))
    });

    // Transform data to WorkoutHistory format
    // Exercise names are now stored in workout_sets.exercise_name for historical accuracy
    const workoutHistory: WorkoutHistory[] = workoutsWithSets.map((workout: any) => {
      // Group sets by exercise
      const exerciseMap: Record<string, WorkoutHistoryExercise> = {};
      
      (workout.workout_sets || []).forEach((set: any) => {
        if (!exerciseMap[set.exercise_id]) {
          exerciseMap[set.exercise_id] = {
            exerciseId: set.exercise_id,
            exerciseName: set.exercise_name || 'Exercise',
            sets: [],
          };
        }
        exerciseMap[set.exercise_id].sets.push({
          setNumber: set.set_number,
          weight: set.weight || 0,
          reps: set.reps || 0,
        });
      });

      // Calculate duration
      const duration = workout.end_time
        ? Math.floor((new Date(workout.end_time).getTime() - new Date(workout.start_time).getTime()) / 1000)
        : 0;

      // Calculate tonnage
      const tonnage = Object.values(exerciseMap).reduce((total, exercise) => {
        return total + exercise.sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
      }, 0);

      const transformed = {
        id: workout.id,
        userId: workout.user_id,
        timestamp: workout.start_time,
        trainingType: workout.name !== 'Workout' ? workout.name : null,
        duration,
        tonnage,
        exercises: Object.values(exerciseMap),
      };

      console.log('getWorkoutHistory: Transformed workout', {
        id: transformed.id,
        timestamp: transformed.timestamp,
        exercisesCount: transformed.exercises.length,
        setsCount: transformed.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
      });

      return transformed;
    });

    console.log('getWorkoutHistory: Final result', {
      totalWorkouts: workoutHistory.length,
      workoutsWithExercises: workoutHistory.filter(w => w.exercises.length > 0).length,
      workoutsWithoutExercises: workoutHistory.filter(w => w.exercises.length === 0).length
    });

    res.json({
      success: true,
      data: workoutHistory,
    });
  } catch (error) {
    console.error('Error fetching workout history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get a single workout history by ID
 * GET /api/workout-history/:id
 */
export const getWorkoutHistoryById = async (
  req: AuthRequest,
  res: Response<ApiResponse<WorkoutHistory>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('workouts')
      .select(`
        id,
        user_id,
        name,
        start_time,
        end_time,
        workout_sets (
          id,
          exercise_id,
          exercise_name,
          set_number,
          reps,
          weight
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({
          success: false,
          error: 'Workout history not found',
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: 'Failed to fetch workout history',
      });
      return;
    }

    // If nested query didn't return sets, fetch them separately
    let sets = data.workout_sets || [];
    if (!sets || sets.length === 0) {
      const { data: setsData, error: setsError } = await supabaseAdmin
        .from('workout_sets')
        .select('id, workout_id, exercise_id, exercise_name, set_number, reps, weight')
        .eq('workout_id', id);
      
      if (!setsError && setsData) {
        sets = setsData;
        console.log('getWorkoutHistoryById: Fetched sets separately', {
          setsCount: sets.length
        });
      }
    }

    // Transform to WorkoutHistory format (same as getWorkoutHistory)
    const exerciseMap: Record<string, WorkoutHistoryExercise> = {};
    
    sets.forEach((set: any) => {
      if (!exerciseMap[set.exercise_id]) {
        exerciseMap[set.exercise_id] = {
          exerciseId: set.exercise_id,
          exerciseName: set.exercise_name || 'Exercise',
          sets: [],
        };
      }
      exerciseMap[set.exercise_id].sets.push({
        setNumber: set.set_number,
        weight: set.weight || 0,
        reps: set.reps || 0,
      });
    });

    const duration = data.end_time
      ? Math.floor((new Date(data.end_time).getTime() - new Date(data.start_time).getTime()) / 1000)
      : 0;

    const tonnage = Object.values(exerciseMap).reduce((total, exercise) => {
      return total + exercise.sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
    }, 0);

    const workoutHistory: WorkoutHistory = {
      id: data.id,
      userId: data.user_id,
      timestamp: data.start_time,
      trainingType: data.name !== 'Workout' ? data.name : null,
      duration,
      tonnage,
      exercises: Object.values(exerciseMap),
    };

    res.json({
      success: true,
      data: workoutHistory,
    });
  } catch (error) {
    console.error('Error fetching workout history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get workout statistics
 * GET /api/workout-history/statistics
 * 
 * Calculates:
 * - Exercise frequency (how often each exercise is used)
 * - Template frequency (how often each template/type is used)
 * - Max weight per exercise
 * - Workout timeline (daily aggregates)
 * 
 * TODO: Implement retention policy filtering (1 month for free users)
 */
export const getWorkoutStatistics = async (
  req: AuthRequest,
  res: Response<ApiResponse<WorkoutStatistics>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    // Build query - only return completed workouts (with end_time)
    let query = supabaseAdmin
      .from('workouts')
      .select(`
        id,
        name,
        start_time,
        end_time,
        workout_sets (
          exercise_id,
          exercise_name,
          weight,
          reps
        )
      `)
      .eq('user_id', userId)
      .not('end_time', 'is', null); // Only return completed workouts
    
    query = query.order('start_time', { ascending: false });

    // Apply date filters
    if (startDate) {
      query = query.gte('start_time', startDate as string);
    }
    if (endDate) {
      query = query.lte('start_time', endDate as string);
    }

    // TODO: Apply retention policy for free users (last 1 month only)
    // const isPaidUser = await checkUserPaidStatus(userId);
    // if (!isPaidUser) {
    //   const oneMonthAgo = new Date();
    //   oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    //   query = query.gte('start_time', oneMonthAgo.toISOString());
    // }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching workout statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics',
      });
      return;
    }

    const exerciseFrequency: Record<string, number> = {};
    const templateFrequency: Record<string, number> = {};
    const maxWeightByExercise: Record<string, number> = {};
    const workoutsByDate: Record<string, any[]> = {};

    (data || []).forEach((workout: any) => {
      // Template frequency
      const templateKey = workout.name !== 'Workout' ? workout.name : 'none';
      templateFrequency[templateKey] = (templateFrequency[templateKey] || 0) + 1;

      // Timeline grouping
      const date = workout.start_time.split('T')[0];
      if (!workoutsByDate[date]) {
        workoutsByDate[date] = [];
      }
      workoutsByDate[date].push(workout);

      // Process sets
      (workout.workout_sets || []).forEach((set: any) => {
        // Exercise frequency
        exerciseFrequency[set.exercise_id] = (exerciseFrequency[set.exercise_id] || 0) + 1;

        // Max weight
        const weight = set.weight || 0;
        const currentMax = maxWeightByExercise[set.exercise_id] || 0;
        if (weight > currentMax) {
          maxWeightByExercise[set.exercise_id] = weight;
        }
      });
    });

    // Build timeline
    const workoutTimeline = Object.entries(workoutsByDate).map(([date, workouts]) => {
      const totalDuration = workouts.reduce((sum, w) => {
        if (w.end_time) {
          return sum + Math.floor((new Date(w.end_time).getTime() - new Date(w.start_time).getTime()) / 1000);
        }
        return sum;
      }, 0);

      const totalTonnage = workouts.reduce((sum, w) => {
        return sum + (w.workout_sets || []).reduce((setSum: number, set: any) => {
          return setSum + (set.weight || 0) * (set.reps || 0);
        }, 0);
      }, 0);

      return {
        date,
        duration: totalDuration,
        tonnage: totalTonnage,
        count: workouts.length,
      };
    });

    workoutTimeline.sort((a, b) => a.date.localeCompare(b.date));

    const statistics: WorkoutStatistics = {
      exerciseFrequency,
      templateFrequency,
      maxWeightByExercise,
      workoutTimeline,
    };

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('Error calculating statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Delete workout history
 * DELETE /api/workout-history/:id
 */
export const deleteWorkoutHistory = async (
  req: AuthRequest,
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Delete workout (sets will be cascade deleted)
    const { error } = await supabaseAdmin
      .from('workouts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete workout history',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Workout history deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting workout history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

