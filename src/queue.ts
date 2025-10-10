import EventEmitter from 'node:events'

type Task = {
    key: string,
    execute(): Promise<any> | any,
}

type Events = {
    run: string[],
    executed: never[]
}

interface ITaskSheduler {
    add(task: Task): void,
    queue: Task[],
    executionList: Task[]
}

export class TaskSheduler extends EventEmitter<Events> implements ITaskSheduler {

    queue: Task[] = []
    executionList: Task[] = []

    private maxParallels: number = 1

    constructor(maxParallels: number) {
        super()
        this.maxParallels = maxParallels
        this.on('run', (taskKey) => { this.execute(taskKey) })
        this.on('executed', () => { 
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
        // Добавляем задачу в очередь
        this.queue.push(task)

        // Тут же убираем задачу из очереди по FIFO
        // и добавляем в список исполняемых задач, исполняем её
        if (this.executionList.length < this.maxParallels) {
            this.remove()
            this.addToExecutionList(task) 
            this.emit('run', task.key)
        }
    }

    private remove(): void {
        this.queue.shift()
    }

    private async execute(taskKey: string) {
        const executedFunction = this.executionList
            .find(task => task.key === taskKey)
            ?.execute

        await executedFunction?.()

        // убираем выполненную задачу из списка выполняемых
        this.removeFromExecutionList(taskKey)
        this.emit('executed')
    }

    private addToExecutionList(task: Task): void {
        this.executionList.push(task)
    }

    private removeFromExecutionList(taskKey: string): void {
        this.executionList = this.executionList.filter(task => task.key !== taskKey)
    }
}

