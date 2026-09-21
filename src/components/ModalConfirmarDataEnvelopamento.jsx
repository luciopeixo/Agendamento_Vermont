import React, { useState, useEffect } from 'react';
import { CheckCircle2, Calendar, X, Box, Layers, AlertCircle } from 'lucide-react';

export function ModalConfirmarDataEnvelopamento({
  aberto,
  onFechar,
  onConfirmar,
  item = null,
  itens = [],
  executando = false
}) {
  const getHojeStr = () => new Date().toISOString().slice(0, 10);
  const getOntemStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  };

  const [dataEnvelopamento, setDataEnvelopamento] = useState(getHojeStr());

  useEffect(() => {
    if (aberto) {
      setDataEnvelopamento(getHojeStr());
    }
  }, [aberto]);

  if (!aberto) return null;

  const totalBlocos = itens?.length > 0 ? itens.length : (item ? 1 : 0);
  const hoje = getHojeStr();
  const ontem = getOntemStr();

  const handleConfirmar = (e) => {
    e.preventDefault();
    if (!dataEnvelopamento) {
      onConfirmar(getHojeStr());
    } else {
      onConfirmar(dataEnvelopamento);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: 520,
        borderRadius: 16,
        padding: 0,
        overflow: 'hidden',
        border: '1px solid rgba(34, 197, 94, 0.4)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        background: 'var(--slate-900)'
      }}>
        {/* Cabeçalho */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(34, 197, 94, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(34, 197, 94, 0.2)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4ade80'
            }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#fff', fontWeight: 800 }}>
                {totalBlocos > 1 ? `Envelopar ${totalBlocos} Blocos` : 'Confirmar Envelopamento'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--slate-400)' }}>
                Selecione a data em que o bloco foi envelopado no pátio
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            disabled={executando}
            className="btn btn-secondary"
            style={{ padding: '6px 10px', borderRadius: 8, color: 'var(--slate-400)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo */}
        <form onSubmit={handleConfirmar} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Card Resumo do Bloco / Lote */}
          {item && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 10,
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Box size={16} color="#38bdf8" />
                <strong style={{ color: '#fff', fontSize: '0.95rem' }}>
                  Bloco nº {item.numero_bloco}
                </strong>
                {item.material && (
                  <span style={{ fontSize: '0.80rem', color: '#38bdf8', fontWeight: 600 }}>
                    • {item.material}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.80rem', color: 'var(--slate-300)', marginTop: 2 }}>
                <strong>Cliente:</strong> {item.cliente_nome || 'Não informado'}
              </div>
              {(item.pedreira_nome || item.pedreira) && (
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                  <strong>Unidade:</strong> {item.pedreira_nome || item.pedreira}
                </div>
              )}
            </div>
          )}

          {itens?.length > 1 && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.06)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: 10,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <Layers size={20} color="#4ade80" />
              <div>
                <strong style={{ color: '#fff', fontSize: '0.90rem' }}>
                  {itens.length} blocos selecionados para atualização
                </strong>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--slate-300)' }}>
                  Todos os blocos do lote receberão a data de envelopamento selecionada abaixo.
                </p>
              </div>
            </div>
          )}

          {/* Seleção de Data */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--slate-200)', fontWeight: 700 }}>
              <Calendar size={15} color="#4ade80" /> Data do Envelopamento:
            </label>

            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <button
                type="button"
                onClick={() => setDataEnvelopamento(hoje)}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: 8,
                  fontSize: '0.80rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: dataEnvelopamento === hoje ? '1px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: dataEnvelopamento === hoje ? 'rgba(34, 197, 94, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                  color: dataEnvelopamento === hoje ? '#4ade80' : 'var(--slate-300)',
                  transition: 'all 0.15s'
                }}
              >
                Hoje (Padrão)
              </button>

              <button
                type="button"
                onClick={() => setDataEnvelopamento(ontem)}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: 8,
                  fontSize: '0.80rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: dataEnvelopamento === ontem ? '1px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: dataEnvelopamento === ontem ? 'rgba(34, 197, 94, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                  color: dataEnvelopamento === ontem ? '#4ade80' : 'var(--slate-300)',
                  transition: 'all 0.15s'
                }}
              >
                Ontem
              </button>
            </div>

            <input
              type="date"
              className="form-input"
              value={dataEnvelopamento}
              onChange={(e) => setDataEnvelopamento(e.target.value)}
              required
              style={{
                fontSize: '0.90rem',
                padding: '10px 12px',
                borderColor: 'rgba(34, 197, 94, 0.4)'
              }}
            />
          </div>

          {/* Botões de Ação */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: 8,
            paddingTop: 14,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              type="button"
              onClick={onFechar}
              disabled={executando}
              className="btn btn-secondary"
              style={{ padding: '9px 18px', fontSize: '0.82rem' }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={executando}
              className="btn btn-vermont"
              style={{ padding: '9px 20px', fontSize: '0.84rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {executando ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14 }} />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Confirmar Envelopamento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
