
import { randomUUID } from "node:crypto"
import { TaskSheduler } from "../../queue"
import { delayedExec } from "../../lib"
import type { Test, TestFunc } from ".."
import type { Task } from "../../types"

const gracefulShutdown = async (maxParallels: number, delay: number): Promise<Test> => {
    const scheduler = new TaskSheduler(maxParallels) 

    const resultsBeforeShutdown: string[] = []
    const resultsAfterShutdown: string[] = []

    const execute = async (i: number, collectResultsArray: string[]) => {
        await delayedExec(delay*i)
        collectResultsArray.push('result')
    }


    const generateTasks = (tasksCount: number, collectResultsArray: string[]) => {
        const tasks: Task[] = []
        for (let i = 0; i < tasksCount; i++) {
            tasks.push({
                key: randomUUID(),
                execute: async () => execute(i, collectResultsArray),
                executorID: randomUUID()
            })    
        }
        return tasks
    }

    const tasksBeforeShutdown = generateTasks(maxParallels, resultsBeforeShutdown)

    const taskAfterShutdown = generateTasks(maxParallels, resultsAfterShutdown)

    
    for (let task of tasksBeforeShutdown) {
        scheduler.add(task)
    }

    scheduler.shutdown()

    for (let task of taskAfterShutdown) {
        scheduler.add(task)
    }

    // Дожидаемся пока очередь завершит выполнение всех задач
    const maxDelay = [ ...tasksBeforeShutdown, ...taskAfterShutdown].length * delay
    await delayedExec(maxDelay+200)

    const totalResults =  [...resultsBeforeShutdown, ...resultsAfterShutdown]

    const ok = 
        totalResults.length === tasksBeforeShutdown.length
        && resultsAfterShutdown.length === 0

        const message = [
            `Задач добавленных в очередь до завершения (shutdown): ${tasksBeforeShutdown.length};`,
            `Задач добавленных в очередь после shutdown: ${taskAfterShutdown.length}.`,
            `Выполнено задач: ${totalResults.length}`
        ].join('\n')
        

    if (ok) { 
        return {
            message
        }
    } else {
        return {
            message,
            error: "Мягкое завершение выполнено некорректно",
        }
    }
}

export const test: TestFunc = () => gracefulShutdown(3, 200)






