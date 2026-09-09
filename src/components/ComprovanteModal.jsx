import React from 'react';
import { CheckCircle2, Printer, Share2, Truck, MapPin, FileText, X, AlertTriangle, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatarPlacasExibicao, formatarDataBR, AVISO_CONFIRMACAO_CLIENTE } from '../services/agendamentoService';

export function ComprovanteModal({ agendamento, onFechar, onNovoAgendamento }) {
  if (!agendamento) return null;

  React.useEffect(() => {
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
  }, []);

  const protocolo = (agendamento.id || 'VT-' + Date.now()).substring(0, 8).toUpperCase();

  const handlePrint = () => {
    window.print();
  };

  // Lista de placas formatadas corretamente (Carreta simples se for 1 carreta, 1ª e 2ª se for Bitrem)
  const listaPlacas = formatarPlacasExibicao(agendamento);

  const isCombinado = agendamento.is_combinado || (agendamento.observacoes && agendamento.observacoes.includes('[Carga Combinada'));
  const ponto1 = agendamento.ponto1 || agendamento.pontos?.[0] || agendamento;
  const ponto2 = agendamento.ponto2 || agendamento.pontos?.[1];

  // Formatação das placas para o texto do WhatsApp
  const placasFormatadasWhats = listaPlacas
    .map(p => `   🔹 *${p.label}:* ${p.placa}`)
    .join('\n');

  // Mensagem oficial atrativa para WhatsApp
  const handleCompartilharWhatsApp = () => {
    let textoWhats = '';

    if (isCombinado && ponto2) {
      textoWhats = 
`🏗️ *VERMONT MINERAÇÃO LTDA.* 🪨
*AUTORIZAÇÃO OFICIAL DE AGENDAMENTO • CARGA COMBINADA*
━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *PROTOCOLO:* #${protocolo}
✅ *STATUS:* *AGENDAMENTO COMBINADO CONFIRMADO (2 PONTOS)*

📍 *ROTEIRO DE CARREGAMENTO:*

🔸 *1º PONTO DE CARREGAMENTO:*
🏢 *Pedreira:* *${ponto1.pedreira}*
🪨 *Material:* *${ponto1.material}*
🏷️ *Nº do Bloco:* *${ponto1.numero_bloco}*
📅 *Data:* *${formatarDataBR(ponto1.data_agendamento)}*
⏰ *Horário:* *${ponto1.horario_agendamento}*

🔸 *2º PONTO DE CARREGAMENTO:*
🏢 *Pedreira:* *${ponto2.pedreira}*
🪨 *Material:* *${ponto2.material}*
🏷️ *Nº do Bloco:* *${ponto2.numero_bloco}*
📅 *Data:* *${formatarDataBR(ponto2.data_agendamento)}*
⏰ *Horário:* *${ponto2.horario_agendamento}*

🚛 *DADOS DO TRANSPORTE:*
🏢 *Transportadora:* *${agendamento.transportadora}*
👤 *Motorista:* *${agendamento.motorista_nome}*
🪪 *CPF:* ${agendamento.motorista_cpf}
📱 *WhatsApp/Tel:* ${agendamento.motorista_telefone || 'Não informado'}
🛣️ *Tipo de Veículo:* *${agendamento.tipo_veiculo}*
⚖️ *Placas:*
${placasFormatadasWhats}
💼 *Cliente Destinatário:* *${agendamento.cliente}*
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
🏢 *Transportadora:* *${agendamento.transportadora}*
👤 *Motorista:* *${agendamento.motorista_nome}*
🪪 *CPF:* ${agendamento.motorista_cpf}
📱 *WhatsApp/Tel:* ${agendamento.motorista_telefone || 'Não informado'}
🛣️ *Tipo de Veículo:* *${agendamento.tipo_veiculo}*
⚖️ *Placas:*
${placasFormatadasWhats}

📦 *DADOS DA CARGA:*
🪨 *Material:* *${agendamento.material}*
🏷️ *Nº do Bloco:* *${agendamento.numero_bloco}*
💼 *Cliente Destinatário:* *${agendamento.cliente}*
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
    <div style={{
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
        className="glass-panel animate-fade"
        style={{
          width: '100%',
          maxWidth: 640,
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '26px 30px',
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
        <div style={{ textAlign: 'center', paddingBottom: 18, borderBottom: '1px dashed rgba(0, 118, 44, 0.4)' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(0, 118, 44, 0.2)',
            border: '1px solid #009e3b',
            color: '#4ade80',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10
          }}>
            <CheckCircle2 size={34} />
          </div>

          <h2 style={{ fontSize: '1.45rem', margin: '0 0 4px 0', color: '#fff' }}>
            {isCombinado ? 'Agendamento Combinado Confirmado!' : 'Agendamento Confirmado!'}
          </h2>
          <p style={{ margin: 0, fontSize: '0.86rem', color: '#86efac' }}>
            {isCombinado 
              ? 'Autorização Oficial de Entrada & Rota Combinada (2 Pedreiras) • Vermont Mineração' 
              : 'Autorização Oficial de Entrada & Carregamento • Vermont Mineração'}
          </p>

          <div style={{
            display: 'inline-block',
            marginTop: 12,
            padding: '6px 18px',
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
        <div style={{ padding: '18px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* Se for Carga Combinada: Roteiro dos 2 Pontos */}
          {isCombinado && ponto2 ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--vermont-green-border)',
              borderRadius: 10,
              padding: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4ade80' }}>
                  <MapPin size={18} />
                  <strong style={{ fontSize: '0.96rem' }}>Roteiro de Carregamento (2 Pedreiras)</strong>
                </div>
                <span className="badge badge-vermont" style={{ fontSize: '0.72rem' }}>Carga Combinada</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* 1º Ponto */}
                <div style={{
                  background: 'rgba(0, 118, 44, 0.12)',
                  border: '1px solid rgba(0, 118, 44, 0.35)',
                  borderRadius: 8,
                  padding: '10px 14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#86efac', fontWeight: 700, fontSize: '0.85rem', marginBottom: 6 }}>
                    <span style={{ background: '#00762c', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>1</span>
                    1º Ponto de Carregamento
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6, fontSize: '0.86rem' }}>
                    <div><span style={{ color: 'var(--slate-400)' }}>Pedreira:</span> <strong style={{ color: '#fff' }}>{ponto1.pedreira}</strong></div>
                    <div><span style={{ color: 'var(--slate-400)' }}>Material:</span> <strong style={{ color: '#86efac' }}>{ponto1.material}</strong></div>
                    <div><span style={{ color: 'var(--slate-400)' }}>Bloco:</span> <strong style={{ color: '#fff' }}>{ponto1.numero_bloco}</strong></div>
                    <div><span style={{ color: 'var(--slate-400)' }}>Data & Horário:</span> <strong style={{ color: '#4ade80' }}>{formatarDataBR(ponto1.data_agendamento)} às {ponto1.horario_agendamento}</strong></div>
                  </div>
                </div>

                {/* 2º Ponto */}
                <div style={{
                  background: 'rgba(56, 189, 248, 0.10)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: 8,
                  padding: '10px 14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem', marginBottom: 6 }}>
                    <span style={{ background: '#0284c7', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>2</span>
                    2º Ponto de Carregamento
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6, fontSize: '0.86rem' }}>
                    <div><span style={{ color: 'var(--slate-400)' }}>Pedreira:</span> <strong style={{ color: '#fff' }}>{ponto2.pedreira}</strong></div>
                    <div><span style={{ color: 'var(--slate-400)' }}>Material:</span> <strong style={{ color: '#38bdf8' }}>{ponto2.material}</strong></div>
                    <div><span style={{ color: 'var(--slate-400)' }}>Bloco:</span> <strong style={{ color: '#fff' }}>{ponto2.numero_bloco}</strong></div>
                    <div><span style={{ color: 'var(--slate-400)' }}>Data & Horário:</span> <strong style={{ color: '#38bdf8' }}>{formatarDataBR(ponto2.data_agendamento)} às {ponto2.horario_agendamento}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Local e Data Simples */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: 10,
                padding: 14
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4ade80', marginBottom: 8 }}>
                  <MapPin size={18} />
                  <strong style={{ fontSize: '0.92rem' }}>Local & Horário de Carregamento</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: '0.88rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--slate-400)' }}>Pedreira:</span> <strong style={{ color: '#fff' }}>{agendamento.pedreira}</strong></div>
                  <div><span style={{ color: 'var(--slate-400)' }}>Data:</span> <strong>{formatarDataBR(agendamento.data_agendamento)}</strong></div>
                  <div>
                    <span style={{ color: 'var(--slate-400)' }}>Horário:</span>{' '}
                    <strong style={{ color: '#4ade80' }}>
                      {agendamento.horario_agendamento} {agendamento.justificativa_outros ? `(${agendamento.justificativa_outros})` : ''}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Dados da Carga Simples */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: 10,
                padding: 14
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fbbf24', marginBottom: 8 }}>
                  <FileText size={18} />
                  <strong style={{ fontSize: '0.92rem' }}>Informações do Bloco & Cliente</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: '0.88rem' }}>
                  <div><span style={{ color: 'var(--slate-400)' }}>Bloco Nº:</span> <strong style={{ color: '#fff' }}>{agendamento.numero_bloco}</strong></div>
                  <div><span style={{ color: 'var(--slate-400)' }}>Material Imputado:</span> <strong style={{ color: '#fff' }}>{agendamento.material}</strong></div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: 'var(--slate-400)' }}>Cliente Destinatário:</span> <strong>{agendamento.cliente}</strong>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Dados do Transporte */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: 10,
            padding: 14
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8', marginBottom: 8 }}>
              <Truck size={18} />
              <strong style={{ fontSize: '0.92rem' }}>Veículo, Motorista & Cliente</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: '0.88rem' }}>
              <div><span style={{ color: 'var(--slate-400)' }}>Transportadora:</span> <strong>{agendamento.transportadora}</strong></div>
              <div><span style={{ color: 'var(--slate-400)' }}>Cliente:</span> <strong>{agendamento.cliente}</strong></div>
              <div><span style={{ color: 'var(--slate-400)' }}>Motorista:</span> <strong>{agendamento.motorista_nome}</strong></div>
              <div><span style={{ color: 'var(--slate-400)' }}>CPF:</span> <strong>{agendamento.motorista_cpf}</strong></div>
              <div><span style={{ color: 'var(--slate-400)' }}>Telefone:</span> <strong>{agendamento.motorista_telefone || 'Não informado'}</strong></div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: 'var(--slate-400)' }}>Tipo do Veículo:</span> <strong style={{ color: '#4ade80' }}>{agendamento.tipo_veiculo}</strong>
              </div>

              {/* Placas com rótulo correto: "Carreta" para 1 carreta, "1ª / 2ª" para Bitrem */}
              {listaPlacas.map((item, idx) => (
                <div key={idx}>
                  <span style={{ color: 'var(--slate-400)' }}>{item.label}:</span>{' '}
                  <strong style={{ fontFamily: 'monospace', color: '#fff' }}>{item.placa}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Documentos Obrigatórios na Pedreira */}
          <div style={{
            background: 'rgba(0, 118, 44, 0.08)',
            border: '1px solid rgba(0, 118, 44, 0.3)',
            borderRadius: 10,
            padding: 12,
            fontSize: '0.82rem'
          }}>
            <strong style={{ color: '#4ade80', display: 'block', marginBottom: 4 }}>
              📄 Documentação Obrigatória para Apresentação na Pedreira:
            </strong>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--slate-300)', lineHeight: '1.5' }}>
              <li>Obrigatório apresentação de CRLVs do cavalo e carreta atualizados;</li>
              <li>CNH compatível com o veículo;</li>
              <li>Motorista deve possuir o curso de cargas indivisíveis;</li>
              <li>Laudo de inspeção de rochas ou CSV dentro da validade.</li>
            </ul>

            {/* Alerta Operacional: Confirmação Prévia com Clientes */}
            <div style={{
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
                <div style={{ marginTop: 2, color: '#fde68a', fontWeight: 500, fontSize: '0.74rem' }}>
                  Essa confirmação é fundamental para evitar imprevistos, atrasos ou problemas durante o carregamento e o transporte.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Aviso de Confirmação por e-mail */}
        <div style={{
          fontSize: '0.78rem',
          color: 'var(--slate-400)',
          textAlign: 'center',
          padding: '8px 0',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          Notificação automática despachada para a coordenação de logística da Vermont Mineração.
        </div>

        {/* Ações / Botões */}
        <div className="no-print" style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleCompartilharWhatsApp}
            className="btn btn-success"
            style={{ flex: 1, minWidth: 160 }}
          >
            <Share2 size={18} />
            Compartilhar no WhatsApp
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-secondary"
            style={{ flex: 1, minWidth: 130 }}
          >
            <Printer size={18} />
            Imprimir
          </button>

          <button
            type="button"
            onClick={onNovoAgendamento}
            className="btn btn-vermont"
            style={{ flex: 1, minWidth: 150 }}
          >
            Novo Agendamento
          </button>
        </div>
      </div>
    </div>
  );
}
