interface RangeValue {
    min: number;
    max: number;
    avg: number;
}

interface Phase {
    [key: string]: number | RangeValue;
}

interface Counters {
    [key: string]: number;
}

export interface NodeOutput {
    a: Phase;
    b: Phase;
    c: Phase;
    n: Phase;
    counters: Counters;
}
