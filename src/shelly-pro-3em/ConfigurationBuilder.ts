import { Configuration } from './Configuration.js';
import type { UserConfiguration } from './UserConfiguration.js';

const getString = function (value: unknown, defaultValue: string): string {
    const result = value || defaultValue;

    const stringValue = '' + result;
    if (stringValue.trim() === '') {
        return defaultValue;
    }

    return stringValue;
};

/**
 * Creates a sanitized configuration from user input.
 */
export function buildConfiguration(config: UserConfiguration): Configuration {
    const outputTarget = getString(config.outputTarget, 'msg');
    const outputProperty = getString(config.outputProperty, 'payload');
    const deviceIp = getString(config.deviceIp, '192.168.33.1');
    const updateMode = getString(config.updateMode, 'never');
    const updateFrequency = Number(config.updateFrequency || 5);

    return new Configuration(outputTarget, outputProperty, deviceIp, updateMode, updateFrequency);
}
