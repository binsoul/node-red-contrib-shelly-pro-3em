import { Action, InputDefinition, Output, OutputDefinition } from '@binsoul/node-red-bundle-processing';
import type { Configuration } from '../Configuration';
import { Storage } from '../Storage';

function formatTime(timestamp: number) {
    const date = new Date(timestamp);

    return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
}

export class OutputAction implements Action {
    private readonly configuration: Configuration;
    private storage: Storage;

    constructor(configuration: Configuration, storage: Storage) {
        this.configuration = configuration;
        this.storage = storage;
    }

    defineInput(): InputDefinition {
        return new InputDefinition();
    }

    defineOutput(): OutputDefinition {
        const result = new OutputDefinition();

        result.set('output', {
            target: this.configuration.outputTarget,
            property: this.configuration.outputProperty,
            type: 'object',
            channel: 0,
        });

        return result;
    }

    execute(): Output {
        const result = new Output();

        if (this.storage.getError() === null) {
            result.setValue('output', this.storage.getData());

            let fromTimeString = '';
            const fromTimestamp = this.storage.getFromTimestamp();
            if (fromTimestamp !== null) {
                fromTimeString = formatTime(fromTimestamp * 1000);
            }

            let toTimeString = '';
            const toTimestamp = this.storage.getToTimestamp();
            if (toTimestamp !== null) {
                toTimeString = formatTime(toTimestamp * 1000);
            }

            result.setNodeStatus({
                fill: 'green',
                shape: 'dot',
                text: `[${this.storage.getRecordCount()}] ${fromTimeString} - ${toTimeString}`,
            });
        } else {
            result.setNodeStatus({
                fill: 'red',
                shape: 'dot',
                text: '' + this.storage.getError(),
            });
        }

        this.storage.clear();
        this.storage.setUpdating(false);

        return result;
    }
}
