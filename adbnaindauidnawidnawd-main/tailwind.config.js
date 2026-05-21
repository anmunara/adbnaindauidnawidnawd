/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "var(--primary-color)",
                secondary: "var(--secondary-color)",
                background: "var(--body-bg)",
                foreground: "var(--body-text)",
                card: "var(--card-bg)",
                "card-foreground": "var(--card-text)",
            },
        },
    },
    plugins: [],
};
