import Config     from './../config/config' ;
import readline   from 'readline';
import fs         from 'fs';
import mkdirp     from 'mkdirp';


/**
 * %entities for each issue over wikipedia entities not found by SPARQL
 * @param     {String}          color     color bars
 * @param     {String}          fileName  source of metrics
 * @param     {String}          xLabel    label of x axis
 * @param     {String}          yLabel    label of y axis
 */

export default function plotIssueBar(color , fileName ,xLabel, yLabel){

  mkdirp.sync(Config.plotMetric);

  const rl = readline.createInterface({
    input: fs.createReadStream( fileName ),
  });

  let entriesArray = [];
  rl.on('line', function(line) {
    let parsed = JSON.parse(line);
    if(parsed.onlyInWikiSize != 0){
      entriesArray.push(parsed);
    }
  });

  rl.on('close', () => {

    let missingProp = 0, diffPropValue = 0, otherPropUsage = 0, onlyInWiki = 0;

    entriesArray.forEach(item => {
      missingProp = missingProp + item.missingPropSize;
      diffPropValue = diffPropValue + item.diffPropValueSize;
      otherPropUsage = otherPropUsage + item.otherPropUsageSize;
      onlyInWiki = onlyInWiki + item.onlyInWikiSize;
    });

    let dataset = [(missingProp/onlyInWiki)*100, (diffPropValue/onlyInWiki)*100, (otherPropUsage/onlyInWiki)*100];

    let htmlBar = `
  <head>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  </head>

  <body>
  <canvas id="barChart"></canvas>
  <script>
  var ctx = document.getElementById('barChart').getContext('2d');

  var chart = new Chart(ctx, {
      // The type of chart we want to create
      type: 'bar',

      // The data for our dataset
      data: {
          labels: ["missingProp", "diffPropValue", "otherPropUsage"],
          datasets: [{
              label: '%entities',
              backgroundColor: '${color}',
              borderColor: '${color}',
              data: ${JSON.stringify(dataset)}
          }]
      },

      // Configuration options go here
      options: {
        title: {
          display:true ,
          text: '%entities for each issue over wikipedia entities not found by SPARQL (for ${entriesArray.length} categories with Precision < 1)'
        },
        plugins: {
          legend: {
            display: true
          }
        },
          scales: {
              x: {
                  beginAtZero: true,
                  position: 'bottom',
                  title: {
                    text: '${xLabel}',
                    display:true
                  }
              },
              y: {
                  beginAtZero: true,
                  title: {
                    text: '${yLabel}',
                    display:true
                  },

              }
          }
      }
  });
  </script>
  </body>

  `;

    let htmlFile = Config.plotMetric+'issue-bar.html';
    fs.writeFileSync(htmlFile, htmlBar);

  });
}
