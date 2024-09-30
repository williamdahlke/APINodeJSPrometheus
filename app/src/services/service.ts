import prom, { Histogram, Gauge } from 'prom-client';
import { GaugeMetric, HistogramMetric, Metric, WegUser } from '../models';
import { GroupedUsers } from '../interfaces';

export const register = prom.register;
export const gaugeList: Gauge[] = [];
export const histogramList: Histogram[] = [];

export const activeUsers = new Gauge({
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

let activeUsersArray: WegUser[] = [];

export function setActiveUserGaugeMetric(metric: Metric) {
    const selectedUser = activeUsersArray.find(x => x.Name == metric.User!.Name && x.Unity == metric.User!.Unity);
    if (selectedUser == undefined) activeUsersArray.push(metric.User!);
  
    filterActiveUsersByTime();
    let groupedUsersArray = groupActiveUsersByUnity();
    setActiveUsersMetricValue(groupedUsersArray);
  }

  function filterActiveUsersByTime() {
    let filtroData = new Date();
    filtroData.setDate(filtroData.getDate() - 90);
    activeUsersArray = activeUsersArray.filter((x) => x.LastOpened >= filtroData.getTime());
  }
  
  function groupActiveUsersByUnity() {
    let groupedUsers = groupByUnity(activeUsersArray);
    let groupedUsersArray = Object.values(groupedUsers);
    return groupedUsersArray;
  }
  
  // Função para agrupar usuários pela propriedade 'unity' e contar o total de usuários por unidade
  function groupByUnity(users: WegUser[]): GroupedUsers {
    return users.reduce((groups: GroupedUsers, user: WegUser) => {
        const unity = user.Unity;
        if (!groups[unity]) {
            groups[unity] = { unity: unity, totalUsers: 0 };
        }
        groups[unity].totalUsers++;
        return groups;
    }, {});
  }
  
  function setActiveUsersMetricValue(groupedUsersArray: { unity: string; totalUsers: number; }[]) {
    activeUsers.reset();
    groupedUsersArray.forEach((item) => {
      activeUsers.labels(item.unity).inc(item.totalUsers);
    });
  }
