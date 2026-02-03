# Metal Cow Scouting App - Complete Integration Guide

## Overview
Complete instructions to implement the Metal Cow Scouting App as a feature/sub-page on the main Metal Cow website. This app handles pit & field scouting with real-time cloud data sync, analytics, and custom modal dialogs.

---

## Features
✅ Multi-page scouting forms (Pit & Field data)  
✅ Real-time Supabase cloud database sync  
✅ Custom modal system (replaces alert/confirm/prompt)  
✅ Data visualization with Chart.js  
✅ Data viewer and admin delete controls  
✅ Mobile-responsive dark theme with neon green accents  
✅ Session management  
✅ Smooth animations  

---

## Prerequisites
- Supabase account (free tier works: https://supabase.com)
- Chart.js library (loaded via CDN)
- Basic HTML/CSS/JS knowledge
- Metal Cow logo image (PNG)

---

## PART 1: Supabase Database Setup

### 1.1 Create Supabase Project
1. Go to https://supabase.com and sign up/login
2. Create new project (free tier)
3. Note your **Project URL** and **Anon Key** (will use later)

### 1.2 Create Database Table
In Supabase, go to **SQL Editor** and run:

```sql
CREATE TABLE scouting_entries (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),
    comp_name TEXT,
    scout_name TEXT,
    form_type TEXT,
    team_number INT,
    match_number INT,
    details JSONB
);
```

### 1.3 Get Your API Keys
- Go to **Project Settings → API**
- Copy your **Project URL** (this is SB_URL)
- Copy your **Anon Key** (this is SB_KEY)
- You'll add these to `script.js` later

---

## PART 2: Create Folder Structure

Create this structure in your website repo:

```
metal-cow-scouting/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── script.js
├── html/
│   ├── login.html
│   ├── pit.html
│   ├── field.html
│   ├── store.html
│   └── stats.html
└── img/
    └── MCRimage3.png  (place Metal Cow logo here)
```

---

## PART 3: Create HTML Files

### index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Metal Cow | Scouting System</title>
    <link rel="stylesheet" href="./css/styles.css">
</head>
<body>
    <img src="./img/MCRimage3.png" class="MCRimage3" alt="Metal Cow logo">
    <div class="scouting-container">
        <h2>Metal Cow Scouting</h2>
        <div class="scouting-box" style="text-align: center;">
            <p>Welcome to the Metal Cow Scouting System</p>
            <button onclick="window.location.href='html/login.html'" style="width: auto; padding: 12px 24px;">Start Scouting</button>
        </div>
    </div>
</body>
</html>
```

### html/login.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Metal Cow | Scout Access</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
    <img src="../img/MCRimage3.png" class="MCRimage3" alt="Metal Cow logo">
    <div class="scouting-container">
        <h2>Scout Access</h2>
        <div class="scouting-box">
            <div class="question">
                <label for="compName">Competition</label>
                <select id="compName">
                    <option value="2026ilpe">Central Illinois (Peoria)</option>
                    <option value="2026mokc">Greater Kansas City</option>
                </select>
            </div>
            <div class="question">
                <label for="username">Scout Name</label>
                <input type="text" id="username" placeholder="Enter your name">
            </div>
            <button type="button" onclick="handleLogin()">Launch System</button>
        </div>
    </div>
    <script src="../js/script.js"></script>
</body>
</html>
```

### html/pit.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Metal Cow | Pit Scouting</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
    <img src="../img/MCRimage3.png" class="MCRimage3" alt="Metal Cow logo">
    <nav>
        <ul>
            <li><a href="login.html">Login</a></li>
            <li><a href="pit.html">Pit</a></li>
            <li><a href="field.html">Field</a></li>
            <li><a href="store.html">Data</a></li>
            <li><a href="stats.html">Analytics</a></li>
        </ul> 
    </nav>
    
    <h2>Pit Scouting</h2>

    <form id="scoutingForm" onsubmit="sendData(event)">
        <div class="question">
            <label for="teamNumber">Team Number</label>
            <input type="number" id="teamNumber" name="teamNumber" placeholder="e.g. 4213" required>
        </div>

        <div class="question">
            <label>Drivetrain Type</label>
            <div class="radio-group">
                <label class="check-inline"><input type="radio" name="drivetrain" value="Tank" required> Tank</label>
                <label class="check-inline"><input type="radio" name="drivetrain" value="Swerve"> Swerve</label>
                <label class="check-inline"><input type="radio" name="drivetrain" value="Other"> Other</label>
            </div>
        </div>

        <fieldset>
            <legend>Autonomous Period</legend>
            <div class="question">
                <label for="fuelPreload">Number of fuel preloaded?</label>
                <input type="number" id="fuelPreload" name="fuelPreload" min="0" max="8">
            </div>
            
            <label class="check-inline"><input type="checkbox" name="autoMoved"> Auto Moved?</label>
            <label class="check-inline"><input type="checkbox" name="autoScored"> Auto Scored?</label>
            <label class="check-inline"><input type="checkbox" name="autoClimb"> Auto Climb?</label>
            
            <div class="question" style="margin-top:10px;">
                <label for="autos">Describe Autonomous Routines</label>
                <textarea id="autos" name="autos" rows="2" placeholder="e.g. 23 ball auto, move off line..."></textarea>
            </div>
        </fieldset>

        <fieldset>
            <legend>Teleop Capabilities</legend>
            <div class="question">
                <label>Obstacles</label>
                <label class="check-inline"><input type="checkbox" name="overBump"> Can it go over the Bump?</label>
                <label class="check-inline"><input type="checkbox" name="underTrench"> Can it go under the Trench?</label>
            </div>

            <div class="question">
                <label for="ballCapacity">Max balls scored in one cycle?</label>
                <input type="number" id="ballCapacity" name="ballCapacity" min="0">
            </div>
            <div class="question">
                <label for="fuelpersec">Fuel per second?</label>
                <input type="number" id="fuelpersec" name="fuelpersec" min="0">
            </div>
        </fieldset>

        <fieldset>
            <legend>Endgame & Ranking Points</legend>
            <div class="question">
                <label>Can it Climb?</label>
                <div class="radio-group">
                    <label class="check-inline"><input type="radio" name="climb" value="Yes"> Yes</label>
                    <label class="check-inline"><input type="radio" name="climb" value="No"> No</label>
                </div>
            </div>

            <div class="question">
                <label for="climbLevel">What level can they reach?</label>
                <select id="climbLevel" name="climbLevel">
                    <option value="None">N/A</option>
                    <option value="Level 1">Level 1</option>
                    <option value="Level 2">Level 2</option>
                    <option value="Level 3">Level 3</option>
                </select>
            </div>

            <label class="check-inline"><input type="checkbox" name="energizedRP"> Energized Ranking Point?</label>
            <label class="check-inline"><input type="checkbox" name="superchargedRP"> Supercharged Ranking Point?</label>
        </fieldset>

        <button type="submit">Submit Pit Data</button>
    </form>

    <script src="../js/script.js"></script>
</body>
</html>
```

### html/field.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Metal Cow | Field Scouting</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
    <img src="../img/MCRimage3.png" class="MCRimage3" alt="Metal Cow logo">
    <nav>
        <ul>
            <li><a href="login.html">Login</a></li>
            <li><a href="pit.html">Pit</a></li>
            <li><a href="field.html">Field</a></li>
            <li><a href="store.html">Data</a></li>
            <li><a href="stats.html">Analytics</a></li>
        </ul> 
    </nav>
    
    <h2>Field Scouting</h2>

    <form id="fieldForm" onsubmit="sendData(event)">
        <div class="question">
            <label for="matchNumber">Match Number</label>
            <input type="number" id="matchNumber" name="matchNumber" required>
        </div>

        <div class="question">
            <label for="teamNumberField">Team Number</label>
            <input type="number" id="teamNumberField" name="teamNumber" required>
        </div>

        <fieldset>
            <legend>Live Performance</legend>
            <div class="question">
                <label for="scoreCount">Game Pieces Scored</label>
                <input type="number" id="scoreCount" name="scoreCount" value="0">
            </div>
            
            <div class="question">
                <label>Robot Status</label>
                <div class="radio-group">
                    <label class="check-inline"><input type="radio" name="status" value="Operational" checked> Operational</label>
                    <label class="check-inline"><input type="radio" name="status" value="Disabled"> Disabled</label>
                </div>
            </div>
        </fieldset>

        <fieldset>
            <legend>Endgame Result</legend>
            <div class="question">
                <label>Climb Success?</label>
                <div class="radio-group">
                    <label class="check-inline"><input type="radio" name="matchClimb" value="Success"> Success</label>
                    <label class="check-inline"><input type="radio" name="matchClimb" value="Fail"> Fail</label>
                    <label class="check-inline"><input type="radio" name="matchClimb" value="N/A"> N/A</label>
                </div>
            </div>
        </fieldset>

        <div class="question">
            <label for="matchNotes">Match Notes</label>
            <textarea id="matchNotes" name="matchNotes" rows="4" placeholder="Defense, driver speed, or breakages..."></textarea>
        </div>

        <button type="submit">Submit Match Data</button>
    </form>

    <script src="../js/script.js"></script>
</body>
</html>
```

### html/store.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Metal Cow | Cloud Data</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
    <nav>
        <ul>
            <li><a href="login.html">Login</a></li>
            <li><a href="pit.html">Pit</a></li>
            <li><a href="field.html">Field</a></li>
            <li><a href="store.html">Data</a></li>
            <li><a href="stats.html">Analytics</a></li>
        </ul> 
    </nav>
    <h2>Saved Scouting Data</h2>
    <table>
        <thead>
            <tr>
                <th>Type</th>
                <th>Team</th>
                <th>Comp</th>
                <th>Scout</th>
                <th>Quick Info</th>
            </tr>
        </thead>
        <tbody id="tableBody"></tbody>
    </table>
    <div class="admin-controls" style="margin-top: 20px; text-align: center;">
        <button type="button" id="clearBtn" onclick="clearAllData()">
            ⚠️ Clear All Cloud Data
        </button>
    </div>
    <script src="../js/script.js"></script>
</body>
</html>
```

### html/stats.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Metal Cow | Analytics</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
    <nav>
        <ul>
            <li><a href="login.html">Login</a></li>
            <li><a href="pit.html">Pit</a></li>
            <li><a href="field.html">Field</a></li>
            <li><a href="store.html">Data</a></li>
            <li><a href="stats.html">Analytics</a></li>
        </ul> 
    </nav>

    <h2>Team Analytics</h2>

    <div class="chart-box">
        <h3>Fuel Per Second</h3>
        <canvas id="fuelChart"></canvas>
    </div>

    <div class="chart-box">
        <h3>Climb Success Rate</h3>
        <canvas id="climbChart"></canvas>
    </div>

    <script src="../js/script.js"></script>
</body>
</html>
```

---

## PART 4: Create JavaScript (js/script.js)

Replace `YOUR-PROJECT.supabase.co` and `YOUR-ANON-KEY` with actual values from Supabase:

```javascript
// --- 1. INITIALIZATION ---
const SB_URL = 'https://YOUR-PROJECT.supabase.co'; 
const SB_KEY = 'YOUR-ANON-KEY'; 

const scoutDB = window.supabase.createClient(SB_URL, SB_KEY);

// --- CUSTOM MODAL SYSTEM ---
function _createAppModal() {
    if (document.getElementById('app-modal-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'app-modal-overlay';
    overlay.innerHTML = `
        <div id="app-modal" role="dialog" aria-modal="true">
            <div id="app-modal-header"></div>
            <div id="app-modal-body"></div>
            <div id="app-modal-input-container" style="display:none; margin-bottom:12px;">
                <input id="app-modal-input" type="text" />
            </div>
            <div id="app-modal-footer">
                <button id="app-modal-cancel">Cancel</button>
                <button id="app-modal-ok">OK</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#app-modal-ok').addEventListener('click', () => {
        overlay.classList.remove('show');
        const ev = new CustomEvent('appModalClosed');
        overlay.dispatchEvent(ev);
    });
    overlay.querySelector('#app-modal-cancel').addEventListener('click', () => {
        overlay.classList.remove('show');
        const ev = new CustomEvent('appModalClosed');
        overlay.dispatchEvent(ev);
    });
}

