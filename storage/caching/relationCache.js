"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RelationCache {
    constructor() {
        // maps prefixes to node files
        this.relationValueMap = new Map();
    }
    addRelation(prefix, nodeFile) {
        this.relationValueMap.set(prefix, nodeFile);
    }
    getNodeFile(value) {
        return this.relationValueMap.get(value);
    }
    getLongestMatch(value) {
        let longestPrefix = null;
        for (let i = 0; i < value.length; i++) {
            const prefix = value.substring(0, i + 1);
            if (this.relationValueMap.has(prefix)) {
                longestPrefix = prefix;
            }
        }
        if (longestPrefix) {
            return {
                prefix: longestPrefix,
                nodeFile: this.relationValueMap.get(longestPrefix),
            };
        }
        return null;
    }
}
exports.default = RelationCache;
//# sourceMappingURL=relationCache.js.map