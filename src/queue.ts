import { UUID } from 'node:crypto'
import EventEmitter from 'node:events'
import { ExecutorsRegistrator } from './TaskRegistrator'
import type { Task, Result, TaskKey, ExecutorId, Mode } from './types'


type Events = {
    run: TaskKey[],
    executed: Result[],
    error: TaskKey[]
}

export interface ITaskSheduler<M extends Mode> {
    add(task: Task): void,
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

    baseRetryDelay: number = 100

    private executorsRegistrator: ExecutorsRegistrator

    private maxParallels: number = 1

    constructor(maxParallels: number, retries?: number, mode?: Mode) {
        super()
        this.maxParallels = maxParallels
        this.mode = mode
        this.executorsRegistrator = new ExecutorsRegistrator(this.mode)

        if (retries) this.maxRetries = retries

        this.on('run', (taskKey) => { this.execute(taskKey) })
        this.on('executed', (result: Result) => { 

            this.executorsRegistrator.emit('result', result)

            // если в очереди есть задачи, то берём одну, по принципу FIFO
            // и добавляем в список исполняемых задач
            if (this.queue.length > 0) {
                const nextTask = this.queue[0]
                this.remove()
                this.addToExecutionList(nextTask)
                this.emit('run', nextTask.key)
            }
        })
    }

    add(task: Task): void {
        // Регистрация задачи и подписка исполнителя на задачу
        this.executorsRegistrator.emit('register', task)

        // Дедупликация и дообавление задачи в очередь
        const duplicate: boolean = this.isDublicate(task.key)
        if (!duplicate) this.queue.push(task)

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
    
            } catch(err: any) {            
                result = {
                    taskKey,
                    message: executionErrMessage,
                    error: `Task with key ${taskKey} executed with error: ${err.message}`,
                    retries
                }

                // экспоненциальная задержка с разбросом
                const exp = 2
                const baseDelay = this.baseRetryDelay * Math.pow(exp, retries)
                const jitter = Math.floor(Math.random() * baseDelay)
                const delay = baseDelay + jitter
                    
                // ожидание перед следующим повтором
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }        
        return result!
    }
}

