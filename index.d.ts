/// <reference types="node" />
import Config from './models/config';
import { AddDataOptions, GetNodeOptions } from './models/option';
export declare function getNode(config: Config, options: GetNodeOptions): Promise<{
    stream: NodeJS.ReadableStream;
    fromCache: boolean;
}>;
export declare function addData(config: Config, options: AddDataOptions): Promise<void>;
