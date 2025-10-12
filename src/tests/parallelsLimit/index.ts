import { TaskSheduler } from "../../queue"
import { delayedExec } from "../../lib"
import { generateMockTasks } from "../mock"

import type { Test, TestFunc } from ".."

const parallelsLimit = async (maxParallels: number, taskCount: number, delay: number): Promise<Test> => {
    const scheduler = new TaskSheduler(maxParallels)

    const results: number[] = []

    const mockTasks = await generateMockTasks(taskCount, delay, async() => {
        results.push(scheduler.executionList.length)
        return { message: 'parallels limit test' }
    } )
    

    for (let task of mockTasks) {
        scheduler.add(task)
    }

    // Дожидаемся пока очередь завершит выполнение всех задач
    await delayedExec((taskCount)*delay + 100)

    const maxParallelTasks = Math.max(...results)

    if (maxParallelTasks <= maxParallels) {
        return {
            message: `Лимит параллельности соблюдён. Максимальное количество одновременно выполняемых задач ${maxParallelTasks}, лимит параллельности: ${maxParallels}`
        }
    } else {
        return {
            message: `Лимит параллельности не соблюдён.`,
            error: `Количество одновременно выполняемых задач (${maxParallelTasks}) превышает максимально допустимое значение ${maxParallels}`
        }
    }
}

export const test: TestFunc = () => parallelsLimit(3, 10, 1000)