function showModal(message, title) {
    _createAppModal();
    const overlay = document.getElementById('app-modal-overlay');
    overlay.querySelector('#app-modal-header').textContent = title || '';
    overlay.querySelector('#app-modal-body').textContent = message || '';

    return new Promise(resolve => {
        const onClose = () => {
            overlay.removeEventListener('appModalClosed', onClose);
            resolve();
        };
        overlay.addEventListener('appModalClosed', onClose);
        overlay.classList.add('show');
        setTimeout(() => overlay.querySelector('#app-modal-ok').focus(), 50);
    });
}

function showConfirm(message, title) {
    _createAppModal();
    const overlay = document.getElementById('app-modal-overlay');
    const ok = overlay.querySelector('#app-modal-ok');
    const cancel = overlay.querySelector('#app-modal-cancel');
    const inputContainer = overlay.querySelector('#app-modal-input-container');

    overlay.querySelector('#app-modal-header').textContent = title || '';
    overlay.querySelector('#app-modal-body').textContent = message || '';
    inputContainer.style.display = 'none';

    return new Promise(resolve => {
        const onOk = () => { cleanup(); overlay.classList.remove('show'); resolve(true); };
        const onCancel = () => { cleanup(); overlay.classList.remove('show'); resolve(false); };
        const cleanup = () => { ok.removeEventListener('click', onOk); cancel.removeEventListener('click', onCancel); };
        ok.addEventListener('click', onOk);
        cancel.addEventListener('click', onCancel);
        overlay.classList.add('show');
        setTimeout(() => ok.focus(), 50);
    });
}

