"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.test = void 0;
const queue_1 = require("../queue");
const lib_1 = require("../lib");
const parallelsLimit = async (maxParallels, taskCount, delay) => {
    const scheduler = new queue_1.TaskSheduler(maxParallels);
    const results = [];
    for (let i = 0; i < taskCount; i++) {
        scheduler.add({
            key: String(i),
            execute: async () => {
                // Имитация долгой асинхронной задачи
                await (0, lib_1.delayedExec)(delay);
                // Проверяем состояние во время выполнения
                results.push(scheduler.executionList.length);
                return i;
            }
        });
    }
    // Дожидаемся пока очередь завершит выполнение всех задач
    await (0, lib_1.delayedExec)((taskCount) * delay + 100);
    const maxParallelTasks = Math.max(...results);
    if (maxParallelTasks <= maxParallels) {
        return {
            message: 'Лимит параллельности соблюдён'
        };
    }
    else {
        return {
            message: 'Лимит параллельности не соблюдён',
            error: `Количество одновременно выполняемых задач (${maxParallelTasks}) превышает максимально допустимое значение ${maxParallels}`
        };
    }
};
const test = () => parallelsLimit(3, 10, 1000);
exports.test = test;
