export const delayedExec = (timeout: number, result?: any): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(result), timeout)
    })
}