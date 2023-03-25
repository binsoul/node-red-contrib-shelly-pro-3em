interface RangeValue {
    min: number;
    max: number;
    avg: number;
    sum?: number;
}

interface RangeValueWithSum extends RangeValue {
    sum: number;
}

interface Phase {
    [key: string]: number | RangeValue;
    actualPower: RangeValue;
    actualEnergy: RangeValueWithSum;
    actualEnergyReturned: RangeValueWithSum;
}

interface Counters {
    [key: string]: number;
}

interface PhaseData {
    [key: string]: Phase;
    phaseA: Phase;
    phaseB: Phase;
    phaseC: Phase;
    neutral: Phase;
}

export interface NodeOutput extends PhaseData {
    counters: Counters;
}
