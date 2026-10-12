// For Real Academy — course catalogue and checkout links.
// Replace each `checkout` URL with the Polar checkout link for that product
// (Polar dashboard → Products → Checkout Links). Until set, buttons open the contact page.
window.ACADEMY = {
  email: "hello@forrealtech.dev",
  courses: [
    {
      id: "web-launch",
      title: "Launch Your First Website",
      level: "Beginner",
      length: "6 modules · about 8 hours",
      blurb: "Go from blank folder to a live, mobile-friendly website on your own domain. HTML, CSS, a little JavaScript, Git and free hosting.",
      learn: ["Structure pages with semantic HTML", "Style responsive layouts with modern CSS", "Add forms and simple interactivity", "Version your work with Git and GitHub", "Deploy and connect a custom domain"],
      price: 79,
      installments: { count: 3, each: 29 },
      checkout: { full: "", split: "" }
    },
    {
      id: "ai-tools",
      title: "AI Tools for Everyday Work",
      level: "Beginner",
      length: "5 modules · about 6 hours",
      blurb: "Use AI assistants well: write better prompts, check the output, and build repeatable workflows for writing, research, spreadsheets and email.",
      learn: ["Write clear prompts and iterate on results", "Verify AI output and spot mistakes", "Automate routine writing and research tasks", "Handle privacy and data safely", "Build a personal prompt library"],
      price: 99,
      installments: { count: 3, each: 36 },
      checkout: { full: "", split: "" }
    },
    {
      id: "ai-web-apps",
      title: "Build Web Apps with AI Coding Assistants",
      level: "Intermediate",
      length: "8 modules · about 12 hours",
      blurb: "Build and ship a working full-stack web app using AI coding assistants, while learning enough to review, test and fix what they produce.",
      learn: ["Plan an app and split it into small tasks", "Pair with an AI assistant without losing control", "Build a database-backed app with auth", "Test, debug and review generated code", "Deploy and monitor your app"],
      price: 149,
      installments: { count: 3, each: 54 },
      checkout: { full: "", split: "" }
    },
    {
      id: "bundle",
      title: "Complete Bundle — All Three Courses",
      level: "All levels",
      length: "19 modules · about 26 hours",
      blurb: "All three courses at a bundle discount. A full path from first website to AI-assisted web apps.",
      learn: ["Everything in the three courses above", "Lifetime access to course updates"],
      price: 249,
      installments: { count: 3, each: 89 },
      checkout: { full: "", split: "" }
    }
  ]
};
