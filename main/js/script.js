// --- 1. INITIALIZATION ---
// Replace these with your actual keys from Supabase Dashboard -> Project Settings -> API
const SB_URL = 'https://qkubjmuukapewydsurag.supabase.co'; 
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdWJqbXV1a2FwZXd5ZHN1cmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNjMyNDMsImV4cCI6MjA4NDgzOTI0M30.jWTpxSizOajbgHjgSNg0gwzOfuL0-DpkxnYQX3nauv8'; 

const scoutDB = window.supabase.createClient(SB_URL, SB_KEY);

// --- CUSTOM MODAL (replaces alert) ---
function _createAppModal() {
    if (document.getElementById('app-modal-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'app-modal-overlay';
    overlay.innerHTML = `
        <div id="app-modal" role="dialog" aria-modal="true">
            <div id="app-modal-header"></div>
            <div id="app-modal-body"></div>
            <div id="app-modal-input-container" style="display:none; margin-bottom:12px;">
                <input id="app-modal-input" type="text" style="width:100%; padding:8px; border-radius:4px; border:1px solid #333; background:#0a0a0a; color:#e6e6e6;" />
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
        // Show
        overlay.classList.add('show');
        // Focus OK for keyboard accessibility
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

// --- 2. LOGIN LOGIC ---
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
            await showModal("signInAnonymously Error: " + (error.message || JSON.stringify(error)));
            throw error;
        }

        sessionStorage.setItem('scoutName', user);
        sessionStorage.setItem('activeComp', comp);
        await showModal("Logged in as " + user);
        window.location.href = "../main/html/pit.html"; 
    } catch (err) {
        await showModal("Login Error: " + err.message);
    }
}

// --- 3. SEND DATA (Field & Pit) ---
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

    // Handle checkboxes correctly
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

// --- 4. LOAD DATA (Store Page) ---
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

document.addEventListener('DOMContentLoaded', loadTableRows);
async function renderCharts() {
    // SAFETY CHECK: If Chart.js isn't loaded or we aren't on the stats page, stop.
    if (typeof Chart === 'undefined' || !document.getElementById('fuelChart')) {
        return; 
    }

    const { data: entries, error } = await scoutDB.from('scouting_entries').select('*');
    if (error) return console.error(error);

    const teams = {};

    // Grouping all sub-topics by Team Number
    entries.forEach(entry => {
        const t = entry.team_number;
        const d = entry.details || {};
        if (!teams[t]) teams[t] = { fuel: [], climbWins: 0, matchTotal: 0, ballMax: 0 };

        // Sub-topic: Fuel Per Second
        if (d.fuelpersec) teams[t].fuel.push(parseFloat(d.fuelpersec));

        // Sub-topic: Climb (Success Rate)
        if (entry.form_type === "Field") {
            teams[t].matchTotal++;
            if (d.matchClimb === "Success") teams[t].climbWins++;
        }

        // Sub-topic: Ball Capacity
        if (d.ballCapacity) {
            const cap = parseInt(d.ballCapacity);
            if (cap > teams[t].ballMax) teams[t].ballMax = cap;
        }
    });

    const teamLabels = Object.keys(teams);

    // Render Fuel Graph
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

    // Render Climb Graph
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

// Keep your existing DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
    loadTableRows();
    renderCharts(); // This will now run safely
});

// --- 5. DELETE LOGIC ---
async function clearAllData() {
    const confirmDelete = await showConfirm("Are you sure you want to PERMANENTLY delete all scouting data?");
    
    if (confirmDelete) {
        const verify = await showPrompt("Type 'DELETE ALL' to confirm:");
        
        if (verify === "JAI IS STUPID") {
            try {
                // This targets every row where the id is greater than 0
                const { error } = await scoutDB
                    .from('scouting_entries')
                    .delete()
                    .gt('id', 0); 

                if (error) throw error;

                await showModal("Database cleared successfully!");
                location.reload(); // Refresh to show empty table/charts
                
            } catch (err) {
                console.error("Delete failed:", err);
                await showModal("Error: " + err.message);
            }
        }
    }
}
/* ---QUERY STRINGS (Passing the User) --- */

const loginBtn = document.querySelector('button'); // Or your specific ID


// RUN THIS ON THE SCOUTING PAGE
const urlParams = new URLSearchParams(window.location.search);
const user = urlParams.get('user');


/* --- PART 2: THE BLUE ALLIANCE (Fetching Teams) --- */

async function fetchTBATeams() {
    const teamDropdown = document.getElementById('team-list');
    if (!teamDropdown) return; // Exit if we aren't on the scouting page

    const apiKey = 'YOUR_TBA_KEY_HERE'; // Get this from The Blue Alliance account
    const kansaskey = '2026mokc';
    const peoriakey = '2026ilpe';
    try {
        const response = await fetch(`https://www.thebluealliance.com/api/v3/event/${kansaskey}/teams/simple`, {
            headers: { 'X-TBA-Auth-Key': apiKey }
        });
        const teams = await response.json();

        // Sort teams numerically
        teams.sort((a, b) => a.team_number - b.team_number);

        teams.forEach(team => {
            let option = document.createElement('option');
            option.value = team.team_number;
            option.text = `${team.team_number} | ${team.nickname}`;
            teamDropdown.appendChild(option);
            if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            const name = document.querySelector('input[type="text"]').value;
            if (name) {
            // Sends them to the scouting page with the name in the URL
            window.location.href = "login.html?user=" ;
            } else {
                showModal("Please enter a username!");
            }
    });
}
        });
    } catch (error) {
        console.error("Blue Alliance Error:", error);
    }
}

// Fire the function when the page loads
window.onload = fetchTBATeams;