import Config from '../models/config';
import { FragmenterArgs } from './fragmenter';
import PrefixTreeFragmenter from './prefix-tree-fragmenter';
import TimeFragmenter from './time-fragmenter';

export function createFragmenter(
  name: string,
  config: Config,
  args: FragmenterArgs
) {
  switch (name) {
    case 'time-fragmenter':
      return new TimeFragmenter(config, args);
    case 'prefix-tree-fragmenter':
      return new PrefixTreeFragmenter(config, args);
    default:
      throw new Error(`Fragmenter ${name} not found`);
  }
}
