/**
 * check matches between contains property content and sparql properties and values
 *
 * @param  {Array}  keywords        keywords array of category containing also properties
 * @param  {Array}  triples         array containing sparql properties and their corresponding values
 * @param  {String} targetSparql    target of sparql query
 * @param  {String} targetWiki      target from wikidata contains property
 * @returns {String}
 */

export default function checkMatchContains(keywords, triples, targetSparql, targetWiki){

  //filter instance of entry (P31)
  let filteredTriples = triples.filter(item => item.p != 'P31');

  let finding = 'noIssue';

  if(targetSparql != targetWiki){
    finding = 'diffTarget';
    return finding;
  }

  if(keywords.length != 0){

    let mapProp = new Map();
    let mapValue = new Map();
    keywords.forEach(item => {
      mapProp.set(item.p, item.iri);
      mapValue.set(item.iri, item.p);
    });

    for (let triple of filteredTriples) {
      // check if property exists
      if(mapProp.has(triple.p)){
      // check if property has another value
        if(triple.value != mapProp.get(triple.p)){
          finding = 'diffPropValue';
          return finding;
        }
      }
      else{
      // check if value is assigned to other property
        if(mapValue.has(triple.value)){
          finding = 'otherPropUsage';
          return finding;
        }
        else{
          finding = 'missingProp';
          return finding;
        }
      }

    }
  }
  else{
    finding = 'missingProp';
    return finding;
  }

  return finding;

}
