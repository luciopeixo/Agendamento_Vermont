import React from 'react';
import { X, Clock, MapPin, Mail, Shield, Truck, FileCheck, AlertTriangle } from 'lucide-react';
import { PEDREIRAS_CEARA, EMAIL_NOTIFICACAO_DESTINO, AVISO_CONFIRMACAO_CLIENTE } from '../services/agendamentoService';

export function RegrasModal({ aberto, onFechar }) {
  if (!aberto) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 10, 8, 0.88)',
      backdropFilter: 'blur(8px)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }} onClick={onFechar}>
      <div 
        className="glass-panel animate-fade"
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 28,
          position: 'relative',
          background: '#0e1412',
          border: '1px solid var(--vermont-green-border)',
          boxShadow: 'var(--vermont-green-glow)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onFechar}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'transparent',
            border: 'none',
            color: 'var(--slate-400)',
            cursor: 'pointer',
            padding: 4
          }}
        >
          <X size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'var(--vermont-green-subtle)',
            border: '1px solid var(--vermont-green-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4ade80'
          }}>
            <Shield size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', margin: 0, color: '#fff' }}>Regras de Agendamento</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--slate-400)' }}>
              Diretrizes operacionais para carregamento de blocos nas pedreiras (Ceará)
            </p>
          </div>
        </div>

        {/* Seção 1: Horários com Espaçamento de 20 min */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '1rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Clock size={18} />
            Horários Operacionais (Espaçamento de 20 minutos)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: 14,
              borderRadius: 10
            }}>
              <span className="badge badge-vermont" style={{ marginBottom: 6 }}>Segunda a Sexta-feira</span>
              <p style={{ fontSize: '0.88rem', margin: '6px 0', color: 'var(--slate-200)' }}>
                <strong>Manhã:</strong> 07:40 às 12:00 (a cada 20 min)<br />
                <strong>Tarde:</strong> 13:30 às 15:30 (a cada 20 min)
              </p>
              <p style={{ fontSize: '0.78rem', color: '#86efac', margin: 0 }}>
                Horários já reservados são automaticamente indisponibilizados para evitar conflitos na pedreira.
              </p>
            </div>

            <div style={{
              background: 'rgba(0, 118, 44, 0.08)',
              border: '1px solid var(--vermont-green-border)',
              padding: 14,
              borderRadius: 10
            }}>
              <span className="badge badge-warning" style={{ marginBottom: 6 }}>Sábados (Exclusivo Uruoca)</span>
              <p style={{ fontSize: '0.88rem', margin: '6px 0', color: 'var(--slate-200)' }}>
                <strong>Capacidade Máxima:</strong> 12 Veículos no total do dia.<br />
                <strong>Horário Limite:</strong> Agendamentos para o sábado devem ser realizados até <strong>sexta-feira às 14:00</strong>.
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--slate-400)', margin: 0 }}>
                Apenas a pedreira <strong>Uruoca - CE (Taj Mahal)</strong> opera aos sábados. As demais unidades operam de segunda a sexta-feira.
              </p>
            </div>
          </div>
        </div>

        {/* Seção 2: Tipos de Veículos & Exigência de Placas */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '1rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Truck size={18} />
            Tipos de Veículo & Exigência de Placas
          </h3>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: 14,
            borderRadius: 10,
            fontSize: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}>
            <div>
              <strong style={{ color: '#4ade80' }}>Bitrem (7 Eixos) e Rodotrem (9 Eixos):</strong>
              <span style={{ color: 'var(--slate-300)', marginLeft: 6 }}>
                Exige <strong>3 placas</strong> (Placa do Cavalo, 1ª Carreta e 2ª Carreta).
              </span>
            </div>
            <div>
              <strong style={{ color: '#4ade80' }}>Truck (3 Eixos) e Bitruck (4 Eixos):</strong>
              <span style={{ color: 'var(--slate-300)', marginLeft: 6 }}>
                Exige <strong>apenas 1 placa</strong> (Placa do Veículo).
              </span>
            </div>
            <div>
              <strong style={{ color: '#4ade80' }}>Carreta LS (6 Eixos), LS 7 Eixos e Vanderleia:</strong>
              <span style={{ color: 'var(--slate-300)', marginLeft: 6 }}>
                Exige <strong>2 placas</strong> (Placa do Cavalo e Placa da Carreta).
              </span>
            </div>
          </div>
        </div>

        {/* Seção 3: Pedreiras Atendidas */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '1rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <MapPin size={18} />
            Pedreiras Oficiais no Ceará
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 8
          }}>
            {PEDREIRAS_CEARA.map((p) => (
              <div key={p.id} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(0, 118, 44, 0.25)',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: '0.85rem'
              }}>
                <strong style={{ color: '#fff' }}>{p.nome}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Seção 4: Documentação Obrigatória */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(0, 118, 44, 0.4)',
          borderRadius: 10,
          padding: 14,
          marginBottom: 16
        }}>
          <h3 style={{ fontSize: '0.96rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 8px 0' }}>
            <FileCheck size={18} />
            Documentação Obrigatória na Portaria da Pedreira
          </h3>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--slate-400)' }}>
            O motorista deverá portar e apresentar obrigatoriamente na portaria:
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.84rem', color: 'var(--slate-200)', lineHeight: '1.6' }}>
            <li><strong>Obrigatório apresentação de CRLVs do cavalo e carreta atualizados;</strong></li>
            <li><strong>CNH compatível com o veículo;</strong></li>
            <li><strong>Motorista deve possuir o curso de cargas indivisíveis;</strong></li>
            <li><strong>Laudo de inspeção de rochas ou CSV dentro da validade.</strong></li>
          </ul>

          <div style={{
            marginTop: 12,
            padding: '10px 14px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10
          }}>
            <AlertTriangle size={18} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: '0.82rem', color: '#fef3c7', lineHeight: '1.45' }}>
              <strong style={{ color: '#fde047', display: 'block', marginBottom: 2 }}>Atenção Transportador:</strong>
              <p style={{ margin: '0 0 4px 0' }}>
                O transportador deverá sempre confirmar com o cliente, antes de realizar o carregamento, se os blocos estão devidamente envelopados e se encontram finalizados e liberados para transporte.
              </p>
              <p style={{ margin: 0, color: '#fde68a', fontWeight: 500, fontSize: '0.80rem' }}>
                Essa confirmação é fundamental para evitar imprevistos, atrasos ou problemas durante o carregamento e o transporte.
              </p>
            </div>
          </div>
        </div>

        {/* Seção 5: Notificação */}
        <div style={{
          background: 'rgba(0, 118, 44, 0.1)',
          border: '1px solid var(--vermont-green-border)',
          borderRadius: 10,
          padding: 14,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start'
        }}>
          <Mail size={22} color="#4ade80" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.84rem' }}>
            <strong style={{ color: '#fff' }}>Notificação Oficial de Carregamento</strong>
            <p style={{ margin: '4px 0 0 0', color: 'var(--slate-300)' }}>
              Cada agendamento gravado despacha confirmação imediata para <strong style={{ color: '#86efac' }}>o e-mail da logística</strong>.
            </p>
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <button onClick={onFechar} className="btn btn-vermont" style={{ padding: '8px 24px' }}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
