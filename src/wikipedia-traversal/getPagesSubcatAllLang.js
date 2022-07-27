import getClaims                                            from './../queries/getClaims' ;
import getPagesSubcatTypeCheck                              from './getPagesSubcatTypeCheck';
import {logPipelineProgress}                                from './../util/logger';
const { performance } = require('perf_hooks');
/**
 * for each category retrieve all its member pages going through the subcategory hierarchy
 * take distinct set from all languages
 * @param     {String}            target       iri of target determined from contains property of set category
 * @param     {String}            catIRI       iri of the initial input category
 * @param     {Object}            titleLang    corresponding list of titles and languages corresponding to actual category
 * @param     {Function}          request      function to issue (sparql) queries
 * @param     {Object}            subclasses   List of subclasses (direct/indirect) of target/wikimedia internal item, includes also target/wikimedia item itself
 */
export default async function getPagesSubcatAllLang(target , catIRI, titleLang , request, subclasses) {

  // set for relevant results with type in subclass hierarchy of target
  let relevantSetMap = new Map(), withType = [] ;
  // set for found relevant results found as members in wikipedia cat pages but that have no type in wikidata
  let relevantSetNoTypeMap = new Map(), noType = [];
  // set for found relevant results found as members in wikipedia cat pages but their type is not in the target subclass hierarchy
  let relevantSetNoTargetTypeMap = new Map() , noTargetType = [] ;
  //categories where we stopped exploring their hierarchy
  let catTypeCheckFailed = [] ;
  // initiate timers for
  let typeCheckT = 0 ,  typeCheckPostT= 0 , tclaim3 = 0, tclaim4 = 0, tclaim5 = 0, tclaim6 = 0 , tclaim7 = 0, tclaim8 = 0 ;
  //store detailled traversal times for each language
  let timeTraversalLangs = [];

  //console.log('retrieve category/subcategory members and their wikidata id');
  logPipelineProgress.info('retrieve category/subcategory members and their wikidata id');

  const traversalAllLang0= performance.now();

  for (let i = 0; i < titleLang.length; i++) {

    // get category members from wikipedia for all languages
    let lang = titleLang[i].lang ,
        apiurl = `https://${lang}.wikipedia.org/w/api.php`;

    //console.log('lang: ' + lang);
    logPipelineProgress.info('lang: ' + lang);

    const tc0= performance.now();
    let resultForLang = await getPagesSubcatTypeCheck(target, request, titleLang[i].title, apiurl, lang, subclasses);
    const tc1= performance.now();

    typeCheckT = typeCheckT + (tc1 - tc0);

    const tcPost0= performance.now();

    if(resultForLang.relevantSet.length + resultForLang.relevantSetNoType.length + resultForLang.relevantSetNoTargetType.length != 0){
      timeTraversalLangs.push(resultForLang.timeTraversalOneLang);
    }
    else {
      continue;
    }

    resultForLang.relevantSet.forEach(item => {
      if(!relevantSetMap.has(item.iri)){
        relevantSetMap.set(item.iri, item.source);
      }
      else{
        relevantSetMap.get(item.iri).push(item.source[0]);
      }
      /*let index = relevantSet.findIndex(el => item.iri == el.iri);
      if(index == -1){
        relevantSet.push({ ... item});
      }
      else{
        let newsource = [...relevantSet[index].source] ;
        newsource.push(item.source[0]);
        relevantSet[index].source = newsource ;
      }*/
    });

    resultForLang.relevantSetNoType.forEach(item => {
      if(!relevantSetNoTypeMap.has(item.iri)){
        relevantSetNoTypeMap.set(item.iri, item.source);
      }
      else{
        relevantSetNoTypeMap.get(item.iri).push(item.source[0]);
      }
      /*let index = relevantSetNoType.findIndex(el => item.iri == el.iri);
      if(index == -1){
        relevantSetNoType.push({ ... item});
      }
      else{
        let newsource = [...relevantSetNoType[index].source] ;
        newsource.push(item.source[0]);
        relevantSetNoType[index].source = newsource ;
      }*/
    });

    resultForLang.relevantSetNoTargetType.forEach(item => {
      if(!relevantSetNoTargetTypeMap.has(item.iri)){
        relevantSetNoTargetTypeMap.set(item.iri, item.source);
      }
      else{
        relevantSetNoTargetTypeMap.get(item.iri).push(item.source[0]);
      }
      /*let index = relevantSetNoTargetType.findIndex(el => item.iri == el.iri);
      if(index == -1){
        relevantSetNoTargetType.push({ ... item});
      }
      else{
        let newsource = [...relevantSetNoTargetType[index].source] ;
        newsource.push(item.source[0]);
        relevantSetNoTargetType[index].source = newsource ;
      }*/
    });

    catTypeCheckFailed = [... catTypeCheckFailed , ...resultForLang.catTypeCheckFailed ] ;

    const tcPost1= performance.now();

    typeCheckPostT = typeCheckPostT + (tcPost1 - tcPost0);

  }
  const traversalAllLang1= performance.now();

  //console.log(`
  //  Time Category traversal : ${(traversalAllLang1 - traversalAllLang0)/1000} s`);
  logPipelineProgress.info(`Time Category traversal : ${(traversalAllLang1 - traversalAllLang0)/1000} s`);
  //console.log(`
  //  Time type check : ${typeCheckT/1000} s`);
  logPipelineProgress.info(`Time type check : ${typeCheckT/1000} s`);
  //console.log(`
  //  Time type check post-proc : ${typeCheckPostT/1000} s`);
  logPipelineProgress.info(`Time type check post-proc : ${typeCheckPostT/1000} s`);

  //console.log('retrieve claims for wikidata ids');
  logPipelineProgress.info('retrieve claims for wikidata ids');

  const getclaimsAll0= performance.now();

  if(relevantSetMap.size != 0){
    let relevantSetValues = [... relevantSetMap.keys()];
    tclaim3= performance.now();
    let claimsWithType = await getClaims(relevantSetValues, request);
    tclaim4= performance.now();
    // append source and lang info
    withType = claimsWithType.map(rel => {
      let obj = {
        iri:rel.iri,
        claims: rel.result ,
        source: [... relevantSetMap.get(rel.iri)]
      };
      return obj ;
    });
  }


  if(relevantSetNoTypeMap.size != 0){
    let relevantSetNoTypeValues = [... relevantSetNoTypeMap.keys()];
    tclaim5= performance.now();
    let claimsNoType = await getClaims(relevantSetNoTypeValues, request);
    tclaim6= performance.now();
    // append source and lang info
    noType = claimsNoType.map(rel => {
      let obj = {
        iri:rel.iri,
        claims: rel.result ,
        source: [... relevantSetNoTypeMap.get(rel.iri)]
      };
      return obj ;
    });
  }


  if(relevantSetNoTargetTypeMap.size != 0){
    let relevantSetNoTargetTypeValues = [... relevantSetNoTargetTypeMap.keys()];
    tclaim7= performance.now();
    let claimsNoTargetType = await getClaims(relevantSetNoTargetTypeValues, request);
    tclaim8= performance.now();
    // append source and lang info
    noTargetType = claimsNoTargetType.map(rel => {
      let obj = {
        iri:rel.iri,
        claims: rel.result ,
        source: [... relevantSetNoTargetTypeMap.get(rel.iri)]
      };
      return obj ;
    });
  }

  const getclaimsAll1 = performance.now();

  //console.log(`
  //  Time taken get all claims (cache calls + post-proc) : ${(getclaimsAll1 - getclaimsAll0)/1000} s`);
  logPipelineProgress.info(`Time taken get all claims (cache calls + post-proc) : ${(getclaimsAll1 - getclaimsAll0)/1000} s`);

  let claimCache = (tclaim4-tclaim3)+(tclaim6-tclaim5)+(tclaim8-tclaim7);
  //console.log(`
  //  Time Taken claim cache calls : ${claimCache/1000} s`);
  logPipelineProgress.info(`Time Taken claim cache calls : ${claimCache/1000} s`);

  let claimPost = (getclaimsAll1 - getclaimsAll0) - claimCache ;
  //console.log(`
  //  Time Taken claim post-proc : ${claimPost/1000} s`);
  logPipelineProgress.info(`Time Taken claim post-proc : ${claimPost/1000} s`);


  let timeWikiTraversal = {
    timeTraversal: (traversalAllLang1 - traversalAllLang0), timeTypeCheck: typeCheckT, timeTypeCheckPost: typeCheckPostT,
    timeclaims: (getclaimsAll1 - getclaimsAll0), timeclaimCache: claimCache, timeclaimPost: claimPost ,
    allIrisSize: relevantSetMap.size + relevantSetNoTypeMap.size + relevantSetNoTargetTypeMap.size,
    irisSizeType: relevantSetMap.size , timeclaimCacheType: (tclaim4-tclaim3),
    irisSizenoType: relevantSetNoTypeMap.size, timeclaimCacheNoType:(tclaim6-tclaim5) ,
    irisSizenoTargetType: relevantSetNoTargetTypeMap.size, timeclaimCacheNoTargetType:(tclaim8-tclaim7),
    timeTraversalPerLang: timeTraversalLangs};

  return {relevantSet: withType, relevantSetNoType: noType, relevantSetNoTargetType: noTargetType , catTypeCheckFailed:catTypeCheckFailed , timeWikiTraversal:timeWikiTraversal} ;

}
