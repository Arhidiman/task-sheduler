import { TaskSheduler } from "./queue";

const delayedExec = (timeout: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), timeout)
    })
}

const tasks = []

for (let count = 0; count <=10; count++) {
    const promiseFunc = () => delayedExec(1000)
    tasks.push({
        key: String(count),
        execute: promiseFunc
    })
}

const taskSheduler = new TaskSheduler(3)

for (let task of tasks) {
    taskSheduler.add(task)
}