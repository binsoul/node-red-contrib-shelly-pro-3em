import { Action, InputDefinition, Output, OutputDefinition } from '@binsoul/node-red-bundle-processing';
import { Input } from '@binsoul/node-red-bundle-processing';
import * as http from 'http';
import type { Configuration } from '../Configuration.js';
import { Storage } from '../Storage.js';

interface GetStatusResult {
    [key: string]: number;
    a_total_act_energy: number;
    a_total_act_ret_energy: number;
    b_total_act_energy: number;
    b_total_act_ret_energy: number;
    c_total_act_energy: number;
    c_total_act_ret_energy: number;
    total_act: number;
    total_act_ret: number;
}

interface DataKey {
    ts: number;
    period: string;
    values: Array<Array<number>>;
}

interface GetDataResult {
    keys: Array<string>;
    data: Array<DataKey>;
    next_record_ts?: number;
}

export class UpdateAction implements Action {
    private readonly configuration: Configuration;
    private readonly storage: Storage;
    private readonly outputCallback: () => void;

    constructor(configuration: Configuration, storage: Storage, outputCallback: () => void) {
        this.configuration = configuration;
        this.storage = storage;
        this.outputCallback = outputCallback;
    }

    defineInput(): InputDefinition {
        return new InputDefinition();
    }

    defineOutput(): OutputDefinition {
        return new OutputDefinition();
    }

    execute(input: Input): Output {
        (async () => {
            const toTimestamp = Math.floor(input.getMessage().timestamp / (60 * 1000)) * 60;
            const fromTimestamp = this.storage.getToTimestamp() || toTimestamp - 60;
            let currentTimestamp = fromTimestamp;

            try {
                const data = await this.fetchJson<GetStatusResult>('http://' + this.configuration.deviceIp + '/rpc/EMData.GetStatus?id=0');
                delete data.id;
                this.storage.setCounters(data);

                let keys: Array<string> | null = null;
                const values: Array<Array<number>> = [];

                while (currentTimestamp) {
                    const data = await this.fetchJson<GetDataResult>('http://' + this.configuration.deviceIp + '/rpc/EMdata.GetData?id=0&ts=' + currentTimestamp + '&end_ts=' + toTimestamp);
                    if (keys === null) {
                        keys = data.keys;
                    }

                    for (let n = 0; n < data.data.length; n++) {
                        const firstTimestamp = data.data[n].ts;
                        let offset = 0;
                        while (firstTimestamp + offset < fromTimestamp) {
                            data.data[n].values.shift();
                            offset += 60;
                        }

                        for (let i = 0; i < data.data[n].values.length; i++) {
                            values.push(data.data[n].values[i]);
                            offset += 60;
                            if (firstTimestamp + offset >= toTimestamp) {
                                break;
                            }
                        }
                    }

                    currentTimestamp = data.next_record_ts || 0;
                }

                if (keys === null) {
                    this.storage.setError('No keys found in response.');
                } else if (values.length === 0) {
                    this.storage.setError('No values found in response.');
                } else {
                    this.storage.setRecords(keys, values);
                }
            } catch (e) {
                if (e instanceof Error) {
                    this.storage.setError(e.message);
                } else if (typeof e === 'string') {
                    this.storage.setError(e);
                } else {
                    console.log(e);
                }
            }

            this.storage.setFromTimestamp(fromTimestamp);
            this.storage.setToTimestamp(toTimestamp);
            this.outputCallback();
        })();

        return new Output();
    }

    private async fetchJson<T>(url: string): Promise<T> {
        return new Promise((resolve, reject) => {
            http.get(url, (res) => {
                let data = '';

                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP Error: ${res.statusCode}`));
                    return;
                }

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    } catch (e) {
                        let message = 'An unknown error occurred.';
                        if (typeof e === 'string') {
                            message = e;
                        } else if (e instanceof Error) {
                            message = e.message;
                        }

                        reject(new Error(`Failed to parse JSON response: ${message}`));
                    }
                });
            }).on('error', (err) => {
                reject(err);
            });
        });
    }
}
