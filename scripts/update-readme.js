/**
 * Auto-Updater Script for GitHub Profile/Repository README
 * Fetches latest public repos from GitHub API sorted by recently pushed,
 * and updates the README.md dynamically.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const USERNAME = process.env.GH_USERNAME || 'rshamith777-cpu';
const README_PATH = path.join(__dirname, '..', 'README.md');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Node-GitHub-Readme-Updater',
        ...(process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {})
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function timeAgo(dateString) {
  const diff = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  return new Date(dateString).toLocaleDateString();
}

const LANG_BADGES = {
  JavaScript: 'https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black',
  TypeScript: 'https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white',
  Python: 'https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white',
  HTML: 'https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white',
  CSS: 'https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white',
  Java: 'https://img.shields.io/badge/Java-ED8B00?style=flat-square&logo=openjdk&logoColor=white',
  'C++': 'https://img.shields.io/badge/C%2B%2B-00599C?style=flat-square&logo=c%2B%2B&logoColor=white',
  Rust: 'https://img.shields.io/badge/Rust-000000?style=flat-square&logo=rust&logoColor=white',
  Go: 'https://img.shields.io/badge/Go-00ADD8?style=flat-square&logo=go&logoColor=white'
};

async function update() {
  console.log(`📡 Fetching live repositories for ${USERNAME}...`);
  try {
    const repos = await fetchJson(`https://api.github.com/users/${USERNAME}/repos?sort=updated&direction=desc&per_page=100`);

    if (!Array.isArray(repos)) {
      console.error('Failed to fetch repos, API returned:', repos);
      return;
    }

    // Keep all public non-fork repositories
    let publicRepos = repos.filter(r => !r.fork);
    if (publicRepos.length === 0) publicRepos = repos;

    let markdown = '| ⚡ Project / Repository | 🛠️ Tech Stack | ⭐ Stars | 🕒 Last Pushed |\n';
    markdown += '| :--- | :--- | :---: | :--- |\n';

    publicRepos.forEach((r, idx) => {
      const isLatest = idx === 0 ? ' `🔥 RECENT`' : '';
      const langBadge = r.language && LANG_BADGES[r.language]
        ? `<img src="${LANG_BADGES[r.language]}" alt="${r.language}" />`
        : (r.language ? `\`${r.language}\`` : '`Code`');

      const desc = r.description ? `<br><sub>${r.description.replace(/\|/g, '-').slice(0, 75)}...</sub>` : '';
      const pushed = timeAgo(r.pushed_at);

      markdown += `| [**${r.name}**](${r.html_url})${isLatest}${desc} | ${langBadge} | ⭐ \`${r.stargazers_count}\` | 🕒 \`${pushed}\` |\n`;
    });

    const timestamp = new Date().toUTCString();
    markdown += `\n*Last auto-synchronized with GitHub on: \`${timestamp}\`*\n`;

    // Read current README
    let readme = fs.readFileSync(README_PATH, 'utf8');

    const START_TAG = '<!-- RECENT_REPOS:START -->';
    const END_TAG = '<!-- RECENT_REPOS:END -->';

    if (readme.includes(START_TAG) && readme.includes(END_TAG)) {
      const regex = new RegExp(`${START_TAG}[\\s\\S]*?${END_TAG}`);
      readme = readme.replace(regex, `${START_TAG}\n\n${markdown}\n${END_TAG}`);
      fs.writeFileSync(README_PATH, readme, 'utf8');
      console.log('✓ Successfully auto-updated README.md with live GitHub projects!');
    } else {
      console.warn('Tags not found in README.md');
    }
  } catch (err) {
    console.error('Update error:', err);
  }
}

update();

