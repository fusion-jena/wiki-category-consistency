

/**
 * gather all keywords from qualifiers list / gather all sparql targets
 *
 *
 * @param     {Array}    qualifiersCat          "contains" qualifier values for categories
 * @param     {Array}    extractedAnnotSparql    sparql queries corresponding to all categories
 * @returns   {Object}   contains arrays of each of the gathered elements
 */

export default function gatherElements(qualifiersCat, extractedAnnotSparql){

  // gather all keywords
  let allKeywordIRIs = [];
  //get all targets labels for sparql query annotation
  let allSparqlTargets = [];

  qualifiersCat.forEach(qual => {
    qual.result.forEach(res => {
      if(res.hasOwnProperty('keywordIRI')){
        allKeywordIRIs.push(res.keywordIRI.toString());
      }
    });
  });

  extractedAnnotSparql.forEach(ex => {
    ex.keywords.forEach(keyword => {
      allKeywordIRIs.push(keyword);
    });
    allSparqlTargets.push(ex.target);
  });


  return {allKeywordIRIs: allKeywordIRIs , allSparqlTargets: allSparqlTargets} ;
}
