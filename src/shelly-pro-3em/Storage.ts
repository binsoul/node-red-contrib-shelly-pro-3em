import { max, mean, min, sum } from 'simple-statistics';
import type { NodeOutput, RangeValue } from './NodeOutput';

/**
 * Stores events and a history of past events.
 */
export class Storage {
    private updating = false;
    private fromTimeStamp: number | null = null;
    private toTimeStamp: number | null = null;
    private error: string | null = null;
    private recordCount = 0;

    private counters: { [key: string]: number } | null = null;
    private data: NodeOutput | null = null;

    public isUpdating(): boolean {
        return this.updating;
    }

    public setUpdating(value: boolean) {
        this.updating = value;
    }

    public getFromTimestamp(): number | null {
        return this.fromTimeStamp;
    }

    public setFromTimestamp(value: number | null) {
        this.fromTimeStamp = value;
    }

    public getToTimestamp(): number | null {
        return this.toTimeStamp;
    }

    public setToTimestamp(value: number | null) {
        this.toTimeStamp = value;
    }

    public getError(): string | null {
        return this.error;
    }

    public setError(value: string | null) {
        this.error = value;
    }

    public getRecordCount(): number {
        return this.recordCount;
    }

    public clear(): void {
        this.data = null;
        this.counters = null;
        this.error = null;
        this.recordCount = 0;
    }

    public getData(): NodeOutput | null {
        const result = Object.assign({}, this.data);
        result.counters = this.counters || {};

        return result;
    }

    public setCounters(counters: { [key: string]: number }): void {
        this.counters = counters;
    }

    public setRecords(keys: Array<string>, values: Array<Array<number>>): void {
        this.recordCount = values.length;

        this.addExtraValues('a', 'act_power', keys, values);
        this.addExtraValues('a', 'aprt_power', keys, values);
        this.addExtraValues('b', 'act_power', keys, values);
        this.addExtraValues('b', 'aprt_power', keys, values);
        this.addExtraValues('c', 'act_power', keys, values);
        this.addExtraValues('c', 'aprt_power', keys, values);

        const result: NodeOutput = { a: {}, b: {}, c: {}, n: {}, counters: {} };
        for (let n = 0; n < keys.length; n++) {
            const data = [];
            for (let i = 0; i < values.length; i++) {
                data.push(values[i][n]);
            }

            let value;
            const parts = keys[n].split('_');
            const phase = parts.shift() as 'a' | 'b' | 'c' | 'n';
            if (['a', 'b', 'c', 'n'].indexOf(phase) < 0) {
                continue;
            }

            if (parts[0] === 'min') {
                value = min(data);
                parts.shift();
                if (typeof result[phase][parts.join('_')] === 'undefined') {
                    result[phase][parts.join('_')] = { min: 0, max: 0, avg: 0 };
                }

                const rangeValue = result[phase][parts.join('_')] as RangeValue;
                rangeValue.min = value;
            } else if (parts[0] === 'max') {
                value = max(data);
                parts.shift();
                if (typeof result[phase][parts.join('_')] === 'undefined') {
                    result[phase][parts.join('_')] = { min: 0, max: 0, avg: 0 };
                }

                const rangeValue = result[phase][parts.join('_')] as RangeValue;
                rangeValue.max = value;
            } else if (parts[0] === 'avg') {
                value = this.round(mean(data), '4');
                parts.shift();
                if (typeof result[phase][parts.join('_')] === 'undefined') {
                    result[phase][parts.join('_')] = { min: 0, max: 0, avg: 0 };
                }

                const rangeValue = result[phase][parts.join('_')] as RangeValue;
                rangeValue.avg = value;
            } else if (parts[parts.length - 1] === 'energy') {
                value = this.round(sum(data), '4');
                result[phase][parts.join('_')] = value;
            } else {
                value = this.round(mean(data), '4');
                result[phase][parts.join('_')] = value;
            }
        }

        this.data = result;
    }

    private addExtraValues(prefix: string, suffix: string, keys: Array<string>, values: Array<Array<number>>) {
        const index = keys.indexOf(prefix + '_avg_' + suffix);
        if (index <= 0) {
            const maxIndex = keys.indexOf(prefix + '_max_' + suffix);
            const minIndex = keys.indexOf(prefix + '_min_' + suffix);

            if (maxIndex >= 0 && minIndex >= 0) {
                keys.push(prefix + '_avg_' + suffix);
                for (let i = 0; i < values.length; i++) {
                    values[i].push((values[i][maxIndex] + values[i][minIndex]) / 2);
                }
            }
        }
    }

    private round(value: number, decimals: string): number {
        return Number(Math.round(<number>(<unknown>(value + 'e' + decimals))) + 'e-' + decimals);
    }
}
