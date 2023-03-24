import type { EditorNodeProperties, EditorRED } from 'node-red';
import type { UserConfigurationOptions } from '../UserConfiguration';

declare const RED: EditorRED;

interface NodeEditorProperties extends EditorNodeProperties, UserConfigurationOptions {}

RED.nodes.registerType<NodeEditorProperties>('binsoul-shelly-pro-3em', {
    category: 'device',
    color: '#4594d1',
    defaults: {
        outputProperty: {
            value: 'payload',
            required: true,
        },
        outputTarget: {
            value: 'msg',
            required: true,
        },
        deviceIp: {
            value: '192.168.33.1',
            required: true,
        },
        name: { value: '' },
    },
    inputs: 1,
    outputs: 1,
    icon: 'font-awesome/fa-share-square-o',
    label: function () {
        return this.name || 'Shelly Pro 3EM';
    },
    labelStyle: function () {
        return this.name ? 'node_label_italic' : '';
    },
    paletteLabel: 'Shelly Pro 3EM',
    inputLabels: 'Incoming message',
    outputLabels: ['Outgoing message'],
    oneditprepare: function () {
        setTimeout(() => {
            $('.binsoul-shelly-pro-3em-wrapper').css('width', '100%');
            $('.binsoul-shelly-pro-3em-wrapper .red-ui-typedInput-container').css({
                width: 'auto',
                display: 'flex',
            });
        });

        $('#node-input-outputProperty').typedInput({
            typeField: '#node-input-outputTarget',
            types: ['msg', 'flow', 'global'],
            default: 'msg',
        });
    },
});
