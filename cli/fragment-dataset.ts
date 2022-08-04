import { Command, Option } from 'commander';
import { DataFactory } from 'n3';
const { namedNode } = DataFactory;
import PrefixTreeFragmenter from '../lib/fragmenters/PrefixTreeFragmenter';
import Node from '../lib/models/node';
import PromiseQueue from '../lib/utils/promise-queue';
import { EXAMPLE, PROV } from '../lib/utils/namespaces';
import fs from 'fs';
import Fragmenter from '../lib/fragmenters/Fragmenter';
import TimeFragmenter from '../lib/fragmenters/TimeFragmenter';
import DefaultTransformer from './dataset-transformers/default-transformer';
import { Newable } from '../lib/utils/utils';
import DatasetTransformer, {
  DatasetConfiguration,
} from './dataset-transformers/dataset-transformer';
import CSVTransformer from './dataset-transformers/csv-transformer';
import path from 'path';
import { IPFSIndexTransformer } from './dataset-transformers/ipfs-index-transformer';
import Cache from '../lib/storage/cache';
import RDFTransformer from './dataset-transformers/rdf-transformer';
import { NamedNode } from '@rdfjs/types';
import {
  FOLDER_DEPTH,
  PAGE_RESOURCES_COUNT,
  SUBFOLDER_NODE_COUNT,
} from '../lib/utils/constants';

const fragmenterMap = new Map<string, Newable<Fragmenter>>();

fragmenterMap.set('time-fragmenter', TimeFragmenter);
fragmenterMap.set('prefix-tree-fragmenter', PrefixTreeFragmenter);

const transformerMap = new Map<string, DatasetTransformer>();
transformerMap.set('csv-transformer', new CSVTransformer());
transformerMap.set('default-transformer', new DefaultTransformer());
transformerMap.set('ipfs-transformer', new IPFSIndexTransformer());
transformerMap.set('rdf-transformer', new RDFTransformer());

const extensionMap = new Map<String, DatasetTransformer>();
extensionMap.set('.csv', new CSVTransformer());

const relationPathMap = new Map<String, NamedNode>();
relationPathMap.set('time-fragmenter', PROV('generatedAtTime'));
relationPathMap.set('prefix-tree-fragmenter', EXAMPLE('name'));

function getTransformer(extension: string): DatasetTransformer {
  return extensionMap.get(extension) || new DefaultTransformer();
}

const UPDATE_QUEUE = new PromiseQueue<Node | null | void>();

const program = new Command();

program
  .name('fragment-dataset')
  .description('CLI tool to create a fragmented version of a provided dataset');

program
  .argument('<dataset_file>', 'The dataset which should be fragmented')
  .requiredOption(
    '-c, --config <config_file>',
    'JSON configuration file which describes how the dataset should be parsed'
  )
  .requiredOption(
    '-o, --output <output_folder>',
    'The destination folder in which the fragmented dataset should be stored'
  )
  .addOption(
    new Option(
      '--cache-size <cache_size>',
      'The maximum size of the node cache'
    )
      .default('1000')
      .argParser(parseInt)
  )
  .addOption(
    new Option(
      '-f, --fragmenter <fragmenter>',
      'The fragmenter which is to be used'
    )
      .choices([...fragmenterMap.keys()] as string[])
      .default('time-fragmenter')
  )
  .addOption(
    new Option(
      '-p, --relation-path <relation_path>',
      'The predicate on which the relations should be defined'
    )
  )

  .addOption(
    new Option(
      '-t, --transformer <dataset_transformer>',
      'The dataset transformer which should be applied, overrides automatic selection of transformer based on file extension'
    ).choices([...transformerMap.keys()] as string[])
  )
  .action(async (datasetFile, options) => {
    const fragmenterClass =
      fragmenterMap.get(options.fragmenter) || TimeFragmenter;
    const jsonData = fs.readFileSync(options.config, 'utf8');
    const datasetConfig: DatasetConfiguration = JSON.parse(jsonData);
    let transformer: DatasetTransformer;
    if (options.transformer) {
      transformer = transformerMap.get(options.transformer)!;
    } else {
      transformer = getTransformer(path.extname(datasetFile));
    }
    let relationPath: NamedNode;
    if (options.relationPath) {
      relationPath = namedNode(options.relationPath);
    } else {
      relationPath = relationPathMap.get(options.fragmenter)!;
    }
    if (fragmenterClass) {
      await fragmentDataset(
        transformer,
        datasetFile,
        datasetConfig,
        fragmenterClass,
        relationPath,
        options.cacheSize,
        options.output
      );
    }
  });

program.parse();

export default function fragmentDataset(
  transformer: DatasetTransformer,
  datasetFile: string,
  datasetConfiguration: DatasetConfiguration,
  fragmenterClass: Newable<Fragmenter>,
  relationPath: NamedNode,
  cacheSizeLimit: number,
  outputFolder: string
): Promise<void> {
  const cache: Cache = new Cache(cacheSizeLimit);
  const fragmenter = new fragmenterClass({
    folder: outputFolder,
    maxResourcesPerPage: PAGE_RESOURCES_COUNT,
    maxNodeCountPerSubFolder: SUBFOLDER_NODE_COUNT,
    folderDepth: FOLDER_DEPTH,
    cache,
  });
  const fileStream = fs.createReadStream(datasetFile);

  return new Promise<void>(async (resolve) => {
    const transformedStream = await transformer.transform(
      fileStream,
      datasetConfiguration
    );
    let i = 0;
    transformedStream
      .on('data', async (resource) => {
        transformedStream.pause();
        i += 1;

        await UPDATE_QUEUE.push(() => fragmenter.addResource(resource));
        transformedStream.resume();
      })
      .on('close', async () => {
        console.log('finished loading resources');
        await UPDATE_QUEUE.push(() => fragmenter.cache.flush());
        resolve();
      });
  });
}
