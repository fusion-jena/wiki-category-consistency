import Cache from '../../../util/cache';
import Config from '../../../config/config';
import Fs from 'fs';
import Path from 'path';
import Util from 'util';
import { getObjectClaims } from '../../util';

// setup caches
const cacheTypes = new Cache( 'types', 'page' );

// setup temp file
const tempFilePath = Path.join( Config.cachePath, 'getClaims.tmp.tsv' );
const tempFile = Fs.createWriteStream( tempFilePath, {});
const appendTemp = Util.promisify( tempFile.write ).bind( tempFile );

// extract list of iris for which we need the claims proverty => value
const iris = new Set();

//for wikipedia members
for( const row of cacheTypes.getAll() ) {
  iris.add(row.page);
}

/**
 * for all iris determine claims
 */
export default function getClaims( entry ) {

  // skip anything that is not our iri
  if( !iris.has( entry.id ) ) {
    return;
  }

  // get claims
  let claims = getObjectClaims(entry);

  // persist
  appendTemp(JSON.stringify({ iri: entry.id, result: claims }) );
  appendTemp('\n');

}
