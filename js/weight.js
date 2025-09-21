class WeightTracker {
    constructor() {
        this.currentUser = 'chris'; // Default to Chris
        this.storage = new StorageManager('weightData', this.currentUser);
        this.weightChart = null;
        this.initializeForm();
        this.initializeDatePicker();
        this.createChart();
        this.updateTable();
    }

    initializeForm() {
        const form = document.getElementById('weight-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveWeight(e);
        });
    }

    initializeDatePicker() {
        flatpickr("#weight-date", {
            defaultDate: "today",
            dateFormat: "Y-m-d"
        });
    }

    saveWeight(event) {
        const form = event.target;
        const date = document.getElementById('weight-date').value;
        const weight = parseFloat(document.getElementById('weight-value').value);

        if (date && weight) {
            const existingEntry = this.storage.getItems().find(item => item.date === date && item.id !== form.dataset.editing);
            
            if (existingEntry) {
                if (confirm('A weight entry for this date already exists. Do you want to overwrite it?')) {
                    this.storage.deleteItem(existingEntry.id);
                    this.storage.addItem({ date, weight });
                }
            } else if (form.dataset.editing) {
                this.storage.updateItem(form.dataset.editing, { date, weight });
                delete form.dataset.editing;
                form.querySelector('button').textContent = 'Save Weight';
            } else {
                this.storage.addItem({ date, weight });
            }
            this.updateChart();
            this.updateTable();
            form.reset();
        }
    }

    updateTable() {
        const tbody = document.querySelector('#weight-table tbody');
        tbody.innerHTML = '';
        
        const data = this.storage.getItems()
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        data.forEach(item => {
            const row = document.createElement('tr');
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = 'Edit';
            editBtn.dataset.id = item.id;
            editBtn.onclick = () => this.editWeight(item.id);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.dataset.id = item.id;
            deleteBtn.onclick = () => this.deleteWeight(item.id);

            const actionDiv = document.createElement('div');
            actionDiv.className = 'action-buttons';
            actionDiv.appendChild(editBtn);
            actionDiv.appendChild(deleteBtn);

            row.innerHTML = `
                <td>${item.date}</td>
                <td>${item.weight}</td>
            `;
            const actionCell = document.createElement('td');
            actionCell.appendChild(actionDiv);
            row.appendChild(actionCell);
            tbody.appendChild(row);
        });
    }

    editWeight(id) {
        const data = this.storage.getItems();
        const item = data.find(item => item.id === id);
        if (item) {
            document.getElementById('weight-date').value = item.date;
            document.getElementById('weight-value').value = item.weight;
            const form = document.getElementById('weight-form');
            form.dataset.editing = id;
            form.querySelector('button').textContent = 'Update Weight';
        }
    }

    deleteWeight(id) {
        if (confirm('Are you sure you want to delete this weight entry?')) {
            this.storage.deleteItem(id);
            this.updateChart();
            this.updateTable();
        }
    }

    switchUser(newUser) {
        if (newUser !== this.currentUser) {
            // Switch user
            this.currentUser = newUser;
            
            // Update storage manager to use the new user
            this.storage.setUser(newUser);
            
            // Update table and chart with new user's data
            this.updateTable();
            this.updateChart();
        }
    }

    createChart() {
        const ctx = document.getElementById('weight-chart').getContext('2d');
        this.weightChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Weight (lbs)',
                    data: [],
                    borderColor: '#007bff',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
        this.updateChart();
    }

    updateChart() {
        const data = this.storage.getItems()
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        this.weightChart.data.labels = data.map(item => item.date);
        this.weightChart.data.datasets[0].data = data.map(item => item.weight);
        this.weightChart.update();
    }
}
