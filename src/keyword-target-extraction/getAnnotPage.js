
/**
 * get target and keyword annotations from "category contains" or ""is a list of""
 * annotate from its value and qualifiers (if available)
 * in case of countains containing multiple values having same target , keep one target and do distinct union of keywords
 * @param     {Object}            qualif    object containing qualifiers
 * @returns   {Array}             array with annotations
 */
export default function getAnnotPage(qualif) {

  // group by target
  let annotations = [];
  qualif.result.forEach(qual => {
    if(!annotations.some(target => target.target == qual.target)){
      if(qual.hasOwnProperty('keywordIRI')){
        annotations.push({target: qual.target , keywords:[{iri:qual.keywordIRI, isiri: qual.isiri, p:qual.p}]});
      }
      else{
        annotations.push({target: qual.target , keywords:[]});
      }
    }
    else {
      let index = annotations.findIndex(element => element.target == qual.target);
      if(!annotations[index].keywords.some(keyword => keyword.iri == qual.keywordIRI) && qual.hasOwnProperty('keywordIRI')){
        annotations[index].keywords.push({iri:qual.keywordIRI, isiri: qual.isiri, p:qual.p});
      }
    }
  });

  return annotations;

}
