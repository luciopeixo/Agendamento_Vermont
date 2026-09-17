import React, { useState, useEffect } from 'react';
import { 
  History, 
  X, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Box, 
  CheckCircle2, 
  Trash2, 
  FileText, 
  RefreshCw,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  listarHistoricoEnvelopamentos, 
  inscreverHistoricoRealtime,
  STATUS_ENVELOPAMENTO
} from '../services/envelopamentoService';
import { formatarDataHoraBR } from '../services/agendamentoService';

export function ModalHistoricoEnvelopamentos({ onFechar }) {
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroAcao, setFiltroAcao] = useState('todos');

  const carregar = async () => {
    setCarregando(true);
    try {
      const dados = await listarHistoricoEnvelopamentos();
      setHistorico(dados);
    } catch (e) {
      console.error('Erro ao carregar histórico:', e);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();

    const unsub = inscreverHistoricoRealtime((novoItem) => {
      if (novoItem) {
        setHistorico(prev => {
          if (prev.some(item => item.id === novoItem.id)) return prev;
          return [novoItem, ...prev];
        });
      }
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const itensFiltrados = historico.filter(item => {
    if (filtroAcao !== 'todos' && item.tipo_acao !== filtroAcao) return false;
    if (busca) {
      const t = busca.toLowerCase().trim();
      const bloco = String(item.numero_bloco || '').toLowerCase();
      const cli = String(item.cliente_nome || '').toLowerCase();
      const mat = String(item.material || '').toLowerCase();
      const user = String(item.usuario_nome || '').toLowerCase();
      const rom = String(item.numero_romaneio || '').toLowerCase();
      const det = String(item.detalhes || '').toLowerCase();
      if (!bloco.includes(t) && !cli.includes(t) && !mat.includes(t) && !user.includes(t) && !rom.includes(t) && !det.includes(t)) {
        return false;
      }
    }
    return true;
  });

  const getBadgeAcao = (tipo) => {
    switch (tipo) {
      case 'CRIACAO':
        return { label: 'Novo Cadastro', bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.35)' };
      case 'STATUS_ALTERADO':
      case 'STATUS_LOTE':
        return { label: 'Status Atualizado', bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.35)' };
      case 'EDICAO':
        return { label: 'Bloco Editado', bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.35)' };
      case 'EXCLUSAO':
      case 'EXCLUSAO_LOTE':
        return { label: 'Bloco Excluído', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.35)' };
      case 'IMPORTACAO_ROMANEIO':
        return { label: 'Importação PDF', bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.35)' };
      default:
        return { label: tipo, bg: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: 'rgba(148, 163, 184, 0.35)' };
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
      <div className="glass-panel modal-historico-container" style={{
        width: '100%',
        maxWidth: 960,
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 16,
        padding: 0,
        overflow: 'hidden',
        border: '1px solid var(--vermont-green-border)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
      }}>
        {/* Cabeçalho do Modal */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 0, 0, 0.35)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: 'rgba(0, 168, 62, 0.15)',
              border: '1px solid rgba(0, 168, 62, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4ade80'
            }}>
              <History size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#fff', fontWeight: 800 }}>
                  Histórico de Alterações em Tempo Real
                </h2>
                <span className="badge badge-vermont" style={{ fontSize: '0.70rem', padding: '2px 8px' }}>
                  Auditoria Viva
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.80rem', color: 'var(--slate-400)' }}>
                Rastreabilidade de cadastros, edições de status, importações e exclusões
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={carregar}
              disabled={carregando}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}
              title="Atualizar histórico"
            >
              <RefreshCw size={14} className={carregando ? 'spin' : ''} />
              <span>Atualizar</span>
            </button>
            <button
              type="button"
              onClick={onFechar}
              className="btn btn-secondary"
              style={{ padding: 8, borderRadius: '50%' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div style={{
          padding: '12px 24px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
            <input
              type="text"
              className="form-input"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por bloco, cliente, romaneio, material ou responsável..."
              style={{ paddingLeft: 36, fontSize: '0.82rem', height: 38 }}
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--slate-400)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Filter size={14} color="var(--slate-400)" />
            <select
              className="form-select"
              value={filtroAcao}
              onChange={(e) => setFiltroAcao(e.target.value)}
              style={{ fontSize: '0.80rem', height: 38, padding: '4px 28px 4px 10px' }}
            >
              <option value="todos">Todas as Operações ({historico.length})</option>
              <option value="STATUS_ALTERADO">Mudanças de Status</option>
              <option value="CRIACAO">Novos Cadastros</option>
              <option value="EDICAO">Edições de Dados</option>
              <option value="IMPORTACAO_ROMANEIO">Importações de Romaneio</option>
              <option value="EXCLUSAO">Exclusões</option>
            </select>
          </div>
        </div>

        {/* Lista de Registros da Linha do Tempo */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          {carregando ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--slate-400)' }}>
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 10px', color: '#4ade80' }} />
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Carregando histórico de auditoria...</p>
            </div>
          ) : itensFiltrados.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 20px',
              color: 'var(--slate-400)',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.01)'
            }}>
              <History size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <h4 style={{ margin: '0 0 4px', color: '#fff', fontSize: '0.95rem' }}>Nenhum registro encontrado</h4>
              <p style={{ margin: 0, fontSize: '0.80rem' }}>
                {busca || filtroAcao !== 'todos' ? 'Tente limpar os filtros de busca.' : 'Os novos cadastros, alterações de status e exclusões aparecerão aqui automaticamente.'}
              </p>
            </div>
          ) : (
            itensFiltrados.map((item) => {
              const badge = getBadgeAcao(item.tipo_acao);
              const stAnt = item.status_anterior ? STATUS_ENVELOPAMENTO[item.status_anterior.toUpperCase()] : null;
              const stNovo = item.status_novo ? STATUS_ENVELOPAMENTO[item.status_novo.toUpperCase()] : null;

              return (
                <div
                  key={item.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: 0.3
                      }}>
                        {badge.label}
                      </span>

                      {item.numero_bloco && (
                        <span style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#fff',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: '0.80rem',
                          fontFamily: 'monospace'
                        }}>
                          Bloco {item.numero_bloco}
                        </span>
                      )}

                      {item.material && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--slate-300)', fontWeight: 600 }}>
                          • {item.material}
                        </span>
                      )}

                      {item.pedreira_nome && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                          ({item.pedreira_nome})
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: 'var(--slate-400)' }}>
                      <Clock size={13} />
                      <span>{formatarDataHoraBR(item.created_at)}</span>
                    </div>
                  </div>

                  {/* Detalhes e Transição de Status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ fontSize: '0.82rem', color: '#fff' }}>
                      {item.cliente_nome && (
                        <strong style={{ color: '#4ade80', marginRight: 6 }}>
                          {item.cliente_nome}:
                        </strong>
                      )}
                      <span>{item.detalhes}</span>
                    </div>

                    {stNovo && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
                        {stAnt && (
                          <>
                            <span style={{
                              color: stAnt.cor,
                              background: stAnt.bg,
                              border: `1px solid ${stAnt.border}`,
                              padding: '2px 6px',
                              borderRadius: 4
                            }}>
                              {stAnt.label}
                            </span>
                            <ArrowRight size={12} color="var(--slate-400)" />
                          </>
                        )}
                        <span style={{
                          color: stNovo.cor,
                          background: stNovo.bg,
                          border: `1px solid ${stNovo.border}`,
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontWeight: 700
                        }}>
                          {stNovo.label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Rodapé do Item: Responsável & Romaneio */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--slate-400)', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <User size={12} color="#00a83e" />
                      <span>Responsável: <strong>{item.usuario_nome || 'Equipe Vermont'}</strong></span>
                    </div>
                    {item.numero_romaneio && (
                      <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 600 }}>
                        Romaneio: Nº {item.numero_romaneio}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé com Estatísticas */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          color: 'var(--slate-400)'
        }}>
          <span>Mostrando {itensFiltrados.length} de {historico.length} registro(s)</span>
          <button
            type="button"
            onClick={onFechar}
            className="btn btn-secondary"
            style={{ padding: '6px 18px', fontSize: '0.80rem' }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
