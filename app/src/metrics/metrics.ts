import prom from 'prom-client';

export const instanciasAtivas = new prom.Gauge({
  name: 'gis_usuarios_online_total',
  help: 'Número de usuários logados no momento',
  labelNames: ['unity']
});

export const tempoSalvarProjeto = new prom.Histogram({
  name: 'gis_tempo_salvarproj_segundos',
  help: 'Tempo em segundos que o gis levou para salvar o projeto',
  buckets: [100, 300, 500, 800, 1000, 3000, 5000, 8000]
});

const calculaMinutosToMs = (arr: number[]) => arr.map(num => num * 60000);
const arrayTempoGerarProj = calculaMinutosToMs([15, 20, 25, 30, 35, 40, 45, 50, 55, 60]);

export const tempoGerarProjeto = new prom.Histogram({
  name: 'cm_tempo_gerarproj_minutos',
  help: 'Tempo em minutos que o CM leva para gerar o projeto',
  buckets: arrayTempoGerarProj
});

export const tempoOperacoesSap = new prom.Histogram({
  name: 'gis_tempo_op_sap_segundos',
  help: 'Tempo em segundos que o GIS levou para realizar as integrações com o SAP',
  buckets: [100, 300, 500, 800, 1000, 3000, 5000, 8000, 10000],
  labelNames: ['operacao']
});

export const usuariosAtivosGauge = new prom.Gauge({
  name: 'gis_usuarios_ativos_total',
  help: 'Número de usuários ativos nos últimos 3 meses',
  labelNames: ['unity']
});
