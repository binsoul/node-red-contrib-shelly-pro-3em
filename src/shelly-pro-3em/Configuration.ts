/**
 * Sanitized configuration generated from user input.
 */
export class Configuration {
    outputProperty: string;
    outputTarget: string;
    deviceIp: string;
    updateMode: string;
    updateFrequency: number;

    constructor(outputTarget = 'msg', outputProperty = 'payload', deviceIp = '192.168.33.1', updateMode = 'never', updateFrequency = 5) {
        this.outputTarget = outputTarget;
        this.outputProperty = outputProperty;
        this.deviceIp = deviceIp;
        this.updateMode = updateMode;
        this.updateFrequency = updateFrequency;
    }
}
