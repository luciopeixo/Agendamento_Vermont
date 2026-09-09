import "jsr:@supabase/functions-js/edge-runtime.d.ts";

function formatarDataBR(dataStr: string): string {
  if (!dataStr) return '';
  if (dataStr.includes('/')) return dataStr;
  const partes = dataStr.split('-');
  if (partes.length === 3) {
    const ano = partes[0];
    const mes = partes[1];
    const dia = partes[2];
    const ano2digitos = ano.length === 4 ? ano.slice(-2) : ano;
    return `${dia}/${mes}/${ano2digitos}`;
  }
  return dataStr;
}

function obterDataHoraEnvioPTBR(): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Fortaleza'
    }).format(new Date());
  } catch (_e) {
    return new Date().toLocaleString('pt-BR');
  }
}

function formatarNomePedreiraCurto(pedreira: string = ''): string {
  if (!pedreira) return 'Pedreira';
  const maiusc = pedreira.toUpperCase();
  if (maiusc.includes('URUOCA')) return 'Uruoca';
  if (maiusc.includes('NEGRESCO')) return 'Massapê (Negresco)';
  if (maiusc.includes('DEL MARE')) return 'Massapê (Del Mare)';
  if (maiusc.includes('MASSAPÊ') || maiusc.includes('MASSAPE')) return 'Massapê';
  if (maiusc.includes('JAIBARAS') || maiusc.includes('SOBRAL')) return 'Sobral (Jaibaras)';
  if (maiusc.includes('SERROTE') || maiusc.includes('SÃO GONÇALO') || maiusc.includes('SAO GONCALO')) return 'São Gonçalo do Amarante (Serrote)';
  return pedreira.split('-')[0].trim();
}

