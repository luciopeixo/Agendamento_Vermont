import React from 'react';
import { History, X, User, Clock, ArrowRight, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { formatarDataBR, normalizarHistoricoStatus } from '../services/agendamentoService';

export function ModalHistoricoStatus({ agendamento, onFechar }) {
  if (!agendamento) return null;

  const historico = normalizarHistoricoStatus(agendamento.historico_status);
  const protocolo = (agendamento.id || '').substring(0, 8).toUpperCase();

  const formatarDataHoraCompleta = (isoString) => {
    if (!isoString) return '-';
    try {
      const dt = new Date(isoString);
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'medium'
      }).format(dt);
    } catch (e) {
      return isoString;
    }
  };

  const getCorStatus = (status) => {
    switch (status) {
      case 'Aguardando Liberação':
        return { bg: 'var(--warning-bg)', border: 'var(--warning-border)', text: 'var(--warning-title)', dot: '#f59e0b' };
      case 'Liberado para Carregar':
      case 'Confirmado':
        return { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(192, 132, 252, 0.45)', text: '#9333ea', dot: '#a855f7' };
      case 'Carregando':
        return { bg: 'var(--info-bg)', border: 'var(--info-border)', text: '#0284c7', dot: '#0284c7' };
      case 'Finalizado':
      case 'Carregado':
        return { bg: 'var(--success-bg)', border: 'var(--success-border)', text: 'var(--vermont-green)', dot: '#10b981' };
      case 'Cancelado':
        return { bg: 'var(--danger-bg)', border: 'var(--danger-border)', text: 'var(--danger-title)', dot: '#ef4444' };
      default:
        return { bg: 'var(--bg-card-hover)', border: 'var(--border-subtle)', text: 'var(--slate-200)', dot: '#94a3b8' };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 10, 8, 0.88)',
      backdropFilter: 'blur(8px)',
      zIndex: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }}>
      <div 
        className="glass-panel animate-fade"
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card-solid, #0d1311)',
          border: '1px solid var(--vermont-green-border)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), var(--vermont-green-glow)',
          borderRadius: 16,
          overflow: 'hidden'
        }}
      >
        {/* Cabeçalho */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
          background: 'var(--vermont-green-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--vermont-green-subtle)',
              border: '1px solid var(--vermont-green-border)',
              color: 'var(--vermont-green-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <History size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--slate-100)' }}>
                Histórico de Alterações de Status
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--slate-400)' }}>
                Rastreamento e auditoria de usuários • Protocolo #{protocolo}
              </p>
            </div>
          </div>

          <button
            onClick={onFechar}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--slate-400)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Resumo do Agendamento */}
        <div style={{
          padding: '14px 24px',
          background: 'var(--bg-card-hover, rgba(255, 255, 255, 0.02))',
          borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
          fontSize: '0.84rem'
        }}>
          <div><span style={{ color: 'var(--slate-400)' }}>Bloco:</span> <strong style={{ color: 'var(--slate-100)' }}>{agendamento.numero_bloco}</strong></div>
          <div><span style={{ color: 'var(--slate-400)' }}>Pedreira:</span> <strong style={{ color: 'var(--slate-100)' }}>{agendamento.pedreira}</strong></div>
          <div><span style={{ color: 'var(--slate-400)' }}>Material:</span> <strong style={{ color: 'var(--vermont-green-light)' }}>{agendamento.material}</strong></div>
          <div><span style={{ color: 'var(--slate-400)' }}>Motorista:</span> <strong style={{ color: 'var(--slate-100)' }}>{agendamento.motorista_nome}</strong></div>
          <div>
            <span style={{ color: 'var(--slate-400)' }}>Status Atual:</span>{' '}
            <strong style={{ color: getCorStatus(agendamento.status).text }}>
              {agendamento.status}
            </strong>
          </div>
        </div>

        {/* Linha do Tempo / Timeline de Histórico */}
        <div style={{
          padding: '20px 24px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          {historico.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '30px 20px',
              color: 'var(--slate-400)',
              fontSize: '0.88rem'
            }}>
              <AlertCircle size={32} color="var(--slate-400)" style={{ margin: '0 auto 10px auto', display: 'block' }} />
              Nenhuma alteração de status registrada após a criação inicial.
              <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--vermont-green-light)' }}>
                Status inicial: <strong>{agendamento.status || 'Aguardando Liberação'}</strong> criado em{' '}
                {formatarDataHoraCompleta(agendamento.created_at)}
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: 24 }}>
              {/* Linha vertical */}
              <div style={{
                position: 'absolute',
                top: 8,
                bottom: 8,
                left: 7,
                width: 2,
                background: 'var(--vermont-green-border, rgba(0, 118, 44, 0.4))'
              }} />

              {historico.map((item, index) => {
                const isEdicaoCampos = item.tipo === 'edicao_dados' || (Array.isArray(item.alteracoes) && item.alteracoes.length > 0);
                const corAnt = getCorStatus(item.status_anterior);
                const corNov = getCorStatus(item.status_novo);
                const dotColor = isEdicaoCampos ? '#38bdf8' : corNov.dot;

                return (
                  <div key={item.id || index} style={{
                    position: 'relative',
                    marginBottom: index === historico.length - 1 ? 0 : 20
                  }}>
                    {/* Marcador na linha */}
                    <div style={{
                      position: 'absolute',
                      left: -24,
                      top: 4,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: dotColor,
                      border: '3px solid var(--bg-card-solid, #0d1311)',
                      boxShadow: `0 0 10px ${dotColor}`
                    }} />

                    {/* Card do Evento */}
                    <div style={{
                      background: isEdicaoCampos ? 'var(--info-bg)' : 'var(--bg-card-hover, rgba(255, 255, 255, 0.03))',
                      border: isEdicaoCampos ? '1px solid var(--info-border)' : '1px solid var(--border-subtle)',
                      borderRadius: 10,
                      padding: '12px 16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={15} color={isEdicaoCampos ? "#0284c7" : "var(--vermont-green-light)"} />
                          <strong style={{ color: 'var(--slate-100)', fontSize: '0.88rem' }}>
                            {item.usuario_nome || 'Usuário'}
                          </strong>
                          {item.usuario_role && (
                            <span className="badge badge-vermont" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                              {item.usuario_role}
                            </span>
                          )}
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '1px 7px',
                            borderRadius: 4,
                            fontWeight: 600,
                            background: isEdicaoCampos ? 'var(--info-bg)' : 'var(--vermont-green-subtle)',
                            border: isEdicaoCampos ? '1px solid var(--info-border)' : '1px solid var(--vermont-green-border)',
                            color: isEdicaoCampos ? '#0284c7' : 'var(--vermont-green-light)'
                          }}>
                            {isEdicaoCampos ? '✏️ Alteração Cadastral' : '🔄 Mudança de Status'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--slate-400)', fontSize: '0.78rem' }}>
                          <Clock size={13} />
                          {formatarDataHoraCompleta(item.data_hora)}
                        </div>
                      </div>

                      {item.usuario_email && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: 8 }}>
                          E-mail: <span style={{ color: 'var(--slate-300)' }}>{item.usuario_email}</span>
                        </div>
                      )}

                      {/* Exibição de Alterações de Campos */}
                      {isEdicaoCampos && Array.isArray(item.alteracoes) && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          background: 'var(--bg-card-hover, rgba(0, 0, 0, 0.35))',
                          border: '1px solid var(--info-border)',
                          borderRadius: 8,
                          padding: '10px 12px'
                        }}>
                          <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700, marginBottom: 2 }}>
                            Campos alterados nesta edição:
                          </div>
                          {item.alteracoes.map((alt, idx) => (
                            <div key={idx} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontSize: '0.8rem',
                              flexWrap: 'wrap',
                              borderBottom: idx === item.alteracoes.length - 1 ? 'none' : '1px dashed var(--border-subtle)',
                              paddingBottom: idx === item.alteracoes.length - 1 ? 0 : 4
                            }}>
                              <strong style={{ color: 'var(--slate-200)', minWidth: 140 }}>
                                • {alt.label || alt.campo}:
                              </strong>
                              <span style={{
                                color: 'var(--danger-title)',
                                textDecoration: 'line-through',
                                background: 'var(--danger-bg)',
                                padding: '1px 6px',
                                borderRadius: 4,
                                fontSize: '0.76rem',
                                fontWeight: 600
                              }}>
                                {alt.de}
                              </span>
                              <ArrowRight size={13} color="var(--slate-400)" />
                              <span style={{
                                color: 'var(--vermont-green)',
                                fontWeight: 700,
                                background: 'var(--vermont-green-subtle)',
                                padding: '1px 6px',
                                borderRadius: 4,
                                fontSize: '0.76rem'
                              }}>
                                {alt.para}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Transição de Status */}
                      {!isEdicaoCampos && item.status_anterior && item.status_novo && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          background: 'var(--bg-card-hover, rgba(0, 0, 0, 0.35))',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 6,
                          padding: '6px 10px',
                          fontSize: '0.8rem',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>De:</span>
                          <span style={{
                            background: corAnt.bg,
                            border: `1px solid ${corAnt.border}`,
                            color: corAnt.text,
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}>
                            {item.status_anterior}
                          </span>

                          <ArrowRight size={14} color="var(--slate-400)" />

                          <span style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>Para:</span>
                          <span style={{
                            background: corNov.bg,
                            border: `1px solid ${corNov.border}`,
                            color: corNov.text,
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontWeight: 700,
                            fontSize: '0.75rem'
                          }}>
                            {item.status_novo}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Criação inicial */}
              <div style={{
                position: 'relative',
                marginTop: 20
              }}>
                <div style={{
                  position: 'absolute',
                  left: -24,
                  top: 4,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'var(--slate-400)',
                  border: '3px solid var(--bg-card-solid, #0d1311)'
                }} />
                <div style={{
                  background: 'var(--bg-card-hover, rgba(255, 255, 255, 0.02))',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: '0.8rem',
                  color: 'var(--slate-400)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>📥 Agendamento criado no portal</span>
                    <span style={{ fontSize: '0.75rem' }}>{formatarDataHoraCompleta(agendamento.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
          background: 'var(--bg-card-hover, rgba(0, 0, 0, 0.2))',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onFechar}
            className="btn btn-secondary"
            style={{ padding: '8px 20px', fontSize: '0.85rem' }}
          >
            Fechar Histórico
          </button>
        </div>
      </div>
    </div>
  );
}
