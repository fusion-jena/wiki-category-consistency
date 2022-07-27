import Cache         from './../util/cache' ;
import {transformToCacheFormat} from './../util/wikidata/formatResult';

/**
 * for each entity get properties and their values
 * if property has more than one value or is not object property skip
 * @param     {Array}             values    list of iris
 * @param     {Function}          request   function to issue (sparql) queries
 * @returns   {(Promise|Array)}   returns promise if we issue query to endpoint or direct array of result if data in cache
 */

//init cache
let cacheClaims = new Cache( 'claims', 'iri' ) ;

export default async function getClaims(values, request) {
  let variable = 'iri';

  function getQueryString(iris){return `
    SELECT ?iri ?p ?value ?isiri
     WHERE
     {
       VALUES ?iri {${iris}}

       ?iri ?p ?value .
       FILTER(CONTAINS(STR(?p), "http://www.wikidata.org/prop/direct/"))
       BIND(isIRI(?value) as ?isiri) .


       }
    `;
  }

  let result = await runRequest(request, cacheClaims, variable , values , getQueryString) ;
  return result ;


}

async function runRequest(request, cache, variable , values , queryString , maxValues = 10000) {
  //make sure we have unique values
  let set = [...new Set(values)];
  // hit cache
  let ask = cache.getValues(set);
  let notfound = ask.misses ;

  //** check if cache hit
  //if(ask.hits.length > 0){
  //console.log('hit: '+ cache._name);
  //logWikipediaHit.info('hit: '+ cache._name );
  //}
  //**

  if(notfound.length == 0){
    return ask.hits ;
  }

  // issue request for not found entities
  let resp = [] ;
  let reqs = [];

  for (let j = 0, k = notfound.length ; j<k ; j+=maxValues){

    let slice = notfound.slice(j, j + maxValues) ;

    let iriList = '';

    slice.forEach(rel => {
      iriList += `wd:${rel} `;
    });

    reqs.push(request(queryString(iriList)));
    //const respSlice = await request(queryString(iriList));
    //resp = [...resp , ...respSlice];
  }

  let res = await Promise.all(reqs) ;

  res.forEach(item => {
    resp = [...resp, ...item] ;
  });

  //adjust iris for literals and unknown
  // replace prefix added by endpoint, in case of non-existng uri with empty string
  // noticed that some keywords have unknown values (e.g., Category:Year of death missing) or are numbers (https://www.wikidata.org/wiki/Q6640133)
  resp.forEach(item => {
    let prefix = 'http://query.wikidata.org/bigdata/namespace/wdq/';
    if(item[variable].includes(prefix)){
      item[variable] = item[variable].replace(prefix, '');
    }
  });

  // transform into cache format
  let respFormatted = transformToCacheFormat(resp, variable, notfound) ;

  let newResult = [];

  respFormatted.forEach(el=>{

    let newEntry = {iri: el.iri, result: []};

    let props = new Set();

    // group result
    el.result.forEach(triple => {

      if(!props.has(triple.p)){

        props.add(triple.p);

        if(triple.isiri && triple.value.startsWith('Q')){
          newEntry.result.push({p: triple.p , value: [triple.value]});
        }
        else{
          newEntry.result.push({p: triple.p , value: []});
        }
      }
      else {
        if(triple.isiri && triple.value.startsWith('Q')){
          let index = newEntry.result.findIndex(el => el.p == triple.p);
          newEntry.result[index].value.push(triple.value);
        }


      }



    });

    newResult.push(newEntry);

  });

  cache.setValues(newResult);

  //return [... transformToEndpointFormat(ask.hits, variable) , ... resp];
  return [... ask.hits, ... newResult];
}
