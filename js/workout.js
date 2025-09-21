class WorkoutTracker {
    constructor() {
        this.currentUser = 'chris'; // Default to Chris
        this.storage = new StorageManager('workoutData', this.currentUser);
        this.pieChart = null;
        this.caloriesChart = null;
        this.initializeForm();
        this.initializeDatePicker();
        this.createCharts();
        this.updateTable();
    }

    initializeForm() {
        const form = document.getElementById('workout-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveWorkout(e);
        });

        // Add event listener for workout type selection
        document.getElementById('workout-type').addEventListener('change', (event) => {
            const selectedType = event.target.value;
            const customWorkoutContainer = document.getElementById('custom-workout-container');
            
            if (selectedType === 'other') {
                customWorkoutContainer.style.display = 'block';
            } else {
                customWorkoutContainer.style.display = 'none';
                document.getElementById('custom-workout').value = '';
            }
        });
    }

    initializeDatePicker() {
        flatpickr("#workout-date", {
            defaultDate: "today",
            dateFormat: "Y-m-d"
        });
    }

    saveWorkout(event) {
        const form = event.target;
        const date = document.getElementById('workout-date').value;
        let type = document.getElementById('workout-type').value;
        const duration = parseInt(document.getElementById('workout-duration').value);
        const calories = parseInt(document.getElementById('calories-burned').value);

        // If "other" is selected, use the custom workout type
        if (type === 'other') {
            const customWorkout = document.getElementById('custom-workout').value.trim();
            if (customWorkout) {
                type = customWorkout;
            } else {
                alert('Please specify the workout type.');
                return;
            }
        }

        if (date && type && duration && calories) {
            if (form.dataset.editing) {
                this.storage.updateItem(form.dataset.editing, { date, type, duration, calories });
                delete form.dataset.editing;
                form.querySelector('button').textContent = 'Save Workout';
            } else {
                this.storage.addItem({ date, type, duration, calories });
            }
            this.updateCharts();
            this.updateTable();
            form.reset();
            // Hide the custom workout input field after saving
            document.getElementById('custom-workout-container').style.display = 'none';
            document.getElementById('custom-workout').value = '';
        }
    }

    updateTable() {
        const tbody = document.querySelector('#workout-table tbody');
        tbody.innerHTML = '';
        
        const data = this.storage.getItems()
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        data.forEach(item => {
            const row = document.createElement('tr');
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = 'Edit';
            editBtn.dataset.id = item.id;
            editBtn.onclick = () => this.editWorkout(item.id);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.dataset.id = item.id;
            deleteBtn.onclick = () => this.deleteWorkout(item.id);

            const actionDiv = document.createElement('div');
            actionDiv.className = 'action-buttons';
            actionDiv.appendChild(editBtn);
            actionDiv.appendChild(deleteBtn);

            row.innerHTML = `
                <td>${item.date}</td>
                <td>${item.type}</td>
                <td>${item.duration}</td>
                <td>${item.calories}</td>
            `;
            const actionCell = document.createElement('td');
            actionCell.appendChild(actionDiv);
            row.appendChild(actionCell);
            tbody.appendChild(row);
        });
    }

    editWorkout(id) {
        const data = this.storage.getItems();
        const item = data.find(item => item.id === id);
        if (item) {
            document.getElementById('workout-date').value = item.date;
            document.getElementById('workout-type').value = item.type;
            document.getElementById('workout-duration').value = item.duration;
            document.getElementById('calories-burned').value = item.calories;
            const form = document.getElementById('workout-form');
            form.dataset.editing = id;
            form.querySelector('button').textContent = 'Update Workout';
        }
    }

    deleteWorkout(id) {
        if (confirm('Are you sure you want to delete this workout entry?')) {
            this.storage.deleteItem(id);
            this.updateCharts();
            this.updateTable();
        }
    }

    switchUser(newUser) {
        if (newUser !== this.currentUser) {
            // Switch user
            this.currentUser = newUser;
            
            // Update storage manager to use the new user
            this.storage.setUser(newUser);
            
            // Update table and charts with new user's data
            this.updateTable();
            this.updateCharts();
        }
    }

    createCharts() {
        // Create pie chart for workout distribution
        const pieCtx = document.getElementById('workout-pie-chart').getContext('2d');
        this.pieChart = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40',
                        '#FF99CC',
                        '#666666'
                    ]
                }]
            },
            options: {
                responsive: true
            }
        });

        // Create bar chart for weekly calories
        const caloriesCtx = document.getElementById('calories-chart').getContext('2d');
        this.caloriesChart = new Chart(caloriesCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Calories Burned',
                    data: [],
                    backgroundColor: '#28a745'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        this.updateCharts();
    }

    updateCharts() {
        const data = this.storage.getItems();
        
        // Update pie chart
        const workoutTypes = {};
        data.forEach(workout => {
            workoutTypes[workout.type] = (workoutTypes[workout.type] || 0) + 1;
        });

        this.pieChart.data.labels = Object.keys(workoutTypes);
        this.pieChart.data.datasets[0].data = Object.values(workoutTypes);
        this.pieChart.update();

        // Update calories chart (last 7 days)
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const caloriesByDay = {};
        last7Days.forEach(day => {
            caloriesByDay[day] = 0;
        });

        data.forEach(workout => {
            if (caloriesByDay.hasOwnProperty(workout.date)) {
                caloriesByDay[workout.date] += workout.calories;
            }
        });

        this.caloriesChart.data.labels = Object.keys(caloriesByDay);
        this.caloriesChart.data.datasets[0].data = Object.values(caloriesByDay);
        this.caloriesChart.update();
    }
}
