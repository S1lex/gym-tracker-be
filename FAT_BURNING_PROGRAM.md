# Fat Burner Challenge Program

## Overview
A high-intensity 4-day training program designed to maximize fat burning and accelerate weight loss. This program combines HIIT, full-body movements, and metabolic conditioning to boost your metabolism and torch calories.

## Program Structure

### Program Details
- **Title**: Fat Burner Challenge
- **Level**: Intermediate
- **Days per Week**: 4
- **Focus**: Fat Burning, Weight Loss, Metabolic Conditioning

### Day 1 - Full Body HIIT
High-intensity interval training targeting the entire body with explosive movements.

**Exercises:**
1. Mountain Climbers - 4 sets, 20-30 reps, 30s rest
2. Freehand Jump Squat - 4 sets, 15-20 reps, 45s rest
3. Plank - 4 sets, 12-15 reps (or 30-60 seconds), 30s rest
4. Box Jump (Multiple Response) - 4 sets, 10-15 reps, 45s rest

### Day 2 - Cardio & Core
Cardiovascular training combined with core strengthening for maximum calorie burn.

**Exercises:**
1. Rowing, Stationary - 3 sets, 500m, 60s rest
2. Rope Jumping - 4 sets, 30-45 reps, 30s rest
3. Mountain Climbers - 4 sets, 20-30 reps, 30s rest
4. Plank - 3 sets, 45-60 seconds, 45s rest

### Day 3 - Strength & Cardio Mix
Metabolic conditioning combining strength movements with cardiovascular elements.

**Exercises:**
1. One-Arm Kettlebell Swings - 4 sets, 15-20 reps, 45s rest
2. Kettlebell Thruster - 4 sets, 12-15 reps, 45s rest
3. Clean and Press - 4 sets, 10-12 reps, 60s rest
4. Freehand Jump Squat - 3 sets, 20-25 reps, 30s rest

### Day 4 - Active Recovery & Cardio
Lower intensity cardio and active recovery to maintain calorie burn while allowing recovery.

**Exercises:**
1. Running, Treadmill - 3 sets, 20-30 min, continuous
2. Rope Jumping - 3 sets, 5-10 min, continuous
3. Mountain Climbers - 3 sets, 30-45 reps, 30s rest
4. Plank - 3 sets, 60-90 seconds, 45s rest

## Installation

### Step 1: Run the SQL Script
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `create-fat-burning-program.sql`
4. Click **Run**

### Step 2: Verify the Program
After running the script, execute the verification queries at the bottom of the SQL file to:
- See program summary with exercise counts
- View detailed exercise list for each day

## Training Tips

- **Warm-up**: Always start with 5-10 minutes of light cardio and dynamic stretching
- **Form First**: Focus on proper form over speed or weight
- **Progressive Overload**: Gradually increase reps, sets, or intensity each week
- **Rest Days**: Take rest days between training days (e.g., train Mon, Wed, Fri, Sun)
- **Hydration**: Drink plenty of water before, during, and after workouts
- **Nutrition**: Combine with a balanced diet for best results

## Notes

- The SQL script will only insert exercises that exist in your `exercises` table
- If an exercise name doesn't match exactly, it will be skipped (no error)
- Rest periods are in seconds (0 means continuous exercise)
- Weight is set to NULL (users can add their own weights during workouts)
- This program is designed to be performed 4 days per week with rest days in between

## Customization

To modify the program:
1. Update exercise names in the SQL script to match your database
2. Adjust sets, reps, and rest periods as needed
3. Add or remove exercises by modifying the INSERT statements
4. Modify the program description or level as needed

## Troubleshooting

If exercises are missing:
1. Check the exercise names in your `exercises` table
2. Verify the exact spelling and capitalization
3. Update the SQL script with the correct exercise names
4. Re-run the script (it will skip if the program already exists)
