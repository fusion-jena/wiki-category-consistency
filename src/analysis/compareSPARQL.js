import Config                       from './../config/config' ;
import checkMatchEntity             from './checkMatchEntity' ;
import checkMatchContains           from './checkMatchContains' ;
import JSONStream                   from 'JSONStream';
import _                            from 'lodash';

/**
 * compare results coming from SPARQL queries attached to some categories with results coming from wikipedia
 *
 * @param      {Object}      fs        object for file system node module
 *
 */

export default function compareSPARQL(fs){

  console.log('Compare SPARQL/Wikipedia . . .');

  let stream = fs.createReadStream(Config.finalData , {encoding: 'utf8'});

  let parser = JSONStream.parse('*');
  stream.pipe(parser);

  //let compareCSV = fs.createWriteStream(Config.eval+'compare.csv', {flags: 'a'});
  let compareJSON = fs.createWriteStream(Config.eval+'compare.json', {flags: 'a'});

  let fractionIntersectSparqlSumm = 0, fractionIntersectWikiSumm = 0 , entryCount = 0;
  //compareCSV.write('catID,query,sparql,intersection/sparqlSize,intersection/wikiSize,sparqlSize,wikiSize,intersection,onlyInSparql,onlyInWiki');
  //compareCSV.write('\r\n');

  parser.on('data', item => {

    entryCount ++;

    let relevantSparql = item.sparql.result.map(element => element.item);
    let relevantWiki = item.relevantEntities.map(element => element.iri);
    let intersect = _.intersection(relevantSparql, relevantWiki);
    let onlyInSparql = _.difference(relevantSparql, relevantWiki);
    let onlyInWiki =  _.difference(relevantWiki, relevantSparql);

    // analyze matches between entity sparql property-value
    // construct an in-memory key value store for relevant entity wikipedia => claims
    let iriClaimMap = new Map();
    item.relevantEntities.forEach(el => {
      iriClaimMap.set(el.iri, el.claims);
    });

    //check matches for wikipedia entities
    let checkEntity = checkMatchEntity(onlyInWiki, item.sparql.triples, iriClaimMap);

    //check matches for contains information in wikidata category
    let checkContains = checkMatchContains(item.keywords, item.sparql.triples, item.sparql.target, item.target.iri);

    //compareCSV.write(`${item.catID},${item.query},${item.sparql.query},${intersect.length/relevantSparql.length},${intersect.length/relevantWiki.length},${relevantSparql.length},${relevantWiki.length},${intersect.length},${onlyInSparql.length},${onlyInWiki.length}`);
    //compareCSV.write('\r\n');

    //for writing as json

    let fractionIntersectSparql = intersect.length/relevantSparql.length;
    let fractionIntersectWiki = intersect.length/relevantWiki.length;

    fractionIntersectSparqlSumm +=  fractionIntersectSparql ;
    fractionIntersectWikiSumm += fractionIntersectWiki ;

    let allIssueSetSize = new Set ([... checkEntity.missingProp, ... checkEntity.diffPropValue, ... checkEntity.otherPropUsage]).size;

    let element = {
      catID: item.catID,
      sparql: item.sparql.query,
      Recall:fractionIntersectSparql,
      Precision:fractionIntersectWiki,
      relevantSparqlSize:relevantSparql.length,
      relevantWikiSize:relevantWiki.length,
      itersectionSize: intersect.length,
      onlyInSparqlSize: onlyInSparql.length,
      onlyInWikiSize: onlyInWiki.length,
      missingPropSize: checkEntity.missingProp.length,
      diffPropValueSize: checkEntity.diffPropValue.length,
      otherPropUsageSize: checkEntity.otherPropUsage.length,
      missingProp: checkEntity.missingProp,
      diffPropValue: checkEntity.diffPropValue,
      otherPropUsage: checkEntity.otherPropUsage,
      allIssueSetSize: allIssueSetSize,
      containsMatch: checkContains
      //intersection: intersect.map(element => JSON.parse(element)),
      //onlyInSparql: onlyInSparql.map(element => JSON.parse(element)),
      //onlyInWiki: onlyInWiki.map(element => JSON.parse(element)),
    };
    compareJSON.write(JSON.stringify(element));
    compareJSON.write('\r\n');

  });

  parser.on('end', () => {

    let compareStats = fs.createWriteStream(Config.eval+'statistics-compare.json', {flags: 'a'});

    let averageIntersectSparql = fractionIntersectSparqlSumm / entryCount;
    let averageIntersectWiki = fractionIntersectWikiSumm / entryCount;

    compareStats.write(JSON.stringify({averageRecall:averageIntersectSparql, averagePrecision: averageIntersectWiki}));


  });
}
