import React, { useState, useMemo } from 'react';
import { 
  Trash2, ShieldAlert, AlertTriangle, CheckCircle2, X, RefreshCw, 
  Search, CheckSquare, Square, Database, HardDrive, Filter, AlertOctagon 
} from 'lucide-react';
import { 
  identificarRegistrosTeste, 
  excluirAgendamentosEmLote, 
  limparCacheLocalAgendamentos,
  formatarDataBR,
  isRegistroTeste
} from '../services/agendamentoService';

export function ModalLimpezaTestes({
  agendamentos = [],
  onConcluido,
  onFechar,
  usuarioInfo = {}
}) {
  const [aba, setAba] = useState('deteccao'); // 'deteccao' | 'manual' | 'cache'
  const [termoBuscaModal, setTermoBuscaModal] = useState('');
  const [selecionados, setSelecionados] = useState(() => {
    const testes = identificarRegistrosTeste(agendamentos);
    return new Set(testes.map(t => String(t.id)));
  });
  const [processando, setProcessando] = useState(false);
  const [sucessoMsg, setSucessoMsg] = useState('');
  const [erroMsg, setErroMsg] = useState('');

  // Agendamentos identificados como teste
  const registrosTesteDetectados = useMemo(() => {
    return identificarRegistrosTeste(agendamentos);
  }, [agendamentos]);

  // Registros filtrados pela busca no modal
  const registrosExibidos = useMemo(() => {
    let listaBase = (aba === 'deteccao') ? registrosTesteDetectados : agendamentos;
    if (!termoBuscaModal.trim()) return listaBase;

    const termo = termoBuscaModal.toLowerCase().trim();
    return listaBase.filter(item => {
      const bloco = String(item.numero_bloco || '').toLowerCase();
      const cliente = String(item.cliente || '').toLowerCase();
      const mot = String(item.motorista_nome || '').toLowerCase();
      const transp = String(item.transportadora || '').toLowerCase();
      const pedreira = String(item.pedreira || '').toLowerCase();
      const id = String(item.id || '').toLowerCase();
      return bloco.includes(termo) || cliente.includes(termo) || mot.includes(termo) || transp.includes(termo) || pedreira.includes(termo) || id.includes(termo);
    });
  }, [aba, registrosTesteDetectados, agendamentos, termoBuscaModal]);

  const todosSelecionados = useMemo(() => {
    if (registrosExibidos.length === 0) return false;
    return registrosExibidos.every(item => selecionados.has(String(item.id)));
  }, [registrosExibidos, selecionados]);

  const toggleItem = (id) => {
    const idStr = String(id);
    const novoSet = new Set(selecionados);
    if (novoSet.has(idStr)) {
      novoSet.delete(idStr);
    } else {
      novoSet.add(idStr);
    }
    setSelecionados(novoSet);
  };

  const toggleTodos = () => {
    const novoSet = new Set(selecionados);
    if (todosSelecionados) {
      registrosExibidos.forEach(item => novoSet.delete(String(item.id)));
    } else {
      registrosExibidos.forEach(item => novoSet.add(String(item.id)));
    }
    setSelecionados(novoSet);
  };

  const handleExcluirSelecionados = async () => {
    if (selecionados.size === 0) {
      setErroMsg('Selecione pelo menos um registro para excluir.');
      return;
    }

    const confirmacao = window.confirm(
      `⚠️ ATENÇÃO: Deseja realmente excluir permanentemente ${selecionados.size} registro(s)?\n\nEssa ação apagará os dados do banco Supabase e do armazenamento local.`
    );

    if (!confirmacao) return;

    setProcessando(true);
    setErroMsg('');
    setSucessoMsg('');

    try {
      const idsParaExcluir = Array.from(selecionados);
      const res = await excluirAgendamentosEmLote(idsParaExcluir);

      if (res.success) {
        setSucessoMsg(`${idsParaExcluir.length} registro(s) de teste excluído(s) com sucesso!`);
        setSelecionados(new Set());
        setTimeout(() => {
          if (onConcluido) onConcluido();
        }, 1200);
      } else {
        setErroMsg('Erro ao excluir alguns registros. Tente novamente.');
      }
    } catch (err) {
      setErroMsg(err.message || 'Falha ao executar exclusão.');
    } finally {
      setProcessando(false);
    }
  };

  const handleLimparCacheNavegador = () => {
    const confirmacao = window.confirm(
      '⚠️ Limpar o cache local de agendamentos do navegador?\n\nIsso removerá dados offline antigos salvos neste computador sem afetar os dados reais gravados no Supabase.'
    );

    if (!confirmacao) return;

    setProcessando(true);
    try {
      limparCacheLocalAgendamentos();
      setSucessoMsg('Cache local de agendamentos limpo com sucesso!');
      setTimeout(() => {
        if (onConcluido) onConcluido();
      }, 1000);
    } catch (e) {
      setErroMsg('Erro ao limpar cache local.');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '20px'
    }}>
      <div style={{
        background: '#111827',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        borderRadius: 16,
        width: '100%',
        maxWidth: '850px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(239, 68, 68, 0.15)',
        overflow: 'hidden'
      }}>
        {/* Cabeçalho do Modal */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(239, 68, 68, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: 10,
              padding: 8,
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Trash2 size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f9fafb' }}>
                Limpeza & Exclusão em Lote
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af' }}>
                Identifique e remova registros de teste do Supabase e do armazenamento local
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            disabled={processando}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              padding: 8,
              color: '#9ca3af',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '0 24px'
        }}>
          <button
            onClick={() => setAba('deteccao')}
            style={{
              padding: '14px 18px',
              background: 'none',
              border: 'none',
              borderBottom: aba === 'deteccao' ? '2px solid #ef4444' : '2px solid transparent',
              color: aba === 'deteccao' ? '#ef4444' : '#9ca3af',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease'
            }}
          >
            <AlertOctagon size={16} />
            Testes Detectados ({registrosTesteDetectados.length})
          </button>

          <button
            onClick={() => setAba('manual')}
            style={{
              padding: '14px 18px',
              background: 'none',
              border: 'none',
              borderBottom: aba === 'manual' ? '2px solid #3b82f6' : '2px solid transparent',
              color: aba === 'manual' ? '#3b82f6' : '#9ca3af',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease'
            }}
          >
            <Database size={16} />
            Todos os Registros ({agendamentos.length})
          </button>

          <button
            onClick={() => setAba('cache')}
            style={{
              padding: '14px 18px',
              background: 'none',
              border: 'none',
              borderBottom: aba === 'cache' ? '2px solid #10b981' : '2px solid transparent',
              color: aba === 'cache' ? '#10b981' : '#9ca3af',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease'
            }}
          >
            <HardDrive size={16} />
            Cache do Navegador
          </button>
        </div>

        {/* Mensagens de Sucesso ou Erro */}
        {sucessoMsg && (
          <div style={{
            margin: '16px 24px 0',
            padding: '12px 16px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 8,
            color: '#34d399',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <CheckCircle2 size={18} />
            {sucessoMsg}
          </div>
        )}

        {erroMsg && (
          <div style={{
            margin: '16px 24px 0',
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 8,
            color: '#f87171',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertTriangle size={18} />
            {erroMsg}
          </div>
        )}

        {/* Conteúdo Principal */}
        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
          {aba === 'cache' ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              background: 'rgba(0, 0, 0, 0.25)',
              padding: 24,
              borderRadius: 12,
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: 12,
                  borderRadius: 12,
                  color: '#34d399'
                }}>
                  <HardDrive size={28} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', color: '#f3f4f6', fontSize: '1.1rem' }}>
                    Limpar Armazenamento Local (`localStorage`)
                  </h3>
                  <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    Se foram realizados testes em navegadores ou se registros antigos ficaram presos no cache local deste computador, você pode resetar o cache com segurança.
                  </p>
                </div>
              </div>

              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '14px 16px',
                borderRadius: 8,
                color: '#fbbf24',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                <span>
                  Essa ação <strong>não apaga</strong> os registros oficiais salvos no Supabase, apenas limpa a memória local deste navegador para evitar que testes antigos continuem aparecendo.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  onClick={handleLimparCacheNavegador}
                  disabled={processando}
                  style={{
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px 24px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: processando ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <RefreshCw size={18} className={processando ? 'animate-spin' : ''} />
                  Limpar Cache Local Agora
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Barra de Filtro e Controles */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12
              }}>
                {/* Campo de Busca Rápida */}
                <div style={{
                  position: 'relative',
                  flex: '1 1 300px'
                }}>
                  <Search size={16} style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af'
                  }} />
                  <input
                    type="text"
                    placeholder="Filtrar por bloco, cliente, motorista..."
                    value={termoBuscaModal}
                    onChange={(e) => setTermoBuscaModal(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 8,
                      color: '#f9fafb',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Botão Selecionar Todos */}
                <button
                  onClick={toggleTodos}
                  disabled={registrosExibidos.length === 0}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 8,
                    padding: '10px 16px',
                    color: '#e5e7eb',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  {todosSelecionados ? <CheckSquare size={16} color="#ef4444" /> : <Square size={16} />}
                  {todosSelecionados ? 'Desmarcar Todos' : 'Selecionar Todos da Lista'}
                </button>
              </div>

              {/* Tabela de Registros Detectados / Selecionáveis */}
              <div style={{
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                overflow: 'hidden',
                background: 'rgba(0, 0, 0, 0.2)'
              }}>
                <div style={{
                  maxHeight: '340px',
                  overflowY: 'auto'
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    fontSize: '0.85rem'
                  }}>
                    <thead>
                      <tr style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#9ca3af'
                      }}>
                        <th style={{ padding: '10px 14px', width: '40px' }}></th>
                        <th style={{ padding: '10px 14px' }}>Data / Horário</th>
                        <th style={{ padding: '10px 14px' }}>Nº Bloco / Material</th>
                        <th style={{ padding: '10px 14px' }}>Cliente / Pedreira</th>
                        <th style={{ padding: '10px 14px' }}>Motorista / Placa</th>
                        <th style={{ padding: '10px 14px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrosExibidos.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                            {aba === 'deteccao' 
                              ? '✨ Nenhum registro com padrão de teste identificado na lista!' 
                              : 'Nenhum agendamento encontrado com o filtro atual.'}
                          </td>
                        </tr>
                      ) : (
                        registrosExibidos.map(item => {
                          const idStr = String(item.id);
                          const isSel = selecionados.has(idStr);
                          const isTeste = isRegistroTeste(item);

                          return (
                            <tr
                              key={idStr}
                              onClick={() => toggleItem(idStr)}
                              style={{
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                background: isSel 
                                  ? 'rgba(239, 68, 68, 0.12)' 
                                  : 'transparent',
                                cursor: 'pointer',
                                transition: 'background 0.15s ease'
                              }}
                            >
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                {isSel ? (
                                  <CheckSquare size={18} color="#ef4444" />
                                ) : (
                                  <Square size={18} color="#6b7280" />
                                )}
                              </td>
                              <td style={{ padding: '10px 14px', color: '#f3f4f6' }}>
                                <div style={{ fontWeight: 600 }}>{formatarDataBR(item.data_agendamento)}</div>
                                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{item.horario_agendamento || '-'}</div>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <div style={{ 
                                  color: isTeste ? '#ef4444' : '#f9fafb', 
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}>
                                  {item.numero_bloco || 'Sem nº'}
                                  {isTeste && (
                                    <span style={{
                                      background: 'rgba(239, 68, 68, 0.2)',
                                      color: '#f87171',
                                      padding: '1px 6px',
                                      borderRadius: 4,
                                      fontSize: '0.7rem'
                                    }}>
                                      TESTE
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{item.material || '-'}</div>
                              </td>
                              <td style={{ padding: '10px 14px', color: '#e5e7eb' }}>
                                <div style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {item.cliente || '-'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{item.pedreira || '-'}</div>
                              </td>
                              <td style={{ padding: '10px 14px', color: '#e5e7eb' }}>
                                <div>{item.motorista_nome || '-'}</div>
                                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{item.placa_cavalo || '-'}</div>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  color: '#d1d5db'
                                }}>
                                  {item.status || 'Aguardando'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Botões de Ação */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
            {aba !== 'cache' && (
              <span>
                <strong>{selecionados.size}</strong> registro(s) marcado(s) para exclusão.
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onFechar}
              disabled={processando}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#e5e7eb',
                borderRadius: 8,
                padding: '10px 18px',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Fechar
            </button>

            {aba !== 'cache' && (
              <button
                onClick={handleExcluirSelecionados}
                disabled={processando || selecionados.size === 0}
                style={{
                  background: selecionados.size > 0 ? '#ef4444' : 'rgba(239, 68, 68, 0.4)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 20px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: (processando || selecionados.size === 0) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: selecionados.size > 0 ? '0 4px 14px rgba(239, 68, 68, 0.4)' : 'none'
                }}
              >
                <Trash2 size={16} className={processando ? 'animate-spin' : ''} />
                {processando ? 'Excluindo...' : `Excluir ${selecionados.size} Selecionado(s)`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
