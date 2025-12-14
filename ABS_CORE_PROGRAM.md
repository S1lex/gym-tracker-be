# Abs & Core Builder Program

## Overview
A comprehensive 5-day training program designed to build a strong, defined core and six-pack abs. This program targets all areas of your core including upper abs, lower abs, obliques, and deep core stability.

## Program Structure

### Program Details
- **Title**: Abs & Core Builder
- **Level**: Intermediate
- **Days per Week**: 5
- **Focus**: Abdominal Strength, Core Stability, Six-Pack Definition

### Day 1 - Upper Abs Focus
Targeting the upper abdominal muscles with crunches and sit-ups.

**Exercises:**
1. Crunches - 4 sets, 15-20 reps, 45s rest
2. Cable Crunch - 4 sets, 12-15 reps, 45s rest
3. Sit-Up - 3 sets, 10-15 reps, 45s rest
4. Decline Crunch - 3 sets, 12-15 reps, 45s rest

### Day 2 - Lower Abs Focus
Focusing on lower abdominal muscles with leg raises and reverse movements.

**Exercises:**
1. Hanging Leg Raise - 4 sets, 12-15 reps, 45s rest
2. Reverse Crunch - 4 sets, 15-20 reps, 45s rest
3. Decline Reverse Crunch - 3 sets, 12-15 reps, 45s rest
4. Flat Bench Lying Leg Raise - 3 sets, 10-12 reps, 45s rest

### Day 3 - Obliques & Core Stability
Targeting the side abs (obliques) and improving core stability.

**Exercises:**
1. Russian Twist - 4 sets, 20-25 reps, 45s rest
2. Oblique Crunches - 4 sets, 15-20 reps, 45s rest
3. Plank - 3 sets, 30-60 seconds, 45s rest
4. Cable Russian Twists - 3 sets, 12-15 reps, 45s rest

### Day 4 - Full Core Circuit
Complete core workout targeting all abdominal muscles in a circuit format.

**Exercises:**
1. Crunches - 3 sets, 15-20 reps, 30s rest
2. Hanging Leg Raise - 3 sets, 12-15 reps, 30s rest
3. Russian Twist - 3 sets, 20-25 reps, 30s rest
4. Plank - 3 sets, 45-60 seconds, 30s rest

### Day 5 - Advanced Core Strength
Advanced core exercises for building deep core strength and definition.

**Exercises:**
1. Ab Roller - 4 sets, 10-15 reps, 60s rest
2. Hanging Pike - 4 sets, 8-12 reps, 60s rest
3. Cable Crunch - 3 sets, 12-15 reps, 45s rest
4. Plank - 3 sets, 60-90 seconds, 45s rest

## Installation

### Step 1: Run the SQL Script
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `create-abs-training-program.sql`
4. Click **Run**

### Step 2: Verify the Program
After running the script, execute the verification queries at the bottom of the SQL file to:
- See program summary with exercise counts
- View detailed exercise list for each day

## Training Tips

- **Form is Critical**: Focus on slow, controlled movements rather than speed
- **Breathing**: Exhale during the contraction (when you crunch/raise), inhale during the release
- **Progressive Overload**: Gradually increase reps, hold time, or add resistance
- **Rest Days**: Take 2 rest days per week (e.g., train Mon-Fri, rest Sat-Sun)
- **Nutrition**: Visible abs require low body fat - combine with proper nutrition
- **Consistency**: Core responds well to frequent training, but quality over quantity

## Weekly Schedule Example

- **Monday**: Day 1 - Upper Abs Focus
- **Tuesday**: Day 2 - Lower Abs Focus
- **Wednesday**: Day 3 - Obliques & Core Stability
- **Thursday**: Day 4 - Full Core Circuit
- **Friday**: Day 5 - Advanced Core Strength
- **Saturday**: Rest Day
- **Sunday**: Rest Day

## Notes

- The SQL script will only insert exercises that exist in your `exercises` table
- If an exercise name doesn't match exactly, it will be skipped (no error)
- Rest periods are in seconds
- Weight is set to NULL (users can add their own weights/resistance during workouts)
- For planks, reps represent seconds held
- This program can be performed 5 days per week as abs recover quickly

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
