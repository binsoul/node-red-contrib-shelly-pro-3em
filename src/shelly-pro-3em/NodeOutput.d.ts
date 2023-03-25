interface RangeValue {
    min: number;
    max: number;
    avg: number;
    sum?: number;
}

interface Phase {
    [key: string]: number | RangeValue;
}

interface Counters {
    [key: string]: number;
}

export interface NodeOutput {
    [key: string]: Phase;
    phaseA: Phase;
    phaseB: Phase;
    phaseC: Phase;
    neutral: Phase;
    counters: Counters;
}
