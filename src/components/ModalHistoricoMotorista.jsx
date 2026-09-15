import React from 'react';
import { History, X, User, Clock, ArrowRight, AlertCircle, ShieldCheck, Truck } from 'lucide-react';
import { formatarCPF, normalizarHistoricoMotorista } from '../services/agendamentoService';

export function ModalHistoricoMotorista({ motorista, onFechar }) {
  if (!motorista) return null;

  const historico = normalizarHistoricoMotorista(motorista.historico_edicoes);
  const cpfFmt = formatarCPF(motorista.cpf);

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

  return (
    <div 
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 10, 8, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div 
        className="glass-panel animate-fade"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 720,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0d1311',
          border: '1px solid var(--vermont-green-border)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), var(--vermont-green-glow)',
          borderRadius: 16,
          overflow: 'hidden'
        }}
      >
        {/* Cabeçalho */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 118, 44, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: 'rgba(0, 118, 44, 0.25)',
              border: '1px solid #009e3b',
              color: '#4ade80',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <History size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', margin: 0, color: '#fff', fontWeight: 800 }}>
                Histórico de Alterações • Motorista & Frota
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--slate-400)' }}>
                Auditoria de edições, documentos e ações de usuários • {motorista.nome || 'Motorista'} ({cpfFmt})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            style={{
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
        </div>

        {/* Resumo do Motorista */}
        <div style={{
          padding: '14px 24px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 10,
          fontSize: '0.84rem'
        }}>
          <div><span style={{ color: 'var(--slate-400)' }}>Nome:</span> <strong style={{ color: '#fff' }}>{motorista.nome || '-'}</strong></div>
          <div><span style={{ color: 'var(--slate-400)' }}>CPF:</span> <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{cpfFmt}</strong></div>
          <div><span style={{ color: 'var(--slate-400)' }}>Transportadora:</span> <strong style={{ color: '#e2e8f0' }}>{motorista.transportadora || '-'}</strong></div>
          <div><span style={{ color: 'var(--slate-400)' }}>Cavalo:</span> <strong style={{ color: '#38bdf8' }}>{motorista.placa_cavalo || '-'}</strong></div>
          <div><span style={{ color: 'var(--slate-400)' }}>Carreta:</span> <strong style={{ color: '#c084fc' }}>{motorista.placa_carreta || '-'}</strong></div>
        </div>

        {/* Linha do Tempo / Timeline */}
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
              padding: '36px 20px',
              color: 'var(--slate-400)',
              fontSize: '0.88rem'
            }}>
              <AlertCircle size={36} color="var(--slate-500)" style={{ margin: '0 auto 10px auto', display: 'block' }} />
              Nenhum histórico detalhado de edições registrado anteriormente para este motorista.
              <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#86efac' }}>
                {motorista.atualizado_em ? (
                  <>Último registro/atualização em: <strong>{formatarDataHoraCompleta(motorista.atualizado_em)}</strong> por <strong>{motorista.atualizado_por || 'Sistema'}</strong></>
                ) : (
                  'Todas as novas edições a partir de agora serão registradas com auditoria completa.'
                )}
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
                background: 'rgba(0, 118, 44, 0.4)'
              }} />

              {historico.map((item, index) => {
                const isCadastroInicial = item.tipo === 'cadastro_inicial';
                const dotColor = isCadastroInicial ? '#10b981' : '#38bdf8';

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
                      border: '3px solid #0d1311',
                      boxShadow: `0 0 10px ${dotColor}`
                    }} />

                    {/* Card do Evento */}
                    <div style={{
                      background: isCadastroInicial ? 'rgba(16, 185, 129, 0.04)' : 'rgba(56, 189, 248, 0.04)',
                      border: isCadastroInicial ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: 10,
                      padding: '12px 16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <User size={15} color={isCadastroInicial ? "#4ade80" : "#38bdf8"} />
                          <strong style={{ color: '#fff', fontSize: '0.88rem' }}>
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
                            background: isCadastroInicial ? 'rgba(74, 222, 128, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                            border: isCadastroInicial ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(56, 189, 248, 0.4)',
                            color: isCadastroInicial ? '#4ade80' : '#38bdf8'
                          }}>
                            {isCadastroInicial ? '📥 Cadastro Inicial' : '✏️ Edição de Dados'}
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

                      {item.descricao && (
                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: 8 }}>
                          {item.descricao}
                        </div>
                      )}

                      {/* Exibição de Alterações de Campos */}
                      {Array.isArray(item.alteracoes) && item.alteracoes.length > 0 && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          background: 'rgba(0, 0, 0, 0.35)',
                          border: '1px solid rgba(56, 189, 248, 0.15)',
                          borderRadius: 8,
                          padding: '10px 12px'
                        }}>
                          <div style={{ fontSize: '0.75rem', color: '#7dd3fc', fontWeight: 600, marginBottom: 2 }}>
                            Campos alterados nesta ação:
                          </div>
                          {item.alteracoes.map((alt, idx) => (
                            <div key={idx} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontSize: '0.8rem',
                              flexWrap: 'wrap',
                              borderBottom: idx === item.alteracoes.length - 1 ? 'none' : '1px dashed rgba(255, 255, 255, 0.06)',
                              paddingBottom: idx === item.alteracoes.length - 1 ? 0 : 4
                            }}>
                              <strong style={{ color: '#cbd5e1', minWidth: 160 }}>
                                • {alt.label || alt.campo}:
                              </strong>
                              <span style={{
                                color: '#fca5a5',
                                textDecoration: 'line-through',
                                background: 'rgba(239, 68, 68, 0.12)',
                                padding: '1px 6px',
                                borderRadius: 4,
                                fontSize: '0.76rem'
                              }}>
                                {alt.de}
                              </span>
                              <ArrowRight size={13} color="var(--slate-400)" />
                              <span style={{
                                color: '#86efac',
                                fontWeight: 700,
                                background: 'rgba(34, 197, 94, 0.15)',
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.2)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            type="button"
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
