import Config                   from './../config/config';
import streamEntry              from './streamEntry';
import localConfig              from './config';
import JSONStream               from 'JSONStream';
const { performance } = require('perf_hooks');

/**
 * clean raw entries
 * remove categories without target (target used by wikipedia traversal): contains empty
 * remove categories with more than one target value (multi-target)
 * remove categories where wikipedia results empty, reasons:
 * 1) relevant.wikipedia = [] => contains empty , no corresponding wikipedia page (e.g., Q31877037) or,  wikidata page was deleted (e.g.,Q8576710)
 * 2) "targetType":[],"noType":[],"noTargetType":[],"noWikidataID":[] =>  wikipedia page empty (e.g., because of redirect, e.g., Q24865978), or
 *     type check failed from first cat , e.g., Q9002458 : // TODO: if depth == 0 and category has members store them .
 * remove categories with empty sparql query result
 * remove categories with multiple sparql queries
 * remove not needed data (e.g., catTypecheckFailed , noWikidataId ...)
 * @param     {Object}      fs              object for file system node module
 *
 */

export default function cleanCandidate(fs){

  const start = performance.now();

  console.log('Candidate cleaning. . .');

  let finalEntryArray = [] , rawEntryArray = [] , containsNotExistArray = [] , multiTargetArray = [], wikipediaEmptyArray = [], multiSparqlArray = [], sparqlEmptyArray = [], noSPARQLMatchArray = [] ;
  let datasetArray = [];

  let stream = fs.createReadStream(Config.rawData , {encoding: 'utf8'});

  let parser = JSONStream.parse('*');
  stream.pipe(parser);

  parser.on('data', entry => {
    rawEntryArray.push(entry.queryID) ;

    let containsExist = (entry.contains != '' && entry.contains.length > 0) ,
        multiTarget = (entry.contains.length > 1),
        wikipediaEmpty = (entry.relevant.wikipedia.length == 0);

    // fill in count statistics
    if(!containsExist){containsNotExistArray.push(entry.queryID) ;}
    if(multiTarget){multiTargetArray.push(entry.queryID) ;}
    if(wikipediaEmpty){wikipediaEmptyArray.push(entry.queryID)}

    if(containsExist && !multiTarget && !wikipediaEmpty){
      let relevantMerged,
          relevant = entry.relevant.wikipedia[0];
      if(localConfig.relevantEntitiesClass == 'targetType'){
        relevantMerged = relevant.targetType.map(item => {return {iri: item.iri, claims: item.claims};});
      }
      else{
        relevantMerged = [... relevant.targetType, ... relevant.noType , ... relevant.noTargetType].map(item => {return {iri: item.iri};});
      }
      let relevantEmpty = (relevant.length == 0 || relevantMerged.length == 0) ;
      if(!relevantEmpty){

        let sparql = {query: entry.sparql[0].sparql, target:entry.sparql[0].target, keywords:entry.sparql[0].keywords, triples:entry.sparql[0].triples, result: entry.relevant.sparql[0].result};

        // store only needed data
        let interEntry = {
          catID: entry.queryID ,
          keywords: entry.contains[0].keywords,
          target: {iri: entry.contains[0].target},
          relevantEntities: relevantMerged ,
          metrics: {relevantEntitiesSize: relevantMerged.length, nrKeyword:entry.contains[0].keywords.length +1 },
          sparql: sparql
        };

        // remove categories with empty sparql queries , or
        // categories with multiple sparql queries
        let sparqlNotEmpty = interEntry.sparql != '' && interEntry.sparql.result[0]?.item != 'timeout' && interEntry.sparql.result[0]?.item != undefined;
        let multiSparql = (entry.relevant.sparql.length > 1);

        if(!sparqlNotEmpty){sparqlEmptyArray.push(entry.queryID) ;}
        if(multiSparql){multiSparqlArray.push(entry.queryID);}


        if(sparqlNotEmpty && !multiSparql){
          datasetArray.push(interEntry);
          finalEntryArray.push(entry.queryID);
        }

      }
    }

  });

  parser.on('end', () => {

    console.log('Writing entries into file ...');
    let inter = fs.createWriteStream(Config.finalData, {flags: 'a'});
    let statsFile = fs.createWriteStream(Config.statsFinalData, {flags: 'a'});

    let stats = {
      rawEntryCount: rawEntryArray.length,
      finalEntryCount: finalEntryArray.length,
      containsNotExistCount: containsNotExistArray.length,
      multiTargetCount: multiTargetArray.length,
      wikipediaEmptyCount: wikipediaEmptyArray.length,
      multiSparqlCount: multiSparqlArray.length,
      sparqlEmptyCount: sparqlEmptyArray.length,

      containsNotExist: containsNotExistArray,
      multiTarget: multiTargetArray,
      wikipediaEmpty: wikipediaEmptyArray,
      multiSparql: multiSparqlArray,
      sparqlEmpty: sparqlEmptyArray
    }

    statsFile.write(JSON.stringify(stats));

    inter.write('[');
    inter.write('\r\n');

    datasetArray.forEach((item, i) => {
      try {
        inter.write(JSON.stringify(item));
      }
      catch(e){
        if(e.message == 'Invalid string length'){
          streamEntry(item,inter);
        }
      }

      inter.write('\r\n');

      if(i!=  datasetArray.length - 1){
        inter.write(',');
      }
      inter.write('\r\n');

    });

    inter.write(']');

    const end = performance.now();

    console.log(`Time taken: ${(end - start) / 1000} s`);
    console.log(JSON.stringify(
      {
        rawEntryCount: rawEntryArray.length,
        finalEntryCount: finalEntryArray.length,
        containsNotExistCount: containsNotExistArray.length,
        multiTargetCount: multiTargetArray.length,
        wikipediaEmptyCount: wikipediaEmptyArray.length,
        multiSparqlCount: multiSparqlArray.length,
        sparqlEmptyCount: sparqlEmptyArray.length
      }
    ))
  });

}