function showPrompt(message, title, defaultValue = '') {
    _createAppModal();
    const overlay = document.getElementById('app-modal-overlay');
    const ok = overlay.querySelector('#app-modal-ok');
    const cancel = overlay.querySelector('#app-modal-cancel');
    const inputContainer = overlay.querySelector('#app-modal-input-container');
    const input = overlay.querySelector('#app-modal-input');

    overlay.querySelector('#app-modal-header').textContent = title || '';
    overlay.querySelector('#app-modal-body').textContent = message || '';
    input.value = defaultValue;
    inputContainer.style.display = 'block';

    return new Promise(resolve => {
        const onOk = () => { cleanup(); const v = input.value; overlay.classList.remove('show'); resolve(v); };
        const onCancel = () => { cleanup(); overlay.classList.remove('show'); resolve(null); };
        const cleanup = () => { ok.removeEventListener('click', onOk); cancel.removeEventListener('click', onCancel); };
        ok.addEventListener('click', onOk);
        cancel.addEventListener('click', onCancel);
        overlay.classList.add('show');
        setTimeout(() => input.focus(), 50);
    });
}

// --- 2. LOGIN ---
async function handleLogin() {
    const user = document.getElementById('username').value;
    const comp = document.getElementById('compName').value;

    if (!user || !comp) {
        await showModal("Please enter both Name and Competition!");
        return;
    }

    try {
        const { error } = await scoutDB.auth.signInAnonymously();
        if (error) {
            await showModal("Login Error: " + (error.message || JSON.stringify(error)));
            return;
        }

        sessionStorage.setItem('scoutName', user);
        sessionStorage.setItem('activeComp', comp);
        await showModal("Logged in as " + user);
        window.location.href = "pit.html"; 
    } catch (err) {
        await showModal("Error: " + err.message);
    }
}

