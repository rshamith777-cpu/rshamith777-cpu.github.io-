/**
 * Portfolio Configuration File
 * Easily customize your details, GitHub username, skills, and social links here.
 */
const CONFIG = {
  // Your GitHub username (will automatically fetch all repos, profile, stats, avatars)
  githubUsername: "rshamith777-cpu",

  // Profile details
  name: "Shamith R",
  roleTitle: "Creative Full-Stack Developer & Designer",
  statusMessage: "Coding the next big thing ✨",
  location: "Earth / Remote",
  
  // Hanging Badge Details
  badge: {
    idNumber: "GIT-777-PRO",
    rank: "LEVEL 42 ARCHITECT",
    clearanceLevel: "LEVEL 5 TOP SECRET",
    hologramColor: "#00f3ff",
  },

  // Social Links
  socials: {
    github: "https://github.com/rshamith777-cpu",
    linkedin: "https://linkedin.com",
    twitter: "https://twitter.com",
    email: "rshamith777@gmail.com",
    discord: "rshamith#7777"
  },

  // Highlighted Tech Stack / Skill Tree (Level 1 to 100)
  skills: [
    { name: "JavaScript / ES6+", level: 95, icon: "⚡", category: "frontend" },
    { name: "TypeScript", level: 90, icon: "🔷", category: "frontend" },
    { name: "React / Next.js", level: 92, icon: "⚛️", category: "frontend" },
    { name: "HTML5 & Modern CSS", level: 98, icon: "🎨", category: "frontend" },
    { name: "Node.js & Express", level: 88, icon: "🟢", category: "backend" },
    { name: "Python", level: 85, icon: "🐍", category: "backend" },
    { name: "Git & GitHub DevOps", level: 94, icon: "🐙", category: "tools" },
    { name: "UI/UX & Interactive Design", level: 93, icon: "✨", category: "design" },
    { name: "REST APIs & GraphQL", level: 89, icon: "🔌", category: "backend" },
    { name: "Canvas & Game Physics", level: 86, icon: "🎮", category: "creative" }
  ],

  // Live Auto-Sync Configuration
  autoSync: {
    enabled: true,
    intervalSeconds: 60, // Polls GitHub API every 60 seconds for newly pushed commits
    showLiveIndicator: true
  },

  // Sound FX default setting
  audio: {
    soundEffectsEnabled: true,
    volume: 0.3
  }
};

window.PORTFOLIO_CONFIG = CONFIG;

