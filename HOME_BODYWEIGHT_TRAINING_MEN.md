# Home Bodyweight Training - Men

## Overview
A comprehensive 4-day bodyweight training program designed for men to build strength, muscle mass, and athleticism at home without any equipment. This program uses progressive bodyweight exercises to target all major muscle groups.

## Program Structure

### Program Details
- **Title**: Home Bodyweight Training - Men
- **Level**: Intermediate
- **Days per Week**: 4
- **Focus**: Strength Building, Muscle Mass, Full Body Development
- **Equipment Required**: None! All exercises use only your bodyweight (pull-up bar recommended but not required)

### Day 1 - Upper Body Push
Chest, shoulders, and triceps focused workout using push-up variations.

**Exercises:**
1. Pushups - 4 sets, 12-15 reps, 60s rest
2. Push-Up Wide - 4 sets, 10-12 reps, 60s rest
3. Push-Ups - Close Triceps Position - 3 sets, 8-12 reps, 60s rest
4. Push Up to Side Plank - 3 sets, 10-15 reps, 45s rest
5. Plank - 3 sets, 30-60 seconds, 45s rest

### Day 2 - Lower Body & Core
Legs, glutes, and core strength building with bodyweight exercises.

**Exercises:**
1. Bodyweight Squat - 4 sets, 15-20 reps, 60s rest
2. Bodyweight Walking Lunge - 4 sets, 12-15 reps, 60s rest
3. Freehand Jump Squat - 3 sets, 15-20 reps, 45s rest
4. Reverse Crunch - 3 sets, 12-15 reps, 45s rest
5. Plank - 3 sets, 45-60 seconds, 45s rest

### Day 3 - Upper Body Pull
Back and biceps focused workout using pulling movements.

**Exercises:**
1. Pullups - 4 sets, 8-12 reps, 90s rest
2. Chin-Up - 4 sets, 8-12 reps, 90s rest
3. Bodyweight Mid Row - 3 sets, 10-15 reps, 60s rest
4. Crunches - 3 sets, 15-20 reps, 45s rest
5. Russian Twist - 3 sets, 20-25 reps, 45s rest

**Note**: If you don't have a pull-up bar, substitute pullups/chin-ups with more sets of Bodyweight Mid Row or use a sturdy table for inverted rows.

### Day 4 - Full Body HIIT
High-intensity full body workout combining strength and cardio.

**Exercises:**
1. Mountain Climbers - 4 sets, 10-15 reps, 30s rest
2. Freehand Jump Squat - 4 sets, 12-15 reps, 30s rest
3. Pushups - 4 sets, 10-12 reps, 30s rest
4. Bodyweight Walking Lunge - 3 sets, 12-15 reps, 30s rest
5. Plank - 3 sets, 30-45 seconds, 30s rest

## Installation

### Step 1: Run the SQL Script
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `create-home-training-men.sql`
4. Click **Run**

### Step 2: Verify the Program
After running the script, execute the verification queries at the bottom of the SQL file to:
- See program summary with exercise counts
- View detailed exercise list for each day

## Training Tips

- **Warm-up**: Always start with 5-10 minutes of dynamic warm-up (arm circles, leg swings, light jumping)
- **Cool-down**: End with 5-10 minutes of stretching focusing on all major muscle groups
- **Progressive Overload**: 
  - Increase reps each week
  - Add more sets when you can complete all reps easily
  - Try harder variations (e.g., decline pushups, one-arm pushups)
- **Form is Critical**: Focus on controlled movements and full range of motion
- **Rest Days**: Take rest days between training days (e.g., train Mon, Tue, Thu, Fri)
- **Pull-up Bar**: While not required, a pull-up bar greatly enhances Day 3 workouts
- **Modifications**:
  - Can't do pullups? Use Bodyweight Mid Row or find a sturdy table for inverted rows
  - Too many reps? Start with fewer and build up
  - Too easy? Add more reps, sets, or try advanced variations

## Weekly Schedule Example

- **Monday**: Day 1 - Upper Body Push
- **Tuesday**: Day 2 - Lower Body & Core
- **Wednesday**: Rest Day
- **Thursday**: Day 3 - Upper Body Pull
- **Friday**: Day 4 - Full Body HIIT
- **Saturday**: Rest Day (or light activity)
- **Sunday**: Rest Day

## Equipment Needed

**Minimal Equipment:**
- Comfortable workout clothes
- A mat or towel (optional, for floor exercises)
- Water bottle
- Enough space to move around (about 8x8 feet)
- **Optional**: Pull-up bar (greatly enhances Day 3, but can be substituted)

## Notes

- The SQL script will only insert exercises that exist in your `exercises` table
- If an exercise name doesn't match exactly, it will be skipped (no error)
- Rest periods are in seconds
- For planks, reps represent seconds held
- This program is designed for intermediate level but can be modified for beginners
- All exercises are bodyweight only - no gym equipment needed!
- Pullups/Chinups require a pull-up bar, but alternatives are provided

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

## Progression Tips

- **Week 1-2**: Focus on form and completing all sets/reps
- **Week 3-4**: Increase reps by 2-3 per exercise
- **Week 5-6**: Add an extra set to each exercise
- **Week 7-8**: Try advanced variations or increase difficulty
- **Ongoing**: Continue progressive overload to keep building strength
