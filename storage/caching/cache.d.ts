import Node from '../../models/node';
export default class Cache {
    nodes: Map<string, Node>;
    usageCount: number;
    lruRank: Map<string, number>;
    lastPages: Map<string, number>;
    cacheLimit: number;
    cacheEvictionPercentage: number;
    evicting: boolean;
    constructor(cacheLimit: number);
    getNode(path: string): Promise<Node>;
    updateNodeFrequency(key: string): void;
    addNode(path: string, node: Node): Promise<void>;
    getFilesRecurs(folder: string): Generator<string>;
    getLastPage(folder: string): number;
    updateLastPage(folder: string, value: number): void;
    applyCacheEviction(): Promise<void>;
    evictFromCache(keys: string[]): Promise<void>;
    flush(): Promise<void>;
}
