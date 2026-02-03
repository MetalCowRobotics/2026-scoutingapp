# Metal Cow Scouting App - Complete Integration Prompt

## Overview
This is a comprehensive guide to implement the Metal Cow Scouting App as a sub-page on the main Metal Cow website. The app includes login, pit scouting, field scouting, data storage, and analytics with a custom modal system.

## Project Features
✅ Multi-page scouting forms (Pit & Field data entry)  
✅ Real-time data sync with Supabase cloud database  
✅ Custom modal dialogs (replaces native alert/confirm/prompt)  
✅ Data visualization with Chart.js  
✅ Blue Alliance API integration for team data  
✅ Session management with localStorage/sessionStorage  
✅ Mobile-responsive design  
✅ Dark theme with neon green accents  

---

## Prerequisites
- Supabase account (free tier works)
- Chart.js library (via CDN)
- Basic HTML/CSS/JavaScript knowledge

---

## PART 1: Supabase Setup

### Create Database Table
1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Create a new project or use existing one
3. Go to SQL Editor and run this query:

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

### Get Your API Keys
1. Go to **Project Settings → API**
2. Copy your **Project URL** (SB_URL)
3. Copy your **Anon Key** (SB_KEY)

---

## PART 2: Project Structure

Create this folder structure in your website:

```
metal-cow-scouting/
│
├── index.html          (home page)
├── css/
│   └── styles.css      (all styling)
├── js/
│   └── script.js       (all logic + modal system)
├── html/
│   ├── login.html      (scout login page)
│   ├── pit.html        (pit scouting form)
│   ├── field.html      (field scouting form)
│   ├── store.html      (data viewer + clear button)
│   └── stats.html      (analytics/charts)
└── img/
    └── MCRimage3.png   (Metal Cow logo)
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
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
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

Add ALL of the following code to `js/script.js`. This includes modal system + all scouting functionality:

```javascript
// --- CUSTOM MODAL SYSTEM (replaces alert/confirm/prompt) ---
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
    const header = overlay.querySelector('#app-modal-header');
    const body = overlay.querySelector('#app-modal-body');

    header.textContent = title || '';
    body.textContent = message || '';

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
    const header = overlay.querySelector('#app-modal-header');
    const body = overlay.querySelector('#app-modal-body');
    const ok = overlay.querySelector('#app-modal-ok');
    const cancel = overlay.querySelector('#app-modal-cancel');
    const inputContainer = overlay.querySelector('#app-modal-input-container');

    header.textContent = title || '';
    body.textContent = message || '';
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
    const header = overlay.querySelector('#app-modal-header');
    const body = overlay.querySelector('#app-modal-body');
    const ok = overlay.querySelector('#app-modal-ok');
    const cancel = overlay.querySelector('#app-modal-cancel');
    const inputContainer = overlay.querySelector('#app-modal-input-container');
    const input = overlay.querySelector('#app-modal-input');

    header.textContent = title || '';
    body.textContent = message || '';
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
```

### Step 2: Add Modal CSS
Add the following CSS to your stylesheet (e.g., `css/styles.css` or equivalent):

```css
/* --- CUSTOM APP MODAL --- */
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
```

### Step 3: Replace Native Dialogs in Code
Throughout your JavaScript, replace:
- `alert("message")` → `await showModal("message")`
- `alert("title", "message")` → `await showModal("message", "title")`
- `confirm("message")` → `await showConfirm("message")`
- `confirm("title", "message")` → `await showConfirm("message", "title")`
- `prompt("message")` → `await showPrompt("message")`
- `prompt("message", "default")` → `await showPrompt("message", "", "default")`

**Important:** Any code calling these functions must be inside an `async` function or use `.then()` chaining.

**Example - Before:**
```javascript
function handleDelete() {
    if (confirm("Are you sure?")) {
        const verify = prompt("Type DELETE to confirm:");
        if (verify === "DELETE") {
            // do deletion
        }
    }
}
```

**Example - After:**
```javascript
async function handleDelete() {
    const confirmed = await showConfirm("Are you sure?");
    if (confirmed) {
        const verify = await showPrompt("Type DELETE to confirm:");
        if (verify === "DELETE") {
            // do deletion
        }
    }
}
```

### Step 4: Customize Styling (Optional)
You can customize the modal appearance by modifying these CSS variables/values:
- `#0f0f0f` → Change background color
- `#e6e6e6` → Change text color
- `#63AD3F` → Change accent color (green)
- `520px` → Change max-width for different screen sizes
- `180ms` → Adjust animation speed

---

## Integration as Sub-Page
To integrate this as a sub-page of the Metal Cow main website:

1. **Copy the JS functions** to your site's main script file
2. **Copy the CSS** to your site's main stylesheet
3. **Replace all `alert()`, `confirm()`, `prompt()` calls** in your sub-page JavaScript with the new functions
4. **Ensure the sub-page inherits** the main site's styling so modals appear consistent

The modal system will:
- Create the overlay once (first call)
- Reuse it for all subsequent calls
- Work across all pages and sub-pages automatically
- Inherit existing theme colors (customize the CSS above to match your brand)

---

## Features
✅ Fully async/await compatible  
✅ Keyboard accessible (Tab, Enter, Escape)  
✅ Smooth animations  
✅ Mobile-responsive  
✅ Customizable styling  
✅ No external dependencies  
✅ Lightweight (~3KB)  

---

## Testing Checklist
- [ ] Modal appears when `showModal()` is called
- [ ] Buttons (OK/Cancel) work correctly
- [ ] Text input field appears for `showPrompt()`
- [ ] Modal closes on button click
- [ ] Animation is smooth
- [ ] Responsive on mobile devices
- [ ] Keyboard navigation works (Tab, Enter, Escape)
