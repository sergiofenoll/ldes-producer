"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PURL = exports.RDF_NAMESPACE = exports.PROV = exports.LDES_TIME = exports.LDES = exports.XML = exports.TREE = exports.EXAMPLE = void 0;
const namespace_1 = __importDefault(require("@rdfjs/namespace"));
exports.EXAMPLE = (0, namespace_1.default)('https://example.org/');
exports.TREE = (0, namespace_1.default)('https://w3id.org/tree#');
exports.XML = (0, namespace_1.default)('http://www.w3.org/2001/XMLSchema#');
exports.LDES = (0, namespace_1.default)('http://w3id.org/ldes#');
exports.LDES_TIME = (0, namespace_1.default)('http://mu.semte.ch/services/ldes-time-fragmenter/');
exports.PROV = (0, namespace_1.default)('http://www.w3.org/ns/prov#');
exports.RDF_NAMESPACE = (0, namespace_1.default)('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
exports.PURL = (0, namespace_1.default)('http://purl.org/dc/terms/');
//# sourceMappingURL=namespaces.js.map