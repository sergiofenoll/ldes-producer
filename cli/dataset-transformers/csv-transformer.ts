import { Readable, PassThrough } from 'stream';
import DatasetTransformer, {
  DatasetConfiguration,
} from './dataset-transformer';
import csv from 'csv-parser';
import { DataFactory } from 'n3';
import { RDF_NAMESPACE } from '../../lib/utils/namespaces';
const { quad, literal, namedNode } = DataFactory;
import MemberNew from '../../lib/models/member-new';
interface CSVDatasetConfiguration extends DatasetConfiguration {
  resourceIdField: string;
  propertyMappings: object;
}

export default class CSVTransformer implements DatasetTransformer {
  transform(input: Readable, config: CSVDatasetConfiguration): Readable {
    const resultStream = new PassThrough({ objectMode: true });

    input
      .pipe(csv())
      .on('data', (data) => {
        let id = namedNode(
          encodeURI(config.resourceIdPrefix + data[config.resourceIdField])
        );

        let member = new MemberNew(id);
        member.addQuads(
          quad(member.id, RDF_NAMESPACE('type'), namedNode(config.resourceType))
        );
        Object.entries(config.propertyMappings).forEach(
          ([propertyName, predicateUri]) => {
            member.addQuads(
              quad(
                member.id,
                namedNode(predicateUri),
                literal(data[propertyName])
              )
            );
          }
        );
        resultStream.push(member);
      })
      .on('end', () => {
        resultStream.end();
      });
    return resultStream;
  }
}
