let express = require('express');
let prom = require('prom-client');
let register = prom.register;
let app = express();

app.use(express.json());

const usuariosOnline = new prom.Gauge({ 
    name: 'gis_usuarios_online_total', 
    help: 'Número de usuários logados no momento' });
 
app.get('/', function(req, res){    
    res.send('API online');    
})

app.get('/metrics', async function(req,res){
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
})

app.post('/metrics/insert', function(req, res) {
    const incrementValue = req.body.value;
    if (typeof incrementValue === 'number') {
        usuariosOnline.inc(incrementValue);
        res.status(200).send(`Incremented by ${incrementValue}`);
    } else {
        res.status(400).send('Invalid value');
    }
});

app.listen(3031);