// --- 3. SEND DATA ---
async function sendData(event) {
    if (event) event.preventDefault(); 
    
    const scoutName = sessionStorage.getItem('scoutName');
    const activeComp = sessionStorage.getItem('activeComp');

    if (!scoutName) {
        await showModal("Session missing. Please login again.");
        window.location.href = "login.html";
        return;
    }

    const form = event.target;
    const formData = new FormData(form);
    const allInputs = Object.fromEntries(formData.entries());

    form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        allInputs[cb.name] = cb.checked;
    });

    const type = document.querySelector('h2').innerText.includes("Field") ? "Field" : "Pit";

    try {
        const { error } = await scoutDB
            .from('scouting_entries')
            .insert([{
                comp_name: activeComp,
                scout_name: scoutName,
                form_type: type,
                team_number: parseInt(allInputs.teamNumber),
                match_number: allInputs.matchNumber ? parseInt(allInputs.matchNumber) : null,
                details: allInputs 
            }]);

        if (error) throw error;

        await showModal("Data Saved Successfully!");
        form.reset();
    } catch (err) {
        console.error("Save error:", err);
        await showModal("Error: " + err.message);
    }
}

// --- 4. LOAD DATA ---
async function loadTableRows() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;

    const { data, error } = await scoutDB
        .from('scouting_entries')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return;

    tableBody.innerHTML = data.map(row => `
        <tr>
            <td>${row.form_type}</td>
            <td>${row.team_number}</td>
            <td>${row.comp_name}</td>
            <td>${row.scout_name}</td>
            <td>${row.details.status || row.details.drivetrain || 'N/A'}</td>
            <td>${row.details.matchNotes || row.details.autos || 'N/A'}</td>
        </tr>
    `).join('');
}

