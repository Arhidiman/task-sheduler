import fs from 'fs'
import path from 'path'

export type Test = {
    message: string,
    error?: string
}

export type TestFunc = () => Promise<Test> | Test

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",

    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",

    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgBlue: "\x1b[44m",
}

const testDir = __dirname
const tests = fs.readdirSync(testDir)

const runTests = async () => {
    console.log(`${colors.cyan}${colors.bright} Запуск тестов...\n${colors.reset}`)

    for (let directory of tests) {
        try {
            const filePath = path.resolve(testDir, directory, 'index.js')
            const exports: { test: TestFunc } = require(filePath)
            const result: Test = await exports?.test?.()

            if (result) {
                const testName = `${colors.bright}${colors.white}${directory}${colors.reset}`

                if ('error' in result) {
                    console.log(
                        `${colors.bgRed}${colors.white} ✖ FAIL ${colors.reset} ${testName}\n` +
                        `${colors.red} ${result.error}${colors.reset}\n`
                    )
                } else {
                    console.log(
                        `${colors.bgGreen}${colors.white} ✔ PASS ${colors.reset} ${testName}\n` +
                        `${colors.green} ${result.message}${colors.reset}\n`
                    )
                }
            }
        } catch (err: any) {
            if (!err?.message.toLowerCase().includes('cannot find')) {
                console.log(
                    `${colors.bgRed}${colors.white} ERROR ${colors.reset}  ${directory}\n` +
                    `${colors.red}    ${err.message}${colors.reset}\n`
                )
            }
        }
    }

    console.log(`${colors.cyan}${colors.bright}🏁 Все тесты завершены.${colors.reset}`)
}

runTests()
