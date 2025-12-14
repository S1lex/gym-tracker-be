# Women's Glutes & Legs Program

## Overview
A comprehensive 3-day training program designed specifically for women to build strong, shapely glutes and powerful legs.

## Program Structure

### Program Details
- **Title**: Glutes & Legs Builder
- **Level**: Intermediate
- **Days per Week**: 3
- **Focus**: Glutes, Quads, Hamstrings

### Day 1 - Glutes Focus
Heavy glute-focused training with hip thrusts, glute bridges, and glute isolation work.

**Exercises:**
1. Barbell Hip Thrust - 4 sets, 8-10 reps, 90s rest
2. Barbell Glute Bridge - 3 sets, 12-15 reps, 60s rest
3. Split Squat with Dumbbells - 3 sets, 10-12 reps, 90s rest
4. Dumbbell Step Ups - 3 sets, 12-15 reps, 60s rest
5. Cable Hip Adduction - 3 sets, 15-20 reps, 45s rest
6. Single Leg Glute Bridge - 3 sets, 12-15 reps, 45s rest
7. Calf Raise On A Dumbbell - 3 sets, 15-20 reps, 45s rest

### Day 2 - Quads & Glutes
Quad-dominant training with squats, leg press, and step-ups for lower body power.

**Exercises:**
1. Barbell Full Squat - 4 sets, 8-10 reps, 120s rest
2. Leg Press - 4 sets, 12-15 reps, 90s rest
3. Barbell Step Ups - 3 sets, 10-12 reps, 90s rest
4. Leg Extensions - 3 sets, 12-15 reps, 60s rest
5. Barbell Walking Lunge - 3 sets, 12-15 reps, 60s rest
6. Goblet Squat - 3 sets, 15-20 reps, 45s rest
7. Calf Press On The Leg Press Machine - 4 sets, 15-20 reps, 45s rest

### Day 3 - Hamstrings & Glutes
Posterior chain focus with Romanian deadlifts, leg curls, and glute activation.

**Exercises:**
1. Romanian Deadlift - 4 sets, 8-10 reps, 120s rest
2. Barbell Hip Thrust - 4 sets, 10-12 reps, 90s rest
3. Lying Leg Curls - 4 sets, 12-15 reps, 60s rest
4. Barbell Deadlift - 3 sets, 6-8 reps, 120s rest
5. Glute Kickback - 3 sets, 15-20 reps, 45s rest
6. Hip Extension with Bands - 3 sets, 15-20 reps, 45s rest
7. Donkey Calf Raises - 3 sets, 15-20 reps, 45s rest

## Installation

### Step 1: Run the SQL Script
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `create-womens-glutes-legs-program.sql`
4. Click **Run**

### Step 2: Verify the Program
After running the script, execute the verification queries at the bottom of the SQL file to:
- See program summary with exercise counts
- View detailed exercise list for each day

## Notes

- The SQL script will only insert exercises that exist in your `exercises` table
- If an exercise name doesn't match exactly, it will be skipped (no error)
- You can add images to the program by updating the `images` array in the `pro_programs` table
- Rest periods are in seconds
- Weight is set to NULL (users can add their own weights during workouts)

## Customization

To modify the program:
1. Update exercise names in the SQL script to match your database
2. Adjust sets, reps, and rest periods as needed
3. Add or remove exercises by modifying the INSERT statements

## Troubleshooting

If exercises are missing:
1. Check the exercise names in your `exercises` table
2. Verify the exact spelling and capitalization
3. Update the SQL script with the correct exercise names
4. Re-run the script (it's safe to run multiple times - it will create new programs each time)
