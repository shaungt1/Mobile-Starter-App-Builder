const nativewindPreset = require('nativewind/preset');

function token(variable) {
  return `hsl(var(${variable}) / <alpha-value>)`;
}

module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  presets: [nativewindPreset],
  theme: {
    extend: {
      colors: {
        background: token('--background'),
        foreground: token('--foreground'),
        card: {
          DEFAULT: token('--card'),
          foreground: token('--card-foreground'),
        },
        popover: {
          DEFAULT: token('--popover'),
          foreground: token('--popover-foreground'),
        },
        primary: {
          DEFAULT: token('--primary'),
          foreground: token('--primary-foreground'),
        },
        secondary: {
          DEFAULT: token('--secondary'),
          foreground: token('--secondary-foreground'),
        },
        muted: {
          DEFAULT: token('--muted'),
          foreground: token('--muted-foreground'),
        },
        accent: {
          DEFAULT: token('--accent'),
          foreground: token('--accent-foreground'),
        },
        success: {
          DEFAULT: token('--success'),
          foreground: token('--success-foreground'),
        },
        warning: {
          DEFAULT: token('--warning'),
          foreground: token('--warning-foreground'),
        },
        destructive: {
          DEFAULT: token('--destructive'),
          foreground: token('--destructive-foreground'),
        },
        border: token('--border'),
        input: token('--input'),
        ring: token('--ring'),
        brand: {
          DEFAULT: token('--brand'),
          active: token('--brand-active'),
          deep: token('--brand-deep'),
        },
        edge: token('--edge'),
        illumination: {
          DEFAULT: token('--illumination'),
          foreground: token('--illumination-foreground'),
        },
        reading: {
          committed: token('--reading-committed'),
          pending: token('--reading-pending'),
          current: token('--reading-current'),
          'current-foreground': token('--reading-current-foreground'),
          lowconf: token('--reading-lowconf'),
          revised: token('--reading-revised'),
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
        serif: ['Lora_400Regular'],
        'serif-italic': ['Lora_400Regular_Italic'],
        'serif-medium': ['Lora_500Medium'],
        'serif-semibold': ['Lora_600SemiBold'],
        'serif-bold': ['Lora_700Bold'],
        mono: ['JetBrainsMono_400Regular'],
        'mono-medium': ['JetBrainsMono_500Medium'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
