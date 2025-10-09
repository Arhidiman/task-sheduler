
type Task = {
    key: string,
    execute(): Promise<any> | any 
}

interface ITaskSheduler {
    add(task: Task): void,
    remove(): void
    execute(): any
    runQueue(): void
}


export class TaskSheduler implements ITaskSheduler {
    private queue: Task[] = []

    add(task: Task): void {
        this.queue.push(task)
    }

    remove(): void {
        this.queue.shift()
    }

    async execute() {
        await this.queue[0].execute()
        this.remove
    }

    async runQueue(): Promise<void> {
        for (let task of this.queue) {
            await task.execute()
        }
    }
}

