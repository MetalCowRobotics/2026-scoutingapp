// --- 1. INITIALIZATION ---
const SB_URL = 'https://qkubjmuukapewydsurag.supabase.co'; 
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdWJqbXV1a2FwZXd5ZHN1cmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNjMyNDMsImV4cCI6MjA4NDgzOTI0M30.jWTpxSizOajbgHjgSNg0gwzOfuL0-DpkxnYQX3nauv8'; 
const TBA_KEY = 'd65auSCuK0kcJWb9Tn1enz5AefFvFOxAxx9pISQ849YRWQgolbt67bjkHqKXp1A0';

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
                <input id="app-modal-input" type="text" style="width:100%; padding:8px; border-radius:4px; border:1px solid #333; background:#0a0a0a; color:#e6e6e6;" />
            </div>
            <div id="app-modal-footer">
                <button id="app-modal-cancel">Cancel</button>
                <button id="app-modal-ok">OK</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#app-modal-ok').onclick = () => {
        overlay.classList.remove('show');
        overlay.dispatchEvent(new CustomEvent('appModalClosed'));
    };
    overlay.querySelector('#app-modal-cancel').onclick = () => {
        overlay.classList.remove('show');
        overlay.dispatchEvent(new CustomEvent('appModalClosed'));
    };
}

async function showModal(message, title) {
    _createAppModal();
    const o = document.getElementById('app-modal-overlay');
    o.querySelector('#app-modal-header').textContent = title || '';
    o.querySelector('#app-modal-body').textContent = message || '';
    return new Promise(r => {
        const cb = () => { o.removeEventListener('appModalClosed', cb); r(); };
        o.addEventListener('appModalClosed', cb);
        o.classList.add('show');
    });
}

async function showConfirm(message, title) {
    _createAppModal();
    const o = document.getElementById('app-modal-overlay');
    const ok = o.querySelector('#app-modal-ok');
    const cancel = o.querySelector('#app-modal-cancel');
    o.querySelector('#app-modal-header').textContent = title || '';
    o.querySelector('#app-modal-body').textContent = message || '';
    o.querySelector('#app-modal-input-container').style.display = 'none';
    return new Promise(r => {
        const onOk = () => { cleanup(); o.classList.remove('show'); r(true); };
        const onCancel = () => { cleanup(); o.classList.remove('show'); r(false); };
        const cleanup = () => { ok.onclick = null; cancel.onclick = null; };
        ok.onclick = onOk; cancel.onclick = onCancel;
        o.classList.add('show');
    });
}

async function showPrompt(message, title, defaultValue = '') {
    _createAppModal();
    const o = document.getElementById('app-modal-overlay');
    const input = o.querySelector('#app-modal-input');
    o.querySelector('#app-modal-header').textContent = title || '';
    o.querySelector('#app-modal-body').textContent = message || '';
    input.value = defaultValue;
    o.querySelector('#app-modal-input-container').style.display = 'block';
    return new Promise(r => {
        const onOk = () => { const v = input.value; o.classList.remove('show'); r(v); };
        const onCancel = () => { o.classList.remove('show'); r(null); };
        o.querySelector('#app-modal-ok').onclick = onOk;
        o.querySelector('#app-modal-cancel').onclick = onCancel;
        o.classList.add('show');
    });
}

// --- 2. LOGIN & TBA COMPETITIONS ---
async function loadCompetitions() {
    const list = document.getElementById('compList');
    if (!list) return;
    
    try {
        const response = await fetch(
            'https://www.thebluealliance.com/api/v3/events/2025/simple',
            { headers: { 'X-TBA-Auth-Key': TBA_KEY } }
        );
        const events = await response.json();
        
        list.innerHTML = '';
        events.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        
        events.forEach(event => {
            const option = document.createElement('option');
            option.value = event.key;
            option.label = event.name;
            list.appendChild(option);
        });
    } catch (error) {
        console.error("TBA List Error:", error);
    }
}

async function handleLogin() {
    const userName = document.getElementById('username').value.trim();
    const competition = document.getElementById('compSearch').value.trim();
    
    if (!userName || !competition) {
        await showModal("Please enter both Name and Competition!", "Missing Info");
        return;
    }

    try {
        const { error } = await scoutDB.auth.signInAnonymously();
        if (error) throw error;
        
        sessionStorage.setItem('scoutName', userName);
        sessionStorage.setItem('activeComp', competition);
        window.location.href = "html/field.html";
    } catch (error) {
        await showModal("Login Error: " + error.message, "Authentication Failed");
    }
}

