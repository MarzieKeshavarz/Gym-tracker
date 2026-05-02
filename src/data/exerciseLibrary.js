// Curated movement library used by the exercise picker. Grouped by primary
// muscle for the picker UI; tags enable substring search ("press" matches
// bench/shoulder/leg press, "row" matches all rows, etc.).

export const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Glutes', 'Core', 'Cardio', 'Full Body',
]

const E = (name, group, tags = [], defaults = {}) => ({
  name,
  group,
  tags: [name.toLowerCase(), group.toLowerCase(), ...tags],
  defaultSets: defaults.sets ?? 3,
  defaultReps: defaults.reps ?? 10,
})

export const EXERCISE_LIBRARY = [
  // Chest
  E('Bench Press', 'Chest', ['barbell', 'press', 'push'], { sets: 4, reps: 8 }),
  E('Incline Bench Press', 'Chest', ['barbell', 'press', 'upper'], { sets: 4, reps: 8 }),
  E('Dumbbell Bench Press', 'Chest', ['dumbbell', 'press']),
  E('Incline Dumbbell Press', 'Chest', ['dumbbell', 'press', 'upper']),
  E('Cable Fly', 'Chest', ['cable', 'isolation'], { reps: 12 }),
  E('Push-up', 'Chest', ['bodyweight', 'push'], { reps: 15 }),
  E('Chest Dip', 'Chest', ['bodyweight', 'dip']),
  E('Pec Deck', 'Chest', ['machine', 'isolation'], { reps: 12 }),

  // Back
  E('Pull-up', 'Back', ['bodyweight', 'vertical', 'pull'], { reps: 8 }),
  E('Chin-up', 'Back', ['bodyweight', 'vertical', 'pull'], { reps: 8 }),
  E('Lat Pulldown', 'Back', ['cable', 'vertical', 'pull'], { reps: 12 }),
  E('Barbell Row', 'Back', ['barbell', 'horizontal', 'pull']),
  E('Cable Row', 'Back', ['cable', 'horizontal', 'pull'], { reps: 12 }),
  E('Dumbbell Row', 'Back', ['dumbbell', 'horizontal', 'pull']),
  E('T-Bar Row', 'Back', ['barbell', 'horizontal', 'pull']),
  E('Face Pull', 'Back', ['cable', 'rear', 'shoulders'], { reps: 15 }),
  E('Deadlift', 'Back', ['barbell', 'compound', 'hinge'], { sets: 3, reps: 5 }),

  // Shoulders
  E('Overhead Press', 'Shoulders', ['barbell', 'press', 'push'], { sets: 4, reps: 8 }),
  E('Dumbbell Shoulder Press', 'Shoulders', ['dumbbell', 'press']),
  E('Arnold Press', 'Shoulders', ['dumbbell', 'press']),
  E('Lateral Raise', 'Shoulders', ['dumbbell', 'isolation'], { reps: 15 }),
  E('Front Raise', 'Shoulders', ['dumbbell', 'isolation'], { reps: 12 }),
  E('Reverse Fly', 'Shoulders', ['dumbbell', 'rear', 'isolation'], { reps: 12 }),
  E('Upright Row', 'Shoulders', ['barbell', 'pull']),

  // Arms
  E('Bicep Curl', 'Arms', ['dumbbell', 'curl', 'biceps'], { reps: 12 }),
  E('Hammer Curl', 'Arms', ['dumbbell', 'curl', 'biceps'], { reps: 12 }),
  E('Preacher Curl', 'Arms', ['barbell', 'curl', 'biceps'], { reps: 10 }),
  E('Tricep Pushdown', 'Arms', ['cable', 'triceps'], { reps: 12 }),
  E('Skull Crusher', 'Arms', ['barbell', 'triceps'], { reps: 10 }),
  E('Tricep Dip', 'Arms', ['bodyweight', 'triceps', 'dip']),
  E('Cable Curl', 'Arms', ['cable', 'biceps'], { reps: 12 }),
  E('Overhead Tricep Extension', 'Arms', ['dumbbell', 'triceps'], { reps: 12 }),

  // Legs
  E('Back Squat', 'Legs', ['barbell', 'compound', 'squat'], { sets: 4, reps: 6 }),
  E('Front Squat', 'Legs', ['barbell', 'compound', 'squat'], { sets: 4, reps: 6 }),
  E('Goblet Squat', 'Legs', ['dumbbell', 'squat']),
  E('Leg Press', 'Legs', ['machine', 'compound'], { reps: 12 }),
  E('Lunge', 'Legs', ['dumbbell', 'unilateral'], { reps: 10 }),
  E('Bulgarian Split Squat', 'Legs', ['dumbbell', 'unilateral'], { reps: 8 }),
  E('Romanian Deadlift', 'Legs', ['barbell', 'hinge', 'hamstrings']),
  E('Leg Curl', 'Legs', ['machine', 'hamstrings'], { reps: 12 }),
  E('Leg Extension', 'Legs', ['machine', 'quads'], { reps: 12 }),
  E('Calf Raise', 'Legs', ['machine', 'calves'], { sets: 4, reps: 15 }),
  E('Walking Lunge', 'Legs', ['dumbbell', 'unilateral'], { reps: 12 }),

  // Glutes
  E('Hip Thrust', 'Glutes', ['barbell', 'compound'], { sets: 4, reps: 10 }),
  E('Glute Bridge', 'Glutes', ['bodyweight'], { reps: 15 }),
  E('Cable Kickback', 'Glutes', ['cable', 'isolation'], { reps: 12 }),
  E('Sumo Deadlift', 'Glutes', ['barbell', 'compound', 'hinge'], { sets: 3, reps: 5 }),
  E('Step-up', 'Glutes', ['dumbbell', 'unilateral'], { reps: 12 }),

  // Core
  E('Plank', 'Core', ['bodyweight', 'isometric'], { sets: 3, reps: 1 }),
  E('Side Plank', 'Core', ['bodyweight', 'isometric'], { sets: 3, reps: 1 }),
  E('Hanging Leg Raise', 'Core', ['bodyweight'], { reps: 10 }),
  E('Cable Crunch', 'Core', ['cable'], { reps: 15 }),
  E('Russian Twist', 'Core', ['bodyweight'], { reps: 20 }),
  E('Ab Rollout', 'Core', ['bodyweight'], { reps: 10 }),
  E('Bicycle Crunch', 'Core', ['bodyweight'], { reps: 20 }),

  // Cardio
  E('Treadmill', 'Cardio', ['running'], { sets: 1, reps: 1 }),
  E('Elliptical', 'Cardio', ['low impact'], { sets: 1, reps: 1 }),
  E('Stairmaster', 'Cardio', ['stairs'], { sets: 1, reps: 1 }),
  E('Row Machine', 'Cardio', ['rowing'], { sets: 1, reps: 1 }),
  E('Stationary Bike', 'Cardio', ['cycling'], { sets: 1, reps: 1 }),
  E('Swim', 'Cardio', ['swimming'], { sets: 1, reps: 1 }),
  E('Jump Rope', 'Cardio', ['skipping'], { sets: 1, reps: 1 }),

  // Full Body
  E('Clean and Press', 'Full Body', ['barbell', 'olympic'], { sets: 4, reps: 5 }),
  E('Kettlebell Swing', 'Full Body', ['kettlebell', 'hinge'], { reps: 15 }),
  E('Burpee', 'Full Body', ['bodyweight', 'conditioning'], { reps: 12 }),
  E('Thruster', 'Full Body', ['barbell', 'conditioning'], { reps: 10 }),
  E('Yoga Flow', 'Full Body', ['mobility'], { sets: 1, reps: 1 }),
  E('HIIT Class', 'Full Body', ['conditioning'], { sets: 1, reps: 1 }),
  E('Pilates', 'Full Body', ['mobility'], { sets: 1, reps: 1 }),
]

export function searchExercises(query, group = null) {
  const q = (query || '').trim().toLowerCase()
  let results = EXERCISE_LIBRARY
  if (group && group !== 'All') {
    results = results.filter(e => e.group === group)
  }
  if (!q) return results
  return results.filter(e => e.tags.some(t => t.includes(q)))
}

export function applyTrainingGoalToExercise(exercise, goal) {
  // For "endurance/class" style 1×1 movements (yoga, cardio), don't override.
  if (exercise.defaultSets === 1 && exercise.defaultReps === 1) {
    return { sets: 1, reps: 1 }
  }
  switch (goal) {
    case 'strength':   return { sets: 5, reps: 5 }
    case 'hypertrophy':return { sets: 4, reps: 10 }
    case 'endurance':  return { sets: 3, reps: 15 }
    default:           return { sets: exercise.defaultSets, reps: exercise.defaultReps }
  }
}
