# 🎮 Game Engine Studio · Oyun Motoru Atölyesi

An interactive learning journey that goes **from a 2D image to a working 3D game object**.
It is built to help students *grasp by doing* the core game-engine concepts:
**Texture, Material, Mesh, GameObject, Hierarchy, Rig and Animation**.

The page flows as a single, top-to-bottom **hierarchical** story — and each choice you make
carries over into the next stage:

| Stage | Topic | What you do |
|-------|-------|-------------|
| **01** | 📷 **Texture** | Pick a 2D pattern; see its flat (2D) form and how it **tiles** on a surface. |
| **02** | 🎨 **Material Studio** | *Just like Unity:* drop a Texture into a slot and add color / metalness / roughness to **build a Material**. Live 3D sphere preview. |
| **03** | 🧊 **GameObject Lab** | Empty GameObject → add a **Mesh** (shape) → apply the **Material** you built. Component list: Transform / Mesh Filter / Mesh Renderer. |
| **04** | 🤖 **Avatar Editor** | Many GameObjects become a full avatar through **Hierarchy**, **Rig** and **Animation**. Click-select, edit, play. |

- 🌍 **Bilingual (TR / EN):** Opens automatically in the browser's language (Turkish if the
  browser is Turkish, English otherwise). You can also switch manually with the **TR / EN**
  button at the top right; your choice is remembered.

> The entire 3D model is **generated with code (Three.js)** and all textures are procedural —
> **there are no external asset files**. Three.js itself is stored locally in the `vendor/` folder,
> so **no internet / CDN is required**; it works on GitHub Pages and fully offline with zero setup.

---

## 🧪 Running It Locally (on your own computer)

> ⚠️ **Important:** Do **not** open the file by double-clicking it (the `file://` mode).
> For security reasons browsers (Chrome / Edge) block the 3D engine in that mode and the page
> gets stuck on *"Preparing 3D scene…"*. You must use a tiny local web server:

**Easiest (Windows):** Double-click **`baslat.bat`** in the folder. It starts a local server and
opens your browser automatically. (Python or Node.js must be installed.)

**Manual:**
```bash
# If you have Python (Windows / Mac / Linux)
python -m http.server 8000
# Then open in the browser: http://localhost:8000

# Or if you have Node.js
npx serve .
```

If you use VS Code, the **"Live Server"** extension also works.

---

## 🚀 Publishing on GitHub Pages (github.io) — Full Step-by-Step

GitHub Pages turns the files in a repository into a **free, public website**. Below are **two
ways** to do it. Pick **Method A** if you prefer clicking in the browser (no commands), or
**Method B** if you are comfortable with the command line.

> ℹ️ The result will be a public web address like
> `https://YOUR-USERNAME.github.io/game-engine-studio/` that you can share with students.

### Before you start
1. You need a free **GitHub account**. If you don't have one, go to <https://github.com>,
   click **Sign up**, and follow the steps (email, password, username).
2. Decide on a **repository name**. In this guide we use `game-engine-studio`. You can choose
   any name, but avoid spaces and Turkish characters (use `a-z`, `0-9`, and `-`).

---

### 🅰️ Method A — Upload through the website (no command line)

**Step 1 — Create a new repository**
1. Log in to <https://github.com>.
2. At the top-right, click the **`+`** icon → **New repository**.
3. **Repository name:** type `game-engine-studio`.
4. **Description** (optional): e.g. `Interactive game engine learning tool`.
5. Choose **Public** (Pages on a free account requires Public).
6. **Do NOT** tick "Add a README file" / .gitignore / license (your folder already has files).
7. Click the green **Create repository** button.

**Step 2 — Upload your files**
1. On the new empty repository page, find the link that says
   **"uploading an existing file"** (or click **Add file → Upload files**).
2. Open your project folder (`MaterialDesign`) on your computer in File Explorer.
3. **Select everything inside it** and drag it onto the GitHub upload area. Make sure you upload
   the **contents**, not the parent folder. You must end up with this structure in the repo root:
   ```
   index.html
   .nojekyll
   css/style.css
   js/main.js
   vendor/three.module.js
   vendor/OrbitControls.js
   ```
   > 📌 Drag the **folders too** (`css`, `js`, `vendor`). GitHub keeps the folder structure.
   > 📌 The hidden file **`.nojekyll`** is important — see the note at the end. If your File
   > Explorer hides it, enable **View → Hidden items** first, then include it in the drag.
4. Scroll down to **"Commit changes"**, leave the default message, and click **Commit changes**.
5. Wait until the file list shows `index.html`, the `css`, `js`, and `vendor` folders.