// --- 5. ANALYTICS ---
async function renderCharts() {
    if (typeof Chart === 'undefined' || !document.getElementById('fuelChart')) {
        return; 
    }

    const { data: entries, error } = await scoutDB.from('scouting_entries').select('*');
    if (error) return console.error(error);

    const teams = {};

    entries.forEach(entry => {
        const t = entry.team_number;
        const d = entry.details || {};
        if (!teams[t]) teams[t] = { fuel: [], climbWins: 0, matchTotal: 0 };

        if (d.fuelpersec) teams[t].fuel.push(parseFloat(d.fuelpersec));

        if (entry.form_type === "Field") {
            teams[t].matchTotal++;
            if (d.matchClimb === "Success") teams[t].climbWins++;
        }
    });

    const teamLabels = Object.keys(teams);

    new Chart(document.getElementById('fuelChart'), {
        type: 'bar',
        data: {
            labels: teamLabels,
            datasets: [{
                label: 'Avg Fuel/Sec',
                data: teamLabels.map(t => teams[t].fuel.reduce((a,b)=>a+b,0) / teams[t].fuel.length || 0),
                backgroundColor: '#9c1c1c'
            }]
        }
    });

    new Chart(document.getElementById('climbChart'), {
        type: 'pie',
        data: {
            labels: teamLabels,
            datasets: [{
                label: 'Climb Success %',
                data: teamLabels.map(t => (teams[t].climbWins / teams[t].matchTotal * 100) || 0),
                backgroundColor: ['#f1c40f', '#e67e22', '#3498db', '#2ecc71']
            }]
        }
    });
}

