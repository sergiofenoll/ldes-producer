"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readNode = exports.convert = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ttl_read = require('@graphy/content.ttl.read');
const rdf_parse_1 = __importDefault(require("rdf-parse"));
const rdf_serialize_1 = __importDefault(require("rdf-serialize"));
const node_converters_1 = require("../../converters/node-converters");
const utils_1 = require("../../utils/utils");
/**
 * Reads the triples in a file, assuming text/turtle.
 *
 * @param {string} file File path where the turtle file is stored.
 * @return {Stream} Stream containing all triples which were downloaded.
 */
function convert(file, contentType, domainName, baseFolder) {
    const triplesStream = readTriplesStream(file, domainName + path_1.default.relative(baseFolder, file));
    return rdf_serialize_1.default.serialize(triplesStream, {
        contentType: contentType,
    });
}
exports.convert = convert;
function readTriplesStream(file, baseIRI) {
    if (!fs_1.default.existsSync(file)) {
        throw Error(`File does not exist: ${file}`);
    }
    const fileStream = fs_1.default.createReadStream(file);
    if (baseIRI) {
        return rdf_parse_1.default.parse(fileStream, {
            contentType: 'text/turtle',
            baseIRI,
        });
    }
    else {
        return fileStream.pipe(ttl_read());
    }
}
async function readNode(filePath) {
    try {
        const store = await (0, utils_1.createStore)(readTriplesStream(filePath));
        return (0, node_converters_1.convertToNode)(store);
    }
    catch (e) {
        throw new Error(`Something went wrong while converting file to node: ${e}`);
    }
}
exports.readNode = readNode;
//# sourceMappingURL=reader.js.map