# Reset and Create Pro Program with Templates

This guide explains how to delete all existing pro programs and create a new one with 2 days referencing your templates.

## Template IDs
- **Day 1 Template**: `056f0095-7f14-422c-800d-7777e747167e`
- **Day 2 Template**: `ee758070-ed39-4268-bacc-2eec84eebe06`

## Option 1: Using SQL (Recommended)

### Step 1: Delete all existing pro programs
Run this in your Supabase SQL Editor:

```sql
-- WARNING: This will delete ALL pro programs and their days!
DELETE FROM pro_programs;
```

### Step 2: Create new pro program with templates
Run this SQL:

```sql
WITH new_program AS (
  INSERT INTO pro_programs (
    title,
    description,
    level,
    days_per_week,
    images,
    created_at,
    updated_at
  ) VALUES (
    'Powerbuilding Program',
    'A comprehensive powerbuilding program combining strength and hypertrophy training',
    'Intermediate',
    2,
    ARRAY[]::TEXT[],
    NOW(),
    NOW()
  )
  RETURNING id
)
INSERT INTO pro_program_days (
  pro_program_id,
  day_number,
  name,
  template_id,
  created_at
)
SELECT 
  new_program.id,
  1,
  'Day 1 - Upper Body',
  '056f0095-7f14-422c-800d-7777e747167e'::UUID,
  NOW()
FROM new_program
UNION ALL
SELECT 
  new_program.id,
  2,
  'Day 2 - Lower Body',
  'ee758070-ed39-4268-bacc-2eec84eebe06'::UUID,
  NOW()
FROM new_program;
```

### Step 3: Verify
```sql
SELECT 
  pp.id as program_id,
  pp.title,
  pp.level,
  pp.days_per_week,
  ppd.day_number,
  ppd.name as day_name,
  ppd.template_id,
  wt.name as template_name
FROM pro_programs pp
JOIN pro_program_days ppd ON pp.id = ppd.pro_program_id
LEFT JOIN workout_templates wt ON ppd.template_id = wt.id
ORDER BY pp.created_at DESC, ppd.day_number;
```

## Option 2: Using API (if you have admin access)

### Step 1: Delete all pro programs
Since there's no DELETE endpoint, use SQL (Option 1, Step 1).

### Step 2: Create via API
Make a POST request to `/api/pro-programs` with:

```json
{
  "title": "Powerbuilding Program",
  "description": "A comprehensive powerbuilding program combining strength and hypertrophy training",
  "level": "Intermediate",
  "days_per_week": 2,
  "images": [],
  "days": [
    {
      "day_number": 1,
      "name": "Day 1 - Upper Body",
      "template_id": "056f0095-7f14-422c-800d-7777e747167e"
    },
    {
      "day_number": 2,
      "name": "Day 2 - Lower Body",
      "template_id": "ee758070-ed39-4268-bacc-2eec84eebe06"
    }
  ]
}
```

## Customization

You can customize:
- **title**: Change the program name
- **description**: Update the description
- **level**: Must be `Beginner`, `Intermediate`, or `Advanced`
- **days_per_week**: Must be between 3 and 5 (but you're using 2 days, so you might want to change this)
- **images**: Add image URLs as an array: `ARRAY['url1', 'url2']::TEXT[]`
- **day names**: Change "Day 1 - Upper Body" and "Day 2 - Lower Body" to whatever you want

## Notes

- The `days_per_week` constraint requires 3-5 days, but you're creating 2 days. You may need to adjust the constraint or use 3 days.
- If you want to use different templates for different days, just change the `template_id` values in the INSERT statements.
- The cascade delete ensures that when you delete pro programs, all associated days are automatically deleted.

