import Cache                    from './../util/cache' ;
import Config                   from './../config/config';
import {transformToCacheFormat} from './../util/wikidata/formatResult';

/**
 * get categories and some of their properties
 * @param     {Function}          request   function to issue (sparql) queries
 * @returns   {(Promise|Array)}   returns promise if we issue query to endpoint or direct array of result if data in cache
 */

//init cache
let cacheAllCats = new Cache('Categories', 'setCat') ;
export default async function getCategories(request) {

  let variable = 'setCat' ;
  let query =  `
  SELECT ?setCat ?sparql ?contains
  WHERE
  {
    ?setCat wdt:P31 wd:${Config.categoryIRI} .
    ?setCat wdt:P3921 ?sparql .

        # filter sparql queries that deal with literals
        FILTER(!CONTAINS(STR(?sparql), "FILTER"))
        # some queries contain union (e.g., multiple targets)
        FILTER(!CONTAINS(STR(?sparql), "UNION"))
        # in some queries there is no "instance of" relation (cannot determine target from query)
        FILTER(CONTAINS(STR(?sparql), "wdt:P31"))
        # exclude sparql queries containing paths
        FILTER(!CONTAINS(STR(?sparql), "/"))
        # exclude queries with "VALUES" clause
        FILTER(!CONTAINS(STR(?sparql), "VALUES"))
        # exclude queries using indirect properties "*"
        FILTER(!CONTAINS(STR(?sparql), "wdt:P279*"))

    ?setCat wdt:P4224 ?contains .
  }
    `;

  let resp ;
  //try to hit cache
  resp = cacheAllCats.getAll();
  if(resp.length == 0 && Config.endpointEnabled){
    // issue query if nothing in cache
    resp = await request(query);
    let respFormatted = transformToCacheFormat(resp, variable, []) ;
    cacheAllCats.setValues(respFormatted);
    return respFormatted ;
  }
  if(resp.length == 0 && !Config.endpointEnabled){
    throw 'categories cache empty !!';
    return ;
  }

  return resp ;
}
