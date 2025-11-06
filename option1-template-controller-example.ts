// Option 1: Template Controller with UUID conversion
// This version converts exercise names/IDs to UUIDs using the exercise_id_mapping table

// Step 2: Convert exercise names/IDs to UUIDs using the mapping table
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
    .in('original_id', exerciseIdsToConvert)
    .or(`exercise_name.in.(${exerciseIdsToConvert.join(',')})`);

  if (mappingError) {
    console.error('Error fetching exercise mappings:', mappingError);
    // Fallback: try direct lookup in public.exercises by name
    const { data: exercisesData } = await supabaseAdmin
      .from('exercises')
      .select('id, name')
      .in('name', exerciseIdsToConvert);

    if (exercisesData) {
      exercisesData.forEach((ex) => {
        exerciseIdMap[ex.name] = ex.id;
      });
    }
  } else if (mappingData) {
    // Build the map from mapping table
    mappingData.forEach((mapping) => {
      exerciseIdMap[mapping.original_id] = mapping.uuid_id;
      exerciseIdMap[mapping.exercise_name] = mapping.uuid_id;
    });
  }

  // If still missing some, try direct lookup in public.exercises
  const missingIds = exerciseIdsToConvert.filter((id) => !exerciseIdMap[id]);
  if (missingIds.length > 0) {
    const { data: exercisesData } = await supabaseAdmin
      .from('exercises')
      .select('id, name')
      .in('name', missingIds);

    if (exercisesData) {
      exercisesData.forEach((ex) => {
        exerciseIdMap[ex.name] = ex.id;
      });
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

