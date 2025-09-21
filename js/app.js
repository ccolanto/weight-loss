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
});
