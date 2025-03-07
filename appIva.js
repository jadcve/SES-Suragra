/*
    Alerta Masiva Correspondiente al IVA Vencido
    Consideraciones:
    Para pruebas internas definir la variable alttest = 2, de esta manera llegara el correo a cuentas
    Internas de AboutIT
    Para despachar los emails al cliente, debe definir la variable alttest = 1.
*/

import sql from 'mssql';
//var aws = require("aws-lib"); // aws-lib SES Amazon
// each = require('foreach');
// _ = require('underscore');
// s = require('underscore.string');
// formatNumber = require('simple-format-number');
// moment = require('moment');
// async = require('async');

const config = {
    user: 'usr_cna2',
    password: 'usr_cna2',
    server: '34.227.19.226',
    database: 'bd_sgra'
}

var templeta;
var asunto;
var mandar = 1;
// Variable que permite controlar si el mail sera enviado internamente como prueba o a clientes //
// alttest=1 --> Se envia al cliente
// alttest=2 --> Se envia internamente a una cuenta de Aboutit
var alttest=1;

BuscaTempleta();

function BuscaTempleta() {
    let connection4 = sql.connect(config, err => {
        // ... error checks

        // Query
    const request = new sql.Request(connection4);
        request.query('select * from TA_SGRA_ALRTA_FLUJO_CNTBL', (err, recordset) => {
            templeta = recordset[2].GLS_DET_ALT;
            asunto = recordset[2].GLS_ALT;
            console.log(asunto);
            //Comenzar();
    });
});



    // var connection4 = new sql.Connection(config, function(err) {
    //     var request = new sql.Request(connection4);
    //     request.query('select * from TA_SGRA_ALRTA_FLUJO_CNTBL', function(err, recordset) {
    //         templeta = recordset[2].GLS_DET_ALT;
    //         asunto = recordset[2].GLS_ALT;
    //         console.log(asunto)
    //         Comenzar();
    //     });
    // });
}

function Comenzar() {
    var connection1 = new sql.Connection(config, function(err) {
        var request = new sql.Request(connection1);
        request.stream = true;
        request.execute('SP_SGR_CNA_ALT_CTB_AMZ');

        request.on('row', function(row) {
            if (row.COD_CNP == "IMOR") {
                ClientesSap();
            }
        });
    });
}

//SP_SGR_CNA_CLT_ALT_AMZ
function ClientesSap() {
    var connection2 = new sql.Connection(config, function(err) {
        var request = new sql.Request(connection2);
        request.stream = true;
        request.execute('SP_SGR_CNA_CLT_ALT_AMZ_IVAP');
        request.on('row', function(row) {
            ContactosSap(row);
            //connection2.close();
        });

    });
}

//SP_SGR_CNA_CTC_CLT_SAP
function ContactosSap(contacto) {
    var connection3 = new sql.Connection(config, function(err) {
        var request = new sql.Request(connection3);
        request.stream = true;
        request.input('COD_IDT_SAP', sql.VarChar, contacto.COD_IDT_SAP);
        request.output('CAN_CTC', sql.Int);
        request.execute('SP_SGR_CNA_CTC_CLT_SAP');
        request.on('row', function(row) {

            if (row.GLS_EML == "NO DEFINIDO") {
                Log(contacto, row.COD_CTC, 2, "EMAIL NO DEFINIDO");
            } else {
                RegistrosContacto(contacto, row);
            }
        });

        request.on('done', function(returnValue) {
            if (request.parameters.CAN_CTC.value == 0) {
                Log(contacto, 0, 3, "NO EXISTEN CONTACTOS PARA NOTIFICAR");
            };
        });
    });
}

//SP_SGR_CNA_STC_CMR_CLT
function RegistrosContacto(contacto, datosContacto) {
    var connection5 = new sql.Connection(config, function(err) {
        var request = new sql.Request(connection5);
        request.stream = false;        
        request.input('COD_IDT_SAP', sql.VarChar, contacto.COD_IDT_SAP);
        request.execute('SP_SGR_CNA_STC_CMR_IVA_PND', function(err, recordsets, returnValue, affected) {
                    
        Email(contacto, datosContacto, recordsets[0]);
        });
    });
}

