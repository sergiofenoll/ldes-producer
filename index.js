"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addData = exports.getNode = void 0;
const path_1 = __importDefault(require("path"));
const rdf_parse_1 = __importDefault(require("rdf-parse"));
const utils_1 = require("./utils/utils");
const reader_1 = require("./storage/file-system/reader");
const member_converter_1 = __importDefault(require("./converters/member-converter"));
const fragmenter_factory_1 = require("./fragmenters/fragmenter-factory");
const fragmenter_1 = __importDefault(require("./fragmenters/fragmenter"));
const ACCEPTED_CONTENT_TYPES = [
    'application/ld+json',
    'application/n-quads',
    'application/n-triples',
    'application/trig',
    'text/n3',
    'text/turtle',
];
async function getNode(config, options) {
    let fromCache = false;
    const page = options.nodeId || 1;
    const pagesFolder = path_1.default.join(config.baseFolder, options.folder);
    if (page > config.cache.getLastPage(pagesFolder)) {
        throw (0, utils_1.error)(404, 'Page not found');
    }
    if (page < config.cache.getLastPage(pagesFolder)) {
        fromCache = true;
    }
    const contentType = options.contentType.toLowerCase();
    if (!ACCEPTED_CONTENT_TYPES.includes(contentType)) {
        throw (0, utils_1.error)(406);
    }
    const filePath = (0, utils_1.fileForPage)(path_1.default.join(pagesFolder, options.subFolder || ''), page);
    return {
        fromCache,
        stream: (0, reader_1.convert)(filePath, contentType, config.baseUrl, config.baseFolder),
    };
}
exports.getNode = getNode;
async function addData(config, options) {
    const contentTypes = await rdf_parse_1.default.getContentTypes();
    if (!contentTypes.includes(options.contentType)) {
        throw (0, utils_1.error)(400, 'Content-Type not recognized');
    }
    const members = await (0, member_converter_1.default)(options.body, options.contentType);
    let fragmenter;
    if (!options.fragmenter || typeof options.fragmenter === 'string') {
        fragmenter = (0, fragmenter_factory_1.createFragmenter)(options.fragmenter || 'time-fragmenter', config, {
            folder: path_1.default.join(config.baseFolder, options.folder),
            maxResourcesPerPage: config.pageResourcesCount,
            maxNodeCountPerSubFolder: config.subFolderNodeCount,
            folderDepth: config.folderDepth,
        });
    }
    else if (options.fragmenter instanceof fragmenter_1.default) {
        fragmenter = options.fragmenter;
    }
    else {
        throw `invalid fragmenter: ${options.fragmenter}`;
    }
    await config.updateQueue.push(async () => {
        for (const member of members) {
            await fragmenter.addMember(member);
        }
    });
    await config.updateQueue.push(() => config.cache.flush());
}
exports.addData = addData;
//# sourceMappingURL=index.js.map