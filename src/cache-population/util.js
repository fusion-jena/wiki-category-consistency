/**
 * check, if the entry is an instance of the given class
 *
 * @param {Object} entry
 * @param {String} klass
 * @returns {Boolean}
 */
export function isInstanceOf( entry, klass ) {
  return ('P31' in entry.claims) && entry.claims.P31.some( (el) => el?.mainsnak?.datavalue?.value?.id == klass );
}

export function isSPARQL( entry ) {
  // get associated values
  const sparql    = getDataValues( entry, 'P3921' ),
        contains  = getObjectValues( entry, 'P4224' );

  // check, whether we can use this SPARQL-query
  const useSparql = sparql &&
    // filter sparql queries that deal with literals
    !sparql[0].includes( 'FILTER' ) &&
    // some queries contain union (e.g., multiple targets)
    !sparql[0].includes( 'UNION' ) &&
    // in some queries there is no "instance of" relation (cannot determine target from query)
    sparql[0].includes( 'wdt:P31' ) &&
    // exclude sparql queries containing paths
    !sparql[0].includes( '/' ) &&
    // exclude queries with "VALUES" clause
    !sparql[0].includes( 'VALUES' ) &&
    //exclude queries using indirect properties "*"
    !sparql[0].includes( '*' ) ;

    return {check: contains && useSparql, sparql: useSparql ? sparql[0] : undefined, contains: contains} ;
}

/**
 * extract all values for the given DatatypeProperty from entry
 *
 * @param {Object} entry
 * @param {String} prop
 * @returns {Array}
 */
export function getDataValues( entry, prop ) {

  // property needs to exist
  if( !(prop in entry.claims) ) {
    return;
  }

  // get all values
  return entry.claims[ prop ].map( (el) => el.mainsnak.datavalue.value );

}


/**
 * extract all values for the given ObjectProperty from entry
 *
 * @param {Object} entry
 * @param {String} prop
 * @returns {Array}
 */
export function getObjectValues( entry, prop ) {

  // property needs to exist
  if( !(prop in entry.claims) ) {
    return;
  }

  const classes = entry.claims[ prop ].map( (el) => el?.mainsnak?.datavalue?.value?.id ).filter( (el) => el );
  if (classes.length == 0 ) {
    return ;
  }
  else {
    return classes;
  }

}

/**
 * extract all object claims with their values, consider only properties with a unique value (all sparql queries do not use two values for the same property)
 *
 * @param   {Object} entry
 * @returns {Object}
 */
export function getObjectClaims( entry ) {

  let claims = [] ;
  for( const prop of Object.keys(entry.claims) ){
    let item = {p: prop, value: []};
    let values = [];
    for (const value of entry.claims[prop]) {
        // if value not object skip
      if(value.mainsnak?.datavalue?.type != "wikibase-entityid"){
        continue;
      }
      values.push(value.mainsnak?.datavalue?.value?.id);
    }
    claims.push({p: prop , value: values}) ;
  }

  return claims;

}

/**
 * emit all combinations of the elements given in the member arrays of lists
 * note that all permutations use the same array, so the results might need to be cloned for further processing
 *
 * @param  {Array.<Array>} lists
 */
export function* getCombinations( lists ) {

  if( lists.length < 1 ) {

    // no more lists
    yield [];

  } else {
    // determine last list; the one processed here
    const lastIndex = lists.length - 1;

    for( const partial of getCombinations( lists.slice( 0, -1 ) ) ) {

      if( lists[lastIndex] && (lists[lastIndex].length > 0) ) {
        // some elements in "our" list
        for( const el of lists[lastIndex] ) {
          partial[lastIndex] = el;
          yield partial;
        }
      } else {
        // empty list
        partial[lastIndex] = undefined;
        yield partial;
      }

    }
  }

}
