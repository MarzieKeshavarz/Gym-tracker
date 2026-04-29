// Default 4-day workout plan
export const DEFAULT_PLAN = {
  days: [
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
