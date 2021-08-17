
const sql = require('mssql');

const sqlConfig = {
  user: 'usr_cna2',
  password: 'usr_cna2',
  database: 'bd_sgra',
  server: '34.227.19.226',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true, // for azure
    trustServerCertificate: true // change to true for local dev / self-signed certs
  }
}

const pool = new sql.ConnectionPool(sqlConfig);
const poolConnect = pool.connect();

let template;
var asunto;

async function buscarTemplate() {
    await poolConnect;

    try{
        const consulta = 'select * from TA_SGRA_ALRTA_FLUJO_CNTBL';
        let resultado = await pool.request().query(consulta);
        template = resultado.recordset[2].GLS_DET_ALT;
        asunto = resultado.recordset[2].GLS_ALT;

        resultados = {
            template,
            asunto
        }
  
        return resultados;
        

    }catch(err){
        console.log(err);
    }
}

buscarTemplate()
    .then(resultados => console.log(resultados.asunto));