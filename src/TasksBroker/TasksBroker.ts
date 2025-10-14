import EventEmitter from "node:events";
import type { Mode, Events, Result, Task, TaskKey, ExecutorId } from "../types";

export interface ITasksBroker<M extends Mode> {
    tasksSubscribers: Record<TaskKey, ExecutorId[]>
    mode?: M
}

// доставщик результатов исполнителям
export class TasksBroker extends EventEmitter<Events> implements ITasksBroker<Mode> {

    tasksSubscribers: Record<TaskKey, ExecutorId[]> = {}
    mode?: Mode

    constructor(mode?: Mode) {
        super()
        this.mode = mode

        this.on('register', (task: Task) => this.subscribeExecutor(task))
        this.on('result', (result: Result) => this.sendToExecutors(result))
    }

    private subscribeExecutor(task: Task) {
        this.tasksSubscribers[task.key] = this.tasksSubscribers[task.key]
            ? [ ...this.tasksSubscribers[task.key], task.executorID]
            : [task.executorID]
    }

    protected sendToExecutors(result: Result) {
        for (let executor of this.tasksSubscribers[result.taskKey]) {
            this.mode === 'test' 
                && console.log(`Result of task ${result.taskKey}: ${result.message}. Sent to executor: ${executor}`)
        }
    }
}