/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
      "./public/index.html"
    ],
    theme: {
      extend: {
        colors: {
          primary: "#1DA1F2",
          secondary: "#14171A",
          background: "#F5F8FA",
        },
      },
    },
    plugins: [],
  }