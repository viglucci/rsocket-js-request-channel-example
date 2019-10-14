class Queue {
    constructor(limit = 100) {
        this._max_size = limit;
        this._items = [];
    }

    add(item) {
        if (this.full()) { return; }
        this._items.push(item);
    }

    remove() {
        return this._items.shift();
    }

    size() {
        return this._items.length;
    }

    full() {
        return this._items.length === this._max_size;
    }
}

module.exports = Queue;