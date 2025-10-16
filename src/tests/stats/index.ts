import { randomUUID } from "node:crypto"
import { TaskSheduler } from "../../queue"
import { delayedExec } from "../../lib"
import type { Test, TestFunc } from ".."
import type { Task } from "../../types"

const stats = async (): Promise<Test> => {

    const scheduler = new TaskSheduler(3, 2) // параллельность и количество ретраев
    const statsCollector = scheduler["statsCollector"] // доступ к внутреннему экземпляру статистики

    const logStats = (label: string) => {
        const s = statsCollector.getStats()
        console.log(
            `${label} -> queued: ${s.queued}, running: ${s.running}, deduplicated: ${s.deduplicated}, retried: ${s.retried}, executedWithError: ${s.executedWithError}, cancelled: ${s.cancelled}`
        )
    }

    const results: string[] = []

    // успешная задача
    const successTask: Task = {
        key: randomUUID(),
        executorID: randomUUID(),
        execute: async () => {
            await delayedExec(200)
            results.push("success")
            return "done"
        }
    }

    // задача, завершающаяся ошибкой
    const failedTask: Task = {
        key: randomUUID(),
        executorID: randomUUID(),
        execute: async () => {
            await delayedExec(100)
            throw new Error("some error")
        }
    }

    // дубликаты одной и той же задачи
    const sharedKey = "dedup-test"
    const duplicateTask: Task = {
        key: sharedKey,
        executorID: randomUUID(),
        execute: async () => {
            await delayedExec(300)
            results.push("deduped")
            return "ok"
        }
    }

    logStats("Before add")

    scheduler.add(successTask)
    scheduler.add(failedTask)
    scheduler.add(duplicateTask)
    scheduler.add({ ...duplicateTask, executorID: randomUUID() }) // второй с тем же ключом
    scheduler.add({ ...duplicateTask, executorID: randomUUID() }) // третий
    scheduler.shutdown()

    logStats("After add")

    // ждём завершения всех задач (учитываем ретраи)
    await delayedExec(2000)

    logStats("After execution")

    // Завершаем работу планировщика
    logStats("After shutdown")

    const s = statsCollector.getStats()

    const ok =
        s.queued >= 3 &&
        s.running === 3 &&
        s.executedWithError >= 1 &&
        s.deduplicated >= 1 &&
        s.cancelled >= 0

    const message = [
        "Итоговая статистика выполнения:",
        `queued: ${s.queued}`,
        `running: ${s.running}`,
        `deduplicated: ${s.deduplicated}`,
        `retried: ${s.retried}`,
        `executedWithError: ${s.executedWithError}`,
        `cancelled: ${s.cancelled}`,
        "",
        `Результаты выполнения задач: ${results.join(", ")}`
    ].join("\n")

    if (ok) {
        return { message }
    } else {
        return {
            message,
            error: "Некорректные значения статистики"
        }
    }
}

export const test: TestFunc = () => stats()
