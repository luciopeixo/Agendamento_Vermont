import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Printer, Share2, Truck, MapPin, FileText, X, AlertTriangle, Clock,
  Mail, Send, ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  formatarPlacasExibicao, 
  formatarDataBR, 
  AVISO_CONFIRMACAO_CLIENTE,
  enviarComprovantePorEmail,
  gerarLinkMailtoComprovante,
  resolverCnpjCliente,
  resolverCnpjTransportadora,
  limparNomeEmpresa
} from '../services/agendamentoService';

export function ComprovanteModal({ agendamento, onFechar, onNovoAgendamento }) {
  if (!agendamento) return null;

  const [mostrarPainelEmail, setMostrarPainelEmail] = useState(false);
  const [emailDestino, setEmailDestino] = useState('');
  const [mensagemEmail, setMensagemEmail] = useState('');
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [statusEmail, setStatusEmail] = useState(null);

  useEffect(() => {
    document.body.classList.add('modal-comprovante-aberto');
    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#00762c', '#009e3b', '#ffffff', '#4ade80']
      });
    } catch (e) {
      // silencioso se não suportado
    }

    const handleAfterPrint = () => {
      document.body.classList.remove('imprimindo-comprovante');
    };
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      document.body.classList.remove('modal-comprovante-aberto');
      document.body.classList.remove('imprimindo-comprovante');
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const protocolo = (agendamento.id || 'VT-' + Date.now()).substring(0, 8).toUpperCase();

  const handlePrint = () => {
    document.body.classList.add('imprimindo-comprovante');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('imprimindo-comprovante');
    }, 1500);
  };

  const handleEnviarEmail = async (e) => {
    if (e) e.preventDefault();
    if (!emailDestino || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDestino.trim())) {
      setStatusEmail({ tipo: 'erro', texto: 'Por favor, informe um endereço de e-mail válido.' });
      return;
    }

    setEnviandoEmail(true);
    setStatusEmail(null);

    const agendamentoNormalizado = {
      ...agendamento,
      cliente: clienteNome,
      cliente_cnpj: clienteCnpj,
      transportadora: transportadoraNome,
      transportadora_cnpj: transportadoraCnpj
    };

    const res = await enviarComprovantePorEmail(agendamentoNormalizado, emailDestino, mensagemEmail);
    setEnviandoEmail(false);

    if (res.success) {
      setStatusEmail({ tipo: 'sucesso', texto: res.message || 'Comprovante enviado com sucesso!' });
    } else {
      setStatusEmail({ tipo: 'erro', texto: res.error || 'Erro ao enviar e-mail. Tente novamente.' });
    }
  };

  // Resolução inteligente e robusta de CNPJs e nomes de empresas
  const clienteNome = limparNomeEmpresa(agendamento.cliente);
  const clienteCnpj = agendamento.cliente_cnpj || resolverCnpjCliente(agendamento) || null;
  const transportadoraNome = limparNomeEmpresa(agendamento.transportadora);
  const transportadoraCnpj = agendamento.transportadora_cnpj || resolverCnpjTransportadora(agendamento) || null;

  // Lista de placas formatadas corretamente (Carreta simples se for 1 carreta, 1ª e 2ª se for Bitrem)
  const listaPlacas = formatarPlacasExibicao(agendamento);

  const isCombinado = agendamento.is_combinado || (agendamento.observacoes && (agendamento.observacoes.includes('[Carga Combinada') || agendamento.observacoes.includes('[Carga Mista')));
  const listaPontos = agendamento.pontos || [agendamento.ponto1 || agendamento, agendamento.ponto2, agendamento.ponto3].filter(Boolean);
  const totalPontos = isCombinado ? Math.max(listaPontos.length, 2) : 1;

  // Formatação das placas para o texto do WhatsApp
  const placasFormatadasWhats = listaPlacas
    .map(p => `   🔹 *${p.label}:* ${p.placa}`)
    .join('\n');

  // Mensagem oficial atrativa para WhatsApp
  const handleCompartilharWhatsApp = () => {
    let textoWhats = '';

    if (isCombinado && listaPontos.length > 1) {
      const roteiroTextoWhats = listaPontos.map((p, idx) => `
🔸 *${idx + 1}º PONTO DE CARREGAMENTO:*
🏢 *Pedreira:* *${p.pedreira}*
🪨 *Material:* *${p.material}*
🏷️ *Nº do Bloco:* *${p.numero_bloco}*
📅 *Data:* *${formatarDataBR(p.data_agendamento)}*
⏰ *Horário:* *${p.horario_agendamento}*`).join('\n');

      textoWhats = 
`🏗️ *VERMONT MINERAÇÃO LTDA.* 🪨
*AUTORIZAÇÃO OFICIAL DE AGENDAMENTO • CARGA COMBINADA (${listaPontos.length} BLOCOS)*
━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *PROTOCOLO:* #${protocolo}
✅ *STATUS:* *AGENDAMENTO COMBINADO CONFIRMADO (${listaPontos.length} PONTOS)*

📍 *ROTEIRO DE CARREGAMENTO:*
${roteiroTextoWhats}

🚛 *DADOS DO TRANSPORTE:*
🏢 *Transportadora:* *${transportadoraNome}* ${transportadoraCnpj ? `(CNPJ: ${transportadoraCnpj})` : ''}
👤 *Motorista:* *${agendamento.motorista_nome}*
🪪 *CPF:* ${agendamento.motorista_cpf}
📱 *WhatsApp/Tel:* ${agendamento.motorista_telefone || 'Não informado'}
🛣️ *Tipo de Veículo:* *${agendamento.tipo_veiculo}*
⚖️ *Placas:*
${placasFormatadasWhats}
💼 *Cliente Destinatário:* *${clienteNome}* ${clienteCnpj ? `(CNPJ: ${clienteCnpj})` : ''}
${agendamento.observacoes ? `\n📌 *Observações:* _${agendamento.observacoes}_\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 *DOCUMENTOS OBRIGATÓRIOS NA PEDREIRA:*
• Obrigatório apresentação de CRLVs do cavalo e carreta atualizados;
• CNH compatível com o veículo;
• Motorista deve possuir o curso de cargas indivisíveis;
• Laudo de inspeção de rochas ou CSV dentro da validade.
━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ *AVISO AO TRANSPORTADOR:*
_O transportador deverá sempre confirmar com o cliente, antes de realizar o carregamento, se os blocos estão devidamente envelopados e se encontram finalizados e liberados para transporte._

_Essa confirmação é fundamental para evitar imprevistos, atrasos ou problemas durante o carregamento e o transporte._
━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️ *Apresente esta confirmação e os documentos na portaria de cada pedreira.*
_Portal Oficial de Agendamentos • Vermont Mineração_`;
    } else {
      textoWhats = 
`🏗️ *VERMONT MINERAÇÃO LTDA.* 🪨
*AUTORIZAÇÃO OFICIAL DE AGENDAMENTO DE CARREGAMENTO*
━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *PROTOCOLO:* #${protocolo}
✅ *STATUS:* *AGENDAMENTO CONFIRMADO*

📍 *LOCALIZAÇÃO & HORÁRIO:*
🏢 *Pedreira:* *${agendamento.pedreira}*
📅 *Data:* *${formatarDataBR(agendamento.data_agendamento)}*
⏰ *Horário:* *${agendamento.horario_agendamento}* ${agendamento.justificativa_outros ? `\n   📝 _Justificativa: ${agendamento.justificativa_outros}_` : ''}

🚛 *DADOS DO TRANSPORTE:*
🏢 *Transportadora:* *${transportadoraNome}* ${transportadoraCnpj ? `(CNPJ: ${transportadoraCnpj})` : ''}
👤 *Motorista:* *${agendamento.motorista_nome}*
🪪 *CPF:* ${agendamento.motorista_cpf}
📱 *WhatsApp/Tel:* ${agendamento.motorista_telefone || 'Não informado'}
🛣️ *Tipo de Veículo:* *${agendamento.tipo_veiculo}*
⚖️ *Placas:*
${placasFormatadasWhats}

📦 *DADOS DA CARGA:*
🪨 *Material:* *${agendamento.material}*
🏷️ *Nº do Bloco:* *${agendamento.numero_bloco}*
💼 *Cliente Destinatário:* *${clienteNome}* ${clienteCnpj ? `(CNPJ: ${clienteCnpj})` : ''}
${agendamento.observacoes ? `\n📌 *Observações:* _${agendamento.observacoes}_\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 *DOCUMENTOS OBRIGATÓRIOS NA PEDREIRA:*
• Obrigatório apresentação de CRLVs do cavalo e carreta atualizados;
• CNH compatível com o veículo;
• Motorista deve possuir o curso de cargas indivisíveis;
• Laudo de inspeção de rochas ou CSV dentro da validade.
━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ *AVISO AO TRANSPORTADOR:*
_O transportador deverá sempre confirmar com o cliente, antes de realizar o carregamento, se os blocos estão devidamente envelopados e se encontram finalizados e liberados para transporte._

_Essa confirmação é fundamental para evitar imprevistos, atrasos ou problemas durante o carregamento e o transporte._
━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️ *Apresente esta confirmação e os documentos na portaria da pedreira.*
_Portal Oficial de Agendamentos • Vermont Mineração_`;
    }

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoWhats)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="modal-comprovante-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 10, 8, 0.9)',
      backdropFilter: 'blur(10px)',
      zIndex: 300,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }}>
      <div 
        id="comprovante-imprimir"
        className="glass-panel animate-fade comprovante-box"
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '24px 28px',
          background: '#0e1412',
          border: '1px solid var(--vermont-green-border)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), var(--vermont-green-glow)',
          position: 'relative',
          borderRadius: 16
        }}
      >
        {/* Fechar topo */}
        <button
          onClick={onFechar}
          className="no-print"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            color: 'var(--slate-400)',
            cursor: 'pointer',
            padding: 6,
            borderRadius: 8
          }}
        >
          <X size={20} />
        </button>

        {/* Cabeçalho do Comprovante com Logo Vermont */}
        <div className="comprovante-header-section" style={{ textAlign: 'center', paddingBottom: 16, borderBottom: '1px dashed rgba(0, 118, 44, 0.4)' }}>
          {/* Logo / Emblema Vermont */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <img 
              src="https://vermontmineracao.com/wp-content/uploads/2022/07/logo-vermont-site-1.png" 
              alt="Vermont Mineração" 
              className="comprovante-logo-print"
              style={{ maxHeight: 38, objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff', letterSpacing: '0.04em' }} className="comprovante-empresa-titulo">
              VERMONT MINERAÇÃO
            </span>
          </div>

          <div className="no-print" style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(0, 118, 44, 0.2)',
            border: '1px solid #009e3b',
            color: '#4ade80',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8
          }}>
            <CheckCircle2 size={30} />
          </div>

          <h2 className="comprovante-titulo" style={{ fontSize: '1.35rem', margin: '0 0 4px 0', color: '#fff' }}>
            {isCombinado ? 'Agendamento Combinado Confirmado!' : 'Agendamento Confirmado!'}
          </h2>
          <p className="comprovante-subtitulo" style={{ margin: 0, fontSize: '0.86rem', color: '#86efac' }}>
            {isCombinado 
              ? `Autorização Oficial de Entrada & Rota Combinada (${listaPontos.length} Pedreiras / Blocos) • Polo Ceará` 
              : 'Autorização Oficial de Entrada & Carregamento • Polo Ceará'}
          </p>

          <div className="comprovante-protocolo-badge" style={{
            display: 'inline-block',
            marginTop: 10,
            padding: '6px 20px',
            background: 'rgba(0, 118, 44, 0.2)',
            border: '1px solid var(--vermont-green-border)',
            borderRadius: 8,
            fontFamily: 'monospace',
            fontSize: '1.05rem',
            color: '#4ade80',
            fontWeight: 700
          }}>
            PROTOCOLO: #{protocolo}
          </div>
        </div>

        {/* Detalhes do Agendamento */}
        <div className="comprovante-corpo-grid" style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          {/* Se for Carga Combinada: Roteiro dos Pontos */}
          {isCombinado && listaPontos.length > 0 ? (
            <div className="comprovante-card comprovante-card-combinado" style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--vermont-green-border)',
              borderRadius: 10,
              padding: 14
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4ade80' }} className="comprovante-card-titulo">
                  <MapPin size={18} />
                  <strong style={{ fontSize: '0.94rem' }}>Roteiro de Carregamento ({listaPontos.length} Pedreiras / Blocos)</strong>
                </div>
                <span className="badge badge-vermont" style={{ fontSize: '0.72rem' }}>Carga Combinada</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {listaPontos.map((pt, idx) => {
                  const themeColors = [
                    { bg: 'rgba(0, 118, 44, 0.12)', border: 'rgba(0, 118, 44, 0.35)', text: '#86efac', circle: '#00762c' },
                    { bg: 'rgba(56, 189, 248, 0.10)', border: 'rgba(56, 189, 248, 0.3)', text: '#38bdf8', circle: '#0284c7' },
                    { bg: 'rgba(234, 179, 8, 0.10)', border: 'rgba(234, 179, 8, 0.35)', text: '#fde047', circle: '#ca8a04' }
                  ][idx % 3];

                  return (
                    <div key={idx} className="comprovante-subcard-ponto" style={{
                      background: themeColors.bg,
                      border: `1px solid ${themeColors.border}`,
                      borderRadius: 8,
                      padding: '10px 14px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: themeColors.text, fontWeight: 700, fontSize: '0.85rem', marginBottom: 6 }}>
                        <span style={{ background: themeColors.circle, color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                          {idx + 1}
                        </span>
                        {idx + 1}º Ponto de Carregamento
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6, fontSize: '0.86rem' }}>
                        <div><span style={{ color: 'var(--slate-400)' }}>Pedreira:</span> <strong style={{ color: '#fff' }} className="print-text-dark">{pt.pedreira}</strong></div>
                        <div><span style={{ color: 'var(--slate-400)' }}>Material:</span> <strong style={{ color: themeColors.text }} className="print-text-dark">{pt.material}</strong></div>
                        <div><span style={{ color: 'var(--slate-400)' }}>Bloco:</span> <strong style={{ color: '#fff' }} className="print-text-dark">{pt.numero_bloco}</strong></div>
                        <div><span style={{ color: 'var(--slate-400)' }}>Data & Horário:</span> <strong style={{ color: themeColors.text }} className="print-text-dark">{formatarDataBR(pt.data_agendamento)} às {pt.horario_agendamento}</strong></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Local e Data Simples */}
              <div className="comprovante-card comprovante-card-local" style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: 10,
                padding: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4ade80', marginBottom: 8 }} className="comprovante-card-titulo">
                  <MapPin size={18} />
                  <strong style={{ fontSize: '0.92rem' }}>Local & Horário de Carregamento</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, fontSize: '0.88rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--slate-400)' }}>Pedreira:</span> <strong style={{ color: '#fff' }} className="print-text-dark">{agendamento.pedreira}</strong></div>
                  <div><span style={{ color: 'var(--slate-400)' }}>Data do Carregamento:</span> <strong className="print-text-dark">{formatarDataBR(agendamento.data_agendamento)}</strong></div>
                  <div>
                    <span style={{ color: 'var(--slate-400)' }}>Horário Agendado:</span>{' '}
                    <strong style={{ color: '#4ade80' }} className="print-text-dark">
                      {agendamento.horario_agendamento} {agendamento.justificativa_outros ? `(${agendamento.justificativa_outros})` : ''}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Dados da Carga Simples */}
              <div className="comprovante-card comprovante-card-carga" style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: 10,
                padding: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fbbf24', marginBottom: 8 }} className="comprovante-card-titulo">
                  <FileText size={18} />
                  <strong style={{ fontSize: '0.92rem' }}>Informações do Bloco & Material</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, fontSize: '0.88rem' }}>
                  <div><span style={{ color: 'var(--slate-400)' }}>Nº do Bloco:</span> <strong style={{ color: '#fff' }} className="print-text-dark">{agendamento.numero_bloco}</strong></div>
                  <div><span style={{ color: 'var(--slate-400)' }}>Material:</span> <strong style={{ color: '#fff' }} className="print-text-dark">{agendamento.material}</strong></div>
                </div>
              </div>
            </>
          )}

          {/* Dados do Transporte, Veículo e Cliente */}
          <div className="comprovante-card comprovante-card-transporte" style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: 10,
            padding: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8', marginBottom: 8 }} className="comprovante-card-titulo">
              <Truck size={18} />
              <strong style={{ fontSize: '0.92rem' }}>Dados do Transporte, Veículo & Destinatário</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: '0.88rem' }}>
              <div>
                <span style={{ color: 'var(--slate-400)' }}>Cliente Destinatário:</span> <strong className="print-text-dark">{clienteNome}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-400)' }}>CNPJ Destinatário:</span> <strong className="print-text-dark" style={{ fontFamily: 'monospace' }}>{clienteCnpj || 'Não informado'}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--slate-400)' }}>Transportadora:</span> <strong className="print-text-dark">{transportadoraNome}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-400)' }}>CNPJ Transportadora:</span> <strong className="print-text-dark" style={{ fontFamily: 'monospace' }}>{transportadoraCnpj || 'Não informado'}</strong>
              </div>

              <div><span style={{ color: 'var(--slate-400)' }}>Motorista:</span> <strong className="print-text-dark">{agendamento.motorista_nome}</strong></div>
              <div><span style={{ color: 'var(--slate-400)' }}>CPF Motorista:</span> <strong className="print-text-dark" style={{ fontFamily: 'monospace' }}>{agendamento.motorista_cpf}</strong></div>
              <div><span style={{ color: 'var(--slate-400)' }}>WhatsApp / Contato:</span> <strong className="print-text-dark">{agendamento.motorista_telefone || 'Não informado'}</strong></div>
              <div>
                <span style={{ color: 'var(--slate-400)' }}>Tipo do Veículo:</span> <strong style={{ color: '#4ade80' }} className="print-text-dark">{agendamento.tipo_veiculo}</strong>
              </div>

              {/* Placas com rótulo correto: "Carreta" para 1 carreta, "1ª / 2ª" para Bitrem */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 2, padding: '6px 10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 6 }} className="comprovante-placas-box">
                {listaPlacas.map((item, idx) => (
                  <div key={idx}>
                    <span style={{ color: 'var(--slate-400)' }}>{item.label}:</span>{' '}
                    <strong style={{ fontFamily: 'monospace', color: '#fff' }} className="print-text-dark">{item.placa}</strong>
                  </div>
                ))}
              </div>

              {agendamento.observacoes && (
                <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                  <span style={{ color: 'var(--slate-400)' }}>Observações:</span>{' '}
                  <span style={{ color: 'var(--slate-300)' }} className="print-text-dark">{agendamento.observacoes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Documentos Obrigatórios na Pedreira */}
          <div className="comprovante-card comprovante-card-docs" style={{
            background: 'rgba(0, 118, 44, 0.08)',
            border: '1px solid rgba(0, 118, 44, 0.3)',
            borderRadius: 10,
            padding: 12,
            fontSize: '0.82rem'
          }}>
            <strong style={{ color: '#4ade80', display: 'block', marginBottom: 4 }} className="comprovante-docs-titulo">
              📄 Documentação Obrigatória para Apresentação na Pedreira:
            </strong>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--slate-300)', lineHeight: '1.45' }} className="comprovante-docs-lista">
              <li>Obrigatório apresentação de CRLVs do cavalo e carreta atualizados;</li>
              <li>CNH compatível com o veículo;</li>
              <li>Motorista deve possuir o curso de cargas indivisíveis;</li>
              <li>Laudo de inspeção de rochas ou CSV dentro da validade.</li>
            </ul>

            {/* Alerta Operacional: Confirmação Prévia com Clientes */}
            <div className="comprovante-alerta-box" style={{
              marginTop: 10,
              padding: '8px 10px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              color: '#fef3c7',
              fontSize: '0.77rem',
              lineHeight: '1.4'
            }}>
              <AlertTriangle size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ color: '#fde047' }}>Atenção Transportador:</strong>{' '}
                O transportador deverá sempre confirmar com o cliente, antes de realizar o carregamento, se os blocos estão devidamente envelopados e se encontram finalizados e liberados para transporte.
              </div>
            </div>
          </div>

          {/* Assinaturas Oficiais para o Documento Impresso / PDF */}
          <div className="comprovante-assinaturas-print" style={{ display: 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginTop: 18, paddingTop: 14 }}>
              <div>
                <div style={{ borderBottom: '1px solid #334155', height: 32, marginBottom: 4 }}></div>
                <div style={{ fontSize: '11px', textAlign: 'center', fontWeight: 600, color: '#1e293b' }}>
                  Assinatura do Motorista ({agendamento.motorista_nome})
                </div>
              </div>
              <div>
                <div style={{ borderBottom: '1px solid #334155', height: 32, marginBottom: 4 }}></div>
                <div style={{ fontSize: '11px', textAlign: 'center', fontWeight: 600, color: '#1e293b' }}>
                  Visto da Portaria / Balança Vermont Mineração
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12, textAlign: 'center', fontSize: '10px', color: '#64748b' }}>
              Emitido eletronicamente via Portal Oficial de Agendamentos Vermont Mineração em {new Date().toLocaleString('pt-BR')} • Protocolo: #{protocolo}
            </div>
          </div>
        </div>

        {/* Aviso de Confirmação por e-mail */}
        <div className="no-print" style={{
          fontSize: '0.78rem',
          color: 'var(--slate-400)',
          textAlign: 'center',
          padding: '8px 0',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          Notificação automática despachada para a coordenação de logística da Vermont Mineração.
        </div>

        {/* Painel Interativo de Envio de E-mail para o Cliente Destinatário */}
        {mostrarPainelEmail && (
          <form 
            onSubmit={handleEnviarEmail}
            className="no-print animate-fade" 
            style={{
              marginTop: 14,
              padding: '16px 18px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8', fontWeight: 700, fontSize: '0.92rem' }}>
                <Mail size={18} />
                <span>Enviar Comprovante & Documentos por E-mail</span>
              </div>
              <button
                type="button"
                onClick={() => setMostrarPainelEmail(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--slate-400)', cursor: 'pointer', padding: 2 }}
                title="Fechar formulário de e-mail"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--slate-300)', marginBottom: 4, fontWeight: 600 }}>
                E-mail do Cliente Destinatário / Transportador: *
              </label>
              <input
                type="email"
                required
                placeholder="exemplo: cliente@empresa.com.br ou logistica@transportadora.com.br"
                value={emailDestino}
                onChange={(e) => setEmailDestino(e.target.value)}
                className="form-input"
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.85)',
                  borderColor: 'rgba(56, 189, 248, 0.35)',
                  fontSize: '0.86rem',
                  padding: '10px 12px'
                }}
                autoFocus
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--slate-300)', marginBottom: 4, fontWeight: 600 }}>
                Mensagem adicional (opcional):
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Segue autorização oficial de agendamento e lista de documentos exigidos na pedreira."
                value={mensagemEmail}
                onChange={(e) => setMensagemEmail(e.target.value)}
                className="form-input"
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.85)',
                  borderColor: 'rgba(56, 189, 248, 0.35)',
                  fontSize: '0.82rem',
                  padding: '8px 12px',
                  resize: 'none'
                }}
              />
            </div>

            {statusEmail && (
              <div style={{
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: '0.8rem',
                background: statusEmail.tipo === 'sucesso' ? 'var(--success-bg)' : 'var(--danger-bg)',
                border: statusEmail.tipo === 'sucesso' ? '1px solid var(--success-border)' : '1px solid var(--danger-border)',
                color: statusEmail.tipo === 'sucesso' ? '#6ee7b7' : '#fca5a5'
              }}>
                {statusEmail.texto}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 2 }}>
              <button
                type="submit"
                disabled={enviandoEmail}
                className="btn btn-vermont"
                style={{ padding: '8px 16px', fontSize: '0.82rem', gap: 6 }}
              >
                <Send size={15} />
                {enviandoEmail ? 'Enviando...' : 'Enviar Agora'}
              </button>

              <a
                href={gerarLinkMailtoComprovante(agendamento, emailDestino, mensagemEmail)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.82rem', gap: 6, textDecoration: 'none' }}
                title="Abre seu aplicativo de e-mail padrão (Outlook, Thunderbird, Gmail Web) com o comprovante já redigido"
              >
                <ExternalLink size={15} />
                Abrir no meu Aplicativo de E-mail
              </a>

              <button
                type="button"
                onClick={() => setMostrarPainelEmail(false)}
                className="btn btn-secondary"
                style={{ padding: '8px 12px', fontSize: '0.82rem', marginLeft: 'auto' }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Ações / Botões Principais */}
        <div className="no-print" style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              setMostrarPainelEmail(!mostrarPainelEmail);
              setStatusEmail(null);
            }}
            className="btn btn-secondary"
            style={{ 
              flex: 1, 
              minWidth: 150, 
              background: mostrarPainelEmail ? 'rgba(56, 189, 248, 0.2)' : 'rgba(56, 189, 248, 0.12)', 
              borderColor: 'rgba(56, 189, 248, 0.45)', 
              color: '#38bdf8',
              fontWeight: 600
            }}
            title="Enviar comprovante e documentos para o e-mail do cliente ou transportadora"
          >
            <Mail size={18} />
            Enviar por E-mail
          </button>

          <button
            type="button"
            onClick={handleCompartilharWhatsApp}
            className="btn btn-success"
            style={{ flex: 1, minWidth: 150 }}
          >
            <Share2 size={18} />
            WhatsApp
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-secondary"
            style={{ flex: 1, minWidth: 130 }}
          >
            <Printer size={18} />
            Imprimir / PDF
          </button>

          <button
            type="button"
            onClick={onNovoAgendamento}
            className="btn btn-vermont"
            style={{ flex: 1, minWidth: 140 }}
          >
            Novo Agendamento
          </button>
        </div>
      </div>
    </div>
  );
}
