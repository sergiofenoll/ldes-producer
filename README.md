# LDES Producer library

WIP

### Configuration

The following environment variables can be configured:

- `BASE_URL` (required): the base-url on which this service is hosted. This ensures the service can resolve relative urls.
- `BASE_FOLDER`: the parent folder to store the LDES streams in. (default: `./data`)
- `LDES_STREAM_PREFIX`: the stream prefix to use to identify the streams. This prefix is used in conjunction with the folder name of the stream. (default: `http://mu.semte.ch/streams/`)
- `TIME_TREE_RELATION_PATH`: the path on which the relations should be defined when fragmenting resources using the time-fragmenter. This is also the predicate which is used when adding a timestamp to a new version of a resource. (default: `http://www.w3.org/ns/prov#generatedAtTime`)
- `PREFIX_TREE_RELATION_PATH`: the path on which the relations should be defined when fragmenting resources using the prefix-tree-fragmenter. (default: `https://example.org/name`)
- `CACHE_SIZE`: the maximum number of pages the cache should keep in memory. (default: `10`)
- `FOLDER_DEPTH`: the number of levels the data folder structure should contain. (default: `1`, a flat folder structure)
- `PAGE_RESOURCES_COUNT`: the number of resources (members) one page should contain. (default: `10`)
- `SUBFOLDER_NODE_COUNT`: the maximum number of nodes (pages) a subfolder should contain. (default: `10`)
- `ENABLE_AUTH`: this allows you to add Basic authentication to the POST route, the GET route (used to fetch pages) is always public (default: `false`)
- `AUTH_USERNAME`: the username to use when enabling Basic authentication. (default: `username`)
- `AUTH_PASSWORD`: the password to use when enabling Basic authentication. (default: `password`)
