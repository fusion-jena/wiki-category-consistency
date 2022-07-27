/**
 * check matches between entities and sparql in terms of properties and values
 *
 * @param  {Array}  onlyInWiki  array containing iris found in wikipedia but not retrieved by sparql
 * @param  {Array}  triples     array containing sparql properties and their corresponding values
 * @param  {Map}    iriClaimMap map containing key value of iri => claim
 * @returns {Object}
 */

export default function checkMatchEntity(onlyInWiki, triples, iriClaimMap){

  let missingProp = new Set();
  let diffPropValue = new Set();
  let otherPropUsage = new Set();

  for (let iri of onlyInWiki) {
    let claims = iriClaimMap.get(iri);
    let mapClaimProp = new Map();
    let setClaimValue = new Set();
    claims.forEach(item => {
      mapClaimProp.set(item.p, item.value);
      item.value.forEach(val => {
        setClaimValue.add(val);
      });

    });

    for (let triple of triples) {

      // check if property exists
      if(mapClaimProp.has(triple.p)){
        // check if one of its value are the same
        if(!mapClaimProp.get(triple.p).some(element => element == triple.value)){
          diffPropValue.add(iri);
          continue;
        }
      }
      else{
        // check if value is assigned to other property
        if(setClaimValue.has(triple.value)){
          otherPropUsage.add(iri);
          continue;
        }
        else{
          missingProp.add(iri);
          continue;
        }
      }

    }
  }

  return {missingProp: [...missingProp], diffPropValue: [...diffPropValue], otherPropUsage: [...otherPropUsage]};

}
