/// <reference types="node" />
import Node from '../../models/node';
/**
 * Reads the triples in a file, assuming text/turtle.
 *
 * @param {string} file File path where the turtle file is stored.
 * @return {Stream} Stream containing all triples which were downloaded.
 */
export declare function convert(file: string, contentType: string, domainName: string, baseFolder: string): NodeJS.ReadableStream;
export declare function readNode(filePath: string): Promise<Node>;
