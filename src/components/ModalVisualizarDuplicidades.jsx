import React, { useState } from 'react';
import { 
  AlertTriangle, 
  X, 
  Trash2, 
  Edit3, 
  Box, 
  Building2, 
  FileText, 
  MapPin, 
  Layers, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { 
  STATUS_ENVELOPAMENTO, 
  gerarChaveDuplicidade,
  excluirEnvelopamento,
  atualizarStatusEnvelopamento
} from '../services/envelopamentoService';
import { formatarDataHoraBR } from '../services/agendamentoService';

export function ModalVisualizarDuplicidades({ 
  envelopamentos = [], 
  onFechar, 
  onEditarBloco, 
  onRecarregar,
  usuarioNome 
}) {
  const [excluindoId, setExcluindoId] = useState(null);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  // Agrupar blocos duplicados pela chave de duplicidade
  const gruposDuplicados = React.useMemo(() => {
    const mapa = new Map();

    envelopamentos.forEach(item => {
      const chave = gerarChaveDuplicidade({
        numero_bloco: item.numero_bloco,
        cliente_nome: item.cliente_nome,
        cliente_cnpj: item.cliente_cnpj,
        material: item.material,
        pedreira_id: item.pedreira_id,
        pedreira_nome: item.pedreira_nome
      });

      if (!chave) return;

      if (!mapa.has(chave)) {
        mapa.set(chave, {
          chave,
          numero_bloco: item.numero_bloco,
          cliente_nome: item.cliente_nome,
          cliente_cnpj: item.cliente_cnpj,
          material: item.material,
          pedreira_nome: item.pedreira_nome,
          itens: []
        });
      }

      mapa.get(chave).itens.push(item);
    });

    // Retorna apenas os grupos que têm 2 ou mais ocorrências
    return Array.from(mapa.values()).filter(g => g.itens.length > 1);
  }, [envelopamentos]);

  const totalBlocosDuplicados = gruposDuplicados.reduce((acc, g) => acc + g.itens.length, 0);

  const handleExcluirDuplicata = async (item) => {
    if (!window.confirm(`Deseja realmente excluir a duplicata do bloco "${item.numero_bloco}" (Romaneio: ${item.numero_romaneio || 'S/N'})?`)) {
      return;
    }

    setExcluindoId(item.id);
    try {
      await excluirEnvelopamento(item.id, usuarioNome);
      setMensagemSucesso(`Duplicata do bloco "${item.numero_bloco}" excluída com sucesso.`);
      if (typeof onRecarregar === 'function') onRecarregar();
    } catch (err) {
      alert('Erro ao excluir duplicata: ' + (err?.message || 'Tente novamente'));
    } finally {
      setExcluindoId(null);
    }
  };

  const handleMudarStatus = async (id, novoStatus) => {
    try {
      await atualizarStatusEnvelopamento(id, novoStatus, usuarioNome);
      if (typeof onRecarregar === 'function') onRecarregar();
    } catch (e) {
      alert('Erro ao atualizar status: ' + e?.message);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16
    }}>
      <div className="glass-panel modal-duplicidades-container" style={{
        width: '100%',
        maxWidth: 1000,
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 16,
        padding: 0,
        overflow: 'hidden',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7)'
      }}>
        {/* Cabeçalho */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(239, 68, 68, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171'
            }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#fff', fontWeight: 800 }}>
                  Central de Análise de Blocos em Duplicidade
                </h2>
                <span style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {totalBlocosDuplicados} Ocorrências em {gruposDuplicados.length} Grupos
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.80rem', color: 'var(--slate-400)' }}>
                Compare as duplicatas cadastradas e remova ou ajuste os registros conflitantes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="btn btn-secondary"
            style={{ padding: 8, borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {mensagemSucesso && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.15)',
            borderBottom: '1px solid rgba(34, 197, 94, 0.3)',
            padding: '10px 24px',
            color: '#86efac',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>✓ {mensagemSucesso}</span>
            <button
              type="button"
              onClick={() => setMensagemSucesso('')}
              style={{ background: 'transparent', border: 'none', color: '#86efac', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Lista de Grupos Conflitantes */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18
        }}>
          {gruposDuplicados.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#86efac',
              border: '1px dashed rgba(34, 197, 94, 0.25)',
              borderRadius: 14,
              background: 'rgba(34, 197, 94, 0.03)'
            }}>
              <CheckCircle2 size={44} style={{ margin: '0 auto 12px', color: '#4ade80' }} />
              <h3 style={{ margin: '0 0 6px', color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>
                Nenhum bloco em duplicidade no sistema!
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--slate-300)' }}>
                Todos os blocos cadastrados possuem unicidade estrita por Cliente, Material e Pedreira.
              </p>
            </div>
          ) : (
            gruposDuplicados.map((grupo, gIdx) => (
              <div
                key={grupo.chave || gIdx}
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: 12,
                  overflow: 'hidden'
                }}
              >
                {/* Header do Grupo Duplicado */}
                <div style={{
                  padding: '12px 18px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{
                      background: 'rgba(239, 68, 68, 0.3)',
                      color: '#fff',
                      fontWeight: 900,
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: '0.92rem',
                      fontFamily: 'monospace',
                      border: '1px solid rgba(239, 68, 68, 0.5)'
                    }}>
                      Bloco {grupo.numero_bloco}
                    </span>
                    <strong style={{ color: '#fff', fontSize: '0.88rem' }}>
                      {grupo.cliente_nome}
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: '#fca5a5' }}>
                      • {grupo.material} ({grupo.pedreira_nome})
                    </span>
                  </div>

                  <span style={{
                    fontSize: '0.72rem',
                    background: 'rgba(239, 68, 68, 0.25)',
                    color: '#fca5a5',
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontWeight: 700
                  }}>
                    {grupo.itens.length} Registros Repetidos
                  </span>
                </div>

                {/* Comparação dos Itens do Grupo */}
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {grupo.itens.map((item, idx) => {
                    const statusInfo = STATUS_ENVELOPAMENTO[item.status?.toUpperCase()] || STATUS_ENVELOPAMENTO.PENDENTE_ENVELOPAMENTO;
                    const isPrimeiro = idx === 0;

                    return (
                      <div
                        key={item.id}
                        style={{
                          background: isPrimeiro ? 'rgba(34, 197, 94, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                          border: isPrimeiro ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: 8,
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 10
                        }}
                      >
                        {/* Identificadores do Item */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.70rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: isPrimeiro ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                            color: isPrimeiro ? '#4ade80' : 'var(--slate-400)'
                          }}>
                            {isPrimeiro ? 'Ocorrência #1 (Principal)' : `Duplicata #${idx + 1}`}
                          </span>

                          <div style={{ fontSize: '0.80rem', color: '#38bdf8', fontWeight: 700, fontFamily: 'monospace' }}>
                            Romaneio: {item.numero_romaneio ? `Nº ${item.numero_romaneio}` : 'S/N (Manual)'}
                          </div>

                          {item.peso_kg && (
                            <span style={{ fontSize: '0.74rem', color: 'var(--slate-300)', fontFamily: 'monospace' }}>
                              Peso: {item.peso_kg} kg
                            </span>
                          )}

                          <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
                            Cadastrado: {formatarDataHoraBR(item.created_at || item.data_cadastro)}
                          </div>
                        </div>

                        {/* Status e Ações */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <select
                            className="form-select"
                            value={item.status}
                            onChange={(e) => handleMudarStatus(item.id, e.target.value)}
                            style={{
                              fontSize: '0.74rem',
                              padding: '3px 22px 3px 8px',
                              height: 30,
                              color: statusInfo.cor,
                              background: statusInfo.bg,
                              borderColor: statusInfo.border,
                              fontWeight: 700
                            }}
                          >
                            {Object.values(STATUS_ENVELOPAMENTO).map(st => (
                              <option key={st.id} value={st.id}>{st.label}</option>
                            ))}
                          </select>

                          {onEditarBloco && (
                            <button
                              type="button"
                              onClick={() => {
                                onFechar();
                                onEditarBloco(item);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}
                              title="Editar este bloco"
                            >
                              <Edit3 size={12} /> Editar
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleExcluirDuplicata(item)}
                            disabled={excluindoId === item.id}
                            className="btn btn-danger"
                            style={{
                              padding: '4px 10px',
                              fontSize: '0.72rem',
                              background: 'rgba(239, 68, 68, 0.2)',
                              borderColor: '#ef4444',
                              color: '#f87171',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                            title="Excluir esta ocorrência"
                          >
                            <Trash2 size={12} /> {excluindoId === item.id ? 'Excluindo...' : 'Excluir'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.80rem',
          color: 'var(--slate-400)'
        }}>
          <span>
            Dica: Mantenha apenas a ocorrência com o romaneio/dados corretos e exclua as cópias redundantes.
          </span>
          <button
            type="button"
            onClick={onFechar}
            className="btn btn-secondary"
            style={{ padding: '6px 20px', fontSize: '0.82rem' }}
          >
            Concluir Análise
          </button>
        </div>
      </div>
    </div>
  );
}
