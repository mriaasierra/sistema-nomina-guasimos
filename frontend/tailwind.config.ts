import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Azul Rey institucional: navegación, cabeceras y superficies primarias.
        royal: {
          950: "#0B1B4D",
          900: "#122A6B",
          800: "#1E3A8A",
          700: "#1E40AF",
          600: "#2563EB",
          500: "#3B82F6",
        },
        // Fondo general y superficies profundas.
        navy: {
          950: "#0F172A",
          900: "#172554",
          850: "#1E3A8A",
          800: "#1E40AF",
        },
        // Naranja vibrante: acento ejecutivo (montos, acciones, badges, alertas).
        // Se conserva el token "gold" por compatibilidad con los componentes.
        gold: {
          DEFAULT: "#F97316",
          light: "#FB923C",
          dark: "#EA580C",
        },
        accent: {
          DEFAULT: "#F97316",
          light: "#FB923C",
          dark: "#EA580C",
        },
        // Tokens semánticos: cambian automáticamente con la clase `dark` del <html>.
        surface: "rgb(var(--surface) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        subtle: "rgb(var(--subtle) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        nav: "rgb(var(--nav) / <alpha-value>)",
        "nav-muted": "rgb(var(--nav-muted) / <alpha-value>)",
      },
      boxShadow: {
        gold: "0 12px 32px -14px rgba(249, 115, 22, 0.45)",
        accent: "0 12px 32px -14px rgba(249, 115, 22, 0.45)",
        card: "0 18px 40px -24px rgba(0, 0, 0, 0.9)",
      },
      letterSpacing: {
        widest2: "0.18em",
      },
    },
  },
  plugins: [],
};

export default config;
