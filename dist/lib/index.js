"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delayedExec = void 0;
const delayedExec = (timeout, result) => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(result), timeout);
    });
};
exports.delayedExec = delayedExec;