// --- 6. DELETE DATA ---
async function clearAllData() {
    const confirmDelete = await showConfirm("Are you sure you want to PERMANENTLY delete all scouting data?");
    
    if (confirmDelete) {
        const verify = await showPrompt("Type 'DELETE ALL' to confirm:");
        
        if (verify === "DELETE ALL") {
            try {
                const { error } = await scoutDB
                    .from('scouting_entries')
                    .delete()
                    .gt('id', 0); 

                if (error) throw error;

                await showModal("Database cleared successfully!");
                location.reload();
                
            } catch (err) {
                console.error("Delete failed:", err);
                await showModal("Error: " + err.message);
            }
        }
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadTableRows();
    renderCharts();
});
```

---

## PART 5: Create Stylesheet (css/styles.css)

```css
/* --- GLOBAL BASE STYLES --- */
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    padding: 20px;
    max-width: 650px;
    margin: auto;
    background-color: #0f0f0f;
    color: #e0e0e0;
}

/* --- NAVIGATION --- */
nav {
    margin-bottom: 25px;
    border-bottom: 2px solid #63AD3F;
    padding-bottom: 10px;
}

nav ul {
    list-style: none;
    padding: 0;
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
}

nav a {
    color: #63AD3F;
    text-decoration: none;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
}

nav a:hover {
    color: #ffffff;
}

/* --- HEADINGS --- */
h2 {
    text-align: center;
    color: #63AD3F;
    text-transform: uppercase;
    letter-spacing: 2px;
}

.MCRimage3 {
    width: auto;
    height: 200px;
    display: flex;
    margin: 0 auto;
    margin-bottom: 10px;
}

/* --- CONTAINERS --- */
form, .scouting-box {
    background: #1a1a1a;
    padding: 25px;
    border-radius: 12px;
    border: 1px solid #333;
    box-shadow: 0 0 15px rgba(57, 255, 20, 0.1);
}

fieldset {
    border: 1px solid #63AD3F;
    border-radius: 8px;
    margin-bottom: 20px;
    padding: 15px;
}

legend {
    color: #63AD3F;
    font-weight: bold;
    padding: 0 10px;
    font-size: 0.9rem;
    text-transform: uppercase;
}

/* --- FORM ELEMENTS --- */
.question {
    margin-bottom: 15px;
}

label {
    display: block;
    font-weight: bold;
    margin-bottom: 5px;
    color: #63AD3F;
}

input[type="number"],
input[type="text"],
textarea,
select {
    width: 100%;
    padding: 10px;
    background-color: #0a0a0a;
    border: 1px solid #444;
    border-radius: 4px;
    color: #63AD3F;
    font-size: 1rem;
    box-sizing: border-box;
}

input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: #63AD3F;
    box-shadow: 0 0 5px #63AD3F;
}

.radio-group {
    display: flex;
    gap: 15px;
    background: #222;
    padding: 10px;
    border-radius: 6px;
    flex-wrap: wrap;
}

.check-inline {
    display: flex;
    align-items: center;
    font-weight: normal;
    color: #e0e0e0;
    cursor: pointer;
    margin-bottom: 8px;
}

.check-inline input {
    margin-right: 10px;
}

/* --- BUTTONS --- */
button {
    width: 100%;
    padding: 12px;
    background-color: #63AD3F;
    color: #000;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 18px;
    font-weight: bold;
    text-transform: uppercase;
    transition: 0.3s;
}

button:hover {
    background-color: #32cd32;
    box-shadow: 0 0 20px rgba(57, 255, 20, 0.4);
    transform: translateY(-2px);
}

/* --- TABLES --- */
table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    background: #1a1a1a;
    color: #e0e0e0;
}

th, td {
    padding: 12px;
    border: 1px solid #333;
    text-align: left;
}

th {
    background-color: #0a0a0a;
    color: #63AD3F;
    text-transform: uppercase;
    font-size: 0.8rem;
}

tr:hover {
    background-color: #222;
}

/* --- CHARTS --- */
.chart-box {
    background-color: #ffffff;
    color: #000;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 30px;
}

/* --- CUSTOM MODAL --- */
#app-modal-overlay {
    display: none;
}

