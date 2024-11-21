import { addData, getConfigFromEnv } from '../src';
import testData from './addNode-data';
describe('addNode', () => {
  it('should add triples to the stream', async () => {
    const config = getConfigFromEnv();
    config.baseFolder = '__test__out';
    for (const data of testData) {
      await expect(
        addData(config, {
          body: data,
          folder: 'ldes-mow-register',
          contentType: 'text/turtle',
        })
      ).resolves.not.toThrow();
    }
  });
});
