"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importToStore = exports.createStore = exports.pushToReadable = exports.fileForPage = exports.getFirstMatch = exports.error = exports.generateVersion = exports.nowLiteral = exports.generateTreeRelation = void 0;
const n3_1 = require("n3");
const uuid_1 = require("uuid");
const namespaces_1 = require("./namespaces");
const { literal } = n3_1.DataFactory;
function generateTreeRelation() {
    return (0, namespaces_1.LDES_TIME)(`relations/${(0, uuid_1.v4)()}`);
}
exports.generateTreeRelation = generateTreeRelation;
function nowLiteral() {
    const xsdDateTime = (0, namespaces_1.XML)('dateTime');
    const now = new Date().toISOString();
    return literal(now, xsdDateTime);
}
exports.nowLiteral = nowLiteral;
function generateVersion(_namedNode) {
    return (0, namespaces_1.LDES_TIME)(`versioned/${(0, uuid_1.v4)()}`);
}
exports.generateVersion = generateVersion;
function error(status, msg) {
    const err = new Error(msg || 'An error occurred');
    err.status = status;
    return err;
}
exports.error = error;
function getFirstMatch(store, subject, predicate, object, graph) {
    const matches = store.getQuads(subject || null, predicate || null, object || null, graph || null);
    if (matches.length > 0) {
        return matches[0];
    }
    return null;
}
exports.getFirstMatch = getFirstMatch;
/**
 * Yields the file path on which the specified page number is described.
 *
 * @param {number} page Page index for which we want te get the file path.
 * @return {string} Path to the page.
 */
function fileForPage(folder, page) {
    return `${folder}/${page}.ttl`;
}
exports.fileForPage = fileForPage;
function pushToReadable(readable, ...chunks) {
    chunks.forEach((chunk) => {
        readable.push(chunk);
    });
}
exports.pushToReadable = pushToReadable;
async function createStore(quadStream) {
    try {
        const store = new n3_1.Store();
        await importToStore(store, quadStream);
        return store;
    }
    catch (e) {
        throw new Error(`Something went wrong while creating store from stream: ${e}`);
    }
}
exports.createStore = createStore;
function importToStore(store, quadStream) {
    return new Promise((resolve, reject) => store
        .import(quadStream)
        .on('error', reject)
        .once('end', () => resolve()));
}
exports.importToStore = importToStore;
//# sourceMappingURL=utils.js.map