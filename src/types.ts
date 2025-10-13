import type { UUID } from "node:crypto"

export type TaskKey = string
export type ExecutorId = UUID

export type Result = {
    taskKey: TaskKey
    message: string,
    error?: string
    retries: number
}

export type Events = {
    result: Result[],
    register: Task[]
}

export type Mode = 'prod' | 'test' | undefined

export type Task = {
    key: TaskKey,
    execute(): Promise<any> | any,
    executorID: ExecutorId,
}