//@COD_IDT_SAP  Se obtiene del  procedimiento SP_SGR_CNA_CLT_ALT_AMZ, el campo tiene el mismo nombre,
//@COD_IDT_CTC  Se obtiene del procedimiento SP_SGR_CNA_CTC_CLT_SAP, el campo es COD_CTC
//0  Si el envió es correcto
//1  Si el envió fallo por algún tema técnico, cualquier excepción.
//2  Si el campo GLS_EML retornado por el procedimiento SP_SGR_CNA_CTC_CLT_SAP tiene el valor NO DEFINIDO
//SP_SGR_INS_TRZ_ALT
function Log(contacto, ctc, codigo, error) {
    var connection3 = new sql.Connection(config, function(err) {
        var request = new sql.Request(connection3);
        request.stream = false;
        request.input('COD_IDT_SAP', sql.VarChar, contacto.COD_IDT_SAP);
        request.input('COD_IDT_CTC', sql.VarChar, ctc);
        request.input('FLG_EML_ENV', sql.Int, codigo);
        request.input('COD_CNP', sql.VarChar, "IMOR");
        request.input('GLS_ERR', sql.VarChar, error);
        request.execute('SP_SGR_INS_TRZ_ALT', function(err, recordsets, returnValue, affected) {
        });
    });
}




var cuenta = "Aviso Iva <avisoiva@suragra.com>";
var ses = aws.createSESClient(user, password); //Credenciales SES

var l = 0;