#app-modal-overlay.show {
    display: flex;
    position: fixed;
    inset: 0;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.6);
    z-index: 9999;
    padding: 24px;
    box-sizing: border-box;
}

#app-modal {
    background: #0f0f0f;
    color: #e6e6e6;
    border: 1px solid #222;
    padding: 22px 20px;
    width: 100%;
    max-width: 520px;
    border-radius: 12px;
    box-shadow: 0 12px 36px rgba(0,0,0,0.6);
    font-size: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transform: translateY(-6px);
    opacity: 0;
    transition: transform 180ms ease, opacity 180ms ease;
}

#app-modal-overlay.show #app-modal {
    transform: translateY(0);
    opacity: 1;
}

#app-modal-header {
    font-weight: 800;
    color: #63AD3F;
    margin: 0;
    font-size: 1.05rem;
}

#app-modal-body {
    margin: 0;
    line-height: 1.45;
    color: #dcdcdc;
}

#app-modal-input-container {
    margin-top: 6px;
}

#app-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 6px;
}

#app-modal-footer button {
    min-width: 84px;
    padding: 8px 12px;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    width: auto;
}

#app-modal-footer #app-modal-ok {
    background: #63AD3F;
    color: #000;
}

#app-modal-footer #app-modal-ok:focus {
    outline: 2px solid #9cff90;
}

#app-modal-footer #app-modal-cancel {
    background: transparent;
    border: 1px solid #444;
    color: #e6e6e6;
}

#app-modal-input {
    background: #0a0a0a;
    border: 1px solid #333;
    color: #e6e6e6;
    padding: 10px;
    border-radius: 8px;
    width: 100%;
    box-sizing: border-box;
}

/* --- RESPONSIVE --- */
@media (max-width: 600px) {
    body {
        padding: 10px;
    }

    nav ul {
        gap: 10px;
        font-size: 0.85rem;
    }

    form, .scouting-box {
        padding: 15px;
    }

    .radio-group {
        flex-direction: column;
        gap: 10px;
    }
}
```

---

## PART 6: Setup Instructions

1. **Add Supabase credentials** to `js/script.js`:
   - Replace `YOUR-PROJECT.supabase.co` with your Supabase project URL
   - Replace `YOUR-ANON-KEY` with your Anon Key

2. **Add logo image**: Place your `MCRimage3.png` in `img/` folder

3. **Link from main site**: Add this link to your main Metal Cow website nav:
   ```html
   <a href="/metal-cow-scouting/index.html">Scouting</a>
   ```

4. **Test**:
   - Open `index.html` in browser
   - Click "Start Scouting"
   - Login with test name + competition
   - Submit pit/field data
   - View data in store page
   - Check analytics charts

---

## Customization

**Colors:**
- Primary Green: `#63AD3F` → change to your brand
- Background: `#0f0f0f` → change dark tone
- Accent: `#e6e6e6` → change text color

**Competitions:**
Edit `html/login.html` select options:
```html
<option value="2026ilpe">Your Competition Name</option>
```

**Forms:**
Add/remove fields in `pit.html` and `field.html`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Data not saving | Check Supabase credentials in script.js |
| Charts not showing | Ensure Chart.js CDN is loading; check browser console |
| Modal not appearing | Verify CSS is linked; check #app-modal-overlay in inspector |
| 404 on page links | Check relative paths in HTML nav links |

---

## Features Implemented

✅ Anonymous login with session storage  
✅ Pit scouting form (robots, capabilities)  
✅ Field scouting form (match performance)  
✅ Real-time cloud sync (Supabase)  
✅ Data viewer table with sorting  
✅ Admin delete with 2-step confirmation  
✅ Analytics dashboard with Chart.js  
✅ Custom modal dialogs (alert/confirm/prompt)  
✅ Mobile responsive design  
✅ Dark theme with neon accents  

---

**Ready to deploy!** Copy this prompt and the file structure to another repo and follow Part 1-6.
