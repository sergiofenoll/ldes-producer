import Fragmenter from '../fragmenters/fragmenter';

export interface GetNodeOptions {
  folder: string;
  subFolder?: string;
  nodeId?: number;
  contentType: string;
}
export interface AddDataOptions {
  contentType: string;
  folder: string;
  body: any;
  fragmenter?: string | Fragmenter | null | undefined;
}
