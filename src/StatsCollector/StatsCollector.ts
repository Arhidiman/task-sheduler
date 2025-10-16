type Stats = {
    queued: number,
    running: number,
    deduplicated: number,
    retried: number,
    executedWithError: number,
    cancelled: number
}

type StatsType = keyof Stats

interface IStatsCollector {
    stats: Stats,
    increment(stat: StatsType): void,
    decrement(stat: StatsType): void,
    getStats(): Stats
}

export class StatsCollector implements IStatsCollector {

    stats: Stats = {
        queued: 0, // поставлено
        running: 0, // запущено
        deduplicated: 0, // дедуплицировано
        retried: 0, // перезапущено
        executedWithError: 0, // завершилось с ошибкой
        cancelled: 0 // отменено
    }

    increment(stat: StatsType): void {
        this.stats = { ...this.stats, [stat]: this.stats[stat] + 1}
    }

    decrement(stat: StatsType): void {
        this.stats = { ...this.stats, [stat]: this.stats[stat] - 1}
    }

    getStats(): Stats {
        return this.stats
    }
}