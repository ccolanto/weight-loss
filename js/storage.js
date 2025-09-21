class StorageManager {
    constructor(key) {
        this.key = key;
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
