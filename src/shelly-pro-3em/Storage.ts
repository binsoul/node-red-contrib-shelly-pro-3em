import { max, mean, min, sum } from 'simple-statistics';
import type { Counters, NodeOutput, Phase, PhaseData, ValueWithBounds, ValueWithBoundsAndSum } from './NodeOutput.js';

/**
 * Stores events and a history of past events.
 */
export class Storage {
    private updating = false;
    private fromTimeStamp: number | null = null;
    private toTimeStamp: number | null = null;
    private error: string | null = null;
    private recordCount = 0;

    private counters: Counters | null = null;
    private phaseData: PhaseData | null = null;

    private knownMeasurements: Map<string, string> = new Map([
        ['total_act_energy', 'actualEnergy'],
        ['fund_act_energy', 'fundamentalActualEnergy'],
        ['total_act_ret_energy', 'actualEnergyReturned'],
        ['fund_act_ret_energy', 'fundamentalActualEnergyReturned'],
        ['lag_react_energy', 'laggingReactiveEnergy'],
        ['lead_react_energy', 'leadingReactiveEnergy'],
        ['act_power', 'actualPower'],
        ['aprt_power', 'apparentPower'],
        ['a_total_act_energy', 'actualEnergyPhaseA'],
        ['a_total_act_ret_energy', 'actualEnergyReturnedPhaseA'],
        ['b_total_act_energy', 'actualEnergyPhaseB'],
        ['b_total_act_ret_energy', 'actualEnergyReturnedPhaseB'],
        ['c_total_act_energy', 'actualEnergyPhaseC'],
        ['c_total_act_ret_energy', 'actualEnergyReturnedPhaseC'],
        ['total_act', 'actualEnergy'],
        ['total_act_ret', 'actualEnergyReturned'],
    ]);

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
        this.phaseData = null;
        this.counters = null;
        this.error = null;
        this.recordCount = 0;
    }

    public getData(): NodeOutput | null {
        if (this.phaseData === null) {
            return null;
        }

        const result: NodeOutput = Object.assign({}, this.phaseData) as NodeOutput;

        result.totals = {};
        result.totals.actualEnergy = this.round(sum([this.phaseData.phaseA.actualEnergy.sum, this.phaseData.phaseB.actualEnergy.sum, this.phaseData.phaseC.actualEnergy.sum]), '4');
        result.totals.actualEnergyReturned = this.round(sum([this.phaseData.phaseA.actualEnergyReturned.sum, this.phaseData.phaseB.actualEnergyReturned.sum, this.phaseData.phaseC.actualEnergyReturned.sum]), '4');
        result.totals.actualPower = this.round((result.totals.actualEnergy * 60) / this.recordCount, '4');
        result.totals.actualPowerReturned = this.round((result.totals.actualEnergyReturned * 60) / this.recordCount, '4');

        result.counters = this.counters || {};

        return result;
    }

    public setCounters(counters: Counters): void {
        this.counters = {};

        for (const [key, value] of Object.entries(counters)) {
            if (this.knownMeasurements.has(key)) {
                this.counters[this.knownMeasurements.get(key) as string] = value;
            } else {
                this.counters[key] = value;
            }
        }
    }

    public setRecords(keys: Array<string>, values: Array<Array<number>>): void {
        this.recordCount = values.length;

        this.addExtraValues('a', 'aprt_power', keys, values);
        this.addExtraValues('b', 'aprt_power', keys, values);
        this.addExtraValues('c', 'aprt_power', keys, values);

        const result: PhaseData = { phaseA: {} as Phase, phaseB: {} as Phase, phaseC: {} as Phase, neutral: {} as Phase };
        for (let n = 0; n < keys.length; n++) {
            const data = [];
            for (let i = 0; i < values.length; i++) {
                data.push(values[i][n]);
            }

            const parts = keys[n].split('_');
            const prefix = parts.shift() as 'a' | 'b' | 'c' | 'n';

            let phase;
            if (prefix === 'n') {
                phase = 'neutral';
            } else {
                phase = 'phase' + prefix.toUpperCase();
            }

            let measurement = this.getMeasurementCode(parts);
            if (parts[0] === 'min') {
                parts.shift();
                measurement = this.getMeasurementCode(parts);
                if (typeof result[phase][measurement] === 'undefined') {
                    result[phase][measurement] = { min: 0, max: 0, avg: 0 };
                }

                const rangeValue = result[phase][measurement] as ValueWithBounds;
                rangeValue.min = this.round(min(data), '4');
            } else if (parts[0] === 'max') {
                parts.shift();
                measurement = this.getMeasurementCode(parts);
                if (typeof result[phase][measurement] === 'undefined') {
                    result[phase][measurement] = { min: 0, max: 0, avg: 0 };
                }

                const rangeValue = result[phase][measurement] as ValueWithBounds;
                rangeValue.max = this.round(max(data), '4');
            } else if (parts[0] === 'avg') {
                parts.shift();
                measurement = this.getMeasurementCode(parts);
                if (typeof result[phase][measurement] === 'undefined') {
                    result[phase][measurement] = { min: 0, max: 0, avg: 0 };
                }

                const rangeValue = result[phase][measurement] as ValueWithBounds;
                rangeValue.avg = this.round(mean(data), '4');
            } else if (parts[parts.length - 1] === 'energy') {
                if (typeof result[phase][measurement] === 'undefined') {
                    result[phase][measurement] = { min: 0, max: 0, avg: 0, sum: 0 } as ValueWithBoundsAndSum;
                }

                const rangeValue = result[phase][measurement] as ValueWithBoundsAndSum;
                rangeValue.min = this.round(min(data), '4');
                rangeValue.max = this.round(max(data), '4');
                rangeValue.avg = this.round(mean(data), '4');
                rangeValue.sum = this.round(sum(data), '4');
            } else {
                result[phase][measurement] = this.round(mean(data), '4');
            }
        }

        result.phaseA.actualPower.avg = this.round(((result.phaseA.actualEnergy.sum - result.phaseA.actualEnergyReturned.sum) * 60) / values.length, '4');
        result.phaseB.actualPower.avg = this.round(((result.phaseB.actualEnergy.sum - result.phaseB.actualEnergyReturned.sum) * 60) / values.length, '4');
        result.phaseC.actualPower.avg = this.round(((result.phaseC.actualEnergy.sum - result.phaseC.actualEnergyReturned.sum) * 60) / values.length, '4');

        this.phaseData = result;
    }

    private getMeasurementCode(parts: string[]): string {
        const result = parts.join('_');
        if (this.knownMeasurements.has(result)) {
            return this.knownMeasurements.get(result) as string;
        }

        return result;
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