// --- 3. TBA RANKINGS (SORTED) ---
async function loadTBAMatchSummary() {
    const competitionKey = sessionStorage.getItem('activeComp');
    const rankingContainer = document.getElementById('rankingList');
    
    if (!rankingContainer || !competitionKey) return;

    try {
        const response = await fetch(
            `https://www.thebluealliance.com/api/v3/event/${competitionKey}/rankings`,
            { headers: { 'X-TBA-Auth-Key': TBA_KEY } }
        );
        const data = await response.json();
        
        if (!data?.rankings) {
            rankingContainer.innerHTML = "No TBA data yet.";
            return;
        }

        let tableHTML = `
            <table style="width:100%; text-align:left; color:#fff; font-size:0.85rem; border-collapse:collapse;">
                <tr style="color:#39ff14; border-bottom:2px solid #39ff14;">
                    <th>Rank</th><th>Team</th><th>W-L-T</th><th>Win %</th>
                </tr>
        `;
        
        data.rankings.forEach(ranking => {
            const teamNumber = ranking.team_key.replace('frc', '');
            const { wins, losses, ties } = ranking.record;
            const totalMatches = wins + losses + ties;
            const winPercentage = totalMatches > 0 
                ? ((wins / totalMatches) * 100).toFixed(1) 
                : "0.0";
            
            tableHTML += `
                <tr style="border-bottom:1px solid #333;">
                    <td>${ranking.rank}</td>
                    <td style="color:#39ff14;">${teamNumber}</td>
                    <td>${wins}-${losses}-${ties}</td>
                    <td>${winPercentage}%</td>
                </tr>
            `;
        });
        
        tableHTML += `</table>`;
        rankingContainer.innerHTML = tableHTML;
    } catch (error) {
        rankingContainer.innerHTML = "Error loading Rankings.";
    }
}

// --- 4. DATA FETCHING ---
async function getMyData() {
    const user = sessionStorage.getItem('scoutName');
    const comp = sessionStorage.getItem('activeComp');
    if (!user || !comp) return [];
    const { data, error } = await scoutDB.from('scouting_entries')
        .select('*').eq('scout_name', user).eq('comp_name', comp);
    return error ? [] : data;
}

// --- 5. SEND DATA ---
async function sendData(event) {
    if (event) event.preventDefault();
    
    const scoutName = sessionStorage.getItem('scoutName');
    const competition = sessionStorage.getItem('activeComp');
    const form = event.target;
    
    console.log('Scout Name:', scoutName);
    console.log('Competition:', competition);
    
    if (!scoutName || !competition) {
        await showModal("Session expired. Please log in again.", "Session Error");
        return;
    }
    
    // Collect form data
    const formData = Object.fromEntries(new FormData(form).entries());
    console.log('Form Data:', formData);
    
    // Handle checkboxes - convert to "Yes"/"No" format
    form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        formData[checkbox.name] = checkbox.checked ? "Yes" : "No";
    });
    
    // Determine form type
    const pageTitle = document.querySelector('h2').innerText;
    const formType = pageTitle.includes("Field") ? "Field" : "Pit";
    console.log('Form Type:', formType);

    // Submit to database
    const { error } = await scoutDB.from('scouting_entries').insert([{
        comp_name: competition,
        scout_name: scoutName,
        form_type: formType,
        team_number: parseInt(formData.teamNumber),
        match_number: formData.matchNumber ? parseInt(formData.matchNumber) : null,
        details: formData
    }]);

    if (error) {
        console.error('Database Error:', error);
        await showModal("Error: " + error.message, "Submission Failed");
    } else {
        console.log('Data saved successfully');
        await showModal("Data Saved!", "Success");
        form.reset();
    }
}

