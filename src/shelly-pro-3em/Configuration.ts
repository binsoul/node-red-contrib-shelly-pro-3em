/**
 * Sanitized configuration generated from user input.
 */
export class Configuration {
    outputProperty: string;
    outputTarget: string;
    deviceIp: string;

    constructor(
        outputTarget = 'msg',
        outputProperty = 'payload',
        deviceIp = '192.168.33.1',
    ) {
        this.outputTarget = outputTarget;
        this.outputProperty = outputProperty;
        this.deviceIp = deviceIp;
    }
}