function Email(contacto, datosContacto, datosFactura) {
    l = l + 1;

    var emailSend="";
    if (alttest == 1){
        emailSend = datosContacto.GLS_EML;
    }
    else{
        emailSend = "jadcve@gmail.com";
    }

    try {
        var recipient_address = emailSend;
        var recipient_address2 = "aracelli@suragra.com";
        var recipient_address3 = "marcoantonio@suragra.com";
        var recipient_address4 = "cinthia@suragra.com";
        var recipient_address5 = "priscilla@suragra.com";
         var recipient_address6 = "jadcve@gmail.com";
        var sender_address = cuenta;

        var temp = templeta;

        temp = temp.replace("&lt;&lt;CLIENTE&gt;&gt;", "<b>" + s.trim(contacto.NOM_CLT_SAP) + "</b>");
        temp = temp.replace("&lt;&lt;MES&gt;&gt;", "<b>" + s.capitalize(moment().subtract(10, 'days').locale('es').format('MMMM')) + " " + moment().locale('es').format('YYYY') + "</b>");

        var detalleFactura = "";
        var detalleCredito = "";

        detalleFactura = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><title>SurAgra</title><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head><body style="margin: 0; padding: 0;">';
        detalleFactura = detalleFactura + "<p><br><b>Facturacion Moneda Extranjera</b></p>";
        detalleFactura = detalleFactura + "<table cellspacing='0' cellpadding='0' width='100%'>";
        detalleFactura = detalleFactura + "<tr>";
        detalleFactura = detalleFactura + "<td width='79'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Documento</span></span></td>";
        detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Fecha Emision</span></span></td>";
        detalleFactura = detalleFactura + "<td width='100' nowrap='nowrap'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>NETO</span></span></td>";
        detalleFactura = detalleFactura + "<td width='100' nowrap='nowrap'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>IVA Pendiente</span></span></td>";
        detalleFactura = detalleFactura + "<td width='100' nowrap='nowrap'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Dias Mora</span></span></td>";
        detalleFactura = detalleFactura + "</tr>";

        var totalNeto = 0;
        var totalIva = 0;
        var contFac = 0;

        var totalNeto2 = 0;
        var totalIva2 = 0;
        var contFac2 = 0;

        var totalIvaFinal=0;
        var codmon="";

        async.each(datosFactura, function(value, callback) {
            codmon = value.COD_MON;

            if (value.FLG_TPO_REG == "IP" && value.COD_MON == "USD") {
                contFac = contFac + 1;

                totalIva = totalIva + (value.IMP_IVA_DOC);
                totalNeto = totalNeto + (value.IMP_TOT_NTO);                                                   

                detalleFactura = detalleFactura + "<tr>";
                detalleFactura = detalleFactura + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value.NUM_FOL + "</span></span></td>";
                detalleFactura = detalleFactura + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value.FEC_EMI + "</span></span></td>";
                detalleFactura = detalleFactura + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value.IMP_TOT_NTO, {
                    fractionDigits: 2,
                    symbols: {
                        decimal: ',',
                        grouping: '.'
                    }
                }) + "</span></span></td>";
                detalleFactura = detalleFactura + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value.IMP_IVA_DOC, {
                    fractionDigits: 0,
                    symbols: {
                        decimal: '.',
                        grouping: '.'
                    }
                }) + "</span></span></td>";
                detalleFactura = detalleFactura + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value.CAN_DIA_MOR + "</span></span></td>";
                detalleFactura = detalleFactura + "</tr>";
            }

            if (value.FLG_TPO_REG == "IP" && value.COD_MON == "CLP") {
                contFac2 = contFac2 + 1;

                totalIva2 = totalIva2 + (value.IMP_IVA_DOC);
                totalNeto2 = totalNeto2 + (value.IMP_TOT_NTO);                       
               
                detalleCredito = detalleCredito + "<tr>";
                detalleCredito = detalleCredito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value.NUM_FOL + "</span></span></td>";
                detalleCredito = detalleCredito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value.FEC_EMI + "</span></span></td>";
                detalleCredito = detalleCredito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value.IMP_TOT_NTO, {
                    fractionDigits: 0,
                    symbols: {
                        decimal: '.',
                        grouping: '.'
                    }
                }) + "</span></span></td>";
                detalleCredito = detalleCredito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + formatNumber(value.IMP_IVA_DOC, {
                    fractionDigits: 0,
                    symbols: {
                        decimal: '.',
                        grouping: '.'
                    }
                }) + "</span></span></td>";
                detalleCredito = detalleCredito + "<td><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>" + value.CAN_DIA_MOR + "</span></span></td>";                
                detalleCredito = detalleCredito + "</tr>";
            }
                totalIvaFinal = totalIva + totalIva2;
                callback();
            },
            function(err) {
                if (contFac > 0) {
                    detalleFactura = detalleFactura + "<tr>";
                    detalleFactura = detalleFactura + "<td width='79'>&nbsp;" + "</td>";
                    detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>Totales:" + "</b></span></span></td>";
                    detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>" + codmon + " "+ formatNumber(totalNeto, {
                        fractionDigits: 2,
                        symbols: {
                            decimal: ',',
                            grouping: '.'
                        }
                    }) + "</b></span></span></td>";                    
                    detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>CLP " + formatNumber(totalIva, {
                        fractionDigits: 0,
                        symbols: {
                            decimal: '.',
                            grouping: '.'
                        }
                    }) + "</b></span></span></td>";
                    detalleFactura = detalleFactura + "<td width='100'>&nbsp;" + "</td>";
                    detalleFactura = detalleFactura + "</tr>";
                    detalleFactura = detalleFactura + "</table>";
                    detalleFactura = detalleFactura + "<p><br></p>";                                            
                } else {
                    detalleFactura = detalleFactura + "</table>";
                    detalleFactura = detalleFactura + "<p>No existen documentos con IVA pendiente asociados a facturas con moneda extranjera</p>";
                }

                detalleFactura = detalleFactura + "<br><p><b>Facturacion  Moneda Local</b></p>";
                detalleFactura = detalleFactura + "<table cellspacing='0' cellpadding='0' width='100%'>";
                detalleFactura = detalleFactura + "<tr>";
                detalleFactura = detalleFactura + "<td width='79'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Documento</span></span></td>";
                detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Fecha Emision</span></span></td>";
                detalleFactura = detalleFactura + "<td width='100' nowrap='nowrap'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>NETO</span></span></td>";
                detalleFactura = detalleFactura + "<td width='100' nowrap='nowrap'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>IVA Pendiente</span></span></td>";
                detalleFactura = detalleFactura + "<td width='100' nowrap='nowrap'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'>Dias Mora</span></span></td>";
                detalleFactura = detalleFactura + "</tr>";


                if (contFac2 > 0) {
                    detalleFactura = detalleFactura + detalleCredito;
                    detalleFactura = detalleFactura + "<tr>";
                    detalleFactura = detalleFactura + "<td width='79'>&nbsp;" + "</td>";
                    detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>Totales:" + "</b></span></span></td>";
                    detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>" + codmon + " "  + formatNumber(totalNeto2, {
                        fractionDigits: 0,
                        symbols: {
                            decimal: '.',
                            grouping: '.'
                        }
                    }) + "</b></span></span></td>";                    
                    detalleFactura = detalleFactura + "<td width='100'><span style='font-size:11px'><span style='font-family:tahoma,geneva,sans-serif'><b>CLP "  + formatNumber(totalIva2, {
                        fractionDigits: 0,
                        symbols: {
                            decimal: '.',
                            grouping: '.'
                        }
                    }) + "</b></span></span></td>";
                    detalleFactura = detalleFactura + "<td width='100'>&nbsp;" + "</td>";
                    detalleFactura = detalleFactura + "</tr>";
                    detalleFactura = detalleFactura + "</table>";
                    detalleFactura = detalleFactura + "<p><br></p>";                                                
                } else {
                    detalleFactura = detalleFactura + "</table>";
                    detalleFactura = detalleFactura + "<p>No existen documentos con IVA pendiente asociados a facturas con moneda local</p>";
                }


                temp = temp.replace('&lt;TOTAL&gt;', formatNumber(totalIvaFinal, {
                                                                                    fractionDigits: 0,
                                                                                    symbols: {
                                                                                        decimal: '.',
                                                                                        grouping: '.'
                                                                                    }
                                                                                }));
                temp = temp.replace('&lt;FACTURAS&gt;', detalleFactura);
                
                if (alttest == 1){
                    var send_args = {
                        'Destination.ToAddresses.member.1': recipient_address,
                        'Destination.ToAddresses.member.2': recipient_address2,
                        'Destination.ToAddresses.member.3': recipient_address3,
                        'Destination.ToAddresses.member.4': recipient_address4,
                        'Destination.ToAddresses.member.5': recipient_address5,
                        'Message.Body.Html.Charset': 'UTF-8',
                        'Message.Body.Html.Data': temp,
                        'Message.Subject.Charset': 'UTF-8',
                        'Message.Subject.Data': asunto + " SURAGRA",
                        'Source': sender_address
                    }
                }
                else{
                    var send_args = {
                        'Destination.ToAddresses.member.1': recipient_address,
                        'Message.Body.Html.Charset': 'UTF-8',
                        'Message.Body.Html.Data': temp,
                        'Message.Subject.Charset': 'UTF-8',
                        'Message.Subject.Data': asunto + " SURAGRA",
                        'Source': sender_address
                    }                   
                }                                

                if (mandar == 1) {
                    setTimeout(function() {
                        ses.call('SendEmail', send_args, function(err, result) {
                            console.log(result);
                            if (err) {
                                Log(contacto, datosContacto.COD_CTC, 1, err);
                            } else {
                                Log(contacto, datosContacto.COD_CTC, 0, "EJECUTADO EXITOSAMENTE");
                            }
                        });
                    }, 200 * l);
                }
            });
    } catch (err) {
        Log(contacto, datosContacto.COD_CTC, 1, err);
    }
}