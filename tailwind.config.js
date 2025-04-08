/** @type {import('tailwindcss').Config} */
module.exports = {
  // revise to render ejs file
  //content: [`./views/**/*.html`],
  content: [`./views/**/*.ejs`],

  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
  daisyui: {
    themes: "all",
  },
};
