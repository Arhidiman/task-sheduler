"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskSheduler = void 0;
class TaskSheduler {
    constructor() {
        this.queue = [];
    }
    add(task) {
        this.queue.push(task);
    }
    remove() {
        this.queue.shift();
    }
    async execute() {
        await this.queue[0].execute();
        this.remove;
    }
    async runQueue() {
        for (let task of this.queue) {
            await task.execute();
        }
    }
}
exports.TaskSheduler = TaskSheduler;
