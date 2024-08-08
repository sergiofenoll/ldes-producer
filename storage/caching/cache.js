"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const reader_1 = require("../file-system/reader");
const writer_1 = require("../file-system/writer");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class Cache {
    constructor(cacheLimit) {
        this.nodes = new Map();
        this.usageCount = 0;
        this.lruRank = new Map();
        this.lastPages = new Map();
        this.cacheLimit = 100;
        this.cacheEvictionPercentage = 0.3;
        this.evicting = false;
        this.cacheLimit = cacheLimit;
    }
    async getNode(path) {
        let result;
        if (this.nodes.has(path)) {
            result = this.nodes.get(path);
            this.updateNodeFrequency(path);
        }
        else {
            result = await (0, reader_1.readNode)(path);
            this.nodes.set(path, result);
            this.lruRank.set(path, 0);
        }
        await this.applyCacheEviction();
        return result;
    }
    updateNodeFrequency(key) {
        this.lruRank.set(key, this.usageCount);
        this.usageCount += 1;
    }
    async addNode(path, node) {
        this.lruRank.set(path, 0);
        this.nodes.set(path, node);
        await this.applyCacheEviction();
    }
    *getFilesRecurs(folder) {
        const files = fs_1.default.readdirSync(folder, { withFileTypes: true });
        for (const file of files) {
            if (file.isDirectory()) {
                yield* this.getFilesRecurs(path_1.default.join(folder, file.name));
            }
            else {
                yield file.name;
            }
        }
    }
    getLastPage(folder) {
        if (!this.lastPages.has(folder)) {
            if (!fs_1.default.existsSync(folder)) {
                return NaN;
            }
            const fileNumbers = [];
            for (const file of this.getFilesRecurs(folder)) {
                const match = file.match(/\d*/);
                if (match) {
                    const parsedNumber = match.length && parseInt(match[0]);
                    if (parsedNumber && !isNaN(parsedNumber))
                        fileNumbers.push(parsedNumber);
                }
            }
            fileNumbers.sort((a, b) => b - a);
            if (fileNumbers.length) {
                this.lastPages.set(folder, fileNumbers[0]);
            }
            else {
                return NaN; // let's not cache this as it's a starting point
            }
        }
        return this.lastPages.get(folder);
    }
    updateLastPage(folder, value) {
        this.lastPages.set(folder, value);
    }
    async applyCacheEviction() {
        if (this.nodes.size > this.cacheLimit && !this.evicting) {
            // Determine least frequently used node
            const lruEntries = Array.from(this.lruRank.entries());
            lruEntries.sort(([k1, v1], [k2, v2]) => v1 - v2);
            const keys = lruEntries
                .map(([k, v]) => k)
                .slice(0, Math.floor(this.cacheEvictionPercentage * this.cacheLimit));
            if (keys) {
                this.evictFromCache(keys);
            }
        }
    }
    async evictFromCache(keys) {
        this.evicting = true;
        const listOfPromises = [];
        for (const key of keys) {
            const node = this.nodes.get(key);
            if (node) {
                listOfPromises.push((0, writer_1.writeNode)(node, key));
            }
        }
        await Promise.all(listOfPromises);
        for (const key of keys) {
            this.nodes.delete(key);
            this.lruRank.delete(key);
        }
        this.evicting = false;
    }
    async flush() {
        await this.evictFromCache(Array.from(this.nodes.keys()));
    }
}
exports.default = Cache;
//# sourceMappingURL=cache.js.map