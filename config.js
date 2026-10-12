// For Real Academy — course catalogue and checkout links.
// Replace each `checkout` URL with the Polar checkout link for that product
// (Polar dashboard → Products → Checkout Links). Until set, buttons open the contact page.
window.ACADEMY = {
  email: "hello@forrealtech.dev",
  courses: [
    {
      id: "web-launch",
      modules: ["Browser, editor and how the web works", "HTML: structure, text, links, images, forms", "CSS: layout, flexbox, grid, responsive design", "JavaScript basics: events, DOM, a small interactive feature", "Git and GitHub: commits, branches, publishing your code", "Deploy: free hosting, custom domain, HTTPS, going live"],
      who: "Anyone starting from zero: career changers, students, small-business owners who want their own site.",
      requires: "A computer (Windows, Mac or Linux) and internet access. No prior coding needed.",
      outcome: "A live personal or small-business website you built and published.",
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
      modules: ["How AI assistants work and where they fail", "Prompting: context, examples, constraints, iteration", "Writing and editing with AI without losing your voice", "Research and summarising: checking sources and facts", "Spreadsheets, email and repeatable workflows", "Privacy, safety and responsible use"],
      who: "Professionals, freelancers and students who want to use AI assistants productively and carefully.",
      requires: "An account with any AI assistant (free tiers work). No technical background needed.",
      outcome: "A personal prompt library and three workflows you use in your own work.",
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
      modules: ["Planning an app: requirements and small tasks", "Project setup, a modern framework and a database", "Working with an AI coding assistant: prompts, context, review", "Authentication and user data", "Testing and debugging generated code", "Reading diffs and spotting security and quality problems", "Deployment, environment variables and monitoring", "Capstone: ship your own app"],
      who: "People who know basic HTML/CSS/JavaScript, for example from Launch Your First Website, and want to build full web apps faster.",
      requires: "Comfort with basic JavaScript and Git; an AI coding assistant of your choice (free tiers work for most exercises).",
      outcome: "A deployed, database-backed web app of your own design.",
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
      modules: ["Launch Your First Website (6 modules)", "AI Tools for Everyday Work (5 modules)", "Build Web Apps with AI Coding Assistants (8 modules)"],
      who: "Beginners who want the whole path, in order, at a lower price than buying separately.",
      requires: "Nothing beyond a computer and internet access.",
      outcome: "A website, a set of AI workflows and a deployed web app.",
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
