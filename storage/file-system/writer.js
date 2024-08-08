"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeNode = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ttl_write = require('@graphy/content.ttl.write');
const node_converters_1 = require("../../converters/node-converters");
async function createParentFolderIfNecessary(file) {
    if (!fs_1.default.existsSync(path_1.default.dirname(file))) {
        await new Promise((resolve, reject) => {
            fs_1.default.mkdir(path_1.default.dirname(file), { recursive: true }, (err) => {
                if (err)
                    reject(err);
                resolve();
            });
        });
    }
}
async function writeNode(node, path) {
    const quadStream = (0, node_converters_1.convertToStream)(node);
    await createParentFolderIfNecessary(path);
    const turtleStream = quadStream.pipe(ttl_write());
    const writeStream = fs_1.default.createWriteStream(path);
    turtleStream.on('data', (turtleChunk) => {
        writeStream.write(turtleChunk);
    });
    return new Promise((resolve, reject) => {
        turtleStream.on('error', () => {
            reject('Something went wrong while writing node to file');
        });
        turtleStream.on('end', () => {
            writeStream.end(() => {
                resolve();
            });
        });
    });
}
exports.writeNode = writeNode;
//# sourceMappingURL=writer.js.map