**Step 3 — Turn on GitHub Pages**
1. In your repository, click the **Settings** tab (top of the page).
2. In the left sidebar, click **Pages**.
3. Under **"Build and deployment" → "Source"**, select **Deploy from a branch**.
4. Under **"Branch"**, open the first dropdown and choose **`main`**.
5. Leave the folder dropdown as **`/ (root)`**.
6. Click **Save**.

**Step 4 — Open your live site**
1. Stay on the **Settings → Pages** screen and wait ~1–3 minutes.
2. Refresh the page. A green box appears: **"Your site is live at …"** with a link like:
   ```
   https://YOUR-USERNAME.github.io/game-engine-studio/
   ```
3. Click it. The studio opens. 🎉 Share this link with your students.

> If you see a **404** for the first couple of minutes, that's normal — Pages is still building.
> Wait a bit and refresh. See **Troubleshooting** below if it persists.

**Updating the site later (Method A)**
- Go to the repo → open the file you want to change → click the **pencil ✏️** icon → edit →
  **Commit changes**. Or use **Add file → Upload files** to replace files.
- The live site updates automatically about 1–2 minutes after each commit
  (do a hard refresh: **Ctrl+F5**).

---

### 🅱️ Method B — Upload with Git (command line)

**Step 0 — One-time setup**
- Install Git from <https://git-scm.com/downloads> (default options are fine).
- Create the **empty** repository on GitHub first (do **Method A → Step 1**, but stop after
  "Create repository" — do not upload anything).

**Step 1 — Open a terminal in the project folder**
- Windows: open the `MaterialDesign` folder, then in the address bar type `cmd` and press Enter
  (or right-click → "Open in Terminal").

**Step 2 — Run these commands one by one**
Replace `YOUR-USERNAME` with your real GitHub username:
```bash
git init
git add .
git commit -m "Game Engine Studio"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/game-engine-studio.git
git push -u origin main
```
- The first `git push` may ask you to log in to GitHub in a browser window — approve it.

**Step 3 — Turn on Pages** → exactly the same as **Method A → Step 3 and Step 4**.

**Updating the site later (Method B)**
```bash
git add .
git commit -m "Update"
git push
```

---

### 🩺 Troubleshooting

| Symptom | Fix |
|---------|-----|
| Page is **blank** or stuck on "Preparing 3D scene…" | The `vendor/` folder (with `three.module.js` and `OrbitControls.js`) was not uploaded, or filenames differ in **case**. GitHub Pages is **case-sensitive**: `js/Main.js` ≠ `js/main.js`. Re-upload the exact files/folders. |
| **404** page not found (after 5+ minutes) | Make sure `index.html` is in the **root** of the repo (not inside a subfolder). The Pages Source must be **Branch: main / (root)**. |
| Styling/3D missing, works locally but not on Pages | Add the empty **`.nojekyll`** file to the repo root (it is already in this project). Without it, GitHub may ignore some files. |
| Changes don't show up | Wait 1–2 minutes after committing, then hard-refresh with **Ctrl + F5**. |

---

## 📁 Project Structure

```
.
├── index.html              # Page skeleton, stages and panels
├── css/style.css           # Dark "game editor" theme
├── js/main.js              # Three.js scenes, hierarchy, inspector, animation, i18n
├── vendor/
│   ├── three.module.js     # Three.js r160 (local — no internet needed)
│   └── OrbitControls.js    # Camera controls (local)
├── baslat.bat              # Windows: double-click → local server + browser
├── .nojekyll               # Tells GitHub Pages to serve files as-is
└── README.md
```

---

## 🎓 How to Use It in Class

Walk down the page following the journey:

| Stage | What to demonstrate |
|-------|---------------------|
| **01 · Texture** | Pick different patterns; show how the same image **tiles** across a surface. Point out that the chosen texture carries into the next stage. |
| **02 · Material** | Fill the texture slot, play with **Metalness / Roughness**; show the sphere updating live. Drive home: "Texture + properties = Material". |
| **03 · GameObject** | Run **1) Add Mesh → 2) Apply Material**. Show the component list (**Transform / Mesh Filter / Mesh Renderer**) filling up — same idea as the Unity Inspector. Toggle **Wireframe** to reveal the mesh. |
| **04 · Avatar** | Press **Next** to run the editor tour (Hierarchy → Mesh → Rig → Animation → Avatar). Rotate `Hips` (parent/child), turn on **Rig**, and play **Wave / Walk** to watch the animation drive the rig. |

> 💡 Tip: Switch to **EN** at the top right to run the same tour in English (for international students).

---

## 🛠️ Tech

- [Three.js](https://threejs.org/) `r160` (bundled locally in `vendor/`, no build step, no CDN)
- Plain HTML + CSS + JavaScript (ES modules)

## 📜 License

Free to use and adapt for educational purposes.
