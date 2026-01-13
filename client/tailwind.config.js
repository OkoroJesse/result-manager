/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['DM Sans', 'sans-serif'],
            },
            colors: {
                background: 'var(--bg-body)',
                card: 'var(--bg-card)',
                secondary: 'var(--bg-secondary)',
                primary: {
                    DEFAULT: 'var(--accent)',
                    soft: 'var(--accent-soft)',
                },
                text: {
                    primary: 'var(--text-primary)',
                    muted: 'var(--text-muted)',
                },
                border: 'var(--border-subtle)',
            },
            borderRadius: {
                'main': 'var(--radius-main)',
            },
            boxShadow: {
                'soft': 'var(--shadow-soft)',
            }
        },
    },
    plugins: [],
}
