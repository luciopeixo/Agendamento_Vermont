import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  Search, 
  Calendar, 
  Building2, 
  Phone, 
  CheckCircle2, 
  Box, 
  Layers, 
  MapPin, 
  MessageSquare,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { obterClientesDoBancoDeDados } from '../services/envelopamentoService';
import { formatarDataBR, saoMesmaPedreira } from '../services/agendamentoService';

export function ModalNotificarClienteWhatsApp({ 
  aberto, 
  onFechar, 
  envelopamentos = [],
  clienteInicial = '',
  pedreiraOperador = ''
}) {
  const [clientesDb, setClientesDb] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(clienteInicial || '');
  const [filtroPeriodo, setFiltroPeriodo] = useState('7_dias'); // 'hoje', 'ontem', '7_dias', 'mes_atual', 'todos', 'custom'
  const [dataInicioCustom, setDataInicioCustom] = useState('');
  const [dataFimCustom, setDataFimCustom] = useState('');
  const [filtroPedreira, setFiltroPedreira] = useState('todas');
  const [filtroStatus, setFiltroStatus] = useState('envelopado'); // 'envelopado' ou 'todos'
  const [telefoneDestino, setTelefoneDestino] = useState('');
  const [blocosSelecionadosIds, setBlocosSelecionadosIds] = useState(new Set());
  const [copiado, setCopiado] = useState(false);
  const [buscaCliente, setBuscaCliente] = useState('');

  // Carrega cadastro de clientes para puxar telefones automaticamente
  useEffect(() => {
    if (aberto) {
      obterClientesDoBancoDeDados().then(res => {
        setClientesDb(res || []);
      }).catch(() => {});
    }
  }, [aberto]);

  // Lista única de clientes presentes nos envelopamentos + cadastrados
  const listaClientes = useMemo(() => {
    const mapa = new Map();
    (envelopamentos || []).forEach(item => {
      const nome = (item.cliente_nome || '').trim().toUpperCase();
      if (nome) {
        if (!mapa.has(nome)) {
          mapa.set(nome, { nome, cnpj: item.cliente_cnpj || '', telefone: '' });
        }
      }
    });

    clientesDb.forEach(c => {
      const nome = (c.nome || '').trim().toUpperCase();
      if (nome) {
        const existente = mapa.get(nome) || { nome, cnpj: c.cnpj || '', telefone: '' };
        if (c.telefone) existente.telefone = c.telefone;
        mapa.set(nome, existente);
      }
    });

    return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [envelopamentos, clientesDb]);

  // Se veio clienteInicial ou se só tem um cliente
  useEffect(() => {
    if (aberto) {
      if (clienteInicial) {
        setClienteSelecionado(clienteInicial.trim().toUpperCase());
      } else if (listaClientes.length > 0 && !clienteSelecionado) {
        setClienteSelecionado(listaClientes[0].nome);
      }
    }
  }, [aberto, clienteInicial, listaClientes]);

  // Atualiza telefone automaticamente quando o cliente selecionado muda
  useEffect(() => {
    if (clienteSelecionado) {
      const cliObj = listaClientes.find(c => c.nome.toUpperCase() === clienteSelecionado.toUpperCase());
      if (cliObj && cliObj.telefone) {
        setTelefoneDestino(cliObj.telefone);
      }
    }
  }, [clienteSelecionado, listaClientes]);

  // Filtra os blocos conforme o cliente e o período selecionado
  const blocosFiltrados = useMemo(() => {
    if (!clienteSelecionado) return [];

    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    let dataMin = null;
    let dataMax = null;

    if (filtroPeriodo === 'hoje') {
      dataMin = new Date();
      dataMin.setHours(0, 0, 0, 0);
      dataMax = new Date();
      dataMax.setHours(23, 59, 59, 999);
    } else if (filtroPeriodo === 'ontem') {
      dataMin = new Date();
      dataMin.setDate(hoje.getDate() - 1);
      dataMin.setHours(0, 0, 0, 0);
      dataMax = new Date();
      dataMax.setDate(hoje.getDate() - 1);
      dataMax.setHours(23, 59, 59, 999);
    } else if (filtroPeriodo === '7_dias') {
      dataMin = new Date();
      dataMin.setDate(hoje.getDate() - 7);
      dataMin.setHours(0, 0, 0, 0);
    } else if (filtroPeriodo === 'mes_atual') {
      dataMin = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    } else if (filtroPeriodo === 'custom') {
      if (dataInicioCustom) {
        const [y, m, d] = dataInicioCustom.split('-').map(Number);
        dataMin = new Date(y, m - 1, d, 0, 0, 0);
      }
      if (dataFimCustom) {
        const [y, m, d] = dataFimCustom.split('-').map(Number);
        dataMax = new Date(y, m - 1, d, 23, 59, 59);
      }
    }

    return (envelopamentos || []).filter(item => {
      // Cliente
      const cliNome = (item.cliente_nome || '').trim().toUpperCase();
      if (cliNome !== clienteSelecionado.toUpperCase()) {
        return false;
      }

      // Status (padrão: envelopado)
      if (filtroStatus === 'envelopado' && item.status !== 'envelopado') {
        return false;
      }

      // Pedreira
      if (filtroPedreira !== 'todas') {
        const ped = item.pedreira_nome || item.pedreira_id || '';
        if (!saoMesmaPedreira(ped, filtroPedreira)) {
          return false;
        }
      }

      // Data de Envelopamento / Cadastro / Romaneio
      const dataStr = item.data_liberacao || item.data_envelopamento || item.data_cadastro || item.data_romaneio || item.created_at;
      if (dataStr && (dataMin || dataMax)) {
        try {
          let dt = null;
          if (dataStr.includes('-')) {
            const [y, m, d] = dataStr.slice(0, 10).split('-').map(Number);
            dt = new Date(y, m - 1, d, 12, 0, 0);
          } else if (dataStr.includes('/')) {
            const [d, m, y] = dataStr.split('/').map(Number);
            dt = new Date(y, m - 1, d, 12, 0, 0);
          }
          if (dt) {
            if (dataMin && dt < dataMin) return false;
            if (dataMax && dt > dataMax) return false;
          }
        } catch (e) {}
      }

      return true;
    });
  }, [envelopamentos, clienteSelecionado, filtroPeriodo, dataInicioCustom, dataFimCustom, filtroPedreira, filtroStatus]);

  // Inicializa a seleção de todos os blocos encontrados
  useEffect(() => {
    if (blocosFiltrados.length > 0) {
      const novoSet = new Set(blocosFiltrados.map(b => b.id || b.numero_bloco));
      setBlocosSelecionadosIds(novoSet);
    } else {
      setBlocosSelecionadosIds(new Set());
    }
  }, [blocosFiltrados]);

  const toggleBloco = (id) => {
    setBlocosSelecionadosIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    if (blocosSelecionadosIds.size === blocosFiltrados.length) {
      setBlocosSelecionadosIds(new Set());
    } else {
      setBlocosSelecionadosIds(new Set(blocosFiltrados.map(b => b.id || b.numero_bloco)));
    }
  };

  // Blocos efetivamente selecionados para inclusão na mensagem
  const blocosParaEnvio = useMemo(() => {
    return blocosFiltrados.filter(b => blocosSelecionadosIds.has(b.id || b.numero_bloco));
  }, [blocosFiltrados, blocosSelecionadosIds]);

  // Cálculo de peso total
  const pesoTotalKg = useMemo(() => {
    return blocosParaEnvio.reduce((acc, item) => {
      if (!item.peso_kg) return acc;
      const num = parseFloat(String(item.peso_kg).replace(/\./g, '').replace(',', '.'));
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  }, [blocosParaEnvio]);

  const pesoTotalToneladas = (pesoTotalKg / 1000).toFixed(1);

  // Pedreiras envolvidas
  const pedreirasEnvolvidas = useMemo(() => {
    const s = new Set();
    blocosParaEnvio.forEach(b => {
      if (b.pedreira_nome) s.add(b.pedreira_nome);
      else if (b.pedreira_id) s.add(b.pedreira_id);
    });
    return Array.from(s).join(' / ') || 'Unidades Vermont';
  }, [blocosParaEnvio]);

  // Formatação do label de período
  const periodoLabel = useMemo(() => {
    const hojeStr = formatarDataBR(new Date().toISOString().slice(0, 10));
    if (filtroPeriodo === 'hoje') return `Hoje (${hojeStr})`;
    if (filtroPeriodo === 'ontem') return 'Ontem';
    if (filtroPeriodo === '7_dias') return 'Últimos 7 Dias';
    if (filtroPeriodo === 'mes_atual') return 'Mês Atual';
    if (filtroPeriodo === 'custom') {
      const dtI = dataInicioCustom ? formatarDataBR(dataInicioCustom) : '';
      const dtF = dataFimCustom ? formatarDataBR(dataFimCustom) : '';
      if (dtI && dtF) return `${dtI} a ${dtF}`;
      if (dtI) return `A partir de ${dtI}`;
      if (dtF) return `Até ${dtF}`;
      return 'Período Personalizado';
    }
    return 'Todo o Histórico';
  }, [filtroPeriodo, dataInicioCustom, dataFimCustom]);

  // Mensagem padronizada oficial
  const mensagemWhatsApp = useMemo(() => {
    if (!clienteSelecionado || blocosParaEnvio.length === 0) {
      return '';
    }

    let texto = `🏛️ *GRUPO VERMONT MINERAÇÃO*\n`;
    texto += `📋 *COMUNICADO DE BLOCOS ENVELOPADOS & LIBERADOS*\n\n`;
    texto += `🏢 *Cliente:* ${clienteSelecionado}\n`;
    texto += `📅 *Período:* ${periodoLabel}\n`;
    texto += `📍 *Pedreira / Unidade:* ${pedreirasEnvolvidas}\n\n`;
    texto += `Informamos que os blocos abaixo foram *ENVELOPADOS* e encontram-se *LIBERADOS PARA CARREGAMENTO* no pátio:\n\n`;
    texto += `📦 *LISTAGEM DE BLOCOS (${blocosParaEnvio.length} blocos • ${pesoTotalToneladas} t):*\n`;

    blocosParaEnvio.forEach((b, idx) => {
      const numRom = b.numero_romaneio ? ` | Rom: *${b.numero_romaneio}*` : '';
      const mat = b.material ? ` | *${b.material}*` : '';
      const peso = b.peso_kg ? ` | ${Number(b.peso_kg).toLocaleString('pt-BR')} kg` : '';
      const ped = b.pedreira_nome ? ` (${b.pedreira_nome.split('-')[0].trim()})` : '';
      texto += `${idx + 1}. Bloco *${b.numero_bloco}*${numRom}${mat}${peso}${ped}\n`;
    });

    texto += `\n✅ *Status:* Liberado para agendamento de transporte e retirada.\n`;
    texto += `🔗 *Portal de Agendamento • Grupo Vermont*`;

    return texto;
  }, [clienteSelecionado, blocosParaEnvio, periodoLabel, pedreirasEnvolvidas, pesoTotalToneladas]);

  // Disparo via WhatsApp
  const handleEnviarWhatsApp = () => {
    if (!mensagemWhatsApp) return;

    let telLimpo = (telefoneDestino || '').replace(/\D/g, '');
    if (telLimpo.length >= 10 && !telLimpo.startsWith('55')) {
      telLimpo = `55${telLimpo}`;
    }

    const encoded = encodeURIComponent(mensagemWhatsApp);
    let url = '';
    if (telLimpo) {
      url = `https://wa.me/${telLimpo}?text=${encoded}`;
    } else {
      url = `https://wa.me/?text=${encoded}`;
    }

    window.open(url, '_blank');
  };

  const handleCopiarMensagem = async () => {
    if (!mensagemWhatsApp) return;
    try {
      await navigator.clipboard.writeText(mensagemWhatsApp);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch (e) {
      console.warn('Erro ao copiar:', e);
    }
  };

  if (!aberto) return null;

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
      <div className="glass-panel animate-scale" style={{
        width: '100%',
        maxWidth: 880,
        maxHeight: '92vh',
        background: '#09110d',
        border: '1px solid var(--vermont-green-border)',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden'
      }}>
        
        {/* Cabeçalho do Modal */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(22, 163, 74, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'rgba(34, 197, 94, 0.2)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4ade80'
            }}>
              <MessageSquare size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                Notificar Cliente via WhatsApp
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 6, background: '#16a34a', color: '#fff', fontWeight: 700 }}>
                  Resumo Padronizado
                </span>
              </h2>
              <span style={{ fontSize: '0.80rem', color: 'var(--slate-400)' }}>
                Selecione o cliente e as datas para gerar a mensagem com os blocos envelopados
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="btn btn-secondary"
            style={{ padding: '8px 10px', borderRadius: 8, color: 'var(--slate-400)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          
          {/* Passo 1: Seleção de Cliente e Telefone */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14,
            background: 'rgba(255, 255, 255, 0.03)',
            padding: 16,
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.07)'
          }}>
            {/* Seleção do Cliente */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: 'var(--slate-300)', fontWeight: 700, marginBottom: 6 }}>
                <Building2 size={14} color="#38bdf8" /> CLIENTE COMPRADOR:
              </label>
              <select
                className="form-select"
                value={clienteSelecionado}
                onChange={(e) => setClienteSelecionado(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  minHeight: 42,
                  borderRadius: 8,
                  background: 'rgba(8, 12, 16, 0.95)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontSize: '0.86rem',
                  fontWeight: 600
                }}
              >
                <option value="">Selecione o Cliente...</option>
                {listaClientes.map(c => (
                  <option key={c.nome} value={c.nome}>
                    {c.nome} {c.telefone ? `📞 (${c.telefone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* WhatsApp do Cliente */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: 'var(--slate-300)', fontWeight: 700, marginBottom: 6 }}>
                <Phone size={14} color="#4ade80" /> WHATSAPP DE DESTINO:
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="(85) 99999-9999 ou 5585999999999"
                value={telefoneDestino}
                onChange={(e) => setTelefoneDestino(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  minHeight: 42,
                  borderRadius: 8,
                  background: 'rgba(8, 12, 16, 0.95)',
                  color: '#4ade80',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  fontSize: '0.86rem',
                  fontWeight: 700
                }}
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--slate-400)', display: 'block', marginTop: 3 }}>
                * Se deixar em branco, o WhatsApp abrirá para você escolher o contato manualmente.
              </span>
            </div>
          </div>

          {/* Passo 2: Seleção de Período com Pílulas Rápidas */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: 16,
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.07)'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: 'var(--slate-300)', fontWeight: 700, marginBottom: 10 }}>
              <Calendar size={14} color="#fbbf24" /> PERÍODO / DATAS DOS BLOCOS:
            </label>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { id: 'hoje', label: 'Hoje' },
                { id: 'ontem', label: 'Ontem' },
                { id: '7_dias', label: 'Últimos 7 Dias' },
                { id: 'mes_atual', label: 'Mês Atual' },
                { id: 'todos', label: 'Todo o Histórico' },
                { id: 'custom', label: '📅 Personalizado (De / Até)' }
              ].map(p => {
                const ativo = filtroPeriodo === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFiltroPeriodo(p.id)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 8,
                      fontSize: '0.80rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: ativo ? '1px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.12)',
                      background: ativo ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      color: ativo ? '#4ade80' : 'var(--slate-300)',
                      transition: 'all 0.15s'
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Inputs de Data Personalizada */}
            {filtroPeriodo === 'custom' && (
              <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--slate-300)', fontWeight: 600 }}>De:</span>
                  <input
                    type="date"
                    className="form-input"
                    value={dataInicioCustom}
                    onChange={(e) => setDataInicioCustom(e.target.value)}
                    style={{ fontSize: '0.82rem', padding: '6px 10px', background: 'rgba(8,12,16,0.95)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6 }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--slate-300)', fontWeight: 600 }}>Até:</span>
                  <input
                    type="date"
                    className="form-input"
                    value={dataFimCustom}
                    onChange={(e) => setDataFimCustom(e.target.value)}
                    style={{ fontSize: '0.82rem', padding: '6px 10px', background: 'rgba(8,12,16,0.95)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6 }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Passo 3: Blocos Encontrados com Checkboxes */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: 16,
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.07)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Box size={16} color="#4ade80" />
                <span style={{ fontSize: '0.84rem', color: '#fff', fontWeight: 700 }}>
                  Blocos Envelopados Encontrados ({blocosFiltrados.length})
                </span>
                {blocosParaEnvio.length > 0 && (
                  <span style={{ fontSize: '0.76rem', color: '#4ade80', background: 'rgba(34,197,94,0.15)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                    {blocosParaEnvio.length} selecionados • {pesoTotalToneladas} t
                  </span>
                )}
              </div>

              {blocosFiltrados.length > 0 && (
                <button
                  type="button"
                  onClick={toggleTodos}
                  style={{
                    fontSize: '0.74rem',
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'var(--slate-300)',
                    cursor: 'pointer'
                  }}
                >
                  {blocosSelecionadosIds.size === blocosFiltrados.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </button>
              )}
            </div>

            {blocosFiltrados.length === 0 ? (
              <div style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: 'var(--slate-400)',
                fontSize: '0.82rem',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 8
              }}>
                <AlertCircle size={24} color="#f59e0b" style={{ margin: '0 auto 8px', display: 'block' }} />
                Nenhum bloco com status <strong>"Envelopado"</strong> encontrado para este cliente no período selecionado.
                <div style={{ marginTop: 6, fontSize: '0.74rem', color: 'var(--slate-500)' }}>
                  Tente alterar o período para "Todo o Histórico" ou verificar se há blocos cadastrados para este cliente.
                </div>
              </div>
            ) : (
              <div style={{
                maxHeight: 180,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                paddingRight: 4
              }}>
                {blocosFiltrados.map(b => {
                  const id = b.id || b.numero_bloco;
                  const selecionado = blocosSelecionadosIds.has(id);
                  const dtFormatada = b.data_liberacao ? formatarDataBR(b.data_liberacao) : (b.data_romaneio ? formatarDataBR(b.data_romaneio) : '');

                  return (
                    <div
                      key={id}
                      onClick={() => toggleBloco(id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: selecionado ? 'rgba(34, 197, 94, 0.10)' : 'rgba(0,0,0,0.25)',
                        border: selecionado ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="checkbox"
                          checked={selecionado}
                          onChange={() => {}} // controlado pelo onClick da div
                          style={{ cursor: 'pointer', accentColor: '#22c55e', width: 16, height: 16 }}
                        />
                        <div>
                          <strong style={{ color: '#fff', fontSize: '0.84rem' }}>
                            Bloco {b.numero_bloco}
                          </strong>
                          {b.numero_romaneio && (
                            <span style={{ fontSize: '0.74rem', color: '#38bdf8', marginLeft: 8 }}>
                              Rom. {b.numero_romaneio}
                            </span>
                          )}
                          {b.material && (
                            <span style={{ fontSize: '0.74rem', color: 'var(--slate-300)', marginLeft: 8 }}>
                              • {b.material}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.76rem', color: 'var(--slate-400)' }}>
                        {b.pedreira_nome && <span>{b.pedreira_nome}</span>}
                        {b.peso_kg && <strong style={{ color: '#fbbf24' }}>{Number(b.peso_kg).toLocaleString('pt-BR')} kg</strong>}
                        {dtFormatada && <span>{dtFormatada}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Passo 4: Prévia da Mensagem Formatada */}
          {mensagemWhatsApp && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: '0.76rem', color: 'var(--slate-300)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={14} color="#4ade80" /> PRÉVIA DA MENSAGEM (FORMATO WHATSAPP):
                </label>
                <button
                  type="button"
                  onClick={handleCopiarMensagem}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.74rem',
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: copiado ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                    border: copiado ? '1px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.15)',
                    color: copiado ? '#4ade80' : 'var(--slate-300)',
                    cursor: 'pointer'
                  }}
                >
                  {copiado ? <Check size={14} /> : <Copy size={14} />}
                  {copiado ? 'Mensagem Copiada!' : 'Copiar Texto'}
                </button>
              </div>

              <div style={{
                background: '#0b1f16',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: 12,
                padding: '14px 18px',
                fontSize: '0.80rem',
                color: '#e2e8f0',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                maxHeight: 160,
                overflowY: 'auto',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)'
              }}>
                {mensagemWhatsApp}
              </div>
            </div>
          )}

        </div>

        {/* Rodapé com Ações */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 0, 0, 0.35)',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <button
            type="button"
            onClick={onFechar}
            className="btn btn-secondary"
            style={{ padding: '9px 18px', fontSize: '0.86rem', fontWeight: 600 }}
          >
            Fechar
          </button>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleCopiarMensagem}
              disabled={blocosParaEnvio.length === 0}
              className="btn btn-secondary"
              style={{
                padding: '10px 18px',
                fontSize: '0.86rem',
                fontWeight: 700,
                gap: 8,
                opacity: blocosParaEnvio.length === 0 ? 0.5 : 1
              }}
            >
              {copiado ? <Check size={16} /> : <Copy size={16} />}
              {copiado ? 'Copiado!' : 'Copiar Mensagem'}
            </button>

            <button
              type="button"
              onClick={handleEnviarWhatsApp}
              disabled={blocosParaEnvio.length === 0}
              className="btn btn-primary"
              style={{
                padding: '10px 22px',
                fontSize: '0.88rem',
                fontWeight: 800,
                gap: 8,
                background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
                border: '1px solid #4ade80',
                color: '#fff',
                boxShadow: '0 4px 15px rgba(34, 197, 94, 0.35)',
                opacity: blocosParaEnvio.length === 0 ? 0.5 : 1,
                cursor: blocosParaEnvio.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <Send size={16} />
              Enviar pelo WhatsApp
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
