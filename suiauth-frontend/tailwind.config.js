/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        colors: {
          border: "rgb(var(--border) / <alpha-value>)",
          input: "rgb(var(--input) / <alpha-value>)",
          ring: "rgb(var(--ring) / <alpha-value>)",
          background: "rgb(var(--background) / <alpha-value>)",
          foreground: "rgb(var(--foreground) / <alpha-value>)",
          primary: {
            DEFAULT: "rgb(var(--primary) / <alpha-value>)",
            foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
          },
          secondary: {
            DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
            foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
          },
          destructive: {
            DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
            foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
          },
          muted: {
            DEFAULT: "rgb(var(--muted) / <alpha-value>)",
            foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
          },
          accent: {
            DEFAULT: "rgb(var(--accent) / <alpha-value>)",
            foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
          },
          popover: {
            DEFAULT: "rgb(var(--popover) / <alpha-value>)",
            foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
          },
          card: {
            DEFAULT: "rgb(var(--card) / <alpha-value>)",
            foreground: "rgb(var(--card-foreground) / <alpha-value>)",
          },
        },
        animation: {
          'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'spin': 'spin 1s linear infinite',
          'bounce': 'bounce 1s infinite',
          'fadeIn': 'fadeIn 0.5s ease-in-out forwards',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          pulse: {
            '0%, 100%': { opacity: '1' },
            '50%': { opacity: '.5' },
          },
          spin: {
            'from': { transform: 'rotate(0deg)' },
            'to': { transform: 'rotate(360deg)' },
          },
          bounce: {
            '0%, 100%': {
              transform: 'translateY(-25%)',
              animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
            },
            '50%': {
              transform: 'translateY(0)',
              animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
            },
          },
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
      },
    },
    plugins: [],
  }
  