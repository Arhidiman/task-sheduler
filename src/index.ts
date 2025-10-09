import { TaskSheduler } from "./queue";


const taskSheduler = new TaskSheduler()

const func1 = () => console.log('func1')
const func2 = () => console.log('func2')
const func3 = () => console.log('func3')

taskSheduler.add({ key: func1.name, execute: func1})
taskSheduler.add({ key: func2.name, execute: func2})
taskSheduler.add({ key: func3.name, execute: func3})


taskSheduler.runQueue()