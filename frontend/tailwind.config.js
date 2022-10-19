const plugin = require('tailwindcss/plugin');

module.exports = {
  purge: {
    content: ['./src/**/*.js', './public/index.html'],
    options: {
      safelist: ["border-b-red-900", "w-12", "h-12", "border-4"]
    }
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    borderStyles: {
      colors: true
    },
    extend: {
      colors: {
        grey: {
          900: "#1B1C1D",
          500: "#2E2F30",
          300: "#424242",
        },
        gray: {
          900: "#1B1C1D",
          500: "#2E2F30",
          300: "#424242",
        }
      },
      width: {
        "1/10": "10%",
        "2/10": "20%",
        "3/10": "30%",
        "4/10": "40%",
        "5/10": "50%",
        "6/10": "60%",
        "7/10": "70%",
        "8/10": "80%",
        "9/10": "90%"
      }
    }
  },
  variants: {
    extend: {
      opacity: ["disabled"],
      backgroundColor: ["disabled"]
    }
  },
  plugins: [
    require("tailwindcss-border-styles")()
  ]
}
