import { app, uuid, errorHandler } from "mu";
import bodyParser from "body-parser";
import rdfParser from "rdf-parse";
import rdfSerializer from "rdf-serialize";
import fs from "fs";
import jsstream from "stream";
import { pipeline } from "stream/promises";
import { Store, DataFactory, Quad } from "n3";
import cors from "cors";
const { namedNode, quad, literal } = DataFactory;
app.use(cors());
app.use(
  bodyParser.text({
    type: function (req: any) {
      return true;
    },
  })
);

import {
  readTriplesStream,
  lastPage,
  clearLastPageCache,
  writeTriplesStream,
  createStore,
} from "./storage/files";
import PromiseQueue from "./promise-queue";

const FEED_FILE = "/app/data/feed.ttl";
const PAGES_FOLDER = "/app/data/pages/";
const GRAPH = namedNode("http://mu.semte.ch/services/ldes-time-fragmenter");
const MAX_RESOURCES_PER_PAGE = 10;
const SERVICE_PATH = "http://localhost:8888"; // a workaround for json-ld not accepting relative paths

const UPDATE_QUEUE = new PromiseQueue<Store>();

function error(status: number, msg: string) {
  var err = new Error(msg);
  err.status = status;
  return err;
}

const stream = namedNode(
  "http://mu.semte.ch/services/ldes-time-fragmenter/example-stream"
);

function generateVersion(_namedNode: any) {
  return namedNode(
    `http://mu.semte.ch/services/ldes-time-fragmenter/versioned/${uuid()}`
  );
}

function generateTreeRelation() {
  return namedNode(
    `http://mu.semte.ch/services/ldes-time-fragmenter/relations/${uuid()}`
  );
}

function generatePageResource(number: number) {
  return namedNode(`/pages?page=${number}`);
}

function nowLiteral() {
  const xsdDateTime = namedNode("http://www.w3.org/2001/XMLSchema#dateTime");
  const now = new Date().toISOString();
  return literal(now, xsdDateTime);
}

/**
 * Yields the file path on which the specified page number is described.
 *
 * @param {number} page Page index for which we want te get the file path.
 * @return {string} Path to the page.
 */
function fileForPage(page: number) {
  return `${PAGES_FOLDER}${page}.ttl`;
}

/**
 * Yield the amount of solutions in the specified graph of the store.
 *
 * @param {Store} store Store containing all the triples.
 * @param {NamedNode} graph The graph containing the data.
 */
function countVersionedItems(store: Store): number {
  let count = store.countQuads(
    stream,
    namedNode("https://w3id.org/tree#member"),
    null,
    null
  );
  return count;
}

/**
 * Indicates whether or not we should create a new page.
 *
 * @param {Store} store Store which contains parsed triples.
 * @return {boolean} Truethy if we should create a new file.
 */
function shouldCreateNewPage(store: Store): boolean {
  return countVersionedItems(store) >= MAX_RESOURCES_PER_PAGE;
}

async function constructVersionedStore(
  resourceURI: string,
  body: string,
  contentType: string
) {
  try {
    const resource = namedNode(resourceURI);
    const versionedResource = generateVersion(resource);

    const bodyStream = jsstream.Readable.from(body);
    const versionedStream = rdfParser
      .parse(bodyStream, {
        contentType: contentType,
      })
      .pipe(
        new jsstream.Transform({
          objectMode: true,
          transform: (quadObj, encoding, callback) => {
            callback(
              null,
              quad(
                quadObj.subject.equals(resource)
                  ? versionedResource
                  : quadObj.subject,
                quadObj.predicate.equals(resource)
                  ? versionedResource
                  : quadObj.predicate,
                quadObj.object.equals(resource)
                  ? versionedResource
                  : quadObj.object
              )
            );
          },
        })
      );

    const versionedStore = await createStore(versionedStream);

    const dateLiteral = nowLiteral();

    // add resources about this version
    versionedStore.add(
      quad(
        versionedResource,
        namedNode("http://purl.org/dc/terms/isVersionOf"),
        resource
      )
    );

    versionedStore.add(
      quad(
        versionedResource,
        namedNode("http://www.w3.org/ns/prov#generatedAtTime"),
        dateLiteral
      )
    );

    versionedStore.add(
      quad(stream, namedNode("https://w3id.org/tree#member"), versionedResource)
    );

    return versionedStore;
  } catch (e) {
    throw e;
  }
}

async function closeDataset(closingDataset: Store, pageNr: number) {
  try {
    const relationResource = generateTreeRelation();
    const currentPageResource = generatePageResource(pageNr);
    const nextPageResource = generatePageResource(pageNr + 1);
    closingDataset.add(
      quad(
        currentPageResource,
        namedNode("https://w3id.org/tree#relation"),
        relationResource
      )
    );
    closingDataset.add(
      quad(
        relationResource,
        namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
        namedNode("https://w3id.org/tree#GreaterThanOrEqualRelation")
      )
    );
    closingDataset.add(
      quad(
        relationResource,
        namedNode("https://w3id.org/tree#node"),
        nextPageResource
      )
    );
    closingDataset.add(
      quad(
        relationResource,
        namedNode("https://w3id.org/tree#path"),
        namedNode("http://www.w3.org/ns/prov#generatedAtTime")
      )
    );
    const dateLiteral = nowLiteral();
    closingDataset.add(
      quad(
        relationResource,
        namedNode("https://w3id.org/tree#value"),
        dateLiteral
      )
    );

    // create a store with the new graph for the new file
    const currentDataset = await createStore(readTriplesStream(FEED_FILE));

    currentDataset.add(
      quad(
        nextPageResource,
        namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
        namedNode("https://w3id.org/tree#Node")
      )
    );
    return currentDataset;
  } catch (e) {
    throw e;
  }
}

