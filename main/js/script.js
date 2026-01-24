

function sendData() {
    event.preventDefault();

    const activeForm = document.forms[0];
    const formData = new FormData(activeForm);
    const data = Object.fromEntries(formData.entries());

    // Identity check: Is this Pit or Field?
    const isPit = document.querySelector('h2').innerText.includes("Pit");
    data.formType = isPit ? "Pit" : "Field";
    
    // Ensure teamNumber is consistent even if IDs are different
    if (!data.teamNumber && data.teamNumberField) {
        data.teamNumber = data.teamNumberField;
    }

    let scoutData = JSON.parse(localStorage.getItem('metalCowData')) || [];
    scoutData.push(data);
    localStorage.setItem('metalCowData', JSON.stringify(scoutData));

    alert("Data recorded for Team " + data.teamNumber);
    window.location.href = "store.html";
}

window.onload = function() {
        const body = document.getElementById('tableBody');
        const data = JSON.parse(localStorage.getItem('metalCowData')) || [];

        body.innerHTML = data.map(entry => {
            const isPit = entry.formType === "Pit";
            
            return `
                <tr class="${isPit ? 'pit-row' : 'field-row'}">
                    <td><strong>${entry.formType}</strong></td>
                    <td>${entry.teamNumber}</td>
                    <td>${isPit ? entry.drivetrain : 'Match: ' + entry.matchNumber}</td>
                    <td>${isPit ? (entry.fuelPreload || 0) + ' preloaded' : entry.scoreCount + ' scored'}</td>
                    <td>${isPit ? entry.climbLevel : entry.matchClimb}</td>
                    <td>${entry.autos || entry.matchNotes || 'N/A'}</td>
                </tr>
            `;
        }).join('');
    };

  function clearAll() {
    let userConfirmed = confirm("Are you sure? This will delete ALL scouting data.");
    
    if (userConfirmed) {
        // 1. Wipe the storage
        localStorage.clear(); 
        
        // 2. Alert the user
        alert("All data has been cleared.");
        
        // 3. REFRESH the page to clear the table from the screen
        location.reload(); 
    } else {
        alert("Operation cancelled.");
    }
}