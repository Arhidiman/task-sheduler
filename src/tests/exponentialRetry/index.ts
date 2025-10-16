import { randomUUID } from "node:crypto"
import { TaskSheduler, ITaskSheduler } from "../../queue"
import { delayedExec, calculateMaxTotalDelay } from "../../lib"
import { performance } from 'perf_hooks'
import type { Test, TestFunc } from ".."

const exponentialRetry = async (maxParallels: number, retries: number): Promise<Test> => {
    const scheduler = new TaskSheduler(maxParallels, retries) 

    const started: number[] = []
    const taskKey = "error-task"

    const execute = async () => {
        started.push(Math.round(performance.now()))
        throw new Error('some error in task')
    }

    const errorTask =   {
        key: taskKey,
        executorID: randomUUID(),
        execute
    }

    scheduler.add(errorTask)
   
    // Дожидаемся пока очередь завершит выполнение всех задач
    const maxDelay = calculateMaxTotalDelay(scheduler.baseRetryDelay, 2, scheduler['maxRetries'])
    await delayedExec(maxDelay+1000)
    const ok = started.length - 1 <= scheduler.maxRetries

    const message = `Задача "${taskKey}" запустилась повторно ${started.length - 1} раз, задержки между стартами задачи: ${started.join('ms, ')}ms.`

    if (ok) { 
        return {
            message
        }
    } else {
        return {
            message,
            error: "Повторный запуск при сбое некоррктен",
        }
    }
}

export const test: TestFunc = () => exponentialRetry(3, 5)
