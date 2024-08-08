export default class RelationCache {
    relationValueMap: Map<string, string>;
    addRelation(prefix: string, nodeFile: string): void;
    getNodeFile(value: string): string | undefined;
    getLongestMatch(value: string): {
        prefix: string;
        nodeFile: string;
    } | null;
}
