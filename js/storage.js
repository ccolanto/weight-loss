class StorageManager {
    constructor(key, user = 'chris') {
        this.baseKey = key;
        this.user = user;
        this.key = `${key}_${user}`;
        this.migrateOldData();
    }

    setUser(user) {
        this.user = user;
        this.key = `${this.baseKey}_${user}`;
    }

    // Migrate old data to user-specific keys
    migrateOldData() {
        // Only migrate for Chris since that's the original user
        if (this.user === 'chris') {
            const oldData = localStorage.getItem(this.baseKey);
            const newData = localStorage.getItem(this.key);
            
            // If old data exists but new data doesn't, migrate it
            if (oldData && !newData) {
                localStorage.setItem(this.key, oldData);
            }
        }
    }

    getData() {
        const data = localStorage.getItem(this.key);
        return data ? JSON.parse(data) : [];
    }

    saveData(data) {
        localStorage.setItem(this.key, JSON.stringify(data));
    }

    addItem(item) {
        const data = this.getData();
        const newItem = {
            ...item,
            id: Date.now().toString() // Add unique ID for each item
        };
        data.push(newItem);
        this.saveData(data);
        return newItem;
    }

    updateItem(id, updatedItem) {
        const data = this.getData();
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updatedItem };
            this.saveData(data);
            return true;
        }
        return false;
    }

    deleteItem(id) {
        const data = this.getData();
        const filteredData = data.filter(item => item.id !== id);
        if (filteredData.length !== data.length) {
            this.saveData(filteredData);
            return true;
        }
        return false;
    }

    getItems() {
        return this.getData();
    }

    clearAll() {
        localStorage.removeItem(this.key);
    }
}
