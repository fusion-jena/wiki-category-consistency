import plotContainsBar                  from './../plots/plotContainsBar';
import plotMetricFrequencyBinned        from './../plots/plotMetricFrequencyBinned';
import plotIssueScatter                 from './../plots/plotIssueScatter';
import plotIssueBar                     from './../plots/plotIssueBar';
import Config                           from './../config/config';


(async function(){

  console.log('Generating Plots . . .');
  plotMetricFrequencyBinned('Precision', 'blue',1,0.1, Config.eval + 'compare.json', 'Precision', '#categories', 'x', 100);
  plotMetricFrequencyBinned('Recall', 'green',1,0.1, Config.eval + 'compare.json', 'Recall', '#categories', 'x', 100);
  plotContainsBar('blue', Config.eval +  'compare.json', 'Issue Types','#categories');
  plotIssueBar('green' , Config.eval +  'compare.json' , 'Issue types', '%entities');
  //plotIssueScatter('missingPropSize', 'black' , Config.eval +  'compare.json' , '#wikipedia entities not found by SPARQL ', '%entities with issue', 'linear');
  //plotIssueScatter('diffPropValueSize', 'black' , Config.eval +  'compare.json' , '#wikipedia entities not found by SPARQL ', '%entities with issue', 'linear');
  //plotIssueScatter('otherPropUsageSize', 'black' , Config.eval +  'compare.json' , '#wikipedia entities not found by SPARQL ', '%entities with issue', 'linear');
  plotIssueScatter('missingPropSize', 'black' , Config.eval +  'compare.json' , '#wikipedia entities not found by SPARQL ', '%entities with issue', 'log');
  plotIssueScatter('diffPropValueSize', 'black' , Config.eval +  'compare.json' , '#wikipedia entities not found by SPARQL ', '%entities with issue', 'log');
  plotIssueScatter('otherPropUsageSize', 'black' , Config.eval +  'compare.json' , '#wikipedia entities not found by SPARQL ', '%entities with issue', 'log');
})();
