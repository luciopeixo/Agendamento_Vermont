import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  Calendar, 
  Building2, 
  Phone, 
  Box, 
  MessageSquare,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { obterClientesDoBancoDeDados, normalizarPeso } from '../services/envelopamentoService';
import { saoMesmaPedreira } from '../services/agendamentoService';

export function ModalNotificarClienteWhatsApp({ 
  aberto, 
  onFechar, 
  envelopamentos = [],
  clienteInicial = '',
  pedreiraOperador = ''
}) {
  const [clientesDb, setClientesDb] = useState([]);
  const [filtroPeriodo, setFiltroPeriodo] = useState('7_dias'); // '7_dias', 'hoje', 'ontem', 'mes_atual', 'todos', 'custom'
  const [dataInicioCustom, setDataInicioCustom] = useState('');
  const [dataFimCustom, setDataFimCustom] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState(clienteInicial || '');
  const [filtroPedreira, setFiltroPedreira] = useState('todas');
  const [telefoneDestino, setTelefoneDestino] = useState('');
  const [blocosSelecionadosIds, setBlocosSelecionadosIds] = useState(new Set());
  const [copiado, setCopiado] = useState(false);

  // Carrega cadastro de clientes para puxar telefones automaticamente
  useEffect(() => {
    if (aberto) {
      obterClientesDoBancoDeDados().then(res => {
        setClientesDb(res || []);
      }).catch(() => {});
    }
  }, [aberto]);

  // Função para formatar o peso em kg sem gerar NaN e preservando decimais quando presentes
  const formatarPesoKg = (peso) => {
    if (peso === undefined || peso === null || peso === '') return '';
    let str = String(peso).trim();
    if (str.toLowerCase().includes('nan')) return '';
    
    // Tratamento de pontos e vírgulas brasileiros
    if (str.includes('.') && str.includes(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else if (str.includes(',')) {
      str = str.replace(',', '.');
    } else if (str.includes('.') && str.split('.')[1]?.length === 3) {
      str = str.replace(/\./g, '');
    }

    const num = parseFloat(str.replace(/[^\d.-]/g, ''));
    if (isNaN(num) || num <= 0) {
      return String(peso).endsWith('kg') ? String(peso) : `${peso} kg`;
    }
    const temDecimal = num % 1 !== 0;
    const formatado = num.toLocaleString('pt-BR', {
      minimumFractionDigits: temDecimal ? 1 : 0,
      maximumFractionDigits: 2
    });
    return `${formatado} kg`;
  };

  // Formatação segura de data sem bugs de ISO string
  const formatarDataSegura = (dataStr) => {
    if (!dataStr) return '';
    try {
      if (dataStr.includes('T')) {
        const datePart = dataStr.split('T')[0];
        const [y, m, d] = datePart.split('-');
        return `${d}/${m}/${y}`;
      }
      if (dataStr.includes('-')) {
        const [y, m, d] = dataStr.slice(0, 10).split('-');
        return `${d}/${m}/${y}`;
      }
      return dataStr;
    } catch (e) {
      return '';
    }
  };

  // Formatar nome da pedreira de forma amigável: "São Gonçalo do Amarante - Serrote"
  const formatarNomePedreira = (pedNome = '') => {
    if (!pedNome) return 'Pedreira Vermont';
    let nomeLimpo = String(pedNome).replace(/\s*-\s*CE\s*/i, ' - ').trim();
    nomeLimpo = nomeLimpo.replace(/\((.*?)\)/g, '$1').trim();
    return nomeLimpo;
  };

  // Limites de datas para o período selecionado
  const limitesData = useMemo(() => {
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

    return { dataMin, dataMax };
  }, [filtroPeriodo, dataInicioCustom, dataFimCustom]);

  // Lista dinâmica: APENAS clientes que tiveram blocos ENVELOPADOS no período
  const clientesDisponiveisNoPeriodo = useMemo(() => {
    const { dataMin, dataMax } = limitesData;
    const mapa = new Map();

    (envelopamentos || []).forEach(item => {
      if (item.status !== 'envelopado') return;

      if (filtroPedreira !== 'todas') {
        const ped = item.pedreira_nome || item.pedreira_id || '';
        if (!saoMesmaPedreira(ped, filtroPedreira)) return;
      }

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
            if (dataMin && dt < dataMin) return;
            if (dataMax && dt > dataMax) return;
          }
        } catch (e) {}
      }

      const nome = (item.cliente_nome || '').trim().toUpperCase();
      if (nome) {
        if (!mapa.has(nome)) {
          const cliDb = clientesDb.find(c => (c.nome || '').trim().toUpperCase() === nome);
          mapa.set(nome, {
            nome,
            cnpj: item.cliente_cnpj || cliDb?.cnpj || '',
            telefone: cliDb?.telefone || '',
            totalBlocos: 1
          });
        } else {
          mapa.get(nome).totalBlocos += 1;
        }
      }
    });

    return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [envelopamentos, clientesDb, limitesData, filtroPedreira]);

  // Sincroniza o cliente selecionado quando o período mudar
  useEffect(() => {
    if (clientesDisponiveisNoPeriodo.length > 0) {
      const aindaExiste = clientesDisponiveisNoPeriodo.some(c => c.nome === clienteSelecionado);
      if (!aindaExiste) {
        setClienteSelecionado(clientesDisponiveisNoPeriodo[0].nome);
      }
    } else {
      setClienteSelecionado('');
    }
  }, [clientesDisponiveisNoPeriodo]);

  // Atualiza telefone automaticamente quando o cliente muda
  useEffect(() => {
    if (clienteSelecionado) {
      const cliObj = clientesDisponiveisNoPeriodo.find(c => c.nome === clienteSelecionado) 
        || clientesDb.find(c => (c.nome || '').trim().toUpperCase() === clienteSelecionado.toUpperCase());
      if (cliObj && cliObj.telefone) {
        setTelefoneDestino(cliObj.telefone);
      }
    }
  }, [clienteSelecionado, clientesDisponiveisNoPeriodo, clientesDb]);

  // Blocos envelopados do cliente selecionado no período
  const blocosFiltrados = useMemo(() => {
    if (!clienteSelecionado) return [];
    const { dataMin, dataMax } = limitesData;

    return (envelopamentos || []).filter(item => {
      if (item.status !== 'envelopado') return false;

      const cliNome = (item.cliente_nome || '').trim().toUpperCase();
      if (cliNome !== clienteSelecionado.toUpperCase()) return false;

      if (filtroPedreira !== 'todas') {
        const ped = item.pedreira_nome || item.pedreira_id || '';
        if (!saoMesmaPedreira(ped, filtroPedreira)) return false;
      }

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
  }, [envelopamentos, clienteSelecionado, limitesData, filtroPedreira]);

  // Inicializa todos os blocos encontrados como selecionados
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

  const blocosParaEnvio = useMemo(() => {
    return blocosFiltrados.filter(b => blocosSelecionadosIds.has(b.id || b.numero_bloco));
  }, [blocosFiltrados, blocosSelecionadosIds]);

  const pesoTotalKg = useMemo(() => {
    return blocosParaEnvio.reduce((acc, item) => {
      const p = normalizarPeso(item.peso_kg);
      return acc + (p > 0 ? p : 0);
    }, 0);
  }, [blocosParaEnvio]);

  const pesoTotalToneladas = (pesoTotalKg / 1000).toFixed(1);

  // Mensagem padronizada exata conforme solicitado
  const mensagemWhatsApp = useMemo(() => {
    if (!clienteSelecionado || blocosParaEnvio.length === 0) {
      return '';
    }

    let texto = `*COMUNICADO DE BLOCOS ENVELOPADOS & LIBERADOS*\n\n`;
    texto += `*Cliente:* ${clienteSelecionado}\n\n`;
    texto += `Informamos que os blocos abaixo foram *ENVELOPADOS* e encontram-se *LIBERADOS PARA CARREGAMENTO* :\n\n`;

    blocosParaEnvio.forEach((b, idx) => {
      const mat = b.material ? `*${b.material}*` : '';
      const peso = formatarPesoKg(b.peso_kg);
      const ped = formatarNomePedreira(b.pedreira_nome || b.pedreira_id);
      const numRom = b.numero_romaneio ? `Rom: *${b.numero_romaneio}*` : '';

      let partes = [];
      partes.push(`Bloco *${b.numero_bloco}*`);
      if (mat) partes.push(mat);

      let infoPesoPed = '';
      if (peso && ped) {
        infoPesoPed = `${peso} (${ped})`;
      } else if (peso) {
        infoPesoPed = peso;
      } else if (ped) {
        infoPesoPed = `(${ped})`;
      }
      if (infoPesoPed) partes.push(infoPesoPed);

      if (numRom) partes.push(numRom);

      const linhaBloco = `${idx + 1}. ${partes.join(' | ')}`;
      texto += `${linhaBloco}\n\n`;
    });

    texto += `Ficamos à disposição para agendamento.`;

    return texto.trim();
  }, [clienteSelecionado, blocosParaEnvio]);

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
        maxWidth: 860,
        maxHeight: '92vh',
        background: '#09110d',
        border: '1px solid var(--vermont-green-border)',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden'
      }}>
        
        {/* Cabeçalho */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(22, 163, 74, 0.1)'
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
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', margin: 0, color: '#fff', fontWeight: 800 }}>
                Notificar Cliente via WhatsApp
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>
                Selecione o período abaixo para visualizar apenas os clientes com blocos envelopados
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="btn btn-secondary"
            style={{ padding: '6px 10px', borderRadius: 8, color: 'var(--slate-400)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div style={{ padding: '18px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* PASSO 1: SELEÇÃO DE PERÍODO (ACIMA DO CLIENTE) */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: 14,
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.07)'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: 'var(--slate-300)', fontWeight: 700, marginBottom: 8 }}>
              <Calendar size={14} color="#fbbf24" /> 1. PERÍODO / DATAS DOS BLOCOS:
            </label>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { id: '7_dias', label: 'Últimos 7 Dias' },
                { id: 'hoje', label: 'Hoje' },
                { id: 'ontem', label: 'Ontem' },
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
                      background: ativo ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      color: ativo ? '#4ade80' : 'var(--slate-300)',
                      transition: 'all 0.15s'
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Inputs de Data Customizada */}
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

          {/* PASSO 2: SELEÇÃO DE CLIENTE & WHATSAPP (ABAIXO DO PERÍODO) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14,
            background: 'rgba(255, 255, 255, 0.03)',
            padding: 14,
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.07)'
          }}>
            {/* Cliente */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: 'var(--slate-300)', fontWeight: 700, marginBottom: 6 }}>
                <Building2 size={14} color="#38bdf8" /> 2. CLIENTE COMPRADOR:
              </label>
              
              {clientesDisponiveisNoPeriodo.length === 0 ? (
                <div style={{
                  padding: '10px 12px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 8,
                  fontSize: '0.80rem',
                  color: '#fbbf24'
                }}>
                  Nenhum cliente teve blocos envelopados neste período.
                </div>
              ) : (
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
                    border: '1px solid rgba(34, 197, 94, 0.5)',
                    fontSize: '0.86rem',
                    fontWeight: 700
                  }}
                >
                  {clientesDisponiveisNoPeriodo.map(c => (
                    <option key={c.nome} value={c.nome}>
                      {c.nome} ({c.totalBlocos} bloco{c.totalBlocos > 1 ? 's' : ''})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* WhatsApp de Destino */}
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

          {/* PASSO 3: BLOCOS ENVELOPADOS ENCONTRADOS */}
          {clienteSelecionado && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: 14,
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
                      {blocosParaEnvio.length} selecionado{blocosParaEnvio.length > 1 ? 's' : ''} • {pesoTotalToneladas} t
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

              <div style={{
                maxHeight: 160,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                paddingRight: 4
              }}>
                {blocosFiltrados.map(b => {
                  const id = b.id || b.numero_bloco;
                  const selecionado = blocosSelecionadosIds.has(id);
                  const pedFormatada = formatarNomePedreira(b.pedreira_nome || b.pedreira_id);
                  const pesoFmt = formatarPesoKg(b.peso_kg);
                  const dtFmt = formatarDataSegura(b.data_liberacao || b.data_romaneio || b.data_cadastro);

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
                        background: selecionado ? 'rgba(34, 197, 94, 0.12)' : 'rgba(0,0,0,0.25)',
                        border: selecionado ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="checkbox"
                          checked={selecionado}
                          onChange={() => {}}
                          style={{ cursor: 'pointer', accentColor: '#22c55e', width: 16, height: 16 }}
                        />
                        <div>
                          <strong style={{ color: '#fff', fontSize: '0.84rem' }}>
                            Bloco {b.numero_bloco}
                          </strong>
                          {b.material && (
                            <span style={{ fontSize: '0.74rem', color: '#38bdf8', marginLeft: 8 }}>
                              • {b.material}
                            </span>
                          )}
                          {b.numero_romaneio && (
                            <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', marginLeft: 8 }}>
                              (Rom. {b.numero_romaneio})
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.76rem', color: 'var(--slate-400)' }}>
                        <span>{pedFormatada}</span>
                        <strong style={{ color: '#fbbf24' }}>{pesoFmt}</strong>
                        {dtFmt && <span style={{ color: 'var(--slate-500)' }}>{dtFmt}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASSO 4: PRÉVIA DA MENSAGEM */}
          {mensagemWhatsApp && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: '0.76rem', color: 'var(--slate-300)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={14} color="#4ade80" /> PRÉVIA DA MENSAGEM:
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
                fontSize: '0.82rem',
                color: '#e2e8f0',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                maxHeight: 180,
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
          padding: '16px 22px',
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
