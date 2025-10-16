import EventEmitter from 'node:events'
import { TasksBroker } from './TasksBroker/TasksBroker'
import { StatsCollector } from './StatsCollector/StatsCollector'
import type { Task, Result, TaskKey, ExecutorId, Mode } from './types'


type Events = {
    run: TaskKey[],
    executed: Result[],
    error: TaskKey[]
}

export interface ITaskSheduler<M extends Mode> {
    add(task: Task): void,
    shutdown(): void,
    queue: Task[],
    executionList: Task[]
    mode?: M
    maxRetries: number,
    baseRetryDelay: number
}

export class TaskSheduler extends EventEmitter<Events> implements ITaskSheduler<Mode> {

    // очередь задач (FIFO)
    queue: Task[] = []

    // текущие исполняемые задачи
    executionList: Task[] = []

    // Режим: для тестирования
    mode?: Mode

    // повторные попытки выполнения задачи
    maxRetries: number = 3

    // начальная задержка перед повтором
    baseRetryDelay: number = 100

    private isShuttingDown: boolean = false

    private tasksBroker: TasksBroker
    private statsCollector: StatsCollector

    private maxParallels: number = 3

    constructor(maxParallels: number, retries?: number, mode?: Mode) {
        super()
        this.maxParallels = maxParallels
        this.mode = mode
        this.tasksBroker = new TasksBroker(this.mode)
        this.statsCollector = new StatsCollector()

        if (retries) this.maxRetries = retries

        this.on('run', (taskKey) => {
            this.execute(taskKey)
            this.statsCollector.increment('running')
        })
        this.on('executed', (result: Result) => {

            this.tasksBroker.emit('result', result)

            if ('error' in result) this.statsCollector.increment('executedWithError')

            // если в очереди есть задачи, то берём одну, по принципу FIFO
            // и добавляем в список исполняемых задач
            if (this.queue.length > 0) {
                const nextTask = this.queue[0]
                this.remove()
                this.addToExecutionList(nextTask)
                this.emit('run', nextTask.key)
            }


            if (this.isShuttingDown && this.executionList.length === 0) {
                console.log('Task scheduler is shutdown !')
                this.isShuttingDown = false
            }

        })
    }

    shutdown(): void {
        this.queue.forEach(() => this.statsCollector.increment('cancelled'))
        this.isShuttingDown = true
        this.queue = [] // мягкое завершение: отмена ожидающих задач
    }

    add(task: Task): void {
        // Регистрация задачи и подписка исполнителя на задачу
        this.tasksBroker.emit('register', task)

        // Дедупликация и добавление задачи в очередь
        const duplicate: boolean = this.isDublicate(task.key)

        if (duplicate) this.statsCollector.increment('deduplicated') // количество дедупликаций

        if (
            !duplicate // Дедупликация
            && !this.isShuttingDown // мягкое завершение: новые задачи не принимать.
        ) {
            this.queue.push(task)
            this.statsCollector.increment('queued')
        }

        // Тут же убираем задачу из очереди по FIFO
        // и добавляем в список исполняемых задач, исполняем её
        if (this.executionList.length < this.maxParallels && !duplicate) { // лимит параллельности
            this.addToExecutionList(task)
            this.remove()
            this.emit('run', task.key)
        }
    }

    private remove(): void {
        this.queue.shift()
    }

    private async execute(taskKey: TaskKey) {
        const executedFunction = this.executionList
            .find(task => task.key === taskKey)
            ?.execute

        const result = await this.getResult(executedFunction, taskKey)

        // убираем выполненную задачу из списка выполняемых
        this.removeFromExecutionList(taskKey)
        this.emit('executed', result)
    }

    private addToExecutionList(task: Task): void {
        this.executionList.push(task)
    }

    private removeFromExecutionList(taskKey: TaskKey): void {
        this.executionList = this.executionList.filter(task => task.key !== taskKey)
    }

    private isDublicate(key: string) {
        const hasDublicate = (tasks: Task[]) => tasks.some((task: Task) => task.key === key)
        return hasDublicate(this.queue)
            || hasDublicate(this.executionList)
    }

    private async getResult(
        execFunction: Task['execute'] | undefined,
        taskKey: string
    ): Promise<Result> {

        const executionErrMessage = 'Task execution error'
        let result

        if (!execFunction) {
            return {
                taskKey,
                message: executionErrMessage,
                error: `Task with key ${taskKey} does not exist`,
                retries: 0
            }
        }

        for (let retries = 0; retries <= this.maxRetries; retries++) {
            try {
                const data = await execFunction?.()

                return {
                    taskKey,
                    message: JSON.stringify(data),
                    retries
                }

            } catch (err: any) {
                result = {
                    taskKey,
                    message: executionErrMessage,
                    error: `Task with key ${taskKey} executed with error: ${err.message}`,
                    retries
                }


                // количество задач, которые были перезапущены хотя бы раз
                retries === 0 && this.statsCollector.increment('retried')

                // экспоненциальная задержка с разбросом
                const delay = this.getExpDelay(retries)

                // ожидание перед следующим повтором
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }
        return result!
    }

    private getExpDelay(retries: number): number {
        const exp = 2
        const baseDelay = this.baseRetryDelay * Math.pow(exp, retries)
        const jitter = Math.floor(Math.random() * baseDelay)
        const delay = baseDelay + jitter
        return delay
    }
}

