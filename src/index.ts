import Config from './models/config';
import path from 'path';
import { AddDataOptions, GetNodeOptions } from './models/option';

import rdfParser from 'rdf-parse';
import { error, fileForPage } from './utils/utils';
import { convert } from './storage/file-system/reader';
import extractMembers from './converters/member-converter';
import { createFragmenter } from './fragmenters/fragmenter-factory';
import Fragmenter from './fragmenters/fragmenter';

export * from './fragmenters/';
export * from './models';
export * from './storage';
export * from './utils';

const ACCEPTED_CONTENT_TYPES = [
  'application/ld+json',
  'application/n-quads',
  'application/n-triples',
  'application/trig',
  'text/n3',
  'text/turtle',
];

export async function getNode(
  config: Config,
  options: GetNodeOptions
): Promise<{ stream: NodeJS.ReadableStream; fromCache: boolean }> {
  let fromCache = false;
  const page = options.nodeId || 1;
  const pagesFolder = path.join(config.baseFolder, options.folder);

  if (page > config.cache.getLastPage(pagesFolder)) {
    throw error(404, 'Page not found');
  }
  if (page < config.cache.getLastPage(pagesFolder)) {
    fromCache = true;
  }
  const contentType = options.contentType.toLowerCase();
  if (!ACCEPTED_CONTENT_TYPES.includes(contentType)) {
    throw error(406);
  }
  const filePath = fileForPage(
    path.join(pagesFolder, options.subFolder || ''),
    page
  );
  return {
    fromCache,
    stream: convert(filePath, contentType, config.baseUrl, config.baseFolder),
  };
}

export async function addData(config: Config, options: AddDataOptions) {
  const contentTypes = await rdfParser.getContentTypes();
  if (!contentTypes.includes(options.contentType)) {
    throw error(400, 'Content-Type not recognized');
  }
  const members = await extractMembers(options.body, options.contentType);
  let fragmenter: Fragmenter;
  if (!options.fragmenter || typeof options.fragmenter === 'string') {
    fragmenter = createFragmenter(
      options.fragmenter || 'time-fragmenter',
      config,
      {
        folder: path.join(config.baseFolder, options.folder),
        maxResourcesPerPage: config.pageResourcesCount,
        maxNodeCountPerSubFolder: config.subFolderNodeCount,
        folderDepth: config.folderDepth,
      }
    );
  } else if (options.fragmenter instanceof Fragmenter) {
    fragmenter = options.fragmenter;
  } else {
    throw `invalid fragmenter: ${options.fragmenter}`;
  }

  await config.updateQueue.push(async () => {
    for (const member of members) {
      await fragmenter.addMember(member);
    }
  });
  await config.updateQueue.push(() => config.cache.flush());
}
