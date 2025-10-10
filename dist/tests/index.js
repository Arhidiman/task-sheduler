"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const testDir = __dirname;
const tests = fs_1.default.readdirSync(testDir);
const runTests = async () => {
    for (let testFile of tests) {
        try {
            const filePath = path_1.default.resolve(testDir, testFile);
            const exports = require(filePath);
            const result = await exports?.test?.();
            if (result) {
                'message' in result
                    && console.log(`Test ${testFile} executed. Result: ${result.message}`);
                'error' in result
                    && console.log(`Error in test ${testFile}. Error: $${result.error}`);
            }
        }
        catch (err) {
            console.log(`Ошибка чтения файла: ${err.message}`);
        }
    }
};
runTests();
