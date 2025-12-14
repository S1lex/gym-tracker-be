# Home Bodyweight Training Program

## Overview
A complete 3-day bodyweight training program designed for women to do at home without any equipment. This program combines strength, cardio, and flexibility exercises to help you build strength, burn calories, and improve overall fitness from the comfort of your home.

## Program Structure

### Program Details
- **Title**: Home Bodyweight Training
- **Level**: Beginner
- **Days per Week**: 3
- **Focus**: Full Body Strength, Cardio, Lower Body & Glutes
- **Equipment Required**: None! All exercises use only your bodyweight

### Day 1 - Full Body Strength
Total body workout using bodyweight exercises to build strength and muscle tone.

**Exercises:**
1. Bodyweight Squat - 3 sets, 15-20 reps, 60s rest
2. Pushups - 3 sets, 10-15 reps, 60s rest
3. Bodyweight Walking Lunge - 3 sets, 12-15 reps, 45s rest
4. Plank - 3 sets, 30-60 seconds, 45s rest
5. Crunches - 3 sets, 15-20 reps, 45s rest

### Day 2 - Cardio & Core
High-energy cardio workout combined with core strengthening exercises.

**Exercises:**
1. Mountain Climbers - 4 sets, 20-30 reps, 30s rest
2. Freehand Jump Squat - 3 sets, 15-20 reps, 30s rest
3. Russian Twist - 3 sets, 20-25 reps, 30s rest
4. Plank - 3 sets, 45-60 seconds, 30s rest
5. Pushups - 3 sets, 10-12 reps, 45s rest

### Day 3 - Lower Body & Glutes
Lower body focused workout targeting legs, glutes, and core.

**Exercises:**
1. Bodyweight Squat - 4 sets, 15-20 reps, 60s rest
2. Bodyweight Walking Lunge - 3 sets, 12-15 reps, 60s rest
3. Reverse Crunch - 3 sets, 12-15 reps, 45s rest
4. Front Leg Raises - 3 sets, 10-12 reps, 45s rest
5. Plank - 3 sets, 30-45 seconds, 45s rest

## Installation

### Step 1: Run the SQL Script
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `create-home-training-women.sql`
4. Click **Run**

### Step 2: Verify the Program
After running the script, execute the verification queries at the bottom of the SQL file to:
- See program summary with exercise counts
- View detailed exercise list for each day

## Training Tips

- **Warm-up**: Always start with 5 minutes of light movement (marching in place, arm circles, leg swings)
- **Cool-down**: End with 5 minutes of stretching focusing on legs, arms, and core
- **Form First**: Focus on proper form over speed or number of reps
- **Progressive Overload**: Gradually increase reps or hold time each week
- **Rest Days**: Take rest days between training days (e.g., train Mon, Wed, Fri)
- **Hydration**: Drink water before, during, and after workouts
- **Modifications**: 
  - Can't do full pushups? Start with knee pushups or wall pushups
  - Too many reps? Start with fewer and build up
  - Plank too hard? Start with shorter holds and increase gradually

## Weekly Schedule Example

- **Monday**: Day 1 - Full Body Strength
- **Tuesday**: Rest Day
- **Wednesday**: Day 2 - Cardio & Core
- **Thursday**: Rest Day
- **Friday**: Day 3 - Lower Body & Glutes
- **Saturday**: Rest Day (or light activity like walking)
- **Sunday**: Rest Day

## Equipment Needed

**NONE!** All exercises use only your bodyweight. You'll need:
- Comfortable workout clothes
- A mat or towel (optional, for floor exercises)
- Water bottle
- Enough space to move around (about 6x6 feet)

## Notes

- The SQL script will only insert exercises that exist in your `exercises` table
- If an exercise name doesn't match exactly, it will be skipped (no error)
- Rest periods are in seconds
- For planks, reps represent seconds held
- This program is perfect for beginners and can be done anywhere
- All exercises are bodyweight only - no gym equipment needed!

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
