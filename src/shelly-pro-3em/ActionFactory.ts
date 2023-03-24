import { Action, ActionFactory as ActionFactoryInterface, Message } from '@binsoul/node-red-bundle-processing';
import type { Node, NodeAPI } from '@node-red/registry';
import { NodeMessageInFlow } from 'node-red';
import { OutputAction } from './Action/OutputAction';
import { UpdateAction } from './Action/UpdateAction';
import type { Configuration } from './Configuration';
import { Storage } from './Storage';

interface MessageData extends NodeMessageInFlow {
    command?: string;
    timestamp?: number;
}

/**
 * Generates actions.
 */
export class ActionFactory implements ActionFactoryInterface {
    private readonly configuration: Configuration;
    private readonly RED: NodeAPI;
    private readonly node: Node;
    private readonly storage: Storage;

    constructor(RED: NodeAPI, node: Node, configuration: Configuration) {
        this.RED = RED;
        this.node = node;
        this.configuration = configuration;
        this.storage = new Storage();
    }

    build(message: Message): Action | Array<Action> | null {
        const data: MessageData = message.data;
        const command = data.command;

        if (typeof command !== 'undefined' && ('' + command).trim() !== '') {
            switch (command.toLowerCase()) {
                case 'output':
                    return new OutputAction(this.configuration, this.storage);
            }
        }

        if (!this.storage.isUpdating()) {
            this.storage.setUpdating(true);
            return new UpdateAction(this.configuration, this.storage, () => {
                this.node.receive(<MessageData>{
                    command: 'output',
                });
            });
        }

        return null;
    }
}