async function writeVersionedResource(versionedStore: Store) {
  try {
    const lastPageNr = lastPage(PAGES_FOLDER);
    let pageFile = fileForPage(lastPageNr);

    let currentDataset = await createStore(readTriplesStream(pageFile));

    if (shouldCreateNewPage(currentDataset)) {
      const closingDataset = currentDataset;

      // link the current dataset to the new dataset but don't save yet
      const closingPageFile = pageFile;
      const nextPageFile = fileForPage(lastPageNr + 1);

      // create a store with the new graph for the new file
      currentDataset = await closeDataset(closingDataset, lastPageNr);

      currentDataset.addQuads(versionedStore.getQuads(null, null, null, null));

      // // Write out new dataset to nextPageFile
      await writeTriplesStream(currentDataset, nextPageFile);
      // // Write out closing dataset to closingPageFile
      await writeTriplesStream(closingDataset, closingPageFile);
      // Clear the last page cache
      clearLastPageCache(PAGES_FOLDER);
    } else {
      currentDataset.addQuads(versionedStore.getQuads(null, null, null, null));
      await writeTriplesStream(currentDataset, pageFile);
    }
    return currentDataset;
  } catch (e) {
    throw e;
  }
}

/**
 * Publishes a new version of the same resource.
 */
app.post("/resource", async function (req: any, res: any, next: any) {
  try {
    const contentTypes = await rdfParser.getContentTypes();
    if (!contentTypes.includes(req.headers["content-type"])) {
      return next(error(400, "Content-Type not recognized"));
    }

    const versionedStore = await constructVersionedStore(
      req.query.resource,
      req.body,
      req.headers["content-type"]
    );

    const currentDataset = await UPDATE_QUEUE.push(() =>
      writeVersionedResource(versionedStore)
    );

    console.log(currentDataset);
    const newCount = countVersionedItems(currentDataset);

    res.status(201).send(`{"message": "ok", "triplesInPage": ${newCount}}`);
  } catch (e) {
    console.error(e);
    return next(error(500, ""));
  }
});

app.get("/", function (req: any, res: any, next: any) {
  // LDES does not use this index page
  try {
    const rdfStream = readTriplesStream(FEED_FILE);

    res.header("Content-Type", req.headers["accept"]);

    rdfSerializer
      .serialize(rdfStream, {
        contentType: req.headers["accept"],
      })
      .on("data", (d) => res.write(d))
      .on("error", (error) => {
        next(error(500, "Serializing error"));
      })
      .on("end", () => {
        res.end();
      });
  } catch (e) {
    return next(error(500, ""));
  }
});

app.get("/pages", async function (req: any, res: any, next: any) {
  try {
    const page = parseInt(req.query.page);

    if (page > lastPage(PAGES_FOLDER)) {
      return next(error(404, "Page not found"));
    }

    const contentTypes = await rdfSerializer.getContentTypes();

    const contentType = req.accepts(contentTypes);
    console.log(contentType);
    if (!contentType) {
      return next(error(406, ""));
    }

    if (page < lastPage(PAGES_FOLDER))
      res.header("Cache-Control", "public, immutable");

    const rdfStream = readTriplesStream(fileForPage(page));

    res.header("Content-Type", contentType);

    rdfSerializer
      .serialize(rdfStream, {
        contentType: contentType,
      })
      .on("data", (d) => res.write(d))
      .on("error", (error) => {
        next(error(500, "Serializing error"));
      })
      .on("end", () => {
        res.end();
      });
  } catch (e) {
    console.error(e);
    return next(error(500, ""));
  }
});

app.get("/count", async function (_req: any, res: any, next: any) {
  try {
    const page = lastPage(PAGES_FOLDER);
    if (page === NaN) return next(error(404, "No pages found"));

    const file = fileForPage(page);
    console.log(`Reading from ${file}`);

    const currentDataset = await createStore(readTriplesStream(file));

    const count = countVersionedItems(currentDataset);
    res.status(200).send(`{"count": ${count}}`);
  } catch (e) {
    console.error(e);
    return next(error(500, ""));
  }
});

app.get("/last-page", function (_req: any, res: any, next: any) {
  try {
    const page = lastPage(PAGES_FOLDER);
    if (page === NaN) return next(error(404, "No pages found"));
    else res.status(200).send(`{"lastPage": ${page}}`);
  } catch (e) {
    console.error(e);
    return next(error(500, ""));
  }
});

app.use(errorHandler);
