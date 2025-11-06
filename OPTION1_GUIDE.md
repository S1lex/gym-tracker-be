# Option 1: Import Exercises to public.exercises with UUIDs

This option keeps the UUID structure in your database while importing exercises from `exercises.exercise` to `public.exercises`.

## Steps to Implement Option 1:

### Step 1: Run the Migration SQL

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the contents of `backend/migrate-exercises-to-public-with-uuids.sql`
4. Click **Run**

This will:
- Create `public.exercises` table if it doesn't exist
- Copy all exercises from `exercises.exercise` to `public.exercises` with UUID IDs
- Create an `exercise_id_mapping` table to track the relationship
- Populate the mapping table

### Step 2: Run the Helper Function SQL (Optional but Recommended)

1. In SQL Editor, copy and paste the contents of `backend/create-exercise-uuid-helper-function.sql`
2. Click **Run**

This creates a helper function `get_exercise_uuid()` that can convert exercise names/IDs to UUIDs.

### Step 3: Update Backend Code

You'll need to update `backend/src/controllers/templateController.ts` to use the UUID conversion logic.

**Current code (lines 196-206)** assumes exercise_id is TEXT. Replace it with the UUID conversion logic from `backend/option1-template-controller-example.ts`.

The key changes:
- Look up UUIDs from `exercise_id_mapping` table
- Convert exercise names/IDs to UUIDs before inserting
- Keep `exercise_id` as UUID type in `template_exercises`

### Step 4: Verify the Migration

Run these queries to verify everything worked:

```sql
-- Check how many exercises were imported
SELECT COUNT(*) as total_exercises FROM public.exercises;
SELECT COUNT(*) as mapped_exercises FROM exercise_id_mapping;

-- View sample mappings
SELECT 
  eim.original_id,
  eim.exercise_name,
  eim.uuid_id,
  pe.name as public_exercise_name
FROM exercise_id_mapping eim
JOIN public.exercises pe ON pe.id = eim.uuid_id
LIMIT 10;

-- Test the helper function
SELECT get_exercise_uuid('Ab_Crunch_Machine');
```

## Pros of Option 1:

✅ Maintains UUID structure (consistent with other tables)  
✅ Better for referential integrity  
✅ Can keep both exercise tables in sync  
✅ Mapping table allows easy lookups  

## Cons of Option 1:

❌ More complex migration  
❌ Requires UUID conversion in backend code  
❌ Need to maintain mapping table  
❌ Two sources of truth (exercises.exercise and public.exercises)  

## Notes:

- The `exercise_id_mapping` table helps convert between the original IDs (like "Ab_Crunch_Machine") and UUIDs
- If new exercises are added to `exercises.exercise`, you'll need to sync them to `public.exercises`
- The template controller needs to convert exercise names to UUIDs before inserting

## Troubleshooting:

If you get errors about exercises not found:
1. Check that `public.exercises` has the exercises: `SELECT * FROM public.exercises LIMIT 10;`
2. Check the mapping table: `SELECT * FROM exercise_id_mapping LIMIT 10;`
3. Verify exercise names match exactly (case-sensitive)

