// --- 1. INITIALIZATION ---
// Replace these with your actual keys from Supabase Dashboard -> Project Settings -> API
const SB_URL = 'https://qkubjmuukapewydsurag.supabase.co'; 
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdWJqbXV1a2FwZXd5ZHN1cmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNjMyNDMsImV4cCI6MjA4NDgzOTI0M30.jWTpxSizOajbgHjgSNg0gwzOfuL0-DpkxnYQX3nauv8'; 

const scoutDB = window.supabase.createClient(SB_URL, SB_KEY);

// --- 2. LOGIN LOGIC ---
async function handleLogin() {
    const user = document.getElementById('username').value;
    const comp = document.getElementById('compName').value;

    if (!user || !comp) {
        alert("Please enter both Name and Competition!");
        return;
    }

    try {
        const { error } = await scoutDB.auth.signInAnonymously();
        if (error) throw error;

        sessionStorage.setItem('scoutName', user);
        sessionStorage.setItem('activeComp', comp);
        alert("Logged in as " + user);
        window.location.href = "index.html"; 
    } catch (err) {
        alert("Login Error: " + err.message);
    }
}

// --- 3. SEND DATA (Field & Pit) ---
async function sendData(event) {
    if (event) event.preventDefault(); 
    
    const scoutName = sessionStorage.getItem('scoutName');
    const activeComp = sessionStorage.getItem('activeComp');

    if (!scoutName) {
        alert("Session missing. Please login again.");
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

        alert("Data Saved Successfully!");
        form.reset();
    } catch (err) {
        console.error("Save error:", err);
        alert("Error: " + err.message);
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
    const confirmDelete = confirm("Are you sure you want to PERMANENTLY delete all scouting data?");
    
    if (confirmDelete) {
        const verify = prompt("Type 'DELETE ALL' to confirm:");
        
        if (verify === "JAI IS STUPID") {
            try {
                // This targets every row where the id is greater than 0
                const { error } = await scoutDB
                    .from('scouting_entries')
                    .delete()
                    .gt('id', 0); 

                if (error) throw error;

                alert("Database cleared successfully!");
                location.reload(); // Refresh to show empty table/charts
                
            } catch (err) {
                console.error("Delete failed:", err);
                alert("Error: " + err.message);
            }
        }
    }
}