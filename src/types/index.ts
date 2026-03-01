// Profile types
export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  updated_at: string;
  // Onboarding fields
  gender?: 'male' | 'female' | 'other' | null;
  current_weight?: number | null;
  current_weight_unit?: 'kg' | 'lbs' | null;
  target_weight?: number | null;
  target_weight_unit?: 'kg' | 'lbs' | null;
  problem_zones?: string[] | null;
  training_preference?: 'gym' | 'home' | null;
  onboarding_completed_at?: string | null;
  onboarding_filled?: boolean;
}

// Exercise types
export interface Exercise {
  id: string;
  name: string;
  category?: string;
  primaryMuscles?: string[]; // Array of muscle groups
  secondaryMuscles?: string[];
  equipment?: string;
  instructions?: string;
  video_url?: string;
  type?: string; // e.g., "Compound", "Isolation"
  images?: string[]; // Array of image file names
}

// Workout types
export interface Workout {
  id: string;
  user_id: string;
  name: string;
  start_time: string;
  end_time?: string;
}

export interface WorkoutWithSets extends Workout {
  workout_sets: WorkoutSet[];
}

// Workout Set types
export interface WorkoutSet {
  id: string;
  workout_id: string;
  exercise_id: string;
  set_number: number;
  reps?: number;
  weight?: number;
  duration_seconds?: number;
}

// Request/Response types
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  } | null; // Can be null when email verification is required
  is_new_user?: boolean; // Indicates if this is a new user registration (for OAuth flows)
}

export interface CreateWorkoutRequest {
  name?: string;
  start_time?: string;
}

export interface UpdateWorkoutRequest {
  name?: string;
  end_time?: string;
}

export interface CreateSetRequest {
  workout_id: string;
  exercise_id: string;
  set_number: number;
  reps?: number;
  weight?: number;
  duration_seconds?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Workout Template types
export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  training_type?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string;
  exercise_order: number;
  sets: number;
  reps?: string;
  weight?: number;
  rest_seconds?: number;
}

export interface WorkoutTemplateWithExercises extends WorkoutTemplate {
  template_exercises: (TemplateExercise & { exercise: Exercise })[];
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  training_type?: string;
  exercises: {
    exercise_id: string;
    exercise_order: number;
    sets: number;
    reps?: string;
    weight?: number;
    rest_seconds?: number;
  }[];
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  training_type?: string;
  exercises?: {
    exercise_id: string;
    exercise_order: number;
    sets: number;
    reps?: string;
    weight?: number;
    rest_seconds?: number;
  }[];
}

// Body Measurement types
export type MeasurementType =
  | 'weight'
  | 'body_fat_percentage'
  | 'neck'
  | 'shoulders'
  | 'chest'
  | 'left_bicep'
  | 'right_bicep'
  | 'left_forearm'
  | 'right_forearm'
  | 'waist'
  | 'hips'
  | 'glutes'
  | 'left_thigh'
  | 'right_thigh'
  | 'left_calf'
  | 'right_calf';

export type MeasurementUnit = 'kg' | 'lbs' | 'cm' | 'in' | '%';

export interface BodyMeasurement {
  id: string;
  user_id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  type: MeasurementType;
  value: number;
  unit: MeasurementUnit;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMeasurementRequest {
  date: string; // ISO date string (YYYY-MM-DD)
  type: MeasurementType;
  value: number;
  unit: MeasurementUnit;
  notes?: string;
}

export interface UpdateMeasurementRequest {
  date?: string;
  type?: MeasurementType;
  value?: number;
  unit?: MeasurementUnit;
  notes?: string;
}

export interface MeasurementDateRange {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

// Weekly Schedule types
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface WeeklySchedule {
  id: string;
  user_id: string;
  day_of_week: DayOfWeek;
  template_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyScheduleWithTemplate extends WeeklySchedule {
  template?: WorkoutTemplate;
}

export interface UpdateWeeklyScheduleRequest {
  schedule: {
    day_of_week: DayOfWeek;
    template_id: string | null;
  }[];
}

// User Goals types
export type GoalType = 'body_weight' | 'exercise_weight' | 'exercise_reps' | 'body_measurement' | 'custom' | 'training_count_per_week';
export type GoalUnit = 'kg' | 'lbs' | 'cm' | 'in' | '%' | 'reps' | 'sets' | 'workouts';

export interface UserGoal {
  id: string;
  user_id: string;
  goal_type: GoalType;
  goal_title: string;
  target_value: number;
  current_value?: number | null;
  unit: GoalUnit;
  exercise_id?: string | null;
  measurement_type?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalRequest {
  goal_type: GoalType;
  goal_title: string;
  target_value: number;
  current_value?: number;
  unit: GoalUnit;
  exercise_id?: string;
  measurement_type?: string;
}

export interface UpdateGoalRequest {
  goal_title?: string;
  target_value?: number;
  current_value?: number;
  unit?: GoalUnit;
  is_active?: boolean;
}