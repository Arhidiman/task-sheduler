import fs from 'fs'
import path from 'path'

export type Test = {
    message: string,
    error?: string
}

export type TestFunc = () => Promise<Test> | Test

const testDir = __dirname
const tests = fs.readdirSync(testDir)


const runTests = async () => {
    for (let testFile of tests) {
        try {
            const filePath = path.resolve(testDir, testFile)
            const exports: { test: TestFunc } = require(filePath)            
            const result: Test = await exports?.test?.()

            if (result) {
                'message' in result 
                    && console.log(`Test ${testFile} executed. Result: ${result.message}`)

                'error' in result 
                    && console.log(`Error in test ${testFile}. Error: $${result.error}`)
            }
        } catch(err: any) {
            console.log(`Ошибка чтения файла: ${err.message}`)
        }
    }
}

runTests()