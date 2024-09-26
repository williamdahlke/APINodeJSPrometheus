import prom, { Histogram } from 'prom-client';
import { Gauge } from 'prom-client';
import { GaugeMetric, HistogramMetric } from '../models';

export const gaugeList: Gauge[] = [];
export const histogramList: prom.Histogram[] = [];

export const activeUsers = new prom.Gauge({
  name: 'gis_usuarios_ativos_total',
  help: 'Número de usuários ativos nos últimos 3 meses',
  labelNames: ['unity']
});

gaugeList.push(activeUsers);

export function addUpdateGauge(metric: GaugeMetric) {
  if (!getGaugeByName(metric.MetricName)){
    const tempGauge : Gauge = new Gauge({
      name: metric.MetricName,
      help: metric.Help,
      labelNames: metric.Label!.LabelNames
    });

    const labels = fillLabelsArray(metric.Label!.LabelNames, metric.Label!.LabelValues);    

    if (metric.Operation === 1){
      if (labels == undefined){
        tempGauge.inc();
      } else{
        tempGauge.inc(labels, 1);
      }      
    }     
    gaugeList.push(tempGauge);    
  } else{    
    const result = getGaugeByName(metric.MetricName);    

    if (result){
      const labels = fillLabelsArray(metric.Label!.LabelNames, metric.Label!.LabelValues);
      if (metric.Operation == 1){
        result.inc(labels, 1);
      } else{
        result.dec(labels, 1);
      }
    }    
  }  
}

function getGaugeByName(name: string): Gauge | undefined {
  return gaugeList.find(gaugeItem =>
    Object.values(gaugeItem).some(value => value === name)
  );
}

function fillLabelsArray(labelNames : string[], labelValues : string[]) {
    // Cria um objeto de labels baseado no array
    const labels = labelValues.reduce((acc, valor, index) => {
      acc[labelNames[index]] = valor; // label1, label2, etc.
      return acc;
  }, {} as Record<string, string>); 

  return labels;
}

export function addUpdateHistogram(metric : HistogramMetric){
  if (!getHistogramByName(metric.MetricName)){
    const tempHistogram : Histogram = new Histogram({
      name: metric.MetricName,
      help: metric.Help,
      labelNames: metric.Label!.LabelNames,
      buckets: metric.Buckets
    });

    const labels = fillLabelsArray(metric.Label!.LabelNames, metric.Label!.LabelValues); 

    tempHistogram.observe(labels, metric.ElapsedTimeMs);         
    histogramList.push(tempHistogram);    
  } else{    
    const result = getHistogramByName(metric.MetricName);    
    if (result){
      const labels = fillLabelsArray(metric.Label!.LabelNames, metric.Label!.LabelValues);
      result.observe(labels, metric.ElapsedTimeMs);      
    }    
  }  
}

function getHistogramByName(name: string): Histogram | undefined {
  return histogramList.find(histogramItem =>
    Object.values(histogramItem).some(value => value === name)
  );
}