// --- 6. LOAD SPLIT TABLES ---
async function loadTableRows() {
    const entries = await getMyData();
    console.log('loadTableRows: Total entries:', entries.length);
    
    const pitTableBody = document.querySelector('#pitTable tbody');
    const fieldTableBody = document.querySelector('#fieldTable tbody');
    
    console.log('Pit table found:', !!pitTableBody);
    console.log('Field table found:', !!fieldTableBody);
    
    if (pitTableBody) pitTableBody.innerHTML = "";
    if (fieldTableBody) fieldTableBody.innerHTML = "";

    let pitCount = 0;
    let fieldCount = 0;

    entries.forEach(entry => {
        const details = entry.details || {};
        const row = document.createElement('tr');
        
        console.log(`Processing entry - Team: ${entry.team_number}, Type: ${entry.form_type}, Match: ${entry.match_number}`);
        
        if (entry.form_type === "Pit") {
            pitCount++;
            // Pit scouting data - show all submitted information
            const climbs = details.climb === "Yes" ? "✅" : "❌";
            const climbLevel = details.climbLevel || "N/A";
            const autoRoutines = details.autos || "None described";
            
            row.innerHTML = `
                <td>${entry.team_number}</td>
                <td>${details.drivetrain || 'N/A'}</td>
                <td>${details.weight || '0'} lbs</td>
                <td>${details.fuelpersec || '0'}</td>
                <td>${details.ballCapacity || '0'}</td>
                <td>${details.fuelPreload || '0'}</td>
                <td>${climbs}</td>
                <td>${climbLevel}</td>
                <td>${autoRoutines}</td>
            `;
            if (pitTableBody) pitTableBody.appendChild(row);
        } else if (entry.form_type === "Field") {
            fieldCount++;
            // Field scouting data
            row.innerHTML = `
                <td>${entry.match_number || 'N/A'}</td>
                <td>${entry.team_number}</td>
                <td>${details.scoreCount || 0}</td>
                <td>${details.matchClimb || 'N/A'}</td>
            `;
            if (fieldTableBody) fieldTableBody.appendChild(row);
        }
    });
    
    console.log(`Data loaded - Pit rows: ${pitCount}, Field rows: ${fieldCount}`);
}

// --- 7A. CLEAR ALL DATA ---
async function clearAllData() {
    const scoutName = sessionStorage.getItem('scoutName');
    const competition = sessionStorage.getItem('activeComp');
    
    if (!scoutName || !competition) {
        await showModal("No active session found.", "Error");
        return;
    }
    
    const confirmed = await showConfirm(
        `Are you sure you want to permanently delete all your scouting records for ${competition}? This action cannot be undone.`,
        "Delete All Records?"
    );
    
    if (!confirmed) return;
    
    // Require user to type the confirmation phrase
    const confirmationPhrase = "JAI IS STUPID";
    const userInput = await showPrompt(
        `This will delete everything. To proceed, type: JAI IS STUPID`,
        "Final Confirmation Required"
    );
    
    if (userInput !== confirmationPhrase) {
        await showModal("That doesn't match. Your records are safe.", "Cancelled");
        return;
    }
    
    try {
        const { error } = await scoutDB.from('scouting_entries')
            .delete()
            .eq('scout_name', scoutName)
            .eq('comp_name', competition);
        
        if (error) throw error;
        
        await showModal("All your scouting records have been permanently deleted.", "Records Deleted");
        
        // Reload the table if it exists
        if (document.querySelector('table')) {
            loadTableRows();
        }
        
        // Reload charts if on analytics page
        if (document.getElementById('fuelChart')) {
            renderCharts();
        }
    } catch (error) {
        await showModal("Something went wrong: " + error.message, "Error");
    }
}

// --- 7. TBA DATA FETCHING FOR CHARTS ---
async function getTBATeamData() {
    const competitionKey = sessionStorage.getItem('activeComp');
    if (!competitionKey) return null;
    
    try {
        // Fetch teams at event
        const teamsResponse = await fetch(
            `https://www.thebluealliance.com/api/v3/event/${competitionKey}/teams`,
            { headers: { 'X-TBA-Auth-Key': TBA_KEY } }
        );
        const teams = await teamsResponse.json();
        
        // Fetch event matches for climb data
        const matchesResponse = await fetch(
            `https://www.thebluealliance.com/api/v3/event/${competitionKey}/matches`,
            { headers: { 'X-TBA-Auth-Key': TBA_KEY } }
        );
        const matches = await matchesResponse.json();
        
        // Fetch team rankings/stats
        const rankingsResponse = await fetch(
            `https://www.thebluealliance.com/api/v3/event/${competitionKey}/rankings`,
            { headers: { 'X-TBA-Auth-Key': TBA_KEY } }
        );
        const rankings = await rankingsResponse.json();
        
        console.log('TBA Teams:', teams.length, 'Matches:', matches.length, 'Rankings:', rankings?.rankings?.length);
        
        return { teams, matches, rankings: rankings?.rankings || [] };
    } catch (error) {
        console.error('Error fetching TBA data:', error);
        return null;
    }
}