function gerarAssuntoEmail(ag: any, dataFormatada: string): string {
  const pedreiraCurta = formatarNomePedreiraCurto(ag.pedreira);
  const bloco = ag.numero_bloco ? String(ag.numero_bloco).toUpperCase().trim() : 'Bloco';

  let isSabado = ag.tipo_dia === 'sabado';
  if (!isSabado && ag.data_agendamento) {
    const partes = ag.data_agendamento.split('-');
    if (partes.length === 3) {
      const dt = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
      isSabado = dt.getDay() === 6;
    }
  }

  if (isSabado) {
    return `Agendamento - ${pedreiraCurta} - Sábado - ${dataFormatada} - ${bloco}`;
  }
  return `Agendamento - ${pedreiraCurta} - ${dataFormatada} - ${bloco}`;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const ag = body.agendamento || body;

    const emailDestino = Deno.env.get('EMAIL_NOTIFICACAO_DESTINO') || '';
    const protocolo = (ag.id || 'VT-' + Date.now()).substring(0, 8).toUpperCase();
    const dataFormatada = formatarDataBR(ag.data_agendamento);
    const dataHoraEnvio = obterDataHoraEnvioPTBR();

    console.log(`[VERMONT] Notificação #${protocolo} para ${emailDestino} (${dataFormatada}):`, ag);

    // Formatação de Placas
    let placasTexto = `Cavalo: ${ag.placa_cavalo || '-'}`;
    if (ag.tipo_veiculo === 'Bitrem (7 Eixos)' || ag.tipo_veiculo === 'Rodotrem (9 Eixos)') {
      if (ag.placa_carreta) placasTexto += ` | 1ª Carreta: ${ag.placa_carreta}`;
      if (ag.placa_carreta_2) placasTexto += ` | 2ª Carreta: ${ag.placa_carreta_2}`;
    } else if (ag.tipo_veiculo === 'Bitruck (4 Eixos)' || ag.tipo_veiculo === 'Truck (3 Eixos)') {
      placasTexto = `Veículo (Caminhão): ${ag.placa_cavalo || '-'}`;
    } else {
      if (ag.placa_carreta) placasTexto += ` | Carreta: ${ag.placa_carreta}`;
    }

    const assuntoEmail = gerarAssuntoEmail(ag, dataFormatada);

    // Layout HTML rigorosamente alinhado às orientações da Vermont Mineração
    const htmlEmail = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${assuntoEmail}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b1014; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b1014; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Container Principal -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,0.5);">
          
          <!-- Cabeçalho Institucional Vermont Mineração com Logo Oficial -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #004d1d 55%, #00762c 100%); padding: 32px 28px; text-align: center; border-bottom: 4px solid #00a83e;">
              <img src="https://vermontmineracao.com/wp-content/uploads/2022/07/logo-vermont-site-1.png" alt="Vermont Mineração" style="height: 50px; max-width: 230px; object-fit: contain; margin-bottom: 14px;" />
              <div style="color: #4ade80; font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 6px;">
                ROCHAS NOBRES &bull; POLO CEARÁ
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">
                Portal de Agendamento - Grupo Vermont Mineração
              </h1>
            </td>
          </tr>

          <!-- Faixa de Destaque / Saudação Solicitada -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 16px 28px; border-bottom: 1px solid #e2e8f0;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 15px; color: #00762c; font-weight: 800;">
                    🚛 🪨 Segue novo agendamento! 📋
                  </td>
                  <td align="right" style="font-size: 13px; color: #166534; font-weight: 700;">
                    <span style="background-color: #dcfce7; padding: 4px 12px; border-radius: 20px; border: 1px solid #86efac;">
                      PROTOCOLO: #${protocolo}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tabela com Colunas [Campos] e [Dados] -->
          <tr>
            <td style="padding: 28px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 14px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #00762c; color: #ffffff;">
                    <th style="padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; width: 38%; border-right: 1px solid rgba(255,255,255,0.2);">
                      Campos
                    </th>
                    <th style="padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">
                      Dados
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
                    <td style="padding: 10px 16px; font-weight: 700; color: #334155; border-right: 1px solid #e2e8f0;">Pedreira de Carregamento</td>
                    <td style="padding: 10px 16px; color: #00762c; font-weight: 700;">${ag.pedreira}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 16px; font-weight: 700; color: #334155; border-right: 1px solid #e2e8f0;">Data do Carregamento</td>
                    <td style="padding: 10px 16px; color: #0f172a; font-weight: 700;">${dataFormatada}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
                    <td style="padding: 10px 16px; font-weight: 700; color: #334155; border-right: 1px solid #e2e8f0;">Horário Agendado</td>
                    <td style="padding: 10px 16px; color: #0f172a; font-weight: 700;">
                      ${ag.horario_agendamento} ${ag.justificativa_outros ? `<span style="font-size: 12px; color: #64748b;">(Justificativa: ${ag.justificativa_outros})</span>` : ''}
                    </td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 16px; font-weight: 700; color: #334155; border-right: 1px solid #e2e8f0;">Material da Pedreira</td>
                    <td style="padding: 10px 16px; color: #0f172a; font-weight: 700;">${ag.material}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
                    <td style="padding: 10px 16px; font-weight: 700; color: #334155; border-right: 1px solid #e2e8f0;">Número do Bloco</td>
                    <td style="padding: 10px 16px; color: #0f172a; font-weight: 600;">${ag.numero_bloco}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 16px; font-weight: 700; color: #334155; border-right: 1px solid #e2e8f0;">Cliente Destinatário</td>
                    <td style="padding: 10px 16px; color: #0f172a;">${ag.cliente}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
                    <td style="padding: 10px 16px; font-weight: 700; color: #334155; border-right: 1px solid #e2e8f0;">Transportadora</td>
                    <td style="padding: 10px 16px; color: #0f172a;">${ag.transportadora}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 16px; font-weight: 700; color: #334155; border-right: 1px solid #e2e8f0;">Motorista Condutor</td>
                    <td style="padding: 10px 16px; color: #0f172a; font-weight: 600;">${ag.motorista_nome}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
                    <td style="padding: 10px 16px; font-weight: 700; color: #334155; border-right: 1px solid #e2e8f0;">CPF do Motorista</td>
                    <td style="padding: 10px 16px; color: #0f172a;">${ag.motorista_cpf}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 16px; font-weight: 700; color: #334155; border-right: 1px solid #e2e8f0;">Telefone / WhatsApp</td>
                    <td style="padding: 10px 16px; color: #0f172a;">${ag.motorista_telefone || 'Não informado'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
                    <td style="padding: 10px 16px; font-weight: 700; color: #334155; border-right: 1px solid #e2e8f0;">Tipo do Veículo</td>
                    <td style="padding: 10px 16px; color: #0f172a; font-weight: 600;">${ag.tipo_veiculo}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 16px; font-weight: 700; color: #334155; border-right: 1px solid #e2e8f0;">Placas Identificadas</td>
                    <td style="padding: 10px 16px; color: #00762c; font-weight: 700;">${placasTexto}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
                    <td style="padding: 10px 16px; font-weight: 700; color: #334155; border-right: 1px solid #e2e8f0;">Documentos Obrigatórios</td>
                    <td style="padding: 10px 16px; color: #00762c; font-size: 13px; font-weight: 600;">
                      CRLV cavalo/carreta atualizados, CNH compatível, Curso de cargas indivisíveis e Laudo de rochas/CSV vigente.
                    </td>
                  </tr>
                  <tr style="background-color: #ffffff;">
                    <td style="padding: 10px 16px; font-weight: 700; color: #334155; border-right: 1px solid #e2e8f0;">Observações Adicionais</td>
                    <td style="padding: 10px 16px; color: #64748b; font-style: italic;">
                      ${ag.observacoes ? ag.observacoes : 'Nenhuma observação informada.'}
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Alerta de Confirmação Prévia de Blocos -->
              <div style="margin-top: 18px; padding: 12px 16px; background-color: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; border-radius: 8px; color: #92400e; font-size: 13px; line-height: 1.5;">
                <strong style="color: #b45309; display: block; margin-bottom: 4px;">⚠️ Atenção ao Transportador:</strong>
                O transportador deverá sempre confirmar com o cliente, antes de realizar o carregamento, se os blocos estão devidamente envelopados e se encontram finalizados e liberados para transporte.<br />
                <span style="font-size: 12px; color: #78350f; font-weight: 600;">Essa confirmação é fundamental para evitar imprevistos, atrasos ou problemas durante o carregamento e o transporte.</span>
              </div>

              <!-- Data de Envio em Português-BR -->
              <div style="margin-top: 14px; text-align: right; font-size: 12px; color: #64748b;">
                🕒 <em>Enviado em ${dataHoraEnvio}</em>
              </div>
            </td>
          </tr>

          <!-- Rodapé Institucional Vermont Mineração -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 28px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.08);">
              <p style="margin: 0 0 8px 0; font-weight: 700; color: #ffffff; font-size: 13px;">
                VERMONT MINERAÇÃO LTDA &bull; CNPJ 07.498.412/0001-30
              </p>
              <p style="margin: 0 0 8px 0;">
                Unidades Produtoras: Uruoca | Massapê | Sobral | São Gonçalo do Amarante - Ceará
              </p>
              <p style="margin: 0;">
                Acesse: <a href="https://vermontmineracao.com.br" style="color: #4ade80; text-decoration: none; font-weight: 600;">www.vermontmineracao.com.br</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // 1. Envio Direto via FormSubmit pelo backend (garantindo entrega imediata em PT-BR)
    try {
      const formSubmitPayload = {
        _subject: assuntoEmail,
        _template: 'table',
        _captcha: 'false',
        'Protocolo': `#${protocolo}`,
        'Pedreira de Carregamento': ag.pedreira,
        'Data do Carregamento': dataFormatada,
        'Horário Agendado': `${ag.horario_agendamento} ${ag.justificativa_outros ? `(Justificativa: ${ag.justificativa_outros})` : ''}`,
        'Material da Pedreira': ag.material,
        'Número do Bloco': ag.numero_bloco,
        'Cliente Destinatário': ag.cliente,
        'Nome da Transportadora': ag.transportadora,
        'Nome do Motorista': ag.motorista_nome,
        'CPF do Motorista': ag.motorista_cpf,
        'Telefone / WhatsApp': ag.motorista_telefone || 'Não informado',
        'Tipo do Veículo': ag.tipo_veiculo,
        'Placas do Veículo': placasTexto,
        'Observações Operacionais': ag.observacoes || 'Nenhuma observação informada.',
        'Documentos Exigidos': 'CRLV cavalo/carreta atualizados, CNH compatível, Curso de cargas indivisíveis e Laudo de rochas/CSV vigente.',
        'Aviso ao Transportador': 'O transportador deverá sempre confirmar com o cliente, antes de realizar o carregamento, se os blocos estão devidamente envelopados e se encontram finalizados e liberados para transporte. Essa confirmação é fundamental para evitar imprevistos, atrasos ou problemas durante o carregamento e o transporte.',
        'Data e Horário de Envio': dataHoraEnvio
      };

      await fetch(`https://formsubmit.co/ajax/${emailDestino}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'https://vermontmineracao.com.br',
          'Referer': 'https://vermontmineracao.com.br/'
        },
        body: JSON.stringify(formSubmitPayload)
      }).catch((e) => console.warn('FormSubmit backend warn:', e));
    } catch (eFs) {
      console.warn('Erro FormSubmit backend:', eFs);
    }

    // 2. Se houver chave Resend configurada no ambiente
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    let resendStatus = 'nao_configurado';

    if (resendApiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: Deno.env.get('EMAIL_FROM') || 'Portal Vermont <notificacoes@sistema.local>',
            to: [emailDestino],
            subject: assuntoEmail,
            html: htmlEmail
          })
        });
        resendStatus = res.ok ? 'enviado_resend' : 'falha_resend';
      } catch (errResend) {
        console.warn('Erro ao despachar Resend:', errResend);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      protocolo: protocolo,
      destinatario: emailDestino,
      data_formatada: dataFormatada,
      data_hora_envio: dataHoraEnvio,
      status_resend: resendStatus,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
