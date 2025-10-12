import { randomUUID } from 'node:crypto'
import { delayedExec } from '../lib'
import type { Task } from "../types"

export const generateMockTasks = (taskCount: number, delay: number, executeFunc: () => Promise<any>): Task[] => {

    let tasks: Task[] = []
    
    for (let i = 0; i < taskCount; i++) {

        const task = {
            key: String(Math.round(Math.random()*taskCount)),
            execute: async () => {
                await delayedExec(delay)
                return await executeFunc()
            },
            executorID: randomUUID()
        }

        tasks.push(task)
    }

    return tasks
}