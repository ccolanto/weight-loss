class CaliperTracker {
    constructor() {
        this.currentUser = 'chris'; // Default to Chris
        this.storage = new StorageManager('caliperData', this.currentUser);
        this.weightStorage = new StorageManager('weightData', this.currentUser);
        this.measurementsChart = null;
        this.sitesChart = null;
        this.massCompositionChart = null;
        this.loadSavedAge();
        this.initializeForm();
        this.initializeDatePicker();
        this.updateTable();
        this.createCharts();
        this.updateCharts();
    }

    loadSavedAge() {
        const savedAge = localStorage.getItem(`savedAge_${this.currentUser}`);
        if (savedAge) {
            document.getElementById('age').value = savedAge;
        }
    }

    saveCurrentAge() {
        const currentAge = document.getElementById('age').value;
        if (currentAge) {
            localStorage.setItem(`savedAge_${this.currentUser}`, currentAge);
        }
    }

    getLastWeight() {
        const weightData = this.weightStorage.getItems();
        if (weightData.length === 0) return null;
        
        // Sort by date descending and get the most recent weight
        return weightData.sort((a, b) => new Date(b.date) - new Date(a.date))[0].weight;
    }

    updateBodyComposition(bodyFat) {
        const lastWeight = this.getLastWeight();
        const weightDisplay = document.getElementById('current-weight');
        const fatMassDisplay = document.getElementById('fat-mass');
        const leanMassDisplay = document.getElementById('lean-mass');

        if (lastWeight && bodyFat) {
            weightDisplay.textContent = lastWeight.toFixed(1);
            const fatMass = (lastWeight * (bodyFat / 100)).toFixed(1);
            const leanMass = (lastWeight - fatMass).toFixed(1);
            
            fatMassDisplay.textContent = fatMass;
            leanMassDisplay.textContent = leanMass;
        } else {
            weightDisplay.textContent = '--';
            fatMassDisplay.textContent = '--';
            leanMassDisplay.textContent = '--';
        }
    }

    initializeForm() {
        const form = document.getElementById('caliper-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMeasurements(e);
        });

        // Update body fat calculation on input change
        const inputs = form.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateBodyFatCalculation();
                if (input.id === 'age') {
                    this.saveCurrentAge();
                }
            });
        });
        
        // Also save age when it loses focus
        const ageInput = document.getElementById('age');
        ageInput.addEventListener('blur', () => {
            this.saveCurrentAge();
        });
    }

    initializeDatePicker() {
        flatpickr("#caliper-date", {
            defaultDate: "today",
            dateFormat: "Y-m-d"
        });
    }

    calculateBodyFat(measurements, age, isFemale = false) {
        const sum = Object.values(measurements).reduce((a, b) => a + b, 0);
        
        if (isFemale) {
            // Jackson/Pollock 7-site formula for females
            const bodyDensity = 1.097 - (0.00046971 * sum) + 
                               (0.00000056 * sum * sum) - 
                               (0.00012828 * age);
            const bodyFat = (495 / bodyDensity) - 450;
            return Math.round(bodyFat * 10) / 10;
        } else {
            // Jackson/Pollock 7-site formula for males
            const bodyDensity = 1.112 - (0.00043499 * sum) + 
                               (0.00000055 * sum * sum) - 
                               (0.00028826 * age);
            const bodyFat = (495 / bodyDensity) - 450;
            return Math.round(bodyFat * 10) / 10;
        }
    }

    updateBodyFatCalculation() {
        const measurements = {
            chest: parseFloat(document.getElementById('chest').value) || 0,
            abdominal: parseFloat(document.getElementById('abdominal').value) || 0,
            thigh: parseFloat(document.getElementById('thigh').value) || 0,
            tricep: parseFloat(document.getElementById('tricep').value) || 0,
            subscapular: parseFloat(document.getElementById('subscapular').value) || 0,
            suprailiac: parseFloat(document.getElementById('suprailiac').value) || 0,
            midaxillary: parseFloat(document.getElementById('midaxillary').value) || 0
        };

        const age = parseInt(document.getElementById('age').value) || 0;
        const isFemale = this.currentUser === 'charlotte';

        if (Object.values(measurements).every(v => v > 0) && age > 0) {
            const bodyFat = this.calculateBodyFat(measurements, age, isFemale);
            document.getElementById('body-fat-result').textContent = bodyFat;
            this.updateBodyComposition(bodyFat);
        } else {
            document.getElementById('body-fat-result').textContent = '--';
            this.updateBodyComposition(null);
        }
    }

    switchUser(newUser) {
        if (newUser !== this.currentUser) {
            // Save current form data before switching
            const currentAge = document.getElementById('age').value;
            if (currentAge) {
                localStorage.setItem(`savedAge_${this.currentUser}`, currentAge);
            }

            // Switch user
            this.currentUser = newUser;
            
            // Update storage managers to use the new user
            this.storage.setUser(newUser);
            this.weightStorage.setUser(newUser);
            
            // Load saved age for the new user
            this.loadSavedAge();
            
            // Reset form except for age field
            const form = document.getElementById('caliper-form');
            const ageValue = document.getElementById('age').value;
            form.reset();
            if (ageValue) {
                document.getElementById('age').value = ageValue;
            }
            document.getElementById('body-fat-result').textContent = '--';
            document.getElementById('current-weight').textContent = '--';
            document.getElementById('fat-mass').textContent = '--';
            document.getElementById('lean-mass').textContent = '--';
            
            // Update table and charts with new user's data
            this.updateTable();
            this.updateCharts();
        }
    }

    saveMeasurements(event) {
        const form = event.target;
        const date = document.getElementById('caliper-date').value;
        const age = parseInt(document.getElementById('age').value);
        const measurements = {
            chest: parseFloat(document.getElementById('chest').value),
            abdominal: parseFloat(document.getElementById('abdominal').value),
            thigh: parseFloat(document.getElementById('thigh').value),
            tricep: parseFloat(document.getElementById('tricep').value),
            subscapular: parseFloat(document.getElementById('subscapular').value),
            suprailiac: parseFloat(document.getElementById('suprailiac').value),
            midaxillary: parseFloat(document.getElementById('midaxillary').value)
        };

        if (date && age && Object.values(measurements).every(v => v > 0)) {
            // Save the age for future use
            this.saveCurrentAge();
            
            const isFemale = this.currentUser === 'charlotte';
            const bodyFat = this.calculateBodyFat(measurements, age, isFemale);
            const data = {
                date,
                age,
                ...measurements,
                bodyFat
            };
            
            const existingEntry = this.storage.getItems().find(item => item.date === date && item.id !== form.dataset.editing);
            
            if (existingEntry) {
                if (confirm('A measurement for this date already exists. Do you want to overwrite it?')) {
                    this.storage.deleteItem(existingEntry.id);
                    this.storage.addItem(data);
                    this.updateCharts();
                    this.updateTable();
                }
            } else if (form.dataset.editing) {
                this.storage.updateItem(form.dataset.editing, data);
                delete form.dataset.editing;
                form.querySelector('button').textContent = 'Save Measurements';
                this.updateCharts();
                this.updateTable();
            } else {
                this.storage.addItem(data);
                this.updateCharts();
                this.updateTable();
            }
            
            // Store the current values before resetting
            const currentBodyFat = parseFloat(document.getElementById('body-fat-result').textContent);
            const currentAge = document.getElementById('age').value;
            
            this.updateCharts();
            this.updateTable();
            // Don't reset the form completely, just clear the measurement fields
            // This keeps the age field populated for future entries
            document.getElementById('chest').value = '';
            document.getElementById('abdominal').value = '';
            document.getElementById('thigh').value = '';
            document.getElementById('tricep').value = '';
            document.getElementById('subscapular').value = '';
            document.getElementById('suprailiac').value = '';
            document.getElementById('midaxillary').value = '';
            
            // Restore the body fat, composition values and age
            if (!isNaN(currentBodyFat)) {
                document.getElementById('body-fat-result').textContent = currentBodyFat;
                this.updateBodyComposition(currentBodyFat);
            }
            if (currentAge) {
                document.getElementById('age').value = currentAge;
            }
        }
    }

    updateTable() {
        const tbody = document.querySelector('#caliper-table tbody');
        tbody.innerHTML = '';
        
        const data = this.storage.getItems()
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        data.forEach(item => {
            const row = document.createElement('tr');
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = 'Edit';
            editBtn.dataset.id = item.id;
            editBtn.onclick = () => this.editMeasurements(item.id);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.dataset.id = item.id;
            deleteBtn.onclick = () => this.deleteMeasurements(item.id);

            const actionDiv = document.createElement('div');
            actionDiv.className = 'action-buttons';
            actionDiv.appendChild(editBtn);
            actionDiv.appendChild(deleteBtn);

            // Calculate fat mass and lean mass for this measurement
            const weightData = this.weightStorage.getItems()
                .filter(w => w.date <= item.date)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            
            let fatMass = '--';
            let leanMass = '--';
            let weight = '--';
            
            if (weightData.length > 0) {
                weight = weightData[0].weight;
                fatMass = (weight * (item.bodyFat / 100)).toFixed(1);
                leanMass = (weight - fatMass).toFixed(1);
            }

            row.innerHTML = `
                <td>${item.date}</td>
                <td>${item.age}</td>
                <td>${weight === '--' ? '--' : weight.toFixed(1)}</td>
                <td>${item.bodyFat}%</td>
                <td>${fatMass}</td>
                <td>${leanMass}</td>
            `;
            const actionCell = document.createElement('td');
            actionCell.appendChild(actionDiv);
            row.appendChild(actionCell);
            tbody.appendChild(row);
        });
    }

    editMeasurements(id) {
        const data = this.storage.getItems();
        const item = data.find(item => item.id === id);
        if (item) {
            document.getElementById('caliper-date').value = item.date;
            document.getElementById('age').value = item.age;
            document.getElementById('chest').value = item.chest;
            document.getElementById('abdominal').value = item.abdominal;
            document.getElementById('thigh').value = item.thigh;
            document.getElementById('tricep').value = item.tricep;
            document.getElementById('subscapular').value = item.subscapular;
            document.getElementById('suprailiac').value = item.suprailiac;
            document.getElementById('midaxillary').value = item.midaxillary;
            
            this.updateBodyFatCalculation();
            
            const form = document.getElementById('caliper-form');
            form.dataset.editing = id;
            form.querySelector('button').textContent = 'Update Measurements';
        }
    }

    deleteMeasurements(id) {
        if (confirm('Are you sure you want to delete this measurement entry?')) {
            this.storage.deleteItem(id);
            this.updateCharts();
            this.updateTable();
        }
    }

    createCharts() {
        // Body Fat % Chart
        const ctxBF = document.getElementById('measurements-chart').getContext('2d');
        this.measurementsChart = new Chart(ctxBF, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Body Fat %',
                    data: [],
                    borderColor: '#dc3545',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Body Fat %'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Body Fat Percentage Over Time'
                    }
                }
            }
        });

        // Individual Sites Chart
        const ctxSites = document.getElementById('sites-chart').getContext('2d');
        this.sitesChart = new Chart(ctxSites, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Chest',
                        borderColor: '#FF6384',
                        data: []
                    },
                    {
                        label: 'Abdominal',
                        borderColor: '#36A2EB',
                        data: []
                    },
                    {
                        label: 'Thigh',
                        borderColor: '#FFCE56',
                        data: []
                    },
                    {
                        label: 'Tricep',
                        borderColor: '#4BC0C0',
                        data: []
                    },
                    {
                        label: 'Subscapular',
                        borderColor: '#9966FF',
                        data: []
                    },
                    {
                        label: 'Suprailiac',
                        borderColor: '#FF9F40',
                        data: []
                    },
                    {
                        label: 'Midaxillary',
                        borderColor: '#FF99CC',
                        data: []
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Measurement (mm)'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Skinfold Measurements by Site'
                    },
                    legend: {
                        position: 'right'
                    }
                }
            }
        });

        // Mass Composition Chart
        const ctxMass = document.getElementById('mass-composition-chart').getContext('2d');
        this.massCompositionChart = new Chart(ctxMass, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Fat Mass (lbs)',
                        borderColor: '#FF6384',
                        data: [],
                        fill: true,
                        backgroundColor: 'rgba(255, 99, 132, 0.2)'
                    },
                    {
                        label: 'Lean Mass (lbs)',
                        borderColor: '#36A2EB',
                        data: [],
                        fill: true,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        stacked: false,
                        title: {
                            display: true,
                            text: 'Mass (lbs)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Body Mass Composition Over Time'
                    }
                }
            }
        });

        this.updateCharts();
    }

    updateCharts() {
        const data = this.storage.getItems()
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Update Body Fat % Chart
        if (this.measurementsChart) {
            this.measurementsChart.data.labels = data.map(item => item.date);
            this.measurementsChart.data.datasets[0].data = data.map(item => item.bodyFat);
            this.measurementsChart.update();
        }

        // Update Sites Chart
        if (this.sitesChart) {
            this.sitesChart.data.labels = data.map(item => item.date);
            this.sitesChart.data.datasets[0].data = data.map(item => item.chest);
            this.sitesChart.data.datasets[1].data = data.map(item => item.abdominal);
            this.sitesChart.data.datasets[2].data = data.map(item => item.thigh);
            this.sitesChart.data.datasets[3].data = data.map(item => item.tricep);
            this.sitesChart.data.datasets[4].data = data.map(item => item.subscapular);
            this.sitesChart.data.datasets[5].data = data.map(item => item.suprailiac);
            this.sitesChart.data.datasets[6].data = data.map(item => item.midaxillary);
            this.sitesChart.update();
        }

        // Update Mass Composition Chart
        if (this.massCompositionChart) {
            const massData = data.map(item => {
                const weightData = this.weightStorage.getItems()
                    .filter(w => w.date <= item.date)
                    .sort((a, b) => new Date(b.date) - new Date(a.date));
                
                if (weightData.length > 0) {
                    const weight = weightData[0].weight;
                    const fatMass = (weight * (item.bodyFat / 100));
                    const leanMass = weight - fatMass;
                    return { fatMass, leanMass };
                }
                return { fatMass: null, leanMass: null };
            });

            this.massCompositionChart.data.labels = data.map(item => item.date);
            this.massCompositionChart.data.datasets[0].data = massData.map(item => item.fatMass);
            this.massCompositionChart.data.datasets[1].data = massData.map(item => item.leanMass);
            this.massCompositionChart.update();
        }
    }
}
