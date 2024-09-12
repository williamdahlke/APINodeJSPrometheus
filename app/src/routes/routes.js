const express = require('express');
const router = express.Router();
let prom = require('prom-client');
let register = prom.register;

const usuariosOnline = new prom.Gauge({
    name: 'gis_usuarios_online_total',
    help: 'Número de usuários logados no momento',
    labelNames: ['unity']
});

const tempoSalvarProjeto = new prom.Histogram({
    name: 'gis_tempo_salvarproj_segundos',
    help: 'Tempo em segundos que o gis levou para salvar o projeto',
    buckets: [100, 300, 500, 800, 1000, 3000, 5000, 8000]
});

const calculaMinutosToMs = (arr) => arr.map(num=> num * 60000);
const arrayTempoGerarProj = calculaMinutosToMs([15, 20, 25, 30, 35, 40, 45, 50, 55, 60]);

const tempoGerarProjeto = new prom.Histogram({
    name: 'cm_tempo_gerarproj_minutos',
    help: 'Tempo em minutos que o CM leva para gerar o projeto',
    buckets: arrayTempoGerarProj
});

const tempoOperacoesSap = new prom.Histogram({
    name: 'gis_tempo_op_sap_segundos',
    help: 'Tempo em segundos que o GIS levou para realizar as integrações com o SAP',
    buckets: [100, 300, 500, 800, 1000, 3000, 5000, 8000, 10000],
    labelNames: ['operacao']
})

/**
 * @swagger
 * components:
 *     Metric:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the metric
 *         value:
 *           type: number
 *           description: The value of the metric
 *       example:
 *         name: gis_usuarios_online_total
 *         value: 5
 */

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Retrieve a list of metrics
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: A list of metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/Metric'
 */

router.get('/metrics', async function (req, res) {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
})

/**
 * @swagger
 * /api/metrics/insert:
 *   post:
 *     summary: Insert a new metric value
 *     tags: [Metrics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: number
 *                 description: The value to increment the metric by
 *             example:
 *               value: 1
 *     responses:
 *       200:
 *         description: Metric incremented successfully
 *       400:
 *         description: Invalid value
 */
router.post('/metrics/insert', function (req, res) {
    if (isValidJson(req.body)){        
        res.status(400).send("JSON is not valid.");
    }
    
    const metricType = req.body.Type;
    switch (metricType){
        case 2:
            setGaugeValue(req.body);
            break;
        case 3:
            setHistogramValue(req.body);
            break;
        default:
            res.status(400).send("Metric type isn't registered.");
    }
    res.status(200).send();
});

function setGaugeValue(requestBody){
    const labelsBody = requestBody.Labels;
    if (requestBody.MetricName == "gis_usuarios_online_total"){
        if (requestBody.Operation == 1){
            usuariosOnline.labels(labelsBody[0]).inc();
        } 
        else if (requestBody.Operation == 2){
            usuariosOnline.labels(labelsBody[0]).dec();
        }
    }
}

function setHistogramValue(requestBody){
    const labelsBody = requestBody.Labels;
    
    switch(requestBody.MetricName){
        case "gis_tempo_salvarproj_segundos":
            tempoSalvarProjeto.observe(requestBody.ElapsedTimeMs);
            break;
        case "cm_tempo_gerarproj_minutos":
            tempoGerarProjeto.observe(requestBody.ElapsedTimeMs);
            break;
        case "gis_tempo_op_sap_segundos":
            tempoOperacoesSap.labels(labelsBody[0]).observe(requestBody.ElapsedTimeMs);
            break;
        default:
            break;
    }
}

function isValidJson(jsonString) {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (e) {
      return false;
    }
  }
  
module.exports = router;