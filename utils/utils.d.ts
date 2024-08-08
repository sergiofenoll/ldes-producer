/// <reference types="node" />
import { Store, Quad, OTerm } from 'n3';
import * as RDF from 'rdf-js';
import { Readable } from 'stream';
interface Error {
    name: string;
    message: string;
    status?: number;
}
export type QuadElement = RDF.Quad_Subject | RDF.Quad_Predicate | RDF.Quad_Object;
export declare function generateTreeRelation(): RDF.NamedNode<string>;
export declare function nowLiteral(): import("n3").Literal;
export declare function generateVersion(_namedNode: any): RDF.NamedNode<string>;
export declare function error(status: number, msg?: string): Error;
export declare function getFirstMatch(store: Store, subject?: OTerm, predicate?: OTerm, object?: OTerm, graph?: OTerm): Quad | null;
/**
 * Yields the file path on which the specified page number is described.
 *
 * @param {number} page Page index for which we want te get the file path.
 * @return {string} Path to the page.
 */
export declare function fileForPage(folder: string, page: number): string;
export declare function pushToReadable<T>(readable: Readable, ...chunks: T[]): void;
export declare function createStore(quadStream: RDF.Stream<RDF.Quad>): Promise<Store>;
export declare function importToStore(store: Store, quadStream: RDF.Stream<RDF.Quad>): Promise<void>;
export {};
