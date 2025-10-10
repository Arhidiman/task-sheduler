"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskSheduler = void 0;
const node_events_1 = __importDefault(require("node:events"));
class TaskSheduler extends node_events_1.default {
    constructor(maxParallels) {
        super();
        this.queue = [];
        this.executionList = [];
        this.maxParallels = 1;
        this.maxParallels = maxParallels;
        this.on('run', (taskKey) => { this.execute(taskKey); });
        this.on('executed', () => {
            // если в очереди есть задачи, то берём одну, по принципу FIFO
            // и добавляем в список исполняемых задач
            if (this.queue.length > 0) {
                const nextTask = this.queue[0];
                this.remove();
                this.addToExecutionList(nextTask);
                this.emit('run', nextTask.key);
            }
        });
    }
    add(task) {
        // Добавляем задачу в очередь
        this.queue.push(task);
        // Тут же убираем задачу из очереди по FIFO
        // и добавляем в список исполняемых задач, исполняем её
        if (this.executionList.length < this.maxParallels) {
            this.remove();
            this.addToExecutionList(task);
            this.emit('run', task.key);
        }
    }
    remove() {
        this.queue.shift();
    }
    async execute(taskKey) {
        const executedFunction = this.executionList
            .find(task => task.key === taskKey)
            ?.execute;
        await executedFunction?.();
        // убираем выполненную задачу из списка выполняемых
        this.removeFromExecutionList(taskKey);
        this.emit('executed');
    }
    addToExecutionList(task) {
        this.executionList.push(task);
    }
    removeFromExecutionList(taskKey) {
        this.executionList = this.executionList.filter(task => task.key !== taskKey);
    }
}
exports.TaskSheduler = TaskSheduler;
