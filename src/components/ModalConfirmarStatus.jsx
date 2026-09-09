import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, X, Shield, Clock, PlayCircle, CheckCheck, XCircle, Share2, MessageCircle, Send } from 'lucide-react';
import { formatarDataBR, formatarPlacasExibicao, abrirNotificacaoWhatsAppAdmin, gerarMensagemWhatsAppCarregando, WHATSAPP_ADMIN_PADRAO } from '../services/agendamentoService';

export function ModalConfirmarStatus({
  agendamento,
  novoStatus,
  usuarioInfo,
  onConfirmar,
  onCancelar,
  processando = false
}) {
  if (!agendamento || !novoStatus) return null;

  const statusAtual = agendamento.status || 'Aguardando Liberação';
  const protocolo = (agendamento.id || '').substring(0, 8).toUpperCase();
  const placas = formatarPlacasExibicao(agendamento);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Aguardando Liberação':
        return (
          <span style={{
            background: 'rgba(245, 158, 11, 0.2)',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            color: '#fbbf24',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}>
            <Clock size={14} /> Aguardando Liberação
          </span>
        );
      case 'Liberado para Carregar':
      case 'Confirmado':
        return (
          <span style={{
            background: 'rgba(168, 85, 247, 0.2)',
            border: '1px solid rgba(192, 132, 252, 0.5)',
            color: '#c084fc',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}>
            <CheckCircle2 size={14} /> Liberado p/ Carregar
          </span>
        );
      case 'Carregando':
        return (
          <span style={{
            background: 'rgba(56, 189, 248, 0.2)',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            color: '#38bdf8',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}>
            <PlayCircle size={14} /> Carregando
          </span>
        );
      case 'Finalizado':
      case 'Carregado':
        return (
          <span style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            color: '#34d399',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}>
            <CheckCheck size={14} /> Finalizado
          </span>
        );
      case 'Cancelado':
        return (
          <span style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            color: '#f87171',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}>
            <XCircle size={14} /> Cancelado
          </span>
        );
      default:
        return (
          <span style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: '0.85rem',
            fontWeight: 700
          }}>
            {status}
          </span>
        );
    }
  };

  const getExplicacaoStatus = (status) => {
    switch (status) {
      case 'Finalizado':
        return 'Ao confirmar como Finalizado, você valida que o bloco foi carregado no veículo e a operação física na pedreira foi concluída.';
      case 'Carregando':
        return 'Ao confirmar como Carregando, o sistema indicará em tempo real que o veículo já está posicionado e em processo de carregamento, emitindo alerta para a administração.';
      case 'Liberado para Carregar':
        return 'Ao confirmar como Liberado para Carregar, a pedreira autoriza o motorista a entrar e iniciar o procedimento.';
      case 'Aguardando Liberação':
        return 'Ao reverter para Aguardando Liberação, o agendamento retornará ao status inicial de triagem.';
      case 'Cancelado':
        return 'ATENÇÃO: A alteração para Cancelado invalida este agendamento.';
      default:
        return 'Confirme se deseja aplicar esta alteração de status para este agendamento.';
    }
  };

  const isCancelamento = novoStatus === 'Cancelado';
  const isCarregando = novoStatus === 'Carregando';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 10, 8, 0.88)',
      backdropFilter: 'blur(8px)',
      zIndex: 600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }}>
      <div
        className="glass-panel animate-fade"
        style={{
          width: '100%',
          maxWidth: 560,
          background: '#0d1411',
          border: isCancelamento ? '1px solid rgba(239, 68, 68, 0.5)' : isCarregando ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(245, 158, 11, 0.45)',
          boxShadow: isCancelamento ? '0 20px 50px rgba(0,0,0,0.9), 0 0 30px rgba(239, 68, 68, 0.2)' : isCarregando ? '0 20px 50px rgba(0,0,0,0.9), 0 0 30px rgba(56, 189, 248, 0.25)' : '0 20px 50px rgba(0,0,0,0.9), 0 0 30px rgba(245, 158, 11, 0.2)',
          borderRadius: 16,
          overflow: 'hidden'
        }}
      >
        {/* Cabeçalho de Atenção */}
        <div style={{
          padding: '18px 24px',
          background: isCancelamento ? 'rgba(239, 68, 68, 0.12)' : isCarregando ? 'rgba(56, 189, 248, 0.12)' : 'rgba(245, 158, 11, 0.12)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: isCancelamento ? 'rgba(239, 68, 68, 0.2)' : isCarregando ? 'rgba(56, 189, 248, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              border: isCancelamento ? '1px solid rgba(239, 68, 68, 0.5)' : isCarregando ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(245, 158, 11, 0.5)',
              color: isCancelamento ? '#f87171' : isCarregando ? '#38bdf8' : '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isCarregando ? <PlayCircle size={24} /> : <AlertTriangle size={24} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff' }}>
                {isCarregando ? 'Confirmar Início de Carregamento' : 'Atenção: Confirmar Alteração de Status'}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--slate-400)' }}>
                {isCarregando ? 'Atualiza a operação em tempo real no painel' : 'Certifique-se antes de atualizar o status operacional'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelar}
            disabled={processando}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--slate-400)',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* Card Resumo do Agendamento */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 10,
            padding: '12px 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 10,
            fontSize: '0.82rem'
          }}>
            <div>
              <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '0.72rem' }}>Protocolo</span>
              <strong style={{ color: '#fff', fontFamily: 'monospace' }}>#{protocolo}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '0.72rem' }}>Nº Bloco</span>
              <strong style={{ color: '#4ade80' }}>{agendamento.numero_bloco}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '0.72rem' }}>Pedreira</span>
              <strong style={{ color: '#fff' }}>{agendamento.pedreira}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '0.72rem' }}>Data / Horário</span>
              <strong style={{ color: '#fff' }}>{formatarDataBR(agendamento.data_agendamento)} • {agendamento.horario_agendamento}</strong>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '0.72rem' }}>Motorista & Veículo</span>
              <span style={{ color: '#e2e8f0' }}>
                {agendamento.motorista_nome} ({agendamento.transportadora}) — {placas.map(p => `${p.label}: ${p.placa}`).join(' | ')}
              </span>
            </div>
          </div>

          {/* Transição Visual de Status */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', fontWeight: 600 }}>
                Status Atual:
              </span>
              {getStatusBadge(statusAtual)}
            </div>

            <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowRight size={22} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 600 }}>
                Novo Status Selecionado:
              </span>
              {getStatusBadge(novoStatus)}
            </div>
          </div>

          {/* Mensagem Explicativa de Impacto */}
          <div style={{
            background: isCancelamento ? 'rgba(239, 68, 68, 0.08)' : isCarregando ? 'rgba(56, 189, 248, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: isCancelamento ? '1px solid rgba(239, 68, 68, 0.25)' : isCarregando ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: '0.84rem',
            color: '#e2e8f0',
            lineHeight: 1.4
          }}>
            <p style={{ margin: 0 }}>
              {getExplicacaoStatus(novoStatus)}
            </p>
          </div>

          {/* Trilha de Auditoria Informada */}
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--slate-400)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '8px 12px',
            borderRadius: 6
          }}>
            <Shield size={14} color="#4ade80" />
            <span>
              Registrado por: <strong style={{ color: '#fff' }}>{usuarioInfo?.nome || 'Usuário Atual'}</strong> ({usuarioInfo?.role || 'Operador'})
            </span>
          </div>

          {/* Botões de Ação */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: 6,
            paddingTop: 12,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              type="button"
              onClick={onCancelar}
              disabled={processando}
              className="btn btn-secondary"
              style={{ padding: '10px 20px', fontSize: '0.88rem' }}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onConfirmar}
              disabled={processando}
              className={`btn ${isCancelamento ? 'btn-danger' : isCarregando ? 'btn-vermont' : 'btn-vermont'}`}
              style={{
                padding: '10px 24px',
                fontSize: '0.88rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              {processando ? (
                <>
                  <span className="spinner" /> Atualizando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={17} /> Sim, Confirmar Alteração
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
