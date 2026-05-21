/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        container: {
            center: true,
            padding: "1.5rem",
            screens: {
                "2xl": "1400px",
            },
        },
        screens: {
            xs: "400px",
            sm: "640px",
            md: "768px",
            lg: "1024px",
            xl: "1280px",
            "2xl": "1536px",
        },
        extend: {
            colors: {
                brand: {
                    50: "#FFF1F2",
                    100: "#FFE4E6",
                    200: "#FECDD3",
                    300: "#FDA4AF",
                    400: "#FB7185",
                    500: "#FF2D55",
                    600: "#DC2626",
                    700: "#BE123C",
                    800: "#9F1239",
                    900: "#881337",
                    950: "#4C0519",
                },
                background: "rgb(var(--background) / <alpha-value>)",
                foreground: "rgb(var(--foreground) / <alpha-value>)",
                surface: "rgb(var(--surface) / <alpha-value>)",
                "surface-elevated": "rgb(var(--surface-elevated) / <alpha-value>)",
                muted: {
                    DEFAULT: "rgb(var(--muted) / <alpha-value>)",
                    foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
                },
                primary: {
                    DEFAULT: "rgb(var(--primary) / <alpha-value>)",
                    foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
                },
                border: "rgb(var(--border) / <alpha-value>)",
                input: "rgb(var(--input) / <alpha-value>)",
                ring: "rgb(var(--ring) / <alpha-value>)",
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                display: ["Space Grotesk", "Inter", "sans-serif"],
            },
            borderRadius: {
                xl: "1rem",
                "2xl": "1.5rem",
                "3xl": "2rem",
            },
            backdropBlur: {
                xs: "2px",
            },
            keyframes: {
                "fade-in": {
                    "0%": { opacity: 0, transform: "translateY(10px)" },
                    "100%": { opacity: 1, transform: "translateY(0)" },
                },
                "fade-in-up": {
                    "0%": { opacity: 0, transform: "translateY(30px)" },
                    "100%": { opacity: 1, transform: "translateY(0)" },
                },
                "scale-in": {
                    "0%": { opacity: 0, transform: "scale(0.95)" },
                    "100%": { opacity: 1, transform: "scale(1)" },
                },
                "shimmer": {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
                "glow": {
                    "0%, 100%": { boxShadow: "0 0 20px rgba(255, 45, 85, 0.3)" },
                    "50%": { boxShadow: "0 0 40px rgba(255, 45, 85, 0.6)" },
                },
                "float": {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                "gradient-shift": {
                    "0%, 100%": { backgroundPosition: "0% 50%" },
                    "50%": { backgroundPosition: "100% 50%" },
                },
                "orbit": {
                    "0%": { transform: "rotate(0deg) translateX(100px) rotate(0deg)" },
                    "100%": { transform: "rotate(360deg) translateX(100px) rotate(-360deg)" },
                },
            },
            animation: {
                "fade-in": "fade-in 0.5s ease-out",
                "fade-in-up": "fade-in-up 0.6s ease-out",
                "scale-in": "scale-in 0.4s ease-out",
                "shimmer": "shimmer 2s linear infinite",
                "glow": "glow 2s ease-in-out infinite",
                "float": "float 3s ease-in-out infinite",
                "gradient-shift": "gradient-shift 8s ease infinite",
                "orbit": "orbit 20s linear infinite",
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "grid-pattern": "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            },
            boxShadow: {
                "glow-sm": "0 0 10px rgba(255, 45, 85, 0.3)",
                "glow-md": "0 0 20px rgba(255, 45, 85, 0.4)",
                "glow-lg": "0 0 40px rgba(255, 45, 85, 0.5)",
                "neu-light": "8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)",
                "neu-dark": "8px 8px 16px rgba(0,0,0,0.4), -8px -8px 16px rgba(255,255,255,0.05)",
                "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
            },
        },
    },
    plugins: [],
};
