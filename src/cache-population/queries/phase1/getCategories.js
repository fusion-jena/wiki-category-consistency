import Cache from '../../../util/cache';
import { getCombinations } from '../../util';

// setup cache
const cache = new Cache( 'Categories', 'setCat' );

export default function getCategories( entry ) {

  // Wikimedia categories (Q4167836)
  if( !entry._isSetCat || !entry._isSPARQL.check) {
    return;
  }

  // create entries for persisting
  const res = [];
  for( const [ pContains ] of getCombinations([ entry._isSPARQL.contains ])) {
    res.push({
      sparql:   entry._isSPARQL.sparql,
      contains: pContains
    });
  }

  // persist
  cache.setValues([{ setCat: entry.id, result: res }]);
}
