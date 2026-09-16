import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, 
  Search, 
  Plus, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  Box, 
  Building2, 
  Users, 
  Scissors, 
  CheckCheck, 
  Ban, 
  Play,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  MinusCircle,
  LayoutGrid,
  List,
  Filter,
  X
} from 'lucide-react';
import { 
  listarEnvelopamentos, 
  atualizarStatusEnvelopamento, 
  excluirEnvelopamento, 
  calcularMetricasEnvelopamento, 
  STATUS_ENVELOPAMENTO,
  inscreverEnvelopamentosRealtime
} from '../services/envelopamentoService';
import { PEDREIRAS_CEARA, formatarDataHoraBR } from '../services/agendamentoService';
import { ModalCadastrarBlocoEnvelopamento } from './ModalCadastrarBlocoEnvelopamento';
import { ModalGestaoClientes } from './ModalGestaoClientes';
import { ModalImportarRomaneioPdf } from './ModalImportarRomaneioPdf';

export function PainelEnvelopamento({ usuario, isAdmin, pedreiraOperador }) {
  const [envelopamentos, setEnvelopamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [modalPdfAberto, setModalPdfAberto] = useState(false);
  const [modalClientesAberto, setModalClientesAberto] = useState(false);
  const [blocoEmEdicao, setBlocoEmEdicao] = useState(null);
  const [filtroPedreira, setFiltroPedreira] = useState(pedreiraOperador || '');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [buscaTexto, setBuscaTexto] = useState('');
  const [executandoAcaoId, setExecutandoAcaoId] = useState(null);

  // Modo de visualização: 'matriz' (agrupado por cliente) ou 'tabela' (lista plana)
  const [modoVisualizacao, setModoVisualizacao] = useState('matriz');
  const [clientesExpandidos, setClientesExpandidos] = useState(new Set());

  const usuarioNome = usuario?.user_metadata?.nome || usuario?.email?.split('@')[0] || 'Equipe Vermont';

  const carregarDados = async (silencioso = false) => {
    if (!silencioso) setCarregando(true);
    try {
      const dados = await listarEnvelopamentos({
        pedreira: filtroPedreira,
        status: filtroStatus,
        busca: buscaTexto
      });
      setEnvelopamentos(dados);
    } catch (err) {
      console.error('Erro ao carregar envelopamentos:', err);
    } finally {
      if (!silencioso) setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [filtroPedreira, filtroStatus, buscaTexto]);

  // Sincronização em tempo real (Supabase Realtime + eventos locais e entre abas)
  useEffect(() => {
    const unsub = inscreverEnvelopamentosRealtime(() => {
      carregarDados(true);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [filtroPedreira, filtroStatus, buscaTexto]);

  const metricas = calcularMetricasEnvelopamento(envelopamentos);

  // Agrupamento em Matriz por Cliente Comprador
  const gruposPorCliente = useMemo(() => {
    const mapa = new Map();
    envelopamentos.forEach(item => {
      const cliNome = String(item.cliente_nome || 'CLIENTE NÃO INFORMADO').trim().toUpperCase();
      if (!mapa.has(cliNome)) {
        mapa.set(cliNome, {
          clienteNome: cliNome,
          clienteCnpj: item.cliente_cnpj || '',
          pedreiras: new Set(),
          blocos: [],
          metricas: {
            total: 0,
            envelopado: 0,
            sem_envelopamento: 0,
            pendente_envelopamento: 0,
            em_andamento: 0,
            aguardando_corte_reparo: 0
          }
        });
      }
      const grupo = mapa.get(cliNome);
      if (!grupo.clienteCnpj && item.cliente_cnpj) grupo.clienteCnpj = item.cliente_cnpj;
      if (item.pedreira_nome) grupo.pedreiras.add(item.pedreira_nome);
      grupo.blocos.push(item);
      grupo.metricas.total++;
      if (item.status === 'envelopado') grupo.metricas.envelopado++;
      else if (item.status === 'sem_envelopamento') grupo.metricas.sem_envelopamento++;
      else if (item.status === 'pendente_envelopamento' || item.status === 'pendente') grupo.metricas.pendente_envelopamento++;
      else if (item.status === 'em_andamento') grupo.metricas.em_andamento++;
      else if (item.status === 'aguardando_corte_reparo') grupo.metricas.aguardando_corte_reparo++;
    });

    return Array.from(mapa.values()).sort((a, b) => b.metricas.total - a.metricas.total);
  }, [envelopamentos]);

  // Se houver poucos clientes (até 3), expande automaticamente
  useEffect(() => {
    if (gruposPorCliente.length > 0 && gruposPorCliente.length <= 3 && clientesExpandidos.size === 0) {
      setClientesExpandidos(new Set(gruposPorCliente.map(g => g.clienteNome)));
    }
  }, [gruposPorCliente]);

  const toggleCliente = (cliNome) => {
    setClientesExpandidos(prev => {
      const novo = new Set(prev);
      if (novo.has(cliNome)) {
        novo.delete(cliNome);
      } else {
        novo.add(cliNome);
      }
      return novo;
    });
  };

  const expandirTodos = () => {
    setClientesExpandidos(new Set(gruposPorCliente.map(g => g.clienteNome)));
  };

  const recolherTodos = () => {
    setClientesExpandidos(new Set());
  };

  const handleAvancarStatus = async (item, proximoStatus) => {
    setExecutandoAcaoId(item.id);
    try {
      await atualizarStatusEnvelopamento(item.id, proximoStatus, usuarioNome);
      await carregarDados();
    } catch (err) {
      console.error('Erro ao avançar status:', err);
    } finally {
      setExecutandoAcaoId(null);
    }
  };

  const handleExcluir = async (id, numeroBloco) => {
    if (window.confirm(`Tem certeza que deseja remover o bloco ${numeroBloco} do controle de envelopamento?`)) {
      try {
        await excluirEnvelopamento(id);
        await carregarDados();
      } catch (err) {
        console.error('Erro ao excluir:', err);
      }
    }
  };

  const handleExportarCSV = () => {
    if (envelopamentos.length === 0) {
      alert('Não há dados para exportar com os filtros atuais.');
      return;
    }

    const cabecalho = ['Bloco', 'Material', 'Pedreira', 'Cliente', 'CNPJ Cliente', 'Status', 'Responsável Envelopamento', 'Data Envelopamento', 'Responsável Liberação', 'Data Liberação', 'Observações'];
    const linhas = envelopamentos.map(b => [
      `"${b.numero_bloco || ''}"`,
      `"${b.material || ''}"`,
      `"${b.pedreira_nome || ''}"`,
      `"${b.cliente_nome || ''}"`,
      `"${b.cliente_cnpj || ''}"`,
      `"${STATUS_ENVELOPAMENTO[b.status?.toUpperCase()]?.label || b.status}"`,
      `"${b.responsavel_envelopamento || ''}"`,
      `"${b.data_envelopamento ? formatarDataHoraBR(b.data_envelopamento) : ''}"`,
      `"${b.responsavel_liberacao || ''}"`,
      `"${b.data_liberacao ? formatarDataHoraBR(b.data_liberacao) : ''}"`,
      `"${(b.observacoes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [cabecalho.join(','), ...linhas.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_envelopamento_vermont_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Cabeçalho do Módulo */}
      <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'var(--vermont-green-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0, 168, 62, 0.35)',
            flexShrink: 0
          }}>
            <Layers size={24} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'inherit', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              Controle de Envelopamento de Blocos
              <span style={{ fontSize: '0.72rem', background: 'rgba(56, 189, 248, 0.15)', color: '#0284c7', padding: '3px 9px', borderRadius: 6, border: '1px solid rgba(56, 189, 248, 0.35)', fontWeight: 700 }}>
                Exclusivo Admin & Pedreiras
              </span>
            </h2>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--slate-400)', opacity: 0.9 }}>
              Acompanhamento de pátio, preparação física e liberação de blocos Vermont
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={carregarDados}
            className="btn btn-secondary"
            title="Recarregar lista"
            style={{ padding: '9px 12px' }}
          >
            <RefreshCw size={16} className={carregando ? 'spinner' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setModalClientesAberto(true)}
            className="btn btn-secondary"
            title="Gerenciar base de clientes compradores"
            style={{ padding: '9px 14px', gap: 6, fontSize: '0.84rem' }}
          >
            <Users size={16} color="#16a34a" />
            Clientes
          </button>
          
          <button
            type="button"
            onClick={handleExportarCSV}
            className="btn btn-secondary"
            title="Exportar para Excel/CSV"
            style={{ padding: '9px 14px', gap: 6, fontSize: '0.84rem' }}
          >
            <Download size={15} />
            Exportar CSV
          </button>

          <button
            type="button"
            onClick={() => setModalPdfAberto(true)}
            className="btn btn-secondary"
            title="Importar Romaneio padrão em PDF da Vermont"
            style={{ 
              padding: '9px 16px', 
              gap: 8, 
              fontSize: '0.86rem', 
              fontWeight: 700,
              borderColor: '#0284c7', 
              color: '#0284c7', 
              background: 'rgba(56, 189, 248, 0.12)' 
            }}
          >
            <FileText size={17} color="#0284c7" />
            Importar PDF Romaneio
          </button>

          <button
            type="button"
            onClick={() => {
              setBlocoEmEdicao(null);
              setModalCadastroAberto(true);
            }}
            className="btn btn-vermont"
            style={{ padding: '9px 18px', gap: 6, fontSize: '0.88rem' }}
          >
            <Plus size={18} />
            Novo Bloco
          </button>
        </div>
      </div>

      {/* Cards de Métricas / 5 Status Oficiais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        
        {/* Total */}
        <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, borderLeft: '4px solid #64748b' }}>
          <div style={{ background: 'rgba(100, 116, 139, 0.15)', padding: 10, borderRadius: 10 }}>
            <Box size={20} color="#64748b" />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--slate-500)', display: 'block', fontWeight: 600 }}>Total de Blocos</span>
            <strong style={{ fontSize: '1.4rem', color: 'inherit' }}>{metricas.total}</strong>
          </div>
        </div>

        {/* Pendente de Envelopamento */}
        <div 
          onClick={() => setFiltroStatus(filtroStatus === 'pendente_envelopamento' ? '' : 'pendente_envelopamento')}
          className="glass-panel" 
          style={{ 
            padding: '14px 18px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            borderLeft: '4px solid #94a3b8',
            cursor: 'pointer',
            background: filtroStatus === 'pendente_envelopamento' ? 'rgba(148, 163, 184, 0.15)' : undefined
          }}
        >
          <div style={{ background: 'rgba(148, 163, 184, 0.2)', padding: 10, borderRadius: 10 }}>
            <Clock size={20} color="#64748b" />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--slate-500)', display: 'block', fontWeight: 600 }}>Pendente Envelop.</span>
            <strong style={{ fontSize: '1.4rem', color: '#64748b' }}>{metricas.pendente_envelopamento}</strong>
          </div>
        </div>

        {/* Em andamento */}
        <div 
          onClick={() => setFiltroStatus(filtroStatus === 'em_andamento' ? '' : 'em_andamento')}
          className="glass-panel" 
          style={{ 
            padding: '14px 18px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            borderLeft: '4px solid #f59e0b',
            cursor: 'pointer',
            background: filtroStatus === 'em_andamento' ? 'rgba(245, 158, 11, 0.15)' : undefined
          }}
        >
          <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: 10, borderRadius: 10 }}>
            <Layers size={20} color="#d97706" />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--slate-500)', display: 'block', fontWeight: 600 }}>Em andamento</span>
            <strong style={{ fontSize: '1.4rem', color: '#d97706' }}>{metricas.em_andamento}</strong>
          </div>
        </div>

        {/* Aguardando corte e reparo */}
        <div 
          onClick={() => setFiltroStatus(filtroStatus === 'aguardando_corte_reparo' ? '' : 'aguardando_corte_reparo')}
          className="glass-panel" 
          style={{ 
            padding: '14px 18px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            borderLeft: '4px solid #ef4444',
            cursor: 'pointer',
            background: filtroStatus === 'aguardando_corte_reparo' ? 'rgba(239, 68, 68, 0.15)' : undefined
          }}
        >
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: 10, borderRadius: 10 }}>
            <Scissors size={20} color="#dc2626" />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--slate-500)', display: 'block', fontWeight: 600 }}>Aguard. Corte/Reparo</span>
            <strong style={{ fontSize: '1.4rem', color: '#dc2626' }}>{metricas.aguardando_corte_reparo}</strong>
          </div>
        </div>

        {/* Envelopado */}
        <div 
          onClick={() => setFiltroStatus(filtroStatus === 'envelopado' ? '' : 'envelopado')}
          className="glass-panel" 
          style={{ 
            padding: '14px 18px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            borderLeft: '4px solid #16a34a',
            cursor: 'pointer',
            background: filtroStatus === 'envelopado' ? 'rgba(22, 163, 74, 0.15)' : undefined
          }}
        >
          <div style={{ background: 'rgba(22, 163, 74, 0.2)', padding: 10, borderRadius: 10 }}>
            <CheckCircle2 size={20} color="#16a34a" />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--slate-500)', display: 'block', fontWeight: 600 }}>Envelopado</span>
            <strong style={{ fontSize: '1.4rem', color: '#16a34a' }}>{metricas.envelopado}</strong>
          </div>
        </div>

        {/* Sem envelopamento */}
        <div 
          onClick={() => setFiltroStatus(filtroStatus === 'sem_envelopamento' ? '' : 'sem_envelopamento')}
          className="glass-panel" 
          style={{ 
            padding: '14px 18px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            borderLeft: '4px solid #0284c7',
            cursor: 'pointer',
            background: filtroStatus === 'sem_envelopamento' ? 'rgba(2, 132, 199, 0.15)' : undefined
          }}
        >
          <div style={{ background: 'rgba(2, 132, 199, 0.2)', padding: 10, borderRadius: 10 }}>
            <Ban size={20} color="#0284c7" />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--slate-500)', display: 'block', fontWeight: 600 }}>Sem Envelopamento</span>
            <strong style={{ fontSize: '1.4rem', color: '#0284c7' }}>{metricas.sem_envelopamento}</strong>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca - Alto Contraste & Rótulos Claros */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '18px 20px', 
          marginBottom: 18, 
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 6px 24px rgba(0,0,0,0.08)'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, alignItems: 'flex-end' }}>
          
          {/* Campo de Busca */}
          <div>
            <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Search size={14} color="var(--vermont-green-light)" />
              BUSCAR POR BLOCO, CLIENTE OU MATERIAL:
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Digite o número do bloco, comprador ou rocha..."
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                style={{ 
                  paddingLeft: 38, 
                  height: 42, 
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  border: '1px solid rgba(255, 255, 255, 0.22)'
                }}
              />
              {buscaTexto && (
                <button
                  type="button"
                  onClick={() => setBuscaTexto('')}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--slate-400)',
                    cursor: 'pointer'
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Filtro Pedreira */}
          <div>
            <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Box size={14} color="var(--vermont-green-light)" />
              FILTRAR PEDREIRA / UNIDADE:
            </label>
            <select
              className="form-select"
              value={filtroPedreira}
              onChange={(e) => setFiltroPedreira(e.target.value)}
              style={{ 
                height: 42, 
                fontSize: '0.88rem',
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.22)'
              }}
            >
              <option value="">Todas as Pedreiras Vermont</option>
              {PEDREIRAS_CEARA.map(p => (
                <option key={p.id} value={p.nome}>{p.nome}</option>
              ))}
            </select>
          </div>

          {/* Filtro Status */}
          <div>
            <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} color="var(--vermont-green-light)" />
              STATUS DO ENVELOPAMENTO:
            </label>
            <select
              className="form-select"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              style={{ 
                height: 42, 
                fontSize: '0.88rem',
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.22)'
              }}
            >
              <option value="">Todos os Status</option>
              {Object.values(STATUS_ENVELOPAMENTO).map(st => (
                <option key={st.id} value={st.id}>{st.label}</option>
              ))}
            </select>
          </div>

          {/* Botão Limpar Filtros */}
          {(buscaTexto || filtroPedreira || filtroStatus) && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setBuscaTexto('');
                  setFiltroPedreira('');
                  setFiltroStatus('');
                }}
                className="btn btn-secondary"
                style={{ 
                  height: 42, 
                  fontSize: '0.84rem', 
                  padding: '0 16px',
                  color: '#f87171',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  width: '100%',
                  fontWeight: 700
                }}
              >
                <X size={15} /> Limpar Filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barra de Controle de Visualização: Matriz por Cliente vs Tabela Plana */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'inherit' }}>
            Visualização:
          </span>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.15)', padding: 3, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              type="button"
              onClick={() => setModoVisualizacao('matriz')}
              className={`btn ${modoVisualizacao === 'matriz' ? 'btn-vermont' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.80rem', gap: 6 }}
            >
              <LayoutGrid size={15} />
              Tabela Matriz (por Cliente)
            </button>
            <button
              type="button"
              onClick={() => setModoVisualizacao('tabela')}
              className={`btn ${modoVisualizacao === 'tabela' ? 'btn-vermont' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.80rem', gap: 6 }}
            >
              <List size={15} />
              Lista Plana (Todos os Blocos)
            </button>
          </div>
        </div>

        {modoVisualizacao === 'matriz' && gruposPorCliente.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={expandirTodos}
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.76rem', gap: 4 }}
            >
              <PlusCircle size={14} color="#16a34a" /> Expandir Todos
            </button>
            <button
              type="button"
              onClick={recolherTodos}
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.76rem', gap: 4 }}
            >
              <MinusCircle size={14} color="#64748b" /> Recolher Todos
            </button>
          </div>
        )}
      </div>

      {/* ÁREA PRINCIPAL: TABELA MATRIZ (POR CLIENTE) OU TABELA PLANA */}
      {carregando ? (
        <div className="glass-panel" style={{ padding: 48, textAlign: 'center', color: 'var(--slate-400)' }}>
          <span className="spinner" style={{ width: 28, height: 28, marginBottom: 12, display: 'inline-block' }} />
          <p style={{ margin: 0, fontSize: '0.95rem' }}>Carregando dados de envelopamento...</p>
        </div>
      ) : envelopamentos.length === 0 ? (
        <div className="glass-panel" style={{ padding: 48, textAlign: 'center', color: 'var(--slate-400)' }}>
          <Box size={44} color="var(--slate-500)" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ margin: 0, color: 'inherit', fontSize: '1.1rem' }}>Nenhum bloco encontrado</h4>
          <p style={{ margin: '6px 0 16px', fontSize: '0.86rem' }}>
            Nenhum bloco cadastrado com os filtros selecionados.
          </p>
          <button
            type="button"
            onClick={() => {
              setBlocoEmEdicao(null);
              setModalCadastroAberto(true);
            }}
            className="btn btn-vermont"
            style={{ display: 'inline-flex', gap: 6, fontSize: '0.86rem' }}
          >
            <Plus size={16} /> Cadastrar Bloco
          </button>
        </div>
      ) : modoVisualizacao === 'matriz' ? (
        /* =========================================================================
           VISÃO MATRIZ AGRUPADA POR CLIENTE COM BOTÃO [+] EXPANSÍVEL
           ========================================================================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {gruposPorCliente.map((grupo) => {
            const isExpandido = clientesExpandidos.has(grupo.clienteNome);
            const pedreirasStr = Array.from(grupo.pedreiras).join(', ') || 'Polo Vermont';

            return (
              <div 
                key={grupo.clienteNome} 
                className="glass-panel" 
                style={{ 
                  padding: 0, 
                  overflow: 'hidden', 
                  borderRadius: 12,
                  border: isExpandido ? '1px solid rgba(0, 168, 62, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Linha Mestra do Cliente (Header com Botão [+]) */}
                <div 
                  onClick={() => toggleCliente(grupo.clienteNome)}
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: isExpandido ? 'rgba(0, 168, 62, 0.08)' : 'transparent',
                    borderBottom: isExpandido ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                    flexWrap: 'wrap',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Botão [+] / [-] */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCliente(grupo.clienteNome);
                      }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: isExpandido ? '1px solid #16a34a' : '1px solid rgba(255, 255, 255, 0.2)',
                        background: isExpandido ? '#16a34a' : 'rgba(255, 255, 255, 0.06)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: 800,
                        transition: 'all 0.2s',
                        boxShadow: isExpandido ? '0 2px 8px rgba(0, 168, 62, 0.35)' : 'none'
                      }}
                      title={isExpandido ? 'Recolher blocos deste cliente' : 'Expandir blocos deste cliente'}
                    >
                      {isExpandido ? <ChevronDown size={18} /> : <Plus size={18} />}
                    </button>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Building2 size={18} color="#16a34a" />
                        <strong style={{ fontSize: '1.05rem', color: 'inherit', letterSpacing: '0.01em' }}>
                          {grupo.clienteNome}
                        </strong>
                        {grupo.clienteCnpj && (
                          <span style={{
                            fontSize: '0.72rem',
                            background: 'rgba(56, 189, 248, 0.12)',
                            color: '#0284c7',
                            padding: '2px 8px',
                            borderRadius: 4,
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            fontFamily: 'monospace',
                            fontWeight: 700
                          }}>
                            CNPJ: {grupo.clienteCnpj}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.76rem', color: 'var(--slate-400)', display: 'block', marginTop: 2 }}>
                        Unidade: {pedreirasStr}
                      </span>
                    </div>
                  </div>

                  {/* Badges de Resumo do Cliente */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {grupo.metricas.envelopado > 0 && (
                      <span style={{
                        fontSize: '0.74rem',
                        padding: '3px 9px',
                        borderRadius: 20,
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: '#16a34a',
                        border: '1px solid #16a34a',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <CheckCircle2 size={12} /> {grupo.metricas.envelopado} Envelopado{grupo.metricas.envelopado > 1 ? 's' : ''}
                      </span>
                    )}

                    {grupo.metricas.sem_envelopamento > 0 && (
                      <span style={{
                        fontSize: '0.74rem',
                        padding: '3px 9px',
                        borderRadius: 20,
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#0284c7',
                        border: '1px solid #0284c7',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <Ban size={12} /> {grupo.metricas.sem_envelopamento} Sem Envelop.
                      </span>
                    )}

                    {grupo.metricas.pendente_envelopamento > 0 && (
                      <span style={{
                        fontSize: '0.74rem',
                        padding: '3px 9px',
                        borderRadius: 20,
                        background: 'rgba(148, 163, 184, 0.15)',
                        color: '#64748b',
                        border: '1px solid #64748b',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <Clock size={12} /> {grupo.metricas.pendente_envelopamento} Pendente{grupo.metricas.pendente_envelopamento > 1 ? 's' : ''}
                      </span>
                    )}

                    {grupo.metricas.em_andamento > 0 && (
                      <span style={{
                        fontSize: '0.74rem',
                        padding: '3px 9px',
                        borderRadius: 20,
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#d97706',
                        border: '1px solid #d97706',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <Layers size={12} /> {grupo.metricas.em_andamento} Em andamento
                      </span>
                    )}

                    {grupo.metricas.aguardando_corte_reparo > 0 && (
                      <span style={{
                        fontSize: '0.74rem',
                        padding: '3px 9px',
                        borderRadius: 20,
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#dc2626',
                        border: '1px solid #dc2626',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <Scissors size={12} /> {grupo.metricas.aguardando_corte_reparo} Reparo
                      </span>
                    )}

                    <span style={{
                      fontSize: '0.80rem',
                      fontWeight: 800,
                      background: 'rgba(0,0,0,0.2)',
                      padding: '4px 10px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'inherit'
                    }}>
                      📦 {grupo.metricas.total} Bloco{grupo.metricas.total > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Tabela de Blocos do Cliente (Expandida com o [+]) */}
                {isExpandido && (
                  <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.03)' }}>
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <th style={{ padding: '10px 14px', fontSize: '0.74rem', color: 'var(--slate-400)', textAlign: 'left', width: '15%' }}>BLOCO / ROCHA</th>
                          <th style={{ padding: '10px 14px', fontSize: '0.74rem', color: 'var(--slate-400)', textAlign: 'left', width: '18%' }}>PEDREIRA</th>
                          <th style={{ padding: '10px 14px', fontSize: '0.74rem', color: 'var(--slate-400)', textAlign: 'center', width: '22%' }}>STATUS ENVELOPAMENTO</th>
                          <th style={{ padding: '10px 14px', fontSize: '0.74rem', color: 'var(--slate-400)', textAlign: 'left', width: '25%' }}>HISTÓRICO & RESPONSÁVEIS</th>
                          <th style={{ padding: '10px 14px', fontSize: '0.74rem', color: 'var(--slate-400)', textAlign: 'center', width: '20%' }}>AÇÕES DE PÁTIO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grupo.blocos.map((b) => {
                          const statusInfo = STATUS_ENVELOPAMENTO[b.status?.toUpperCase()] || STATUS_ENVELOPAMENTO.PENDENTE_ENVELOPAMENTO;
                          const executando = executandoAcaoId === b.id;

                          return (
                            <tr 
                              key={b.id}
                              style={{ 
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                background: b.status === 'envelopado' ? 'rgba(34, 197, 94, 0.03)' : undefined
                              }}
                            >
                              {/* Bloco */}
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  color: 'inherit',
                                  fontWeight: 800,
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  fontSize: '0.86rem',
                                  fontFamily: 'monospace',
                                  letterSpacing: '0.05em',
                                  border: '1px solid rgba(255,255,255,0.15)',
                                  display: 'inline-block'
                                }}>
                                  {b.numero_bloco}
                                </span>
                                <span style={{ fontSize: '0.76rem', color: 'var(--slate-400)', display: 'block', marginTop: 4, fontWeight: 600 }}>
                                  {b.material}
                                </span>
                              </td>

                              {/* Pedreira */}
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'inherit' }}>
                                  {b.pedreira_nome || '-'}
                                </span>
                              </td>

                              {/* Status */}
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                <div style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '5px 12px',
                                  borderRadius: 20,
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                  background: statusInfo.bg,
                                  color: statusInfo.cor,
                                  border: `1px solid ${statusInfo.border}`
                                }}>
                                  {b.status === 'envelopado' && <CheckCircle2 size={13} />}
                                  {b.status === 'em_andamento' && <Layers size={13} />}
                                  {b.status === 'aguardando_corte_reparo' && <Scissors size={13} />}
                                  {b.status === 'pendente_envelopamento' && <Clock size={13} />}
                                  {b.status === 'sem_envelopamento' && <Ban size={13} />}
                                  <span>{statusInfo.label}</span>
                                </div>
                              </td>

                              {/* Histórico & Observações */}
                              <td style={{ padding: '10px 14px' }}>
                                {b.status === 'envelopado' && b.responsavel_liberacao ? (
                                  <div style={{ fontSize: '0.74rem', color: '#16a34a' }}>
                                    <span>Liberado por: <strong>{b.responsavel_liberacao}</strong></span>
                                    {b.data_liberacao && (
                                      <span style={{ display: 'block', color: 'var(--slate-400)', fontSize: '0.70rem' }}>
                                        {formatarDataHoraBR(b.data_liberacao)}
                                      </span>
                                    )}
                                  </div>
                                ) : b.status === 'sem_envelopamento' && b.responsavel_liberacao ? (
                                  <div style={{ fontSize: '0.74rem', color: '#0284c7' }}>
                                    <span>Liberado direto por: <strong>{b.responsavel_liberacao}</strong></span>
                                  </div>
                                ) : b.status === 'em_andamento' && b.responsavel_envelopamento ? (
                                  <div style={{ fontSize: '0.74rem', color: '#d97706' }}>
                                    <span>Envelopando: <strong>{b.responsavel_envelopamento}</strong></span>
                                    {b.data_envelopamento && (
                                      <span style={{ display: 'block', color: 'var(--slate-400)', fontSize: '0.70rem' }}>
                                        Início: {formatarDataHoraBR(b.data_envelopamento)}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)' }}>
                                    Cadastrado em {formatarDataHoraBR(b.data_cadastro)}
                                  </span>
                                )}
                                {b.observacoes && (
                                  <div style={{ fontSize: '0.70rem', color: 'var(--slate-500)', marginTop: 2, fontStyle: 'italic', maxWidth: 260 }}>
                                    "{b.observacoes}"
                                  </div>
                                )}
                              </td>

                              {/* Ações de Pátio */}
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                  {b.status === 'pendente_envelopamento' && (
                                    <>
                                      <button
                                        type="button"
                                        disabled={executando}
                                        onClick={() => handleAvancarStatus(b, 'em_andamento')}
                                        className="btn btn-secondary"
                                        style={{ padding: '4px 8px', fontSize: '0.72rem', gap: 4, background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', borderColor: '#f59e0b' }}
                                        title="Iniciar Envelopamento no pátio"
                                      >
                                        <Play size={11} /> Iniciar
                                      </button>
                                      <button
                                        type="button"
                                        disabled={executando}
                                        onClick={() => handleAvancarStatus(b, 'sem_envelopamento')}
                                        className="btn btn-secondary"
                                        style={{ padding: '4px 7px', fontSize: '0.72rem', color: '#0284c7' }}
                                        title="Marcar como sem necessidade de envelopamento"
                                      >
                                        Sem Env.
                                      </button>
                                    </>
                                  )}

                                  {b.status === 'em_andamento' && (
                                    <>
                                      <button
                                        type="button"
                                        disabled={executando}
                                        onClick={() => handleAvancarStatus(b, 'envelopado')}
                                        className="btn btn-vermont"
                                        style={{ padding: '4px 8px', fontSize: '0.72rem', gap: 4 }}
                                        title="Finalizar e marcar como Envelopado"
                                      >
                                        <CheckCircle2 size={12} /> Envelopado
                                      </button>
                                      <button
                                        type="button"
                                        disabled={executando}
                                        onClick={() => handleAvancarStatus(b, 'aguardando_corte_reparo')}
                                        className="btn btn-secondary"
                                        style={{ padding: '4px 7px', fontSize: '0.70rem', color: '#dc2626' }}
                                        title="Necessita de corte ou reparo"
                                      >
                                        Corte
                                      </button>
                                    </>
                                  )}

                                  {b.status === 'aguardando_corte_reparo' && (
                                    <button
                                      type="button"
                                      disabled={executando}
                                      onClick={() => handleAvancarStatus(b, 'em_andamento')}
                                      className="btn btn-secondary"
                                      style={{ padding: '4px 8px', fontSize: '0.72rem', gap: 4, background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', borderColor: '#f59e0b' }}
                                      title="Retomar para processo de envelopamento"
                                    >
                                      <Play size={11} /> Retomar
                                    </button>
                                  )}

                                  {(b.status === 'envelopado' || b.status === 'sem_envelopamento') && (
                                    <button
                                      type="button"
                                      disabled={executando}
                                      onClick={() => handleAvancarStatus(b, 'em_andamento')}
                                      className="btn btn-secondary"
                                      style={{ padding: '4px 6px', fontSize: '0.70rem', color: 'var(--slate-400)' }}
                                      title="Reverter para Em Andamento"
                                    >
                                      Reverter
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBlocoEmEdicao(b);
                                      setModalCadastroAberto(true);
                                    }}
                                    className="btn btn-secondary"
                                    style={{ padding: '4px 6px' }}
                                    title="Editar dados do bloco"
                                  >
                                    <Edit3 size={12} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleExcluir(b.id, b.numero_bloco)}
                                    className="btn btn-danger"
                                    style={{ padding: '4px 6px' }}
                                    title="Remover do controle"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* =========================================================================
           VISÃO LISTA PLANA (TODOS OS BLOCOS)
           ========================================================================= */
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: 12 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: 'var(--slate-400)', textAlign: 'left' }}>BLOCO / ROCHA</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: 'var(--slate-400)', textAlign: 'left' }}>PEDREIRA</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: 'var(--slate-400)', textAlign: 'left' }}>CLIENTE COMPRADOR</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: 'var(--slate-400)', textAlign: 'center' }}>STATUS ENVELOPAMENTO</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: 'var(--slate-400)', textAlign: 'left' }}>HISTÓRICO & RESPONSÁVEIS</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: 'var(--slate-400)', textAlign: 'center' }}>AÇÕES DE PÁTIO</th>
                </tr>
              </thead>
              <tbody>
                {envelopamentos.map((b) => {
                  const statusInfo = STATUS_ENVELOPAMENTO[b.status?.toUpperCase()] || STATUS_ENVELOPAMENTO.PENDENTE_ENVELOPAMENTO;
                  const executando = executandoAcaoId === b.id;

                  return (
                    <tr 
                      key={b.id} 
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: b.status === 'envelopado' ? 'rgba(34, 197, 94, 0.03)' : undefined
                      }}
                    >
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: 'inherit',
                          fontWeight: 800,
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: '0.86rem',
                          fontFamily: 'monospace',
                          border: '1px solid rgba(255,255,255,0.15)'
                        }}>
                          {b.numero_bloco}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--slate-400)', display: 'block', marginTop: 4, fontWeight: 600 }}>
                          {b.material}
                        </span>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '0.82rem', color: 'inherit', fontWeight: 600 }}>
                          {b.pedreira_nome || '-'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <strong style={{ fontSize: '0.84rem', color: 'inherit', display: 'block' }}>
                          {b.cliente_nome}
                        </strong>
                        {b.cliente_cnpj && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
                            CNPJ: {b.cliente_cnpj}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '5px 10px',
                          borderRadius: 20,
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          background: statusInfo.bg,
                          color: statusInfo.cor,
                          border: `1px solid ${statusInfo.border}`
                        }}>
                          {b.status === 'envelopado' && <CheckCircle2 size={13} />}
                          {b.status === 'em_andamento' && <Layers size={13} />}
                          {b.status === 'aguardando_corte_reparo' && <Scissors size={13} />}
                          {b.status === 'pendente_envelopamento' && <Clock size={13} />}
                          {b.status === 'sem_envelopamento' && <Ban size={13} />}
                          <span>{statusInfo.label}</span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        {b.status === 'envelopado' && b.responsavel_liberacao ? (
                          <div style={{ fontSize: '0.74rem', color: '#16a34a' }}>
                            <span>Liberado por: <strong>{b.responsavel_liberacao}</strong></span>
                            {b.data_liberacao && (
                              <span style={{ display: 'block', color: 'var(--slate-400)', fontSize: '0.70rem' }}>
                                {formatarDataHoraBR(b.data_liberacao)}
                              </span>
                            )}
                          </div>
                        ) : b.status === 'sem_envelopamento' && b.responsavel_liberacao ? (
                          <div style={{ fontSize: '0.74rem', color: '#0284c7' }}>
                            <span>Liberado direto por: <strong>{b.responsavel_liberacao}</strong></span>
                          </div>
                        ) : b.status === 'em_andamento' && b.responsavel_envelopamento ? (
                          <div style={{ fontSize: '0.74rem', color: '#d97706' }}>
                            <span>Envelopando: <strong>{b.responsavel_envelopamento}</strong></span>
                            {b.data_envelopamento && (
                              <span style={{ display: 'block', color: 'var(--slate-400)', fontSize: '0.70rem' }}>
                                Início: {formatarDataHoraBR(b.data_envelopamento)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)' }}>
                            Cadastrado em {formatarDataHoraBR(b.data_cadastro)}
                          </span>
                        )}
                        {b.observacoes && (
                          <div style={{ fontSize: '0.70rem', color: 'var(--slate-500)', marginTop: 2, fontStyle: 'italic', maxWidth: 220 }}>
                            "{b.observacoes}"
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {b.status === 'pendente_envelopamento' && (
                            <>
                              <button
                                type="button"
                                disabled={executando}
                                onClick={() => handleAvancarStatus(b, 'em_andamento')}
                                className="btn btn-secondary"
                                style={{ padding: '5px 8px', fontSize: '0.74rem', gap: 4, background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', borderColor: '#f59e0b' }}
                                title="Iniciar Envelopamento no pátio"
                              >
                                <Play size={12} /> Iniciar
                              </button>
                              <button
                                type="button"
                                disabled={executando}
                                onClick={() => handleAvancarStatus(b, 'sem_envelopamento')}
                                className="btn btn-secondary"
                                style={{ padding: '5px 7px', fontSize: '0.72rem', color: '#0284c7' }}
                                title="Marcar como sem necessidade de envelopamento"
                              >
                                Sem Envelop.
                              </button>
                            </>
                          )}

                          {b.status === 'em_andamento' && (
                            <>
                              <button
                                type="button"
                                disabled={executando}
                                onClick={() => handleAvancarStatus(b, 'envelopado')}
                                className="btn btn-vermont"
                                style={{ padding: '5px 8px', fontSize: '0.74rem', gap: 4 }}
                                title="Finalizar e marcar como Envelopado"
                              >
                                <CheckCircle2 size={13} /> Envelopado
                              </button>
                              <button
                                type="button"
                                disabled={executando}
                                onClick={() => handleAvancarStatus(b, 'aguardando_corte_reparo')}
                                className="btn btn-secondary"
                                style={{ padding: '5px 7px', fontSize: '0.72rem', color: '#dc2626' }}
                                title="Necessita de corte ou reparo"
                              >
                                Corte/Reparo
                              </button>
                            </>
                          )}

                          {b.status === 'aguardando_corte_reparo' && (
                            <button
                              type="button"
                              disabled={executando}
                              onClick={() => handleAvancarStatus(b, 'em_andamento')}
                              className="btn btn-secondary"
                              style={{ padding: '5px 8px', fontSize: '0.74rem', gap: 4, background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', borderColor: '#f59e0b' }}
                              title="Retomar para processo de envelopamento"
                            >
                              <Play size={12} /> Retomar
                            </button>
                          )}

                          {(b.status === 'envelopado' || b.status === 'sem_envelopamento') && (
                            <button
                              type="button"
                              disabled={executando}
                              onClick={() => handleAvancarStatus(b, 'em_andamento')}
                              className="btn btn-secondary"
                              style={{ padding: '5px 6px', fontSize: '0.70rem', color: 'var(--slate-400)' }}
                              title="Reverter para Em Andamento"
                            >
                              Reverter
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setBlocoEmEdicao(b);
                              setModalCadastroAberto(true);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '5px 7px' }}
                            title="Editar dados do bloco"
                          >
                            <Edit3 size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExcluir(b.id, b.numero_bloco)}
                            className="btn btn-danger"
                            style={{ padding: '5px 7px' }}
                            title="Remover do controle"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Cadastro / Edição de Bloco */}
      {modalCadastroAberto && (
        <ModalCadastrarBlocoEnvelopamento
          blocoEdicao={blocoEmEdicao}
          usuarioNome={usuarioNome}
          onFechar={() => {
            setModalCadastroAberto(false);
            setBlocoEmEdicao(null);
          }}
          onSalvo={async (salvo, qtdLote) => {
            await carregarDados();
            if (qtdLote) {
              alert(`${qtdLote} blocos importados com sucesso para envelopamento!`);
            }
          }}
        />
      )}

      {/* Modal de Gestão de Clientes */}
      {modalClientesAberto && (
        <ModalGestaoClientes
          onFechar={() => {
            setModalClientesAberto(false);
          }}
        />
      )}

      {/* Modal de Importação de Romaneio PDF */}
      {modalPdfAberto && (
        <ModalImportarRomaneioPdf
          usuarioNome={usuarioNome}
          onFechar={() => setModalPdfAberto(false)}
          onSucesso={async (qtd) => {
            await carregarDados();
            alert(`${qtd} bloco${qtd > 1 ? 's' : ''} do romaneio importado${qtd > 1 ? 's' : ''} com sucesso no envelopamento!`);
          }}
        />
      )}
    </div>
  );
}
