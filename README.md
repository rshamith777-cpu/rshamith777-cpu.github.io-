# 🎮 CyberPulse — Interactive Cyberpunk Developer Portfolio

An interactive, game-inspired developer portfolio with real-time GitHub integration, physics-based hanging badge simulation, playable retro arcade mini-game, and multi-theme cyberpunk aesthetics.

![Interactive Portfolio Preview](https://img.shields.io/badge/Status-Live%20GitHub%20Sync-00f3ff?style=for-the-badge&logo=github)
![Physics Engine](https://img.shields.io/badge/Physics-Verlet%20Lanyard-ff0055?style=for-the-badge)
![Audio](https://img.shields.io/badge/Sound-Web%20Audio%20API-fcee0a?style=for-the-badge)

---

## ⚡ Highlights & Key Features

### 🪪 1. Interactive Physics Hanging Lanyard Badge
- **Realistic Pendulum Physics**: Simulates rope tension, gravity, spring elasticity, and momentum swinging.
- **Drag & Flick**: Grab the ID card with your mouse/touch, swing it around, and fling it with momentum!
- **3D Holographic Foil**: Reflects cursor movement with dynamic prismatic sheen and 3D card perspective tilt.
- **Card Flip**: Double-click or click **"Flip Card"** to reveal your secret clearance, credentials, and social links.

### 🔄 2. Live GitHub Sync & Auto-Update on Push
- **Zero-Build Real-Time Updates**: Directly queries the GitHub REST API (`/users/{username}/repos?sort=updated`).
- **Instant Push Promotion**: The second you push code to any repo on GitHub, it automatically jumps to the #1 spot in the portfolio with a glowing **`⚡ RECENTLY PUSHED`** badge!
- **Auto-Sync Polling**: Polls GitHub periodically (configurable in `js/config.js`) so open browser tabs update dynamically.
- **Smart Fallback Caching**: Uses `localStorage` with offline resilience and rate-limit handling so your portfolio never goes down.
- **Instant Search & Language Filters**: Real-time filtering by programming language, tech stack, or topic tags.

### 🕹️ 3. Playable Retro Arcade Mini-Game ("Git Defender")
- Embedded 2D retro space shooter built directly on HTML5 Canvas.
- Blast incoming **Bugs** 🐛, **Merge Conflicts** 💥, and **404 Errors** ⚠️.
- Collect **Git Star Coins** ⭐ to rack up bonus points.
- High score tracking saved in your browser.

### 🏆 4. Quest & Achievement Badges
- Unlockable trophies with celebratory toast alerts and chimes:
  - 🌟 **First Contact** (Visited portfolio)
  - 🎯 **Kinetic Master** (Swung hanging badge 8+ times)
  - 💳 **Hacker Identity** (Flipped badge to view credentials)
  - 📡 **GitHub Uplink** (Established live API sync)
  - 🕹️ **Insert Coin** (Launched retro arcade mini-game)
  - 👾 **Bug Exterminator** (Scored 300+ in Git Defender)
  - 🎨 **Chameleon** (Switched themes)
  - 🧭 **Code Cartographer** (Filtered repositories)
  - 💻 **Terminal Root** (Used CLI terminal commands)

### 🔊 5. Procedural Web Audio FX
- Authentic 8-bit chiptune sound effects generated dynamically using the **Web Audio API** (no external MP3/WAV files needed, zero latency).
- Toggle sound on/off anytime with persistent memory.

### 🎨 6. Four Cyberpunk Themes
- **Cyberpunk 2077 Neon** (Deep dark obsidian, electric cyan & neon pink)
- **80s Synthwave** (Midnight violet, hot magenta & sunset orange)
- **Matrix Terminal** (Pitch black & phosphor green)
- **Cosmic Nebula** (Deep sapphire, starlight lilac & celestial blue)

### 💻 7. Interactive Hacker Terminal (CLI Mode)
- Press **`~`** (tilde) or click the **CLI** button to launch the terminal HUD.
- Commands: `help`, `repos`, `skills`, `theme <name>`, `user <username>`, `play`, `clear`.

---

## 🚀 Quick Setup & Deployment to GitHub Pages

### Step 1: Customize Your Details
Open [`js/config.js`](file:///c:/Users/gunas/OneDrive/Desktop/Github%20portfolio/js/config.js) and set your GitHub username:
```javascript
const CONFIG = {
  githubUsername: "rshamith777-cpu", // Your GitHub handle here
  name: "Shamith R",
  roleTitle: "Creative Full-Stack Developer",
  ...
};
```

### Step 2: Push to GitHub
In your project directory terminal:
```bash
git init
git add .
git commit -m "feat: initial interactive cyberpunk portfolio"
git branch -M main
git remote add origin https://github.com/rshamith777-cpu/portfolio.git  # Replace with your repo URL
git push -u origin main
```

### Step 3: Enable GitHub Pages (Takes 10 Seconds)
1. Go to your repository on **GitHub** > **Settings** > **Pages**.
2. Under **Build and deployment** > **Source**, choose **GitHub Actions** (the included `.github/workflows/deploy.yml` will deploy automatically on every push!).
3. Your interactive portfolio is now live at:  
   `https://<your-username>.github.io/<repo-name>/` (or custom domain).

---

## 📂 Project Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions continuous deployment
├── css/
│   ├── style.css             # Main design system, themes, and layout
│   ├── badge.css             # 3D hanging badge & lanyard styling
│   └── game.css              # Arcade cabinet, CRT screen & terminal HUD
├── js/
│   ├── config.js             # Configuration for user, links & skills
│   ├── audio.js              # Procedural Web Audio synthesizer
│   ├── physics-badge.js      # Verlet pendulum physics & lanyard canvas
│   ├── github-api.js         # Live GitHub REST API & auto-updater
│   ├── game.js               # Git Defender retro arcade shooter
│   ├── achievements.js       # Trophy case & quest unlock engine
│   └── app.js                # Main controller & event bindings
├── index.html                # Portfolio application entry
└── README.md                 # Project documentation
```

---

## 🛠️ Tech Stack
- **Pure Modern Web Technologies**: HTML5, Modern CSS3 (Grid/Flexbox/CSS Variables), Vanilla ES6+ JavaScript.
- **Physics**: Verlet integration / Pendulum equations for the lanyard strap.
- **Audio**: Web Audio API oscillator nodes & gain envelopes.
- **Graphics**: HTML5 2D Canvas for lanyard rope & particle field.
- **API**: GitHub REST API v3 with client-side polling and caching.
- **DevOps**: GitHub Actions CI/CD to GitHub Pages.
