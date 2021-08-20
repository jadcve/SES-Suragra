
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
let asunto;

const buscarTemplate = async () => {
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

        comenzar();

        return resultados;
    }catch(err){
        console.log(err);
    }
}

const comenzar = async () => {
    await poolConnect;

    try {
        let request = await pool.request();
        request.stream = true;
        request.execute('SP_SGR_CNA_ALT_CTB_AMZ');

        request.on('row', function(row) {
            if (row.COD_CNP == "IMOR") {
                console.log(row.COD_CNP);
                // clientesSap();
            }
        });

        //console.log(request)

      //  return resultados;
    } catch(err) {
        console.log(err);
    }
}

const clientesSap = async () => {
    await poolConnect;
    
    try {
        let request = await pool.request();
        request.stream = true;
        request.execute('SP_SGR_CNA_CLT_ALT_AMZ_IVAP');
        request.on('row', function(row) {
            console.log(row);
            contactosSap(row);
        });
    } catch(err) {
        console.log(err);
    }   
}

const contactosSap = async (contacto) => {
    await poolConnect;
    
    try {
        let request = await pool.request();
        request.stream = true;
        request.input('COD_IDT_SAP', sql.VarChar, contacto.COD_IDT_SAP);
        request.output('CAN_CTC', sql.Int);
        request.execute('SP_SGR_CNA_CTC_CLT_SAP');
        request.on('row', function(row) {
            if (row.GLS_EML == "NO DEFINIDO") {
                console.log(row.GLS_EML);
                // Log(contacto, row.COD_CTC, 2, "EMAIL NO DEFINIDO");
            } else {
                console.log(row.GLS_EML);
                // RegistrosContacto(contacto, row);
            }
        });

        request.on('done', function(returnValue) {
            if (request.parameters.CAN_CTC.value == 0) {
                // Log(contacto, 0, 3, "NO EXISTEN CONTACTOS PARA NOTIFICAR");
                console.log(request.parameters.CAN_CTC.value);
            };
        });
    } catch(err) {
        console.log(err);
    }
}

const registrosContacto = async (contacto, datosContacto) => {
    await poolConnect;
    
    try {
        let request = await pool.request();

        request.stream = false;        
        request.input('COD_IDT_SAP', sql.VarChar, contacto.COD_IDT_SAP);
        console.log("Aquí estaría enviando el correo. Saludos Alain");         
        // request.execute('SP_SGR_CNA_STC_CMR_IVA_PND', function(err, recordsets, returnValue, affected) {
        //     Email(contacto, datosContacto, recordsets[0]);
        // });
    } catch(err) {
        console.log(err);
    }
}


// buscarTemplate()
//     .then(resultados => {

//     });
// comenzar();
clientesSap();
//contactosSap();
registrosContacto();


