import { TaskSheduler } from "../queue"
import { delayedExec } from "../lib"
import type { Test, TestFunc } from "."

const parallelsLimit = async (maxParallels: number, taskCount: number, delay: number): Promise<Test> => {
    const scheduler = new TaskSheduler(maxParallels)

    const results: number[] = []
    
    for (let i = 0; i < taskCount; i++) {
        scheduler.add({
            key: String(1),
            execute: async () => {
                // Имитация долгой асинхронной задачи
                await delayedExec(delay)


                // console.log(scheduler.executionList, 'scheduler.executionList')
                // Проверяем состояние во время выполнения
                results.push(scheduler.executionList.length)
                return i
            }
        })
    }

    // Дожидаемся пока очередь завершит выполнение всех задач
    await delayedExec((taskCount)*delay + 100)

    // console.log(results, 'results')

    const maxParallelTasks = Math.max(...results)

    if (maxParallelTasks <= maxParallels) {
        return {
            message: 'Лимит параллельности соблюдён'
        }
    } else {
        return {
            message: 'Лимит параллельности не соблюдён',
            error: `Количество одновременно выполняемых задач (${maxParallelTasks}) превышает максимально допустимое значение ${maxParallels}`
        }
    }
}

export const test: TestFunc = () => parallelsLimit(3, 10, 1000)
