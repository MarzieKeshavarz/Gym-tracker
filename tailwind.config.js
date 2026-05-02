/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Surfaces
        bg:           '#0A0B0F',
        surface:      '#12141A',
        'surface-2':  '#181B23',
        'surface-3':  '#1F232D',

        // Borders
        border:        '#1E222B',
        'border-strong': '#2A2F3A',

        // Brand
        primary:       '#FF6A3D',
        'primary-soft':'rgba(255, 106, 61, 0.12)',
        'primary-ink': '#160805',

        // Secondary / charts
        accent:        '#6EA8FF',
        'accent-soft': 'rgba(110, 168, 255, 0.12)',

        // Status
        success:       '#34D399',
        warning:       '#F5B544',
        danger:        '#F87171',

        // Text — calibrated for AA contrast on bg/surface in low-light gym lighting
        'text-primary':   '#F4F6FA',
        'text-secondary': '#C8CFDB',
        'text-tertiary':  '#8B93A1',

        // Back-compat aliases for any leftovers — kept neutral
        base:    '#0A0B0F',
        text:    '#F4F6FA',
        muted:   '#C8CFDB',
        surface2:'#1F232D',
      },
      borderRadius: {
        lg: '0.75rem',   // 12
        xl: '1rem',      // 16
        '2xl': '1.25rem',// 20
        '3xl': '1.5rem', // 24
      },
      boxShadow: {
        'card':    '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -16px rgba(0,0,0,0.6)',
        'elev':    '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 16px 32px -20px rgba(0,0,0,0.8)',
        'glow':    '0 0 0 1px rgba(255,106,61,0.35), 0 12px 32px -12px rgba(255,106,61,0.45)',
        'inset-hi':'inset 0 1px 0 0 rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #FF7A4F 0%, #FF5C2C 100%)',
        'card-gradient':    'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0) 60%)',
        'page-glow':        'radial-gradient(900px 500px at 50% -10%, rgba(255,106,61,0.08), transparent 60%)',
      },
      letterSpacing: {
        tightish: '-0.01em',
        tighter2: '-0.02em',
        wideish:  '0.06em',
        label:    '0.12em',
      },
    },
  },
  plugins: [],
}