// --- 7. CHART ENGINE ---
async function renderCharts() {
    const fuelChart = document.getElementById('fuelChart');
    const ballChart = document.getElementById('ballChart');
    const preloadChart = document.getElementById('preloadChart');
    const weightChart = document.getElementById('weightChart');
    const climbChart = document.getElementById('climbChart');
    
    if (typeof Chart === 'undefined' || !fuelChart) {
        console.error('Chart.js not loaded or fuelChart canvas not found');
        return;
    }

    // Fetch TBA data instead of scouting data
    const tbaData = await getTBATeamData();
    if (!tbaData) {
        console.error('Failed to fetch TBA data');
        return;
    }

    // Also fetch scouting data for climb stats
    const scoutingEntries = await getMyData();
    const fieldEntries = scoutingEntries.filter(entry => entry.form_type === "Field");
    console.log('Field scouting entries for climb:', fieldEntries.length);

    const { teams, matches, rankings } = tbaData;
    
    // Build team data from TBA rankings
    const teamStats = {};
    
    rankings.forEach(ranking => {
        const teamNumber = ranking.team_key.replace('frc', '');
        const { wins, losses, ties } = ranking.record;
        const totalMatches = wins + losses + ties;
        const winPercentage = totalMatches > 0 ? ((wins / totalMatches) * 100) : 0;
        
        // TBA API uses ranking_points (with underscore), not rankingPoints
        const rankingPoints = ranking.ranking_points || ranking.rankingPoints || 0;
        
        console.log(`Team ${teamNumber}: RP=${rankingPoints}, Rank=${ranking.rank}`);
        
        teamStats[teamNumber] = {
            teamKey: ranking.team_key,
            wins: wins,
            losses: losses,
            ties: ties,
            winPercentage: winPercentage,
            rank: ranking.rank,
            rp: rankingPoints,
            tiebreaker: ranking.tiebreaker1 || 0
        };
    });

    // Calculate climb success from matches
    const teamClimbStats = {};
    matches.forEach(match => {
        if (!match.alliances) return;
        
        ['red', 'blue'].forEach(alliance => {
            const allianceData = match.alliances[alliance];
            if (!allianceData) return;
            
            allianceData.team_keys?.forEach(teamKey => {
                const teamNumber = teamKey.replace('frc', '');
                if (!teamClimbStats[teamNumber]) {
                    teamClimbStats[teamNumber] = { attempts: 0, successes: 0 };
                }
                teamClimbStats[teamNumber].attempts++;
            });
        });
    });

    const teamLabels = Object.keys(teamStats).sort((a, b) => parseInt(a) - parseInt(b));
    console.log('Teams to display:', teamLabels);
    
    // Plugin to display values on bars
    const valuePlugin = {
        id: 'valuePlugin',
        afterDatasetsDraw(chart) {
            const { ctx, data } = chart;
            ctx.save();
            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            
            chart.getDatasetMeta(0).data.forEach((bar, index) => {
                const value = data.datasets[0].data[index];
                const isHorizontal = chart.options.indexAxis === 'y';
                const xPos = isHorizontal ? bar.x + 20 : bar.x;
                const yPos = isHorizontal ? bar.y + 5 : bar.y - 10;
                
                ctx.fillText(value, xPos, yPos);
            });
            
            ctx.restore();
        }
    };

    // Win Percentage Chart - from TBA rankings
    if (fuelChart && fuelChart.getContext) {
        try {
            new Chart(fuelChart, {
                type: 'bar',
                data: {
                    labels: teamLabels,
                    datasets: [{
                        label: 'Win %',
                        data: teamLabels.map(team => parseFloat(teamStats[team].winPercentage.toFixed(1))),
                        backgroundColor: '#39ff14'
                    }]
                },
                options: {
                    indexAxis: 'y',
                    scales: {
                        x: { ticks: { color: '#fff' } },
                        y: { ticks: { color: '#fff' } }
                    }
                },
                plugins: [valuePlugin]
            });
            console.log('Win % chart rendered');
        } catch (e) {
            console.error('Error rendering win % chart:', e);
        }
    }

    // Ranking Points Chart
    if (ballChart && ballChart.getContext) {
        try {
            new Chart(ballChart, {
                type: 'bar',
                data: {
                    labels: teamLabels,
                    datasets: [{
                        label: 'Ranking Points',
                        data: teamLabels.map(team => teamStats[team].rp),
                        backgroundColor: '#00bcff'
                    }]
                },
                options: {
                    scales: {
                        x: { ticks: { color: '#fff' } },
                        y: { ticks: { color: '#fff' } }
                    }
                },
                plugins: [valuePlugin]
            });
            console.log('Ranking Points chart rendered');
        } catch (e) {
            console.error('Error rendering ranking points chart:', e);
        }
    }

    // Wins Chart
    if (preloadChart && preloadChart.getContext) {
        try {
            new Chart(preloadChart, {
                type: 'bar',
                data: {
                    labels: teamLabels,
                    datasets: [{
                        label: 'Wins',
                        data: teamLabels.map(team => teamStats[team].wins),
                        backgroundColor: '#ff9500'
                    }]
                },
                options: {
                    scales: {
                        x: { ticks: { color: '#fff' } },
                        y: { ticks: { color: '#fff' } }
                    }
                },
                plugins: [valuePlugin]
            });
            console.log('Wins chart rendered');
        } catch (e) {
            console.error('Error rendering wins chart:', e);
        }
    }

    // Team Rankings Chart
    if (weightChart && weightChart.getContext) {
        try {
            new Chart(weightChart, {
                type: 'bar',
                data: {
                    labels: teamLabels,
                    datasets: [{
                        label: 'Event Rank',
                        data: teamLabels.map(team => teamStats[team].rank),
                        backgroundColor: '#a78bfa'
                    }]
                },
                options: {
                    scales: {
                        x: { ticks: { color: '#fff' } },
                        y: { ticks: { color: '#fff' } }
                    }
                },
                plugins: [valuePlugin]
            });
            console.log('Ranking chart rendered');
        } catch (e) {
            console.error('Error rendering ranking chart:', e);
        }
    }

    // Climb Success Chart - from field scouting data
    let totalSuccess = 0;
    let totalFailure = 0;
    
    // Count all valid climb attempts from field entries
    fieldEntries.forEach(entry => {
        const details = entry.details || {};
        const climbResult = details.matchClimb;
        
        if (climbResult === "Success") {
            totalSuccess++;
        } else if (climbResult === "Fail") {
            totalFailure++;
        }
    });
    
    console.log('Climb stats - Success:', totalSuccess, 'Failure:', totalFailure, 'Total entries:', fieldEntries.length);
    
    const climbPlugin = {
        id: 'climbPlugin',
        afterDatasetsDraw(chart) {
            const { ctx } = chart;
            ctx.save();
            ctx.font = 'bold 16px sans-serif';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            
            const centerX = chart.chartArea.left + chart.chartArea.width / 2;
            const centerY = chart.chartArea.top + chart.chartArea.height / 2;
            
            const totalAttempts = totalSuccess + totalFailure;
            const successPercent = totalAttempts > 0 
                ? ((totalSuccess / totalAttempts) * 100).toFixed(1) 
                : 0;
            
            ctx.fillText(`${successPercent}%`, centerX, centerY - 10);
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(`${totalSuccess}/${totalAttempts}`, centerX, centerY + 10);
            ctx.restore();
        }
    };
    
    if (climbChart && climbChart.getContext) {
        try {
            new Chart(climbChart, {
                type: 'doughnut',
                data: {
                    labels: ["Success", "Failure"],
                    datasets: [{
                        data: [totalSuccess || 0, totalFailure || 0],
                        backgroundColor: ['#39ff14', '#ff4d4d']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#fff',
                                font: { size: 14 }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => `${ctx.label}: ${ctx.parsed}`
                            }
                        }
                    }
                },
                plugins: [climbPlugin]
            });
            console.log('Climb chart rendered successfully');
        } catch (e) {
            console.error('Error rendering climb chart:', e);
        }
    } else {
        console.error('Climb chart canvas not found or getContext failed');
    }


}

// --- 8. INITIALIZATION & EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    console.log('Chart.js loaded:', typeof Chart !== 'undefined');
    
    loadCompetitions();
    
    if (document.querySelector('table')) {
        console.log('Table found, loading rows');
        loadTableRows();
    }
    
    if (document.getElementById('fuelChart')) {
        console.log('Charts found, rendering');
        renderCharts();
        loadTBAMatchSummary();
    } else {
        console.log('No fuelChart found on this page');
    }
    
    const form = document.querySelector('form');
    if (form) {
        console.log('Form found, attaching submit listener');
        form.addEventListener('submit', sendData);
    }
});