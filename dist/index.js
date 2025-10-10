"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queue_1 = require("./queue");
const delayedExec = (timeout) => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), timeout);
    });
};
const tasks = [];
for (let count = 0; count <= 10; count++) {
    const promiseFunc = () => delayedExec(1000);
    tasks.push({
        key: String(count),
        execute: promiseFunc
    });
}
const taskSheduler = new queue_1.TaskSheduler(3);
for (let task of tasks) {
    taskSheduler.add(task);
}
