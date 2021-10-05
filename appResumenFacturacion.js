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
        template = resultado.recordset[0].GLS_DET_ALT;
        asunto = resultado.recordset[0].GLS_ALT;

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
            if (row.COD_CNP == "RFAC") {
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
        request.execute('SP_SGR_CNA_CLT_ALT_AMZ');
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
    
        request.execute('SP_SGR_CNA_STC_CMR_RSM_FAC', function(err, recordsets, returnValue, affected) {
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
const cuenta = "Reportes <reportes@suragra.com>";
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
        let detalleFacturaLocal = "";
        let detalleCredito = "";
        let detalleCreditoLocal ="";
        let detalleDebito = "";
        let detalleDebitoLocal="";

        detalleFactura = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><title>SurAgra</title><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head><body style="margin: 0; padding: 0;">';
        detalleFactura = detalleFactura + "<p><br><b>Facturas Moneda Extranjera</b></p>";
        detalleFactura = detalleFactura + "<table cellspacing='0' cellpadding='0' width='100%'>";
        detalleFactura = detalleFactura + "<tr>";
        detalleFactura = detalleFactura + "<td width='79'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Documento</span></span></td>";
        detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Fecha Emision</span></span></td>";
        detalleFactura = detalleFactura + "<td width='100' nowrap='nowrap'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>IVA</span></span></td>";
        detalleFactura = detalleFactura + "<td width='100' nowrap='nowrap'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>NETO</span></span></td>";
        detalleFactura = detalleFactura + "</tr>";

        let totalNeto = 0;
        let totalIva = 0;
        let totalNetoLocal = 0;
        let totalIvaLocal= 0;
        let contFac = 0;
        let contFacLocal = 0;

        let totalNeto2 = 0;
        let totalIva2 = 0;
        let totalNeto2Local = 0;
        let totalIva2Local = 0;        
        let contFac2 = 0;
        let contFac2Local= 0;

        let totalNeto3 = 0;
        let totalIva3 = 0;
        let totalNeto3Local = 0;
        let totalIva3Local = 0;        
        let contFac3 = 0;
        let contFac3Local = 0;

        let totalIvaFinal = 0;
        let totalNetoFinal = 0;
        let totalNetoFinalCLP = 0;

        let codmon="";

        async_lib.each(datosFactura, function(value, callback) {
            if (Array.isArray(value[0])) {
                for (let i = 0; i < value[0].length; i++) {
                    codmon = value[0][i].COD_MON;
                    if (value[0][i].FLG_TPO_DOC_CTB == "FAC" && value[0][i].COD_MON == "USD") {
                        contFac = contFac + 1;
                        totalIva = totalIva + (value[0][i].IMP_IVA_DOC);
                        totalNeto = totalNeto + (value[0][i].IMP_TOT_NTO);
    
                        detalleFactura = detalleFactura + "<tr>";
                        detalleFactura = detalleFactura + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[0][i].NUM_FOL + "</span></span></td>";
                        detalleFactura = detalleFactura + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[0][i].FEC_EMI + "</span></span></td>";
                        detalleFactura = detalleFactura + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[0][i].IMP_IVA_DOC, {
                            fractionDigits: 0,
                            symbols: {
                                decimal: '.',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";
                        detalleFactura = detalleFactura + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[0][i].IMP_TOT_NTO, {
                            fractionDigits: 2,
                            symbols: {
                                decimal: ',',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";                    
                        detalleFactura = detalleFactura + "</tr>";  
                    }

                    if (value[0][i].COD_MON == "CLP" && value[0][i].FLG_TPO_DOC_CTB == "FAC") {   
                        contFacLocal = contFacLocal + 1;
                        totalIvaLocal = totalIvaLocal + (value[0][i].IMP_IVA_DOC);
                        totalNetoLocal = totalNetoLocal + (value[0][i].IMP_TOT_NTO);                                                   
    
                        detalleFacturaLocal = detalleFacturaLocal + "<tr>";
                        detalleFacturaLocal = detalleFacturaLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[0][i].NUM_FOL + "</span></span></td>";
                        detalleFacturaLocal = detalleFacturaLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[0][i].FEC_EMI + "</span></span></td>";
                        detalleFacturaLocal = detalleFacturaLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[0][i].IMP_IVA_DOC, {
                            fractionDigits: 0,
                            symbols: {
                                decimal: '.',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";
                        detalleFacturaLocal = detalleFacturaLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[0][i].IMP_TOT_NTO, {
                            fractionDigits: 0,
                            symbols: {
                                decimal: '.',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";                    
                        detalleFacturaLocal = detalleFacturaLocal + "</tr>";                
                    }            
                    
                    if (value[0][i].COD_MON == "USD" && value[0][i].FLG_TPO_DOC_CTB == "NCR") {
                        contFac2 = contFac2 + 1;
                        totalIva2 = totalIva2 + (value[0][i].IMP_IVA_DOC);
                        totalNeto2 = totalNeto2 + (value[0][i].IMP_TOT_NTO);                                        
    
                        detalleCredito = detalleCredito + "<tr>";
                        detalleCredito = detalleCredito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[0][i].NUM_FOL + "</span></span></td>";
                        detalleCredito = detalleCredito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[0][i].FEC_EMI + "</span></span></td>";
                        detalleCredito = detalleCredito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[0][i].IMP_IVA_DOC, {
                            fractionDigits: 0,
                            symbols: {
                                decimal: '.',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";
                        detalleCredito = detalleCredito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[0][i].IMP_TOT_NTO, {
                            fractionDigits: 2,
                            symbols: {
                                decimal: ',',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";
                        detalleCredito = detalleCredito + "</tr>";
                    }
                    
                    if (value[0][i].COD_MON == "CLP" && value[0][i].FLG_TPO_DOC_CTB == "NCR") {
                        contFac2Local = contFac2Local + 1;
                        totalIva2Local = totalIva2Local + (value[0][i].IMP_IVA_DOC);
                        totalNeto2Local = totalNeto2Local + (value[0][i].IMP_TOT_NTO);                                        
    
                        detalleCreditoLocal = detalleCreditoLocal + "<tr>";
                        detalleCreditoLocal = detalleCreditoLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[0][i].NUM_FOL + "</span></span></td>";
                        detalleCreditoLocal = detalleCreditoLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[0][i].FEC_EMI + "</span></span></td>";
                        detalleCreditoLocal = detalleCreditoLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[0][i].IMP_IVA_DOC, {
                            fractionDigits: 0,
                            symbols: {
                                decimal: '.',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";
                        detalleCreditoLocal = detalleCreditoLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[0][i].IMP_TOT_NTO, {
                            fractionDigits: 0,
                            symbols: {
                                decimal: ',',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";
                        detalleCreditoLocal = detalleCreditoLocal + "</tr>";
                    }   
                    
                    if (value[0][i].COD_MON == "USD" && value[0][i].FLG_TPO_DOC_CTB == "NDB") {
                        contFac3 = contFac3 + 1;
                        totalIva3 = totalIva3 + (value[0][i].IMP_IVA_DOC);
                        totalNeto3 = totalNeto3 + (value[0][i].IMP_TOT_NTO);
    
                        detalleDebito = detalleDebito + "<tr>";
                        detalleDebito = detalleDebito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[0][i].NUM_FOL + "</span></span></td>";
                        detalleDebito = detalleDebito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[0][i].FEC_EMI + "</span></span></td>";
                        detalleDebito = detalleDebito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[0][i].IMP_IVA_DOC, {
                            fractionDigits: 0,
                            symbols: {
                                decimal: '.',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";
                        detalleDebito = detalleDebito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[0][i].IMP_TOT_NTO, {
                            fractionDigits: 2,
                            symbols: {
                                decimal: ',',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";
                        detalleDebito = detalleDebito + "</tr>";                    
                    }  
                    
                    if (value[0][i].COD_MON == "CLP" && value[0][i].FLG_TPO_DOC_CTB == "NDB") {
                        contFac3Local = contFac3Local + 1;
                        totalIva3Local = totalIva3Local + (value[0][i].IMP_IVA_DOC);
                        totalNeto3Local = totalNeto3Local + (value[0][i].IMP_TOT_NTO);
    
                        detalleDebitoLocal = detalleDebitoLocal + "<tr>";
                        detalleDebitoLocal = detalleDebitoLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[0][i].NUM_FOL + "</span></span></td>";
                        detalleDebitoLocal = detalleDebitoLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[0][i].FEC_EMI + "</span></span></td>";
                        detalleDebitoLocal = detalleDebitoLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[0][i].IMP_IVA_DOC, {
                            fractionDigits: 0,
                            symbols: {
                                decimal: '.',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";
                        detalleDebitoLocal = detalleDebitoLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[0][i].IMP_TOT_NTO, {
                            fractionDigits: 0,
                            symbols: {
                                decimal: '.',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";
                        detalleDebitoLocal = detalleDebitoLocal + "</tr>";                    
                    }       
                }
            } else {
                for (let i = 0; i < value.length; i++) {
                    codmon = value[i].COD_MON;
    
                    if (value[i].FLG_TPO_DOC_CTB == "FAC" && value[i].COD_MON == "USD") {
                        contFac = contFac + 1;
                        totalIva = totalIva + (value[i].IMP_IVA_DOC);
                        totalNeto = totalNeto + (value[i].IMP_TOT_NTO);
    
                        detalleFactura = detalleFactura + "<tr>";
                        detalleFactura = detalleFactura + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[i].NUM_FOL + "</span></span></td>";
                        detalleFactura = detalleFactura + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[i].FEC_EMI + "</span></span></td>";
                        detalleFactura = detalleFactura + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[i].IMP_IVA_DOC, {
                            fractionDigits: 0,
                            symbols: {
                                decimal: '.',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";
                        detalleFactura = detalleFactura + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[i].IMP_TOT_NTO, {
                            fractionDigits: 2,
                            symbols: {
                                decimal: ',',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";                    
                        detalleFactura = detalleFactura + "</tr>";  
                    }
                    
                    if (value[i].COD_MON == "CLP" && value[i].FLG_TPO_DOC_CTB == "FAC") {    
                        contFacLocal = contFacLocal + 1;
                        totalIvaLocal = totalIvaLocal + (value[i].IMP_IVA_DOC);
                        totalNetoLocal = totalNetoLocal + (value[i].IMP_TOT_NTO);                                                   
    
                        detalleFacturaLocal = detalleFacturaLocal + "<tr>";
                        detalleFacturaLocal = detalleFacturaLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[i].NUM_FOL + "</span></span></td>";
                        detalleFacturaLocal = detalleFacturaLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[i].FEC_EMI + "</span></span></td>";
                        detalleFacturaLocal = detalleFacturaLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[i].IMP_IVA_DOC, {
                            fractionDigits: 0,
                            symbols: {
                                decimal: '.',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";
                        detalleFacturaLocal = detalleFacturaLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[i].IMP_TOT_NTO, {
                            fractionDigits: 0,
                            symbols: {
                                decimal: '.',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";                    
                        detalleFacturaLocal = detalleFacturaLocal + "</tr>";                
                    }            
                        
                    if (value[i].COD_MON == "USD" && value[i].FLG_TPO_DOC_CTB == "NCR") {
                        contFac2 = contFac2 + 1;
                        totalIva2 = totalIva2 + (value[i].IMP_IVA_DOC);
                        totalNeto2 = totalNeto2 + (value[i].IMP_TOT_NTO);                                        
    
                        detalleCredito = detalleCredito + "<tr>";
                        detalleCredito = detalleCredito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[i].NUM_FOL + "</span></span></td>";
                        detalleCredito = detalleCredito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[i].FEC_EMI + "</span></span></td>";
                        detalleCredito = detalleCredito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[i].IMP_IVA_DOC, {
                            fractionDigits: 0,
                            symbols: {
                                decimal: '.',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";
                        detalleCredito = detalleCredito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[i].IMP_TOT_NTO, {
                            fractionDigits: 2,
                            symbols: {
                                decimal: ',',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";
                        detalleCredito = detalleCredito + "</tr>";
                    }
    
                    if (value[i].COD_MON == "CLP" && value[i].FLG_TPO_DOC_CTB == "NCR") {
                        contFac2Local = contFac2Local + 1;
                        totalIva2Local = totalIva2Local + (value[i].IMP_IVA_DOC);
                        totalNeto2Local = totalNeto2Local + (value[i].IMP_TOT_NTO);                                        
    
                        detalleCreditoLocal = detalleCreditoLocal + "<tr>";
                        detalleCreditoLocal = detalleCreditoLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[i].NUM_FOL + "</span></span></td>";
                        detalleCreditoLocal = detalleCreditoLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[i].FEC_EMI + "</span></span></td>";
                        detalleCreditoLocal = detalleCreditoLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[i].IMP_IVA_DOC, {
                            fractionDigits: 0,
                            symbols: {
                                decimal: '.',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";
                        detalleCreditoLocal = detalleCreditoLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[i].IMP_TOT_NTO, {
                            fractionDigits: 0,
                            symbols: {
                                decimal: ',',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";
                        detalleCreditoLocal = detalleCreditoLocal + "</tr>";
                    }   
    
                    if (value[i].COD_MON == "USD" && value[i].FLG_TPO_DOC_CTB == "NDB") {
                        contFac3 = contFac3 + 1;
                        totalIva3 = totalIva3 + (value[i].IMP_IVA_DOC);
                        totalNeto3 = totalNeto3 + (value[i].IMP_TOT_NTO);
    
                        detalleDebito = detalleDebito + "<tr>";
                        detalleDebito = detalleDebito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[i].NUM_FOL + "</span></span></td>";
                        detalleDebito = detalleDebito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[i].FEC_EMI + "</span></span></td>";
                        detalleDebito = detalleDebito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[i].IMP_IVA_DOC, {
                            fractionDigits: 0,
                            symbols: {
                                decimal: '.',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";
                        detalleDebito = detalleDebito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[i].IMP_TOT_NTO, {
                            fractionDigits: 2,
                            symbols: {
                                decimal: ',',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";
                        detalleDebito = detalleDebito + "</tr>";                    
                    }  
    
                    if (value[i].COD_MON == "CLP" && value[i].FLG_TPO_DOC_CTB == "NDB") {
                        contFac3Local = contFac3Local + 1;
    
                        totalIva3Local = totalIva3Local + (value[i].IMP_IVA_DOC);
                        totalNeto3Local = totalNeto3Local + (value[i].IMP_TOT_NTO);
    
                        detalleDebitoLocal = detalleDebitoLocal + "<tr>";
                        detalleDebitoLocal = detalleDebitoLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[i].NUM_FOL + "</span></span></td>";
                        detalleDebitoLocal = detalleDebitoLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value[i].FEC_EMI + "</span></span></td>";
                        detalleDebitoLocal = detalleDebitoLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[i].IMP_IVA_DOC, {
                            fractionDigits: 0,
                            symbols: {
                                decimal: '.',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";
                        detalleDebitoLocal = detalleDebitoLocal + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value[i].IMP_TOT_NTO, {
                            fractionDigits: 0,
                            symbols: {
                                decimal: '.',
                                grouping: '.'
                            }
                        }) + "</span></span></td>";
                        detalleDebitoLocal = detalleDebitoLocal + "</tr>";                    
                    }        
                }
            }

            totalIvaFinal = totalIva + totalIvaLocal + totalIva2 + totalIva2Local + totalIva3 + totalIva3Local;
            totalNetoFinal = totalNeto + totalNeto2 + totalNeto3 ;
            totalNetoFinalCLP = totalNetoLocal + totalNeto2Local + totalNeto3Local;
            
            callback();
        },
            
        function(err) {
            if (contFac > 0) {
                detalleFactura = detalleFactura + "<tr>";
                detalleFactura = detalleFactura + "<td width='79'>&nbsp;" + "</td>";
                detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>Totales:" + "</b></span></span></td>";
                detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>CLP: " + formatNumber(totalIva, {
                    fractionDigits: 0,
                    symbols: {
                        decimal: '.',
                        grouping: '.'
                    }
                }) + "</b></span></span></td>";
                detalleFactura = detalleFactura + "<td width='200'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>USD: " + formatNumber(totalNeto, {
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
                detalleFactura = detalleFactura + "<p>No existe facturacion para moneda extranjera</p>";
            }

            detalleFactura = detalleFactura + "<br><p><b>Facturacion  Moneda Local</b></p>";
            detalleFactura = detalleFactura + "<table cellspacing='0' cellpadding='0' width='100%'>";
            detalleFactura = detalleFactura + "<tr>";
            detalleFactura = detalleFactura + "<td width='79'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Documento</span></span></td>";
            detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Fecha Emision</span></span></td>";
            detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>IVA</span></span></td>";
            detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>NETO</span></span></td>";
            detalleFactura = detalleFactura + "</tr>";

            if (contFacLocal > 0) {
                detalleFactura = detalleFactura + detalleFacturaLocal;
                detalleFactura = detalleFactura + "<td width='79'>&nbsp;" + "</td>";
                detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>Totales:" + "</b></span></span></td>";
                detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>CLP: "  + formatNumber(totalIvaLocal, {
                    fractionDigits: 0,
                    symbols: {
                        decimal: '.',
                        grouping: '.'
                    }
                }) + "</b></span></span></td>";
                detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>CLP: "  + formatNumber(totalNetoLocal, {
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
                detalleFactura = detalleFactura + "<p>No existe facturacion para moneda local</p>";
            }

            detalleFactura = detalleFactura + "<br><p><b>Notas de Credito Moneda Extranjera</b></p>";
            detalleFactura = detalleFactura + "<table cellspacing='0' cellpadding='0' width='100%'>";
            detalleFactura = detalleFactura + "<tr>";
            detalleFactura = detalleFactura + "<td width='79'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Documento</span></span></td>";
            detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Fecha Emision</span></span></td>";
            detalleFactura = detalleFactura + "<td width='100' nowrap='nowrap'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>IVA</span></span></td>";
            detalleFactura = detalleFactura + "<td width='100' nowrap='nowrap'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>NETO</span></span></td>";
            detalleFactura = detalleFactura + "</tr>";

            if (contFac2 > 0) {
                detalleFactura = detalleFactura + detalleCredito;
                detalleFactura = detalleFactura + "<tr>";
                detalleFactura = detalleFactura + "<td width='79'>&nbsp;" + "</td>";
                detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>Totales:" + "</b></span></span></td>";
                detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>CLP: " + formatNumber(totalIva2, {
                    fractionDigits: 0,
                    symbols: {
                        decimal: '.',
                        grouping: '.'
                    }
                }) + "</b></span></span></td>";                    
                detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>USD: " + formatNumber(totalNeto2, {
                    fractionDigits: 2,
                    symbols: {
                        decimal: ',',
                        grouping: '.'
                    }
                }) + "</b></span></span></td>";
                detalleFactura = detalleFactura + "</tr>";
                detalleFactura = detalleFactura + "</table>";
                detalleFactura = detalleFactura + "<p><br></p>";
            }else {
                detalleFactura = detalleFactura + "</table>";
                detalleFactura = detalleFactura + "<p>No existen nota de credito para moneda extranjera</p>";
            }

            detalleFactura = detalleFactura + "<br><p><b>Notas de Credito Moneda Local</b></p>";
            detalleFactura = detalleFactura + "<table cellspacing='0' cellpadding='0' width='100%'>";
            detalleFactura = detalleFactura + "<tr>";
            detalleFactura = detalleFactura + "<td width='79'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Documento</span></span></td>";
            detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Fecha Emision</span></span></td>";
            detalleFactura = detalleFactura + "<td width='100' nowrap='nowrap'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>IVA</span></span></td>";
            detalleFactura = detalleFactura + "<td width='100' nowrap='nowrap'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>NETO</span></span></td>";
            detalleFactura = detalleFactura + "</tr>";

            if (contFac2Local > 0) {
                detalleFactura = detalleFactura + detalleCreditoLocal;
                detalleFactura = detalleFactura + "<td width='79'>&nbsp;" + "</td>";
                detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>Totales:" + "</b></span></span></td>";
                detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>CLP: "  + formatNumber(totalIva2Local, {
                    fractionDigits: 0,
                    symbols: {
                        decimal: '.',
                        grouping: '.'
                    }
                }) + "</b></span></span></td>";
                detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>CLP: "  + formatNumber(totalNeto2Local, {
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
                detalleFactura = detalleFactura + "<p>No existen notas de credito para moneda local</p>";
            }

            detalleFactura = detalleFactura + "<p><br><b>Notas de Debito Moneda Extranjera</b></p>";
            detalleFactura = detalleFactura + "<table cellspacing='0' cellpadding='0' width='100%'>";
            detalleFactura = detalleFactura + "<tr>";
            detalleFactura = detalleFactura + "<td width='79'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Documento</span></span></td>";
            detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Fecha Emision</span></span></td>";
            detalleFactura = detalleFactura + "<td width='100' nowrap='nowrap'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>IVA</span></span></td>";
            detalleFactura = detalleFactura + "<td width='100' nowrap='nowrap'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>NETO</span></span></td>";
            detalleFactura = detalleFactura + "</tr>";

            if (contFac3 > 0) {
                detalleFactura = detalleFactura + detalleDebito;
                detalleFactura = detalleFactura + "<tr>";
                detalleFactura = detalleFactura + "<td width='79'>&nbsp;" + "</td>";
                detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>Totales:" + "</b></span></span></td>";
                detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>CLP: " + formatNumber(totalIva3, {
                    fractionDigits: 0,
                    symbols: {
                        decimal: '.',
                        grouping: '.'
                    }
                }) + "</b></span></span></td>";
                detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>USD: " + formatNumber(totalNeto3, {
                    fractionDigits: 2,
                    symbols: {
                        decimal: ',',
                        grouping: '.'
                    }
                }) + "</b></span></span></td>";
                detalleFactura = detalleFactura + "</tr>";
                detalleFactura = detalleFactura + "</table>";
                detalleFactura = detalleFactura + "<p><br></p>";
            }
            else {
                detalleFactura = detalleFactura + "</table>";
                detalleFactura = detalleFactura + "<p>No existen notas de debito para moneda extranjera</p>";
            }

            detalleFactura = detalleFactura + "<p><br><b>Notas de Debito Moneda Local</b></p>";
            detalleFactura = detalleFactura + "<table cellspacing='0' cellpadding='0' width='100%'>";
            detalleFactura = detalleFactura + "<tr>";
            detalleFactura = detalleFactura + "<td width='79'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Documento</span></span></td>";
            detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Fecha Emision</span></span></td>";
            detalleFactura = detalleFactura + "<td width='100' nowrap='nowrap'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>IVA</span></span></td>";
            detalleFactura = detalleFactura + "<td width='100' nowrap='nowrap'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>NETO</span></span></td>";
            detalleFactura = detalleFactura + "</tr>";

            if (contFac3Local > 0) {
                detalleFactura = detalleFactura + detalleDebitoLocal;
                detalleFactura = detalleFactura + "<tr>";
                detalleFactura = detalleFactura + "<td width='79'>&nbsp;" + "</td>";
                detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>Totales:" + "</b></span></span></td>";
                detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>CLP: " + formatNumber(totalIva3Local, {
                    fractionDigits: 0,
                    symbols: {
                        decimal: '.',
                        grouping: '.'
                    }
                }) + "</b></span></span></td>";
                detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>CLP: " + formatNumber(totalNeto3Local, {
                    fractionDigits: 0,
                    symbols: {
                        decimal: '.',
                        grouping: '.'
                    }
                }) + "</b></span></span></td>";
                detalleFactura = detalleFactura + "</tr>";
                detalleFactura = detalleFactura + "</table>";
                detalleFactura = detalleFactura + "<p><br></p>";
            }
            else {
                detalleFactura = detalleFactura + "</table>";
                detalleFactura = detalleFactura + "<p>No existen notas de debito para moneda local</p>";
            }

            temp = temp.replace('&lt;TOTALIVA&gt;', formatNumber(totalIvaFinal, {
                                                                                fractionDigits: 0,
                                                                                symbols: {
                                                                                    decimal: '.',
                                                                                    grouping: '.'
                                                                                }
                                                                            }));

            temp = temp.replace('&lt;TOTALNETO&gt;', formatNumber(totalNetoFinal, {
                                                                                fractionDigits: 2,
                                                                                symbols: {
                                                                                    decimal: ',',
                                                                                    grouping: '.'
                                                                                }
                                                                            }));
            temp = temp.replace('&lt;TOTALNETOCLP&gt;', formatNumber(totalNetoFinalCLP, {
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