import path from 'path';

const Config = {

  // enable/disable sending requests to endpoint
  endpointEnabled: false,

  // IRI of the source categories
  // Wikimedia set categories (Q59542487), Wikimedia categories (Q4167836)
  categoryIRI: 'Q4167836',

  // maximum parallel queries
  maxParallelQueries:   5,

  //default waiting time on 429 in case server does not give any "Retry-After" time
  //time in seconds
  defaultDelay: 10 ,

  // number of times to rerun the same query
  maxRetries: 20 ,

  //limit depth for category hierarchy exploration
  depthLimit: 3 ,

  // set category from where to start
  checkpoint: 1,

  // endpoint to query
  endpoint:     'https://query.wikidata.org/sparql' ,

  // maximum number of parameters in an SQLite query
  // (Maximum Number Of Host Parameters In A Single SQL Statement)
  cacheMaxValuesSQLite: 32766,

  //output directory
  outputGS: path.join(__dirname,'..', '..','/dataset/'),

  //raw dataset files
  rawData: path.join(__dirname,'..', '..','/dataset/raw-data.json'),
  statsRawData: path.join(__dirname,'..', '..','/dataset/statistics-raw-data.json'),

  //category data files
  finalData: path.join(__dirname,'..', '..','/dataset/finalData.json'),
  statsFinalData: path.join(__dirname,'..', '..','/dataset/statistics-final-data.json'),

  //output plots
  plotMetric: path.join(__dirname,'..', '..','/charts/'),

  //output evaluation
  eval: path.join(__dirname,'..', '..','/eval/'),

  //cache database files
  cachePath: path.join(__dirname,'..', '..','/cache/'),


  //dowload location for wikipedia dumps
  downloadPath: path.join(__dirname,'..', '..','/wikipedia-dump/'),

  //logs
  apiErrorLog: path.join(__dirname,'..', '..','/dataset/api-errors-log.log'),
  pipelineLog: path.join(__dirname,'..', '..','/dataset/pipeline-log.log'),
  wikipediaHitLog: path.join(__dirname,'..', '..','/dataset/wikipedia-hit-log.log'),

  cachePopLog: path.join(__dirname,'..', '..','/cache/global-cache-population-log.log'),
  wikipediaCachePopLog: path.join(__dirname,'..', '..','/cache/wikipedia-cache-population-log.log'),
  downloadLog: path.join(__dirname,'..', '..','/wikipedia-dump/download-log.log'),

};
export default Config;


// make sure all paths actually exist
import mkdirp from 'mkdirp';
['outputGS', 'plotMetric', 'eval', 'cachePath','downloadPath' ]
  .map( (prop) => mkdirp.sync( Config[ prop ] ) );
