/**
 * stream writing entry, when JSON.Stringify fails by big json (Invalid string length)
 *
 *
 * @param     {Object}   data                 dateset entry
 * @param     {Object}   writeStream          writing stream object
 *
 *
 */

export default function streamEntry(data, writeStream){

  writeStream.write('{');

  Object.keys(data).forEach(key => {
    if(key != 'relevantEntities'){
      writeStream.write(JSON.stringify(key));
      writeStream.write(':');
      writeStream.write(JSON.stringify(data[key]));
      if(key != 'sparql'){
        writeStream.write(',');
      }
    }
    else{
      writeStream.write(JSON.stringify(key));
      writeStream.write(':');
      writeStream.write('[');
      data[key].forEach((element,i) => {
        writeStream.write(JSON.stringify(element));
        if(i!=data[key].length - 1 ){
          writeStream.write(',');
        }
      });
      // close relevant array
      writeStream.write(']');
      writeStream.write(',');
    }
  });

  //close whole entry
  writeStream.write('}');
}
