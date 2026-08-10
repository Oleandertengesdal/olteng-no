/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    // Fargene er *erstattet*, ikke utvidet. Da finnes ikke bg-blue-500 i det
    // hele tatt, og det er umulig å hardkode en farge ved et uhell — den
    // eneste veien til en farge går gjennom en semantisk variabel.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      paper: 'rgb(var(--c-paper) / <alpha-value>)',
      surface: 'rgb(var(--c-surface) / <alpha-value>)',
      raised: 'rgb(var(--c-raised) / <alpha-value>)',
      ink: 'rgb(var(--c-ink) / <alpha-value>)',
      muted: 'rgb(var(--c-muted) / <alpha-value>)',
      faint: 'rgb(var(--c-faint) / <alpha-value>)',
      line: 'rgb(var(--c-line) / <alpha-value>)',
      accent: {
        DEFAULT: 'rgb(var(--c-accent) / <alpha-value>)',
        ink: 'rgb(var(--c-accent-ink) / <alpha-value>)',
      },
      positive: 'rgb(var(--c-positive) / <alpha-value>)',
      warning: 'rgb(var(--c-warning) / <alpha-value>)',
      critical: 'rgb(var(--c-critical) / <alpha-value>)',
    },
    extend: {
      fontFamily: {
        display: ['Fraunces Variable', 'Fraunces', 'Iowan Old Style', 'Georgia', 'serif'],
        sans: ['IBM Plex Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        // Ett radius-steg, og det er lite. Runde hjørner er ikke et designspråk.
        DEFAULT: '2px',
        sm: '1px',
        md: '3px',
      },
      boxShadow: {
        // Ingen skygger. Hierarki lages med hårfine linjer og flatetone.
        none: 'none',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        rise: 'rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  corePlugins: {
    // Slått av med vilje: verktøyklasser som finnes, blir brukt.
    boxShadow: false,
    dropShadow: false,
    backgroundImage: false,
    gradientColorStops: false,
  },
  plugins: [],
}
