import React, { useState, useEffect } from 'react';
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
  Play
} from 'lucide-react';
import { 
  listarEnvelopamentos, 
  atualizarStatusEnvelopamento, 
  excluirEnvelopamento, 
  calcularMetricasEnvelopamento, 
  STATUS_ENVELOPAMENTO 
} from '../services/envelopamentoService';
import { PEDREIRAS_CEARA, formatarDataHoraBR } from '../services/agendamentoService';
import { ModalCadastrarBlocoEnvelopamento } from './ModalCadastrarBlocoEnvelopamento';
import { ModalGestaoClientes } from './ModalGestaoClientes';

export function PainelEnvelopamento({ usuario, isAdmin, pedreiraOperador }) {
  const [envelopamentos, setEnvelopamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [modalClientesAberto, setModalClientesAberto] = useState(false);
  const [blocoEmEdicao, setBlocoEmEdicao] = useState(null);
  const [filtroPedreira, setFiltroPedreira] = useState(pedreiraOperador || '');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [buscaTexto, setBuscaTexto] = useState('');
  const [executandoAcaoId, setExecutandoAcaoId] = useState(null);

  const usuarioNome = usuario?.user_metadata?.nome || usuario?.email?.split('@')[0] || 'Equipe Vermont';

  const carregarDados = async () => {
    setCarregando(true);
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
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [filtroPedreira, filtroStatus, buscaTexto]);

  const metricas = calcularMetricasEnvelopamento(envelopamentos);

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
            width: 46,
            height: 46,
            borderRadius: 12,
            background: 'var(--vermont-green-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0, 168, 62, 0.35)'
          }}>
            <Layers size={24} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
              Controle de Envelopamento de Blocos
              <span style={{ fontSize: '0.70rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                Exclusivo Admin & Pedreiras
              </span>
            </h2>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--slate-400)' }}>
              Acompanhamento de pátio, preparação física e liberação de blocos Vermont
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={carregarDados}
            className="btn btn-secondary"
            title="Recarregar lista"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={16} className={carregando ? 'spinner' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setModalClientesAberto(true)}
            className="btn btn-secondary"
            title="Gerenciar base de clientes compradores"
            style={{ padding: '8px 14px', gap: 6, fontSize: '0.82rem' }}
          >
            <Users size={15} color="#4ade80" />
            Clientes
          </button>
          
          <button
            type="button"
            onClick={handleExportarCSV}
            className="btn btn-secondary"
            title="Exportar para Excel/CSV"
            style={{ padding: '8px 14px', gap: 6, fontSize: '0.82rem' }}
          >
            <Download size={15} />
            Exportar CSV
          </button>

          <button
            type="button"
            onClick={() => {
              setBlocoEmEdicao(null);
              setModalCadastroAberto(true);
            }}
            className="btn btn-vermont"
            style={{ padding: '8px 16px', gap: 6, fontSize: '0.86rem' }}
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
            <Box size={20} color="#94a3b8" />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', display: 'block' }}>Total de Blocos</span>
            <strong style={{ fontSize: '1.35rem', color: '#fff' }}>{metricas.total}</strong>
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
            background: filtroStatus === 'pendente_envelopamento' ? 'rgba(148, 163, 184, 0.1)' : undefined
          }}
        >
          <div style={{ background: 'rgba(148, 163, 184, 0.15)', padding: 10, borderRadius: 10 }}>
            <Clock size={20} color="#94a3b8" />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', display: 'block' }}>Pendente Envelop.</span>
            <strong style={{ fontSize: '1.35rem', color: '#94a3b8' }}>{metricas.pendente_envelopamento}</strong>
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
            background: filtroStatus === 'em_andamento' ? 'rgba(245, 158, 11, 0.1)' : undefined
          }}
        >
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: 10, borderRadius: 10 }}>
            <Layers size={20} color="#f59e0b" />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', display: 'block' }}>Em andamento</span>
            <strong style={{ fontSize: '1.35rem', color: '#fbbf24' }}>{metricas.em_andamento}</strong>
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
            background: filtroStatus === 'aguardando_corte_reparo' ? 'rgba(239, 68, 68, 0.1)' : undefined
          }}
        >
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: 10, borderRadius: 10 }}>
            <Scissors size={20} color="#f87171" />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', display: 'block' }}>Aguard. Corte/Reparo</span>
            <strong style={{ fontSize: '1.35rem', color: '#f87171' }}>{metricas.aguardando_corte_reparo}</strong>
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
            borderLeft: '4px solid #22c55e',
            cursor: 'pointer',
            background: filtroStatus === 'envelopado' ? 'rgba(34, 197, 94, 0.1)' : undefined
          }}
        >
          <div style={{ background: 'rgba(34, 197, 94, 0.15)', padding: 10, borderRadius: 10 }}>
            <CheckCircle2 size={20} color="#4ade80" />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', display: 'block' }}>Envelopado</span>
            <strong style={{ fontSize: '1.35rem', color: '#4ade80' }}>{metricas.envelopado}</strong>
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
            borderLeft: '4px solid #38bdf8',
            cursor: 'pointer',
            background: filtroStatus === 'sem_envelopamento' ? 'rgba(56, 189, 248, 0.1)' : undefined
          }}
        >
          <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: 10, borderRadius: 10 }}>
            <Ban size={20} color="#38bdf8" />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', display: 'block' }}>Sem Envelopamento</span>
            <strong style={{ fontSize: '1.35rem', color: '#38bdf8' }}>{metricas.sem_envelopamento}</strong>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="glass-panel" style={{ padding: '14px 18px', marginBottom: 18, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por bloco, cliente ou material..."
            value={buscaTexto}
            onChange={(e) => setBuscaTexto(e.target.value)}
            style={{ paddingLeft: 36, height: 38, fontSize: '0.84rem' }}
          />
        </div>

        <div style={{ flex: '0 1 200px' }}>
          <select
            className="form-select"
            value={filtroPedreira}
            onChange={(e) => setFiltroPedreira(e.target.value)}
            style={{ height: 38, fontSize: '0.84rem' }}
          >
            <option value="">Todas as Pedreiras</option>
            {PEDREIRAS_CEARA.map(p => (
              <option key={p.id} value={p.nome}>{p.nome}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '0 1 220px' }}>
          <select
            className="form-select"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            style={{ height: 38, fontSize: '0.84rem' }}
          >
            <option value="">Todos os Status</option>
            {Object.values(STATUS_ENVELOPAMENTO).map(st => (
              <option key={st.id} value={st.id}>{st.label}</option>
            ))}
          </select>
        </div>

        {(buscaTexto || filtroPedreira || filtroStatus) && (
          <button
            type="button"
            onClick={() => {
              setBuscaTexto('');
              setFiltroPedreira('');
              setFiltroStatus('');
            }}
            className="btn btn-secondary"
            style={{ height: 38, fontSize: '0.80rem', padding: '0 12px' }}
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Tabela de Envelopamento */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: 12 }}>
        {carregando ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--slate-400)' }}>
            <span className="spinner" style={{ width: 24, height: 24, marginBottom: 10, display: 'inline-block' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Carregando dados de envelopamento...</p>
          </div>
        ) : envelopamentos.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--slate-400)' }}>
            <Box size={40} color="var(--slate-600)" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ margin: 0, color: '#fff', fontSize: '1.05rem' }}>Nenhum bloco encontrado</h4>
            <p style={{ margin: '6px 0 16px', fontSize: '0.84rem' }}>
              Nenhum bloco cadastrado com os filtros selecionados.
            </p>
            <button
              type="button"
              onClick={() => {
                setBlocoEmEdicao(null);
                setModalCadastroAberto(true);
              }}
              className="btn btn-vermont"
              style={{ display: 'inline-flex', gap: 6, fontSize: '0.84rem' }}
            >
              <Plus size={16} /> Cadastrar Primeiro Bloco
            </button>
          </div>
        ) : (
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
                        transition: 'background 0.2s',
                        background: b.status === 'envelopado' ? 'rgba(34, 197, 94, 0.03)' : undefined
                      }}
                    >
                      {/* Bloco & Rocha */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#fff',
                            fontWeight: 800,
                            padding: '4px 8px',
                            borderRadius: 6,
                            fontSize: '0.86rem',
                            fontFamily: 'monospace',
                            letterSpacing: '0.05em',
                            border: '1px solid rgba(255,255,255,0.15)'
                          }}>
                            {b.numero_bloco}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--slate-300)', display: 'block', marginTop: 4 }}>
                          {b.material}
                        </span>
                      </td>

                      {/* Pedreira */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>
                          {b.pedreira_nome || '-'}
                        </span>
                      </td>

                      {/* Cliente */}
                      <td style={{ padding: '12px 14px' }}>
                        <strong style={{ fontSize: '0.84rem', color: '#fff', display: 'block' }}>
                          {b.cliente_nome}
                        </strong>
                        {b.cliente_cnpj && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
                            CNPJ: {b.cliente_cnpj}
                          </span>
                        )}
                      </td>

                      {/* Status */}
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

                      {/* Responsáveis e Datas */}
                      <td style={{ padding: '12px 14px' }}>
                        {b.status === 'envelopado' && b.responsavel_liberacao ? (
                          <div style={{ fontSize: '0.74rem', color: '#4ade80' }}>
                            <span>Liberado por: <strong>{b.responsavel_liberacao}</strong></span>
                            {b.data_liberacao && (
                              <span style={{ display: 'block', color: 'var(--slate-400)', fontSize: '0.70rem' }}>
                                {formatarDataHoraBR(b.data_liberacao)}
                              </span>
                            )}
                          </div>
                        ) : b.status === 'sem_envelopamento' && b.responsavel_liberacao ? (
                          <div style={{ fontSize: '0.74rem', color: '#38bdf8' }}>
                            <span>Liberado direto por: <strong>{b.responsavel_liberacao}</strong></span>
                          </div>
                        ) : b.status === 'aguardando_corte_reparo' ? (
                          <div style={{ fontSize: '0.74rem', color: '#f87171' }}>
                            <span>Aguardando corte / reparo</span>
                          </div>
                        ) : b.status === 'em_andamento' && b.responsavel_envelopamento ? (
                          <div style={{ fontSize: '0.74rem', color: '#fbbf24' }}>
                            <span>Envelopando: <strong>{b.responsavel_envelopamento}</strong></span>
                            {b.data_envelopamento && (
                              <span style={{ display: 'block', color: 'var(--slate-400)', fontSize: '0.70rem' }}>
                                Início: {formatarDataHoraBR(b.data_envelopamento)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.74rem', color: 'var(--slate-500)' }}>
                            Cadastrado em {formatarDataHoraBR(b.data_cadastro)}
                          </span>
                        )}
                        {b.observacoes && (
                          <div style={{ fontSize: '0.70rem', color: 'var(--slate-400)', marginTop: 2, fontStyle: 'italic', maxWidth: 220 }}>
                            "{b.observacoes}"
                          </div>
                        )}
                      </td>

                      {/* Ações de Pátio */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          
                          {/* Botões de Avanço Rápido de Status */}
                          {b.status === 'pendente_envelopamento' && (
                            <>
                              <button
                                type="button"
                                disabled={executando}
                                onClick={() => handleAvancarStatus(b, 'em_andamento')}
                                className="btn btn-secondary"
                                style={{ padding: '5px 8px', fontSize: '0.74rem', gap: 4, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderColor: '#f59e0b' }}
                                title="Iniciar Envelopamento no pátio"
                              >
                                <Play size={12} /> Iniciar
                              </button>
                              <button
                                type="button"
                                disabled={executando}
                                onClick={() => handleAvancarStatus(b, 'sem_envelopamento')}
                                className="btn btn-secondary"
                                style={{ padding: '5px 7px', fontSize: '0.72rem', color: '#38bdf8' }}
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
                                style={{ padding: '5px 7px', fontSize: '0.72rem', color: '#f87171' }}
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
                              style={{ padding: '5px 8px', fontSize: '0.74rem', gap: 4, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderColor: '#f59e0b' }}
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

                          {/* Botão Editar */}
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

                          {/* Botão Excluir */}
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
        )}
      </div>

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
    </div>
  );
}
