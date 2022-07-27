
/**
 * extract target and keywords from sparql query
 * @param     {String}          sparql            sparql query string
 * @returns   {Object}          for the sparql query extracted target and keywords
 *
 */
export default function extractTargetKeyword(sparql) {
  //extract all entities
  let entities = sparql.match(/wd:Q[0-9]*/g) ;

  //replace wd: prefix
  entities.forEach((item, index) => {
    entities[index] = item.replace('wd:', '');
  });

  //extract instance triple
  let instance = sparql.match(/wdt:P31 wd:Q[0-9]*/g) ;

  //extract target
  let target = instance[0].match(/wd:Q[0-9]*/g)[0].replace('wd:', '') ;

  //get only keywords
  let keywords = entities.filter(entity => entity != target) ;

  //extract triples
  let triples = sparql.match(/wdt:P[0-9]* wd:Q[0-9]*/g) ;

  //format to array of objects {p: , key:}
  let triplesObject = triples.map(el => {return {p: el.match(/wdt:P[0-9]*/g)[0].replace('wdt:', ''), value: el.match(/wd:Q[0-9]*/g)[0].replace('wd:', '')};});

  return {sparql: sparql , target: target , keywords:keywords, triples: triplesObject} ;

}
