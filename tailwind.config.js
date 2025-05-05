/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#EB4A3E',
        'primary-foreground': '#ffffff',
        red: {
          500: '#EB4A3E', // Replacing the default red-500 with #EB4A3E
        }
      },
    },
  },
  plugins: [],
};
