import { randomUUID } from 'node:crypto'
import type { Task } from "../types"

export const delayedExec = (timeout: number, result?: any): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(result), timeout)
    })
}

export const generateMockTasks = (taskCount: number, delay: number, executeFunc: () => Promise<any>): Task[] => {
    let tasks: Task[] = []
    for (let i = 0; i < taskCount; i++) {


        const key = String(Math.round(Math.random()*taskCount)) 
        const task = {
            key,
            execute: async () => {
                await delayedExec(delay)

                // console.log(key)
                return await executeFunc()
            },
            executorID: randomUUID()
        }

        tasks.push(task)
    }
    return tasks
}

export function calculateMaxTotalDelay(baseRetryDelay: number, exp: number, maxRetries: number): number {
    let total = 0

    for (let retry = 0; retry <= maxRetries; retry++) {
        const baseDelay = baseRetryDelay * Math.pow(exp, retry)
        const maxJitter = baseDelay // jitter может быть до baseDelay
        total += baseDelay + maxJitter
    }

    return total
}