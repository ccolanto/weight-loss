document.addEventListener('DOMContentLoaded', () => {
    // Initialize tab functionality
    const tabs = document.querySelectorAll('.tabs a');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const targetId = tab.getAttribute('href').substring(1);
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Initialize trackers
    const weightTracker = new WeightTracker();
    const workoutTracker = new WorkoutTracker();
    const caliperTracker = new CaliperTracker();

    // Function to switch user across all trackers
    window.switchUser = function(newUser) {
        weightTracker.switchUser(newUser);
        workoutTracker.switchUser(newUser);
        caliperTracker.switchUser(newUser);
        
        // Update UI to reflect current user
        const userDisplay = document.getElementById('current-user-display');
        if (userDisplay) {
            userDisplay.textContent = newUser.charAt(0).toUpperCase() + newUser.slice(1);
        }
    };

    // Add event listeners for user switching buttons
    const chrisBtn = document.getElementById('switch-to-chris');
    const charlotteBtn = document.getElementById('switch-to-charlotte');
    
    if (chrisBtn) {
        chrisBtn.addEventListener('click', () => {
            switchUser('chris');
            // Update button states
            chrisBtn.classList.add('active');
            if (charlotteBtn) charlotteBtn.classList.remove('active');
        });
    }
    
    if (charlotteBtn) {
        charlotteBtn.addEventListener('click', () => {
            switchUser('charlotte');
            // Update button states
            charlotteBtn.classList.add('active');
            if (chrisBtn) chrisBtn.classList.remove('active');
        });
    }
});
