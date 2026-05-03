// Default plan template. Used as a starting point when a user creates their
// first plan, and as the source of the legacy-data migration.
export const DEFAULT_PLAN_TEMPLATE = {
  name: 'My Plan',
  sections: [
    {
      id: 'lower-body',
      name: 'Lower Body',
      icon: '🦵',
      color: '#c8ff00',
      exercises: [
        { id: 'hip-thrust',             name: 'Hip Thrust',             targetSets: 4, targetReps: 10 },
        { id: 'romanian-deadlift',      name: 'Romanian Deadlift',      targetSets: 3, targetReps: 10 },
        { id: 'bulgarian-split-squat',  name: 'Bulgarian Split Squat',  targetSets: 3, targetReps: 8  },
        { id: 'leg-press',              name: 'Leg Press',              targetSets: 3, targetReps: 12 },
        { id: 'leg-curl',               name: 'Leg Curl',               targetSets: 3, targetReps: 12 },
        { id: 'calf-raise',             name: 'Calf Raise',             targetSets: 4, targetReps: 15 },
      ],
    },
    {
      id: 'upper-body',
      name: 'Upper Body',
      icon: '💪',
      color: '#ff6b35',
      exercises: [
        { id: 'bench-press',       name: 'Bench Press',       targetSets: 4, targetReps: 8  },
        { id: 'pull-up',           name: 'Pull Up',           targetSets: 3, targetReps: 8  },
        { id: 'cable-row',         name: 'Cable Row',         targetSets: 3, targetReps: 12 },
        { id: 'shoulder-press',    name: 'Shoulder Press',    targetSets: 3, targetReps: 10 },
        { id: 'lateral-raise',     name: 'Lateral Raise',     targetSets: 3, targetReps: 15 },
        { id: 'tricep-pushdown',   name: 'Tricep Pushdown',   targetSets: 3, targetReps: 12 },
        { id: 'bicep-curl',        name: 'Bicep Curl',        targetSets: 3, targetReps: 12 },
      ],
    },
    {
      id: 'group-class',
      name: 'Group Class',
      icon: '🧘',
      color: '#a78bfa',
      exercises: [
        { id: 'yoga-flow',        name: 'Yoga Flow',          targetSets: 1, targetReps: 1 },
        { id: 'spin-class',       name: 'Spin Class',         targetSets: 1, targetReps: 1 },
        { id: 'hiit-class',       name: 'HIIT Class',         targetSets: 1, targetReps: 1 },
        { id: 'pilates',          name: 'Pilates',            targetSets: 1, targetReps: 1 },
      ],
    },
    {
      id: 'optional-activity',
      name: 'Optional Activity',
      icon: '🏃',
      color: '#38bdf8',
      exercises: [
        { id: 'treadmill',     name: 'Treadmill',        targetSets: 1, targetReps: 1 },
        { id: 'elliptical',    name: 'Elliptical',       targetSets: 1, targetReps: 1 },
        { id: 'stairmaster',   name: 'Stairmaster',      targetSets: 1, targetReps: 1 },
        { id: 'row-machine',   name: 'Row Machine',      targetSets: 1, targetReps: 1 },
        { id: 'swim',          name: 'Swim',             targetSets: 1, targetReps: 1 },
      ],
    },
  ],
}

// Three-day body-part split. All exercises 2 sets × 8 reps as the default
// starting point — users can override per exercise after creation.
const reps2x8 = (names) => names.map(n => ({ id: n.toLowerCase().replace(/\s+/g, '-'), name: n, targetSets: 2, targetReps: 8 }))

export const THREE_DAY_SPLIT_TEMPLATE = {
  name: '3-Day Split',
  sections: [
    {
      id: 'arms',
      name: 'Arms',
      icon: '💪',
      color: '#ff6b35',
      exercises: reps2x8([
        'Dumbbell Press',
        'Shoulder Flys',
        'Dumbbell Shoulder Flys',
        'Dumbbell Curls',
        'Rope Curls',
        'Barbell Curls',
        'Triceps Extension',
        'Triceps Overhead',
      ]),
    },
    {
      id: 'chest-back',
      name: 'Chest & Back',
      icon: '🏋️',
      color: '#a78bfa',
      exercises: reps2x8([
        'Chest Press',
        'Dumbbell Chest Press',
        'Pec Deck',
        'Seated Cable Row',
        'Cable Face Pull',
        'Pull Ups',
      ]),
    },
    {
      id: 'legs',
      name: 'Legs',
      icon: '🦵',
      color: '#c8ff00',
      exercises: reps2x8([
        'Leg Press',
        'Leg Extension',
        'Leg Curls',
        'Abductor',
        'Calf Raises',
        'Adductor',
      ]),
    },
  ],
}

// Registry of named built-in templates. Order matters — first entry is the
// fallback for legacy callers that don't pass a key.
export const BUILT_IN_TEMPLATES = [
  {
    key: 'mixed',
    label: 'Mixed Plan',
    icon: '📋',
    description: 'Lower / Upper / Class · 3×10 defaults',
    template: DEFAULT_PLAN_TEMPLATE,
  },
  {
    key: 'three-day',
    label: '3-Day Split',
    icon: '💪',
    description: 'Arms · Chest & Back · Legs · 2×8 defaults',
    template: THREE_DAY_SPLIT_TEMPLATE,
  },
]

export const SECTION_PRESETS = {
  icons: ['🏋️', '🦵', '💪', '🧘', '🏃', '🚴', '🤸', '🥊', '🧗', '🏊'],
  colors: ['#c8ff00', '#ff6b35', '#a78bfa', '#38bdf8', '#f472b6', '#34d399'],
}

export const USER_AVATARS = [
  '🏋️', '💪', '🤸', '🧘', '🏃', '🚴', '🥊', '🧗', '🏊', '⚡',
  '🔥', '🌟', '🎯', '👟', '🦾', '🧠',
]
