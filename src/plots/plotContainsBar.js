import Config     from './../config/config' ;
import readline   from 'readline';
import fs         from 'fs';
import mkdirp     from 'mkdirp';


/**
 * Distribution of "contains" property issues over categories
 * @param     {String}          color     color bars
 * @param     {String}          fileName  source of metrics
 * @param     {String}          xLabel    label of x axis
 * @param     {String}          yLabel    label of y axis
 */

export default function plotContainsBar(color , fileName ,xLabel, yLabel){

  mkdirp.sync(Config.plotMetric);

  const rl = readline.createInterface({
    input: fs.createReadStream( fileName ),
  });

  let entriesArray = [];
  rl.on('line', function(line) {
    entriesArray.push(JSON.parse(line));
  });

  rl.on('close', () => {

    let missingProp = 0, diffPropValue = 0, otherPropUsage = 0 ;

    entriesArray.forEach(item => {
      if(item.containsMatch == 'missingProp'){
        missingProp ++;
      }
      if(item.containsMatch == 'diffPropValue'){
        diffPropValue ++;
      }
      if(item.containsMatch == 'otherPropUsage'){
        otherPropUsage ++;
      }
    });

    let dataset = [missingProp, diffPropValue, otherPropUsage];

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
              label: '#categories',
              backgroundColor: '${color}',
              borderColor: '${color}',
              data: ${JSON.stringify(dataset)}
          }]
      },

      // Configuration options go here
      options: {
        title: {
          display:true ,
          text: 'Distribution of "contains" property issues over categories'
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

    let htmlFile = Config.plotMetric+'issue-contains-bar.html';
    fs.writeFileSync(htmlFile, htmlBar);

  });
}
