// Profile types
export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  updated_at: string;
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
  exercises?: {
    exercise_id: string;
    exercise_order: number;
    sets: number;
    reps?: string;
    weight?: number;
    rest_seconds?: number;
  }[];
}