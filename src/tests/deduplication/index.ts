import { randomUUID } from "node:crypto"
import { TaskSheduler } from "../../queue"
import { delayedExec } from "../../lib"
import type { Test, TestFunc } from ".."
import type { Task } from "../../types"

const deduplication = async (taskCount: number, delayPerTask: number): Promise<Test> => {
    const scheduler = new TaskSheduler(3)

    const executed: string[] = []
    const sharedTaskKey = "duplicate-task"

    const longTask = async () => {
        executed.push("run")
        await delayedExec(delayPerTask)
        return "done"
    }

    const task =   {
        key: sharedTaskKey,
        executorID: randomUUID(),
        execute: longTask
    }

    let tasks: Task[] = []

    for (let i = 0; i < taskCount; i++) {
        tasks.push(task)
    }

    // Создание задач одинаковым ключом
    for (let task of tasks) {
        scheduler.add(task)
    }

    // Дожидаемся пока очередь завершит выполнение всех задач
    await delayedExec(taskCount*delayPerTask+200)

    const tasksMap = scheduler["executorsRegistrator"].tasksSubscribers
    const duplicateSubs = tasksMap[sharedTaskKey].length // количество подписчиков на задачу

    const ok = executed.length === 1

    if (ok) { 
        return {
            message: `Task widt key "${sharedTaskKey}" deduplicated correctly. Executed ${executed.length} times, executors count: ${duplicateSubs}.`,
        }
    } else {
        return {
            message: "Deduplication error.",
            error: `Executed times: ${executed.length}; executors count: ${duplicateSubs}`,
        }
    }
}

export const test: TestFunc = () => deduplication(10, 500)
