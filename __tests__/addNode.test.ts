import namespace from '@rdfjs/namespace';
import { addData, getConfigFromEnv } from '../src';
import testData from './addNode-data';
describe('addNode', () => {
  it('should add triples to the stream', async () => {
    const config = getConfigFromEnv();
    config.baseFolder = '__test__out';
    config.cacheSize = 1000;
    config.pageResourcesCount = 50;
    config.folderDepth = 1;
    config.streamPrefix = namespace('http://data.lblod.info/streams/op/');
    for (const data of testData) {
      await expect(
        addData(config, {
          body: data,
          folder: 'ldes-mow-register',
          contentType: 'text/turtle',
          fragmenter: 'time-fragmenter',
        })
      ).resolves.not.toThrow();
    }
  });
});
