import getCategories              from './../queries/getCategories';
import getWikiTitleLang           from './../queries/getWikiTitleLang';
import getQualifiers              from './../queries/getQualifiers';
import getAllSparqlResult         from './../queries/getAllSparqlResult';
import getSubclasses              from './../queries/getSubclasses';
import getAnnotPage               from './../keyword-target-extraction/getAnnotPage';
import getPagesSubcatAllLang      from './../wikipedia-traversal/getPagesSubcatAllLang';
import groupProperties            from './groupProperties';
import checkLangAccess            from './checkLangAccess';
import streamEntryWrite           from './streamEntryWrite';
import Config                     from './../config/config';
import { logPipelineProgress }    from './../util/logger';
import progressBar                from 'cli-progress';

const { performance } = require('perf_hooks');


/**
 * actual pipeline for generating candidate entries (wikipedia set and sparql set)
 * @param     {Object}      fs        object for file system node module
 * @param     {Function}    request   function to issue (sparql) queries
 */

export default async function generateCandidate(fs, request) {

  const barWikiTraversal = new progressBar.SingleBar({}, progressBar.Presets.shades_classic);

  const start = performance.now();

  let logStreamGS = fs.createWriteStream(Config.rawData, { flags: 'a' });
  logStreamGS.write('[');
  logStreamGS.write('\r\n');

  let logStreamStat = fs.createWriteStream(Config.statsRawData, { flags: 'a' });
  logStreamStat.write('[');

  let timetraversal = fs.createWriteStream(Config.outputGS + 'time-traversal.json', { flags: 'a' });
  timetraversal.write('[');

  //init all timestamps
  let tAnnotSparql0 = 0, tAnnotSparql1 = 0, tAnnotPageCat0 = 0, tAnnotPageCat1 = 0, tExecSparql0 = 0, tExecSparql1 = 0, tExecWikip0 = 0, tExecWikip1 = 0, tExecDBp0 = 0, tExecDBp1 = 0;

  console.log('Retrieve categories with some properties');
  logPipelineProgress.info('Retrieve categories with some properties');

  //retrieve categories with some properties
  const tAllCat0 = performance.now();
  let result = await getCategories(request);
  const tAllCat1 = performance.now();

  console.log('Group properties of categories');
  logPipelineProgress.info('Group properties of categories');

  let grouped = groupProperties(result);

  result = result.slice(Config.checkpoint - 1);

  // UNCOMMENT THE FOLLOWING PART IF YOU WANT TO RUN THE PIPELINE FOR JUST ONE CATEGORY
  // CHANGE THE CATEGORY IRI ACCORDINGLY IN THE FOLLOWING LINE

  /*result = result.filter(elm => elm.setCat == 'Q32772830');
  console.log(result);*/

  console.group('Retrieve all data that can be fetched at once for now');
  logPipelineProgress.info('Retrieve all data that can be fetched at once for now');

  console.log('fetch title/lang for all categories');
  logPipelineProgress.info('fetch title/lang for all categories');

  const tAllTitleLangs0 = performance.now();
  let wikipTitleLang = await getWikiTitleLang(grouped.valuesCat, request);
  const tAllTitleLangs1 = performance.now();

  console.log('fetch all qualifiers for contains values for categories');
  logPipelineProgress.info('fetch all qualifiers for contains values for categories');

  const tQualifCat0 = performance.now();
  let qualifiersCat = await getQualifiers(grouped.valuesWithContains, request, 'set-category');
  const tQualifCat1 = performance.now();

  console.log('execute all sparql queries corresponding to all categories');
  logPipelineProgress.info('excute all sparql queries corresponding to all categories');
  // get results of all sparql queries corresponding to set categories
  const tAllSparql0 = performance.now();
  let allSparqlResults = await getAllSparqlResult(request, grouped.extractedAnnotSparql);
  const tAllSparql1 = performance.now();

  console.log('get list of sublasses of "Wikimedia internal item (Q17442446)');
  logPipelineProgress.info('get list of sublasses of "Wikimedia internal item (Q17442446)');
  let wikimediaSub = await getSubclasses(['Q17442446'], request);

  console.log('Gather languages that both have API and download links');
  logPipelineProgress.info('Gather languages that both have API and download links');

  let langList = await checkLangAccess(wikipTitleLang);
  //let langList = JSON.parse(fs.readFileSync(Config.outputGS + 'lang-list.json'));

  console.groupEnd();

  console.log('For each category extract annotations and retrieve relevant results');
  logPipelineProgress.info('For each category extract annotations and retrieve relevant results');
  // for each category extract annotations

  barWikiTraversal.start(result.length, 0);

  for (let i = 0; i < result.length; i++) {

    const timeTreatOneCat0 = performance.now();

    //console.group(`--- ${i+1}. ${result[i].result.setCatLabel} ---`);
    logPipelineProgress.info(`--- ${i + 1}. ${result[i].setCat} ---`);

    //let entry = { queryID: result[i].setCat, query: result[i].result.setCatLabel, sparql: '', contains: '', list: '', relevant: { sparql: [], DBpedia: [], wikipedia: [] }, comment: '' };
    let entry = { queryID: result[i].setCat, sparql: '', contains: '', relevant: { sparql: [] , wikipedia: [] }, comment: '' };

    // if sparql query exists annotate from query
    if (result[i].result.hasOwnProperty('sparql')) {

      //console.log('sparql query exists , annotate from it');
      logPipelineProgress.info('sparql query exists , annotate from it');

      let sparqlAnnot = [];
      tAnnotSparql0 = performance.now();
      for (let k = 0; k < result[i].result.sparql.length; k++) {
        let sparql = grouped.extractedAnnotSparql.find(el => el.sparql == result[i].result.sparql[k]);
        sparqlAnnot.push(sparql);
      }
      tAnnotSparql1 = performance.now();
      entry.sparql = sparqlAnnot;
    }

    //if property P4224 "category contains" exists , annotate from its value and qualifiers (if available)
    if (result[i].result.hasOwnProperty('contains')) {

      //console.log('"category contains" exists , annotate from it');
      logPipelineProgress.info('"category contains" exists , annotate from it');

      // get category contains qualifiers
      let qualif = qualifiersCat.find(item => item.iri == result[i].setCat);

      tAnnotPageCat0 = performance.now();
      let annotationContains = getAnnotPage(qualif);
      tAnnotPageCat1 = performance.now();
      entry.contains = annotationContains;

    }

    if (!result[i].result.hasOwnProperty('sparql') && !result[i].result.hasOwnProperty('contains') && !result[i].result.hasOwnProperty('list')) {
      //console.log('no annotation source available');
      logPipelineProgress.info('no annotation source available');
      entry.comment = 'no annotation source available';
    }

    // retrieve list of relevant results
    //get from sparql
    if (entry.sparql != '') {

      //console.log('retrieve list of relevant results : SPARQL');
      logPipelineProgress.info('retrieve list of relevant results : SPARQL');

      let relevant = [];

      tExecSparql0 = performance.now();
      entry.sparql.forEach(annot => {
        let idQuery = annot.sparql.replace(/[^A-Z0-9]/ig, '');
        let result = allSparqlResults.find(item => item.query == idQuery);
        if (Object.keys(result.result[0]).length == 0) {
          relevant.push({ query: annot.sparql, result: [] });
        }
        else {
          relevant.push({ query: annot.sparql, result: result.result });
        }
      });
      tExecSparql1 = performance.now();

      entry.relevant.sparql = relevant ;
    }

    let timeWikiPerTarget = [];

    //get category members from wikipedia (type check)

    if (entry.contains != '' && entry.contains.length == 1) {

      //console.group('retrieve list of relevant results : Wikipedia');
      logPipelineProgress.info('retrieve list of relevant results : Wikipedia');

      tExecWikip0 = performance.now();

      for (let j = 0; j < entry.contains.length; j++) {

        const tTraversalTarget0 = performance.now();

        //console.log('retrieve category title and language');
        logPipelineProgress.info('retrieve category title and language');

        // find title and language of corresponding wikipedia category page
        let found = wikipTitleLang.find(cat => cat.catIRI == result[i].setCat);
        //filter elements without both title and lang and also non accepted languages
        let titleLang = found.result.filter(item => item.hasOwnProperty('title') && item.hasOwnProperty('lang') && langList.accepted.some(el => el == item.lang));

        if (titleLang.length != 0 ) {
          let target = entry.contains[j].target;
          //console.log(target);
          logPipelineProgress.info(target);

          // get list of sublasses of target
          let targetSub = await getSubclasses([target]);
          let subclasses = {target:targetSub , wikimedia:wikimediaSub};

          let relevantWikip = await getPagesSubcatAllLang(target, result[i].setCat, titleLang, request, subclasses);

          entry.relevant.wikipedia.push({
            target: target,
            targetType:         relevantWikip.relevantSet,
            noType:             relevantWikip.relevantSetNoType,
            noTargetType:       relevantWikip.relevantSetNoTargetType,
            catTypeCheckFailed: relevantWikip.catTypeCheckFailed
          });

          const tTraversalTarget1 = performance.now();

          timeWikiPerTarget.push({ catIRI: result[i].setCat, target: target, timeWikiTraversal: relevantWikip.timeWikiTraversal, timeTraversalTarget: (tTraversalTarget1 - tTraversalTarget0) });

        }
      }
      tExecWikip1 = performance.now();

      //console.groupEnd();

    }

    //console.log('Write  entry into file + gather statistics');
    logPipelineProgress.info('Write entry into file + gather statistics');

    let relvSparqlSize = [], relvWikiSize = [];
    entry.relevant.sparql.forEach(item => {
      relvSparqlSize.push({ query: item.query, size: item.result.length });
    });
    entry.relevant.wikipedia.forEach(item => {
      relvWikiSize.push({
        target: item.target,
        sizeTargetType: item.targetType.length,
        sizeNoType: item.noType.length,
        sizeNoTargetType: item.noTargetType.length,
        sizeCatTypeCheckFailed: item.catTypeCheckFailed.length,
      });
    });


    //gather time and other information (prop existance , relv result length ...)
    let statistics = {
      queryID: result[i].setCat,
      sparql: result[i].sparql != '', timeAnnotSparql: (tAnnotSparql1 - tAnnotSparql0) / 1000,
      contains: result[i].contains != '', timeAnnotContains: (tAnnotPageCat1 - tAnnotPageCat0) / 1000,
      timeExecSparql: (tExecSparql1 - tExecSparql0) / 1000, relvSparqlSize: relvSparqlSize,
      timeExecWiki: (tExecWikip1 - tExecWikip0) / 1000, sizes: relvWikiSize
    };

    try {
      logStreamGS.write(JSON.stringify(entry));
    }
    catch(e){
      if(e.message == 'Invalid string length'){
        streamEntryWrite(entry,logStreamGS);
      }
    }

    logStreamStat.write(JSON.stringify(statistics));
    logStreamStat.write(',');
    if (i != result.length - 1) {
      logStreamGS.write(',');
    }
    logStreamGS.write('\r\n');

    //console.log('Entry successfully written into '+ Config.outputGS);
    logPipelineProgress.info('Entry successfully written into ' + Config.outputGS);

    //console.groupEnd();

    const timeTreatOneCat1 = performance.now();

    let timesTarget = timeWikiPerTarget.map(item => item);

    timeWikiPerTarget.forEach(target => {
      let timeTreatOneCat = (timeTreatOneCat1 - timeTreatOneCat0);
      timesTarget.forEach(time => {
        if (time.target != target.target) {
          timeTreatOneCat = timeTreatOneCat - time.timeTraversalTarget;
        }
      });

      target['timeTreatOneCat'] = timeTreatOneCat;

      //console.log(`
      //Time Treat one Cat target : ${timeTreatOneCat/1000} s `);
      logPipelineProgress.info(`Time Treat one Cat target : ${timeTreatOneCat / 1000} s`);

      let timeRest = timeTreatOneCat - target.timeWikiTraversal.timeTypeCheck
        - target.timeWikiTraversal.timeTypeCheckPost
        - target.timeWikiTraversal.timeclaimCache
        - target.timeWikiTraversal.timeclaimPost;

      target['timeRest'] = timeRest;

      //console.log(`Time rest : ${timeRest/1000} s `);
      logPipelineProgress.info(`Time rest : ${timeRest / 1000} s `);

      timetraversal.write(JSON.stringify(target));

    });

    if (i != result.length - 1) {
      timetraversal.write(',');
    }

    barWikiTraversal.increment();
  }

  logStreamGS.write(']');
  timetraversal.write(']');

  const end = performance.now();

  let globalStats = {
    timeGetAllCat: (tAllCat1 - tAllCat0) / 1000,
    timeGetLangs: (tAllTitleLangs1 - tAllTitleLangs0) / 1000,
    timeGetQualifCat: (tQualifCat1 - tQualifCat0) / 1000,
    timeAllSparql: (tAllSparql1 - tAllSparql0) / 1000,
    totalTime: (end - start) / 1000
  };

  logStreamStat.write(JSON.stringify(globalStats));
  logStreamStat.write(']');

  console.log(`
  Time taken: ${(end - start) / 1000} s`);
  logPipelineProgress.info('Time taken: ' + (end - start) / 1000 + ' s');

  barWikiTraversal.stop();
}
