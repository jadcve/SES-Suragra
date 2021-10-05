const AWS = require('aws-sdk');
// Set the region 
const REGION = "us-west-2"; //e.g. "us-east-1"
AWS.config.update({region: REGION});


const sql = require('mssql');
const s = require('underscore.string');
const formatNumber = require('simple-format-number');
const moment = require('moment');
const async_lib = require('async');

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
let mandar = 1;
let alttest=2;

const buscarTemplate = async () => {
    await poolConnect;
    
    try{
        const consulta = 'select * from TA_SGRA_ALRTA_FLUJO_CNTBL';
        let resultado = await pool.request().query(consulta);
        template = resultado.recordset[1].GLS_DET_ALT;
        asunto = resultado.recordset[1].GLS_ALT;

        comenzar();
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
            if (row.COD_CNP == "NMOR") {
                clientesSap();
            }
        });
    } catch(err) {
        console.log(err);
    }
}

const clientesSap = async () => {
    await poolConnect;
    
    try {
        let request = await pool.request();
        request.stream = true;
        request.execute('SP_SGR_CNA_CLT_ALT_AMZ_NETP');
        request.on('row', function(row) {
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
                log(contacto, row.COD_CTC, 2, "EMAIL NO DEFINIDO");
            } else {
                registrosContacto(contacto, row);
            }
        });

        request.on('done', function(returnValue) {
            if (request.parameters.CAN_CTC.value == 0) {
                log(contacto, 0, 3, "NO EXISTEN CONTACTOS PARA NOTIFICAR");
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
    
        request.execute('SP_SGR_CNA_STC_CMR_IVA_PND', function(err, recordsets, returnValue, affected) {
            email(contacto, datosContacto, recordsets);
        });
    } catch(err) {
        console.log(err);
    }
}

const log = async (contacto, ctc, codigo, error) => {
    await poolConnect;
    
    try {
        let request = await pool.request();

        request.stream = false; 
        request.input('COD_IDT_SAP', sql.VarChar, contacto.COD_IDT_SAP);
        request.input('COD_IDT_CTC', sql.VarChar, ctc);
        request.input('FLG_EML_ENV', sql.Int, codigo);
        request.input('COD_CNP', sql.VarChar, "NMOR");
        request.input('GLS_ERR', sql.VarChar, error);
        request.execute('SP_SGR_INS_TRZ_ALT', function(err, recordsets, returnValue, affected) {
        });
    } catch(err) {
        console.log(err);
    }
}

// Parámetros pre-email
const cuenta = "Cobranza Suragra <cobranza@suragra.com>";
let l = 0;
let params = null;

const email = async (contacto, datosContacto, datosFactura) => {
    l = l + 1;

    let emailSend="";
    
    if (alttest == 1){
        emailSend = datosContacto.GLS_EML;
    }
    else{
        emailSend = "jadcve@gmail.com";
    }

    try {
        let recipient_address = emailSend;
        let recipient_address2 = "aracelli@suragra.com";
        let recipient_address3 = "marcoantonio@suragra.com";
        let recipient_address4 = "cinthia@suragra.com";
        let recipient_address5 = "priscilla@suragra.com";
        let recipient_address6 = "jadcve@gmail.com";
        let sender_address = cuenta;

        let temp = template;

        temp = temp.replace("&lt;&lt;CLIENTE&gt;&gt;", "<b>" + s.trim(contacto.NOM_CLT_SAP) + "</b>");
        temp = temp.replace("&lt;&lt;MES&gt;&gt;", "<b>" + s.capitalize(moment().subtract(10, 'days').locale('es').format('MMMM')) + " " + moment().locale('es').format('YYYY') + "</b>");

        let detalleFactura = "";
        let detalleCredito = "";

        detalleFactura = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><title>SurAgra</title><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head><body style="margin: 0; padding: 0;">';
        detalleFactura = detalleFactura + "<p><br><b>Facturacion Moneda Extranjera</b></p>";
        detalleFactura = detalleFactura + "<table cellspacing='0' cellpadding='0' width='100%'>";
        detalleFactura = detalleFactura + "<tr>";
        detalleFactura = detalleFactura + "<td width='79'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Documento</span></span></td>";
        detalleFactura = detalleFactura + "<td width='80'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Fecha Emision</span></span></td>";
        detalleFactura = detalleFactura + "<td width='80'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Fecha Vencimiento</span></span></td>";
        detalleFactura = detalleFactura + "<td width='70'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Dias de Mora</span></span></td>";
        detalleFactura = detalleFactura + "<td width='200' nowrap='nowrap'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>NETO Pendiente</span></span></td>";
        detalleFactura = detalleFactura + "</tr>";

        let totalNeto = 0;
        let contFac = 0;

        let totalNeto2 = 0;
        let contFac2 = 0;

        let totalNetoFinal=0;
        let codmon="";

        async_lib.each(datosFactura, function(value, callback) {
            for (let i = 0; i < value.length; i++) {
                codmon = value.COD_MON;

                if (value.FLG_TPO_REG == "NP" && value.COD_MON == "USD") {
                    contFac = contFac + 1;
                    totalNeto = totalNeto + (value.IMP_TOT_PEN);                                                   

                    detalleFactura = detalleFactura + "<tr>";
                    detalleFactura = detalleFactura + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value.NUM_FOL + "</span></span></td>";
                    detalleFactura = detalleFactura + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value.FEC_EMI + "</span></span></td>";
                    detalleFactura = detalleFactura + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value.FEC_VEN + "</span></span></td>";
                    detalleFactura = detalleFactura + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value.CAN_DIA_MOR + "</span></span></td>";
                    detalleFactura = detalleFactura + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value.IMP_SDO_PEN_EML + "</span></span></td>";
                    detalleFactura = detalleFactura + "</tr>";
                }

                if (value.FLG_TPO_REG == "NP" && value.COD_MON == "CLP") {
                    contFac2 = contFac2 + 1;
                    totalNeto2 = totalNeto2 + (value.IMP_TOT_PEN);                       

                    detalleCredito = detalleCredito + "<tr>";
                    detalleCredito = detalleCredito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value.NUM_FOL + "</span></span></td>";
                    detalleCredito = detalleCredito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value.FEC_EMI + "</span></span></td>";
                    detalleCredito = detalleCredito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value.FEC_VEN + "</span></span></td>";
                    detalleCredito = detalleCredito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value.CAN_DIA_MOR + "</span></span></td>";
                    detalleCredito = detalleCredito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value.IMP_TOT_PEN, {
                        fractionDigits: 0,
                        symbols: {
                            decimal: '.',
                            grouping: '.'
                        }
                    }) + "</span></span></td>";
                    detalleCredito = detalleCredito + "</tr>";
                }
            }
            totalNetoFinal = totalNeto + totalNeto2;
            callback();
        },
        function(err) {
            if (contFac > 0) {
                detalleFactura = detalleFactura + "<tr>";
                detalleFactura = detalleFactura + "<td width='79'>&nbsp;" + "</td>";
                detalleFactura = detalleFactura + "<td width='80'>&nbsp;" + "</td>";
                detalleFactura = detalleFactura + "<td width='80'>&nbsp;" + "</td>";
                detalleFactura = detalleFactura + "<td width='70'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>Total:" + "</b></span></span></td>";
                detalleFactura = detalleFactura + "<td width='200'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>"+ codmon + " " + formatNumber(totalNeto, {
                    fractionDigits: 2,
                    symbols: {
                        decimal: ',',
                        grouping: '.'
                    }
                }) + "</b></span></span></td>";
                detalleFactura = detalleFactura + "</tr>";
                detalleFactura = detalleFactura + "</table>";
                detalleFactura = detalleFactura + "<p><br></p>";                                            
            } else {
                detalleFactura = detalleFactura + "</table>";
                detalleFactura = detalleFactura + "<p>No existen documentos con NETO pendiente asociados a facturas con moneda extranjera</p>";
            }

            detalleFactura = detalleFactura + "<br><p><b>Facturacion  Moneda Local</b></p>";
            detalleFactura = detalleFactura + "<table cellspacing='0' cellpadding='0' width='100%'>";
            detalleFactura = detalleFactura + "<tr>";
            detalleFactura = detalleFactura + "<td width='79'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Documento</span></span></td>";
            detalleFactura = detalleFactura + "<td width='80'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Fecha Emision</span></span></td>";
            detalleFactura = detalleFactura + "<td width='80'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Fecha Vencimiento</span></span></td>";
            detalleFactura = detalleFactura + "<td width='70'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Dias de Mora</span></span></td>";
            detalleFactura = detalleFactura + "<td width='200' nowrap='nowrap'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>NETO Pendiente</span></span></td>";
            detalleFactura = detalleFactura + "</tr>";

            if (contFac2 > 0) {
                detalleFactura = detalleFactura + detalleCredito;
                detalleFactura = detalleFactura + "<td width='79'>&nbsp;" + "</td>";
                detalleFactura = detalleFactura + "<td width='80'>&nbsp;" + "</td>";
                detalleFactura = detalleFactura + "<td width='80'>&nbsp;" + "</td>";
                detalleFactura = detalleFactura + "<td width='70'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>Total:" + "</b></span></span></td>";
                detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>CLP "  + formatNumber(totalNeto2, {
                    fractionDigits: 0,
                    symbols: {
                        decimal: '.',
                        grouping: '.'
                    }
                }) + "</b></span></span></td>";
                detalleFactura = detalleFactura + "</tr>";
                detalleFactura = detalleFactura + "</table>";
                detalleFactura = detalleFactura + "<p><br></p>";                                                 
            } else {
                detalleFactura = detalleFactura + "</table>";
                detalleFactura = detalleFactura + "<p>No existen documentos con NETO pendiente asociados a facturas con moneda local</p>";
            }

            temp = temp.replace('&lt;TOTALUSD&gt;', formatNumber(totalNeto, {
                                                                                fractionDigits: 2,
                                                                                symbols: {
                                                                                    decimal: ',',
                                                                                    grouping: '.'
                                                                                }
                                                                            }));
            temp = temp.replace('&lt;TOTALCLP&gt;', formatNumber(totalNeto2, {
                                                                                fractionDigits: 0,
                                                                                symbols: {
                                                                                    decimal: '.',
                                                                                    grouping: '.'
                                                                                }
                                                                            }));
            temp = temp.replace('&lt;FACTURAS&gt;', detalleFactura);
            
            if (alttest == 1){
                params = {
                    Destination: { /* required */
                        CcAddresses: [
                        ],
                        ToAddresses: [
                            recipient_address,
                            recipient_address2,
                            recipient_address3,
                            recipient_address4,
                            recipient_address5,
                            recipient_address6,
                        ]
                    },
                    Message: { /* required */
                        Body: { /* required */
                            Html: {
                                Charset: "UTF-8",
                                Data: temp
                            },
                            Text: {
                                Charset: "UTF-8",
                                Data: ''
                            }
                        },
                        Subject: {
                            Charset: 'UTF-8',
                            Data: asunto + " SURAGRA"
                        }
                    },
                    Source: sender_address, /* required */
                    ReplyToAddresses: [
                        sender_address
                        /* more items */
                    ],
                };
            }
            else{
                params = {
                    Destination: { /* required */
                        CcAddresses: [
                        ],
                        ToAddresses: [
                            recipient_address,
                        ]
                    },
                    Message: { /* required */
                        Body: { /* required */
                            Html: {
                                Charset: "UTF-8",
                                Data: temp
                            },
                            Text: {
                                Charset: "UTF-8",
                                Data: ''
                            }
                        },
                        Subject: {
                            Charset: 'UTF-8',
                            Data: asunto + " SURAGRA"
                        }
                    },
                    Source: sender_address, /* required */
                    ReplyToAddresses: [
                        sender_address
                        /* more items */
                    ],
                };                   
            }                                

            if (mandar == 1) {
                // Create the promise and SES service object
                let sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();

                // Handle promise's fulfilled/rejected states
                sendPromise
                    .then(
                        function(data) {
                            console.log(data.MessageId);
                            log(contacto, datosContacto.COD_CTC, 0, "EJECUTADO EXITOSAMENTE");
                        })
                    .catch(
                        function(err) {
                            console.error(err, err.stack);
                            log(contacto, datosContacto.COD_CTC, 1, err);
                    });
            }
        });
    } catch (err) {
        log(contacto, datosContacto.COD_CTC, 1, err);
    }
}

buscarTemplate();