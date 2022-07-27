import Config     from './../config/config' ;
import readline   from 'readline';
import fs         from 'fs';
import mkdirp     from 'mkdirp';


/**
 * Distribution of #(wikipedia entities not found by SPARQL) and %entities having one issue (each point represents a category)
 * @param     {String}          metric    name of metric
 * @param     {String}          color     color bars
 * @param     {String}          fileName  source of metrics
 * @param     {String}          xLabel    label of x axis
 * @param     {String}          yLabel    label of y axis
 * @param     {String}          xScale    scale of x axis log or linear
 */

export default function plotIssueScatter(metric, color , fileName ,xLabel, yLabel, xScale){

  mkdirp.sync(Config.plotMetric);

  const rl = readline.createInterface({
    input: fs.createReadStream( fileName ),
  });

  let dataset = [], entriesArray = [];
  rl.on('line', function(line) {
    let parsed = JSON.parse(line);
    if(parsed.onlyInWikiSize != 0){
      entriesArray.push(parsed);
    }
  });

  rl.on('close', () => {

    entriesArray.forEach((item) => {
      let x = item.onlyInWikiSize;
      if (xScale == 'log'){
        x = Math.log10(item.onlyInWikiSize);
      }

      let entry = {x:x, y:(item[metric]/item.onlyInWikiSize)*100};
      dataset.push(entry);
    });

    let htmlScatter = `
<head>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.min.js"></script>
</head>

<body>
<canvas id="ScatterChart"></canvas>
<script>
var ctx = document.getElementById('ScatterChart').getContext('2d');

var chart = new Chart(ctx, {
    // The type of chart we want to create
    type: 'scatter',

    // The data for our dataset
    data: {
        datasets: [{
            label: 'category',
            backgroundColor: '${color}',
            borderColor: '${color}',
            pointRadius: 1,
            data: ${JSON.stringify(dataset)}
        }]
    },

    // Configuration options go here
    options: {
      title: {
        display:true ,
        text: 'Distribution of #(wikipedia entities not found by SPARQL) and %entities for the issue ${metric} (each point represents a category: ${entriesArray.length} categories with Precision < 1)'
      },
      plugins: {
        legend: {
          display: false
        }
      },
        scales: {
          xAxes: [{
    type:'linear',
    position: 'bottom',
    ticks: {
      userCallback: function(label, index, labels) {
        return Math.pow(10,label).toLocaleString();
      }
    },
    scaleLabel: {
      display: true,
      labelString: '${xLabel}'
           }
  }],
  yAxes: [{
    scaleLabel: {
      display: true,
      labelString: '${yLabel}'
           }

  }]


        }
    }
});
</script>
</body>

`;

    let htmlFile = Config.plotMetric+`issue-scatter-${metric}-${xScale}.html`;

    fs.writeFileSync(htmlFile, htmlScatter);

  });
}
