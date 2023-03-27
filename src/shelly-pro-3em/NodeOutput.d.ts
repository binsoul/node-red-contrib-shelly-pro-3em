interface ValueWithBounds {
    min: number;
    max: number;
    avg: number;
}

interface ValueWithBoundsAndSum extends ValueWithBounds {
    sum: number;
}

interface Phase {
    [key: string]: number | ValueWithBounds;
    actualPower: ValueWithBounds;
    actualEnergy: ValueWithBoundsAndSum;
    actualEnergyReturned: ValueWithBoundsAndSum;
}

interface PhaseData {
    [key: string]: Phase;
    phaseA: Phase;
    phaseB: Phase;
    phaseC: Phase;
    neutral: Phase;
}

interface Totals {
    [key: string]: number;
}

interface Counters {
    [key: string]: number;
}

export interface NodeOutput extends PhaseData {
    totals: Totals;
    counters: Counters;
}
