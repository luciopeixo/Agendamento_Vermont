import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Layers, 
  Users, 
  Filter, 
  Download, 
  CheckCircle2, 
  PieChart, 
  ArrowUpRight, 
  Clock, 
  Ban, 
  Box, 
  FileText, 
  Scale, 
  Building2, 
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { STATUS_ENVELOPAMENTO } from '../services/envelopamentoService';
import { PEDREIRAS_CEARA, saoMesmaPedreira, formatarDataBR } from '../services/agendamentoService';

export function GraficosEnvelopamento({ envelopamentos = [] }) {
  // Filtros de Análise
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos'); // '7_dias', '30_dias', 'mes_atual', 'ano_atual', 'todos', 'custom'
  const [dataInicioCustom, setDataInicioCustom] = useState('');
  const [dataFimCustom, setDataFimCustom] = useState('');
  const [filtroPedreira, setFiltroPedreira] = useState('todas');
  const [filtroMaterial, setFiltroMaterial] = useState('todos');
  const [filtroCliente, setFiltroCliente] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [tipoGraficoTempo, setTipoGraficoTempo] = useState('barras'); // 'barras' ou 'linha'

  // Lista única de Clientes
  const listaClientesUnicos = useMemo(() => {
    const setC = new Set();
    envelopamentos.forEach(item => {
      const nome = (item.cliente_nome || '').trim();
      if (nome) setC.add(nome.toUpperCase());
    });
    return Array.from(setC).sort();
  }, [envelopamentos]);

  // Lista única de Materiais
  const listaMateriaisUnicos = useMemo(() => {
    const setM = new Set();
    envelopamentos.forEach(item => {
      const mat = (item.material || '').trim();
      if (mat) setM.add(mat);
    });
    return Array.from(setM).sort();
  }, [envelopamentos]);

  // Filtra envelopamentos conforme período e seleções
  const itensFiltrados = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    let dataMin = null;
    let dataMax = null;

    if (filtroPeriodo === '7_dias') {
      dataMin = new Date();
      dataMin.setDate(hoje.getDate() - 7);
      dataMin.setHours(0, 0, 0, 0);
    } else if (filtroPeriodo === '30_dias') {
      dataMin = new Date();
      dataMin.setDate(hoje.getDate() - 30);
      dataMin.setHours(0, 0, 0, 0);
    } else if (filtroPeriodo === 'mes_atual') {
      dataMin = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    } else if (filtroPeriodo === 'ano_atual') {
      dataMin = new Date(hoje.getFullYear(), 0, 1);
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

    return envelopamentos.filter(item => {
      // Filtro de Status
      if (filtroStatus !== 'todos' && item.status !== filtroStatus) {
        return false;
      }

      // Filtro de Data (usa data_cadastro, created_at ou data_romaneio)
      const dataStr = item.data_cadastro || item.created_at || item.data_romaneio;
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

      // Filtro de Pedreira
      if (filtroPedreira !== 'todas') {
        const pedItem = item.pedreira_nome || item.pedreira_id || '';
        if (!saoMesmaPedreira(pedItem, filtroPedreira)) {
          return false;
        }
      }

      // Filtro de Material
      if (filtroMaterial !== 'todos') {
        const matItem = (item.material || '').trim().toLowerCase();
        if (matItem !== filtroMaterial.trim().toLowerCase()) {
          return false;
        }
      }

      // Filtro de Cliente
      if (filtroCliente !== 'todos') {
        const cliItem = (item.cliente_nome || '').trim().toUpperCase();
        if (cliItem !== filtroCliente.trim().toUpperCase()) {
          return false;
        }
      }

      return true;
    });
  }, [envelopamentos, filtroPeriodo, dataInicioCustom, dataFimCustom, filtroPedreira, filtroMaterial, filtroCliente, filtroStatus]);

  // Cálculos de Indicadores Globais
  const totalBlocos = itensFiltrados.length;
  const qtdEnvelopados = itensFiltrados.filter(i => i.status === 'envelopado').length;
  const qtdSemEnvelopamento = itensFiltrados.filter(i => i.status === 'sem_envelopamento').length;
  const qtdPendentes = itensFiltrados.filter(i => i.status === 'pendente_envelopamento' || i.status === 'pendente').length;

  const pctEnvelopados = totalBlocos > 0 ? ((qtdEnvelopados / totalBlocos) * 100).toFixed(1) : '0.0';
  const pctSemEnvelopamento = totalBlocos > 0 ? ((qtdSemEnvelopamento / totalBlocos) * 100).toFixed(1) : '0.0';
  const pctPendentes = totalBlocos > 0 ? ((qtdPendentes / totalBlocos) * 100).toFixed(1) : '0.0';

  // Peso Total em Toneladas
  const pesoTotalKg = useMemo(() => {
    return itensFiltrados.reduce((acc, item) => {
      if (!item.peso_kg) return acc;
      const pesoLimpo = String(item.peso_kg).replace(/\./g, '').replace(',', '.');
      const num = parseFloat(pesoLimpo);
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  }, [itensFiltrados]);

  const pesoTotalToneladas = (pesoTotalKg / 1000).toFixed(1);
  const pesoMedioKg = totalBlocos > 0 ? (pesoTotalKg / totalBlocos).toFixed(0) : 0;

  // Total de Romaneios Únicos e Clientes no recorte
  const totalRomaneiosUnicos = useMemo(() => {
    const s = new Set();
    itensFiltrados.forEach(i => {
      if (i.numero_romaneio) s.add(String(i.numero_romaneio).trim());
    });
    return s.size;
  }, [itensFiltrados]);

  const totalClientesNoRecorte = useMemo(() => {
    const s = new Set();
    itensFiltrados.forEach(i => {
      if (i.cliente_nome) s.add(String(i.cliente_nome).trim().toUpperCase());
    });
    return s.size;
  }, [itensFiltrados]);

  // Agrupamento por Pedreira com Composição de Status
  const dadosPorPedreira = useMemo(() => {
    const mapa = {};
    itensFiltrados.forEach(item => {
      const ped = item.pedreira_nome || item.pedreira_id || 'Pedreira Não Informada';
      if (!mapa[ped]) {
        mapa[ped] = { pedreira: ped, total: 0, envelopado: 0, sem_envelopamento: 0, pendente: 0, pesoKg: 0 };
      }
      mapa[ped].total += 1;
      if (item.status === 'envelopado') mapa[ped].envelopado += 1;
      else if (item.status === 'sem_envelopamento') mapa[ped].sem_envelopamento += 1;
      else mapa[ped].pendente += 1;

      if (item.peso_kg) {
        const p = parseFloat(String(item.peso_kg).replace(/\./g, '').replace(',', '.'));
        if (!isNaN(p)) mapa[ped].pesoKg += p;
      }
    });

    return Object.values(mapa).sort((a, b) => b.total - a.total);
  }, [itensFiltrados]);

  // Agrupamento por Material
  const dadosPorMaterial = useMemo(() => {
    const mapa = {};
    itensFiltrados.forEach(item => {
      const mat = item.material || 'Não Informado';
      if (!mapa[mat]) {
        mapa[mat] = { material: mat, total: 0, envelopado: 0, sem_envelopamento: 0, pendente: 0, pesoKg: 0 };
      }
      mapa[mat].total += 1;
      if (item.status === 'envelopado') mapa[mat].envelopado += 1;
      else if (item.status === 'sem_envelopamento') mapa[mat].sem_envelopamento += 1;
      else mapa[mat].pendente += 1;

      if (item.peso_kg) {
        const p = parseFloat(String(item.peso_kg).replace(/\./g, '').replace(',', '.'));
        if (!isNaN(p)) mapa[mat].pesoKg += p;
      }
    });

    return Object.values(mapa).sort((a, b) => b.total - a.total);
  }, [itensFiltrados]);

  // Agrupamento por Top 10 Clientes
  const dadosPorCliente = useMemo(() => {
    const mapa = {};
    itensFiltrados.forEach(item => {
      const cli = (item.cliente_nome || 'Cliente Não Informado').trim().toUpperCase();
      if (!mapa[cli]) {
        mapa[cli] = { cliente: cli, total: 0, envelopado: 0, sem_envelopamento: 0, pendente: 0, pesoKg: 0 };
      }
      mapa[cli].total += 1;
      if (item.status === 'envelopado') mapa[cli].envelopado += 1;
      else if (item.status === 'sem_envelopamento') mapa[cli].sem_envelopamento += 1;
      else mapa[cli].pendente += 1;

      if (item.peso_kg) {
        const p = parseFloat(String(item.peso_kg).replace(/\./g, '').replace(',', '.'));
        if (!isNaN(p)) mapa[cli].pesoKg += p;
      }
    });

    return Object.values(mapa)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [itensFiltrados]);

  // Agrupamento Temporal (por Data de Cadastro / Romaneio)
  const dadosPorData = useMemo(() => {
    const mapa = {};
    itensFiltrados.forEach(item => {
      const dataStr = item.data_cadastro || item.created_at || item.data_romaneio;
      let dataKey = 'Outros';
      if (dataStr) {
        if (dataStr.includes('-')) {
          dataKey = dataStr.slice(0, 10); // YYYY-MM-DD
        } else if (dataStr.includes('/')) {
          const parts = dataStr.split('/');
          if (parts.length === 3) {
            dataKey = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
      }

      if (!mapa[dataKey]) {
        mapa[dataKey] = { data: dataKey, total: 0, envelopado: 0, pendente: 0, sem_envelopamento: 0 };
      }
      mapa[dataKey].total += 1;
      if (item.status === 'envelopado') mapa[dataKey].envelopado += 1;
      else if (item.status === 'sem_envelopamento') mapa[dataKey].sem_envelopamento += 1;
      else mapa[dataKey].pendente += 1;
    });

    return Object.values(mapa)
      .filter(d => d.data !== 'Outros')
      .sort((a, b) => a.data.localeCompare(b.data))
      .slice(-30); // Últimas 30 datas registradas
  }, [itensFiltrados]);

  // Resumo por Romaneios Consolidados
  const dadosPorRomaneio = useMemo(() => {
    const mapa = {};
    itensFiltrados.forEach(item => {
      const rom = item.numero_romaneio ? `Nº ${item.numero_romaneio}` : 'S/N (Manual)';
      if (!mapa[rom]) {
        mapa[rom] = {
          romaneio: rom,
          cliente: item.cliente_nome || '-',
          pedreira: item.pedreira_nome || '-',
          total: 0,
          envelopado: 0,
          sem_envelopamento: 0,
          pendente: 0,
          pesoKg: 0,
          data: item.data_romaneio || item.data_cadastro || '-'
        };
      }
      mapa[rom].total += 1;
      if (item.status === 'envelopado') mapa[rom].envelopado += 1;
      else if (item.status === 'sem_envelopamento') mapa[rom].sem_envelopamento += 1;
      else mapa[rom].pendente += 1;

      if (item.peso_kg) {
        const p = parseFloat(String(item.peso_kg).replace(/\./g, '').replace(',', '.'));
        if (!isNaN(p)) mapa[rom].pesoKg += p;
      }
    });

    return Object.values(mapa)
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);
  }, [itensFiltrados]);

  // Exportar Relatório Executivo em Excel
  const exportarAnaliseExcel = () => {
    if (itensFiltrados.length === 0) {
      alert('Nenhum dado encontrado para os filtros selecionados.');
      return;
    }

    const cabecalhos = [
      'Nº do Bloco',
      'Romaneio',
      'Data Romaneio',
      'Cliente',
      'CNPJ Cliente',
      'Pedreira',
      'Material',
      'Peso (Kg)',
      'Status de Envelopamento',
      'Data de Cadastro',
      'Observações'
    ];

    const dados = itensFiltrados.map(item => ({
      'Nº do Bloco': item.numero_bloco || '',
      'Romaneio': item.numero_romaneio || 'S/N',
      'Data Romaneio': item.data_romaneio || '',
      'Cliente': item.cliente_nome || '',
      'CNPJ Cliente': item.cliente_cnpj || '',
      'Pedreira': item.pedreira_nome || '',
      'Material': item.material || '',
      'Peso (Kg)': item.peso_kg || '',
      'Status de Envelopamento': item.status === 'envelopado' ? 'Envelopado' : item.status === 'sem_envelopamento' ? 'Sem Envelopamento' : 'Pendente de Envelopamento',
      'Data de Cadastro': item.data_cadastro || item.created_at || '',
      'Observações': item.observacoes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dados, { header: cabecalhos });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Análise Envelopamentos');
    XLSX.writeFile(wb, `analise_envelopamentos_vermont_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const maxQtdTempo = Math.max(1, ...dadosPorData.map(d => d.total));
  const maxQtdPedreira = Math.max(1, ...dadosPorPedreira.map(d => d.total));
  const maxQtdCliente = Math.max(1, ...dadosPorCliente.map(d => d.total));

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      
      {/* 1. Barra Superior de Filtros Analíticos */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        background: 'rgba(10, 18, 14, 0.75)',
        border: '1px solid var(--vermont-green-border)',
        borderRadius: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'var(--vermont-green-subtle)',
              border: '1px solid var(--vermont-green-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4ade80'
            }}>
              <Filter size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#fff', fontWeight: 800 }}>
                Filtros Analíticos & Inteligência de Envelopamento
              </h2>
              <span style={{ fontSize: '0.80rem', color: 'var(--slate-400)' }}>
                Filtre por período, pedreira, material, cliente ou status para visualizar métricas consolidadas
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={exportarAnaliseExcel}
              className="btn btn-secondary"
              style={{
                padding: '9px 16px',
                fontSize: '0.84rem',
                fontWeight: 700,
                gap: 8,
                color: '#34d399',
                borderColor: 'rgba(16, 185, 129, 0.4)',
                background: 'rgba(16, 185, 129, 0.1)'
              }}
              title="Baixar planilha Excel com todos os blocos e status filtrados"
            >
              <Download size={16} />
              Exportar Análise (.XLSX)
            </button>
          </div>
        </div>

        {/* Grade de Controles de Filtros */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          
          {/* Período */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.74rem', color: 'var(--slate-300)', marginBottom: 6, fontWeight: 700 }}>
              <span>📅</span> PERÍODO:
            </label>
            <select
              className="form-select"
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              style={{
                fontSize: '0.84rem',
                padding: '9px 12px',
                lineHeight: 1.4,
                width: '100%',
                minHeight: 42,
                borderRadius: 8,
                background: 'rgba(8, 12, 16, 0.9)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxSizing: 'border-box'
              }}
            >
              <option value="todos">Todo o Histórico</option>
              <option value="7_dias">Últimos 7 Dias</option>
              <option value="30_dias">Últimos 30 Dias</option>
              <option value="mes_atual">Mês Atual</option>
              <option value="ano_atual">Ano Atual</option>
              <option value="custom">Personalizado (Datas)</option>
            </select>
          </div>

          {/* Pedreira */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.74rem', color: 'var(--slate-300)', marginBottom: 6, fontWeight: 700 }}>
              <span>🏛️</span> PEDREIRA:
            </label>
            <select
              className="form-select"
              value={filtroPedreira}
              onChange={(e) => setFiltroPedreira(e.target.value)}
              style={{
                fontSize: '0.84rem',
                padding: '9px 12px',
                lineHeight: 1.4,
                width: '100%',
                minHeight: 42,
                borderRadius: 8,
                background: 'rgba(8, 12, 16, 0.9)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxSizing: 'border-box'
              }}
            >
              <option value="todas">Todas as Pedreiras</option>
              {PEDREIRAS_CEARA.map(p => (
                <option key={p.id} value={p.nome}>{p.nome}</option>
              ))}
            </select>
          </div>

          {/* Material */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.74rem', color: 'var(--slate-300)', marginBottom: 6, fontWeight: 700 }}>
              <span>🪨</span> MATERIAL / ROCHA:
            </label>
            <select
              className="form-select"
              value={filtroMaterial}
              onChange={(e) => setFiltroMaterial(e.target.value)}
              style={{
                fontSize: '0.84rem',
                padding: '9px 12px',
                lineHeight: 1.4,
                width: '100%',
                minHeight: 42,
                borderRadius: 8,
                background: 'rgba(8, 12, 16, 0.9)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxSizing: 'border-box'
              }}
            >
              <option value="todos">Todos os Materiais</option>
              {listaMateriaisUnicos.map(mat => (
                <option key={mat} value={mat}>{mat}</option>
              ))}
            </select>
          </div>

          {/* Cliente */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.74rem', color: 'var(--slate-300)', marginBottom: 6, fontWeight: 700 }}>
              <span>🏢</span> CLIENTE COMPRADOR:
            </label>
            <select
              className="form-select"
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              style={{
                fontSize: '0.84rem',
                padding: '9px 12px',
                lineHeight: 1.4,
                width: '100%',
                minHeight: 42,
                borderRadius: 8,
                background: 'rgba(8, 12, 16, 0.9)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxSizing: 'border-box'
              }}
            >
              <option value="todos">Todos os Clientes</option>
              {listaClientesUnicos.map(cli => (
                <option key={cli} value={cli}>{cli}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.74rem', color: 'var(--slate-300)', marginBottom: 6, fontWeight: 700 }}>
              <span>🛡️</span> STATUS DE ENVELOPAMENTO:
            </label>
            <select
              className="form-select"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              style={{
                fontSize: '0.84rem',
                padding: '9px 12px',
                lineHeight: 1.4,
                width: '100%',
                minHeight: 42,
                borderRadius: 8,
                background: 'rgba(8, 12, 16, 0.9)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxSizing: 'border-box'
              }}
            >
              <option value="todos">Todos os Status</option>
              <option value="envelopado">🟢 Envelopado</option>
              <option value="sem_envelopamento">🔵 Sem Envelopamento</option>
              <option value="pendente_envelopamento">⚪ Pendente de Envelopamento</option>
            </select>
          </div>
        </div>

        {/* Campos de Data Personalizada */}
        {filtroPeriodo === 'custom' && (
          <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap', alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '10px 16px', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--slate-300)', fontWeight: 600 }}>De:</span>
              <input
                type="date"
                className="form-input"
                value={dataInicioCustom}
                onChange={(e) => setDataInicioCustom(e.target.value)}
                style={{ fontSize: '0.84rem', padding: '6px 12px', minHeight: 38, borderRadius: 6, background: 'rgba(8, 12, 16, 0.9)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--slate-300)', fontWeight: 600 }}>Até:</span>
              <input
                type="date"
                className="form-input"
                value={dataFimCustom}
                onChange={(e) => setDataFimCustom(e.target.value)}
                style={{ fontSize: '0.84rem', padding: '6px 12px', minHeight: 38, borderRadius: 6, background: 'rgba(8, 12, 16, 0.9)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Cards de KPIs Executivos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        
        {/* Total de Blocos */}
        <div className="glass-panel" style={{
          padding: '16px 20px',
          borderLeft: '4px solid #3b82f6',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#60a5fa'
          }}>
            <Box size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', fontWeight: 600, display: 'block' }}>
              Total de Blocos
            </span>
            <strong style={{ fontSize: '1.45rem', color: '#fff' }}>{totalBlocos}</strong>
            <span style={{ fontSize: '0.70rem', color: 'var(--slate-400)', display: 'block', marginTop: 1 }}>
              {totalRomaneiosUnicos} Romaneios • {totalClientesNoRecorte} Clientes
            </span>
          </div>
        </div>

        {/* Envelopados */}
        <div className="glass-panel" style={{
          padding: '16px 20px',
          borderLeft: '4px solid #22c55e',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4ade80'
          }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', fontWeight: 600, display: 'block' }}>
              Envelopados (Concluídos)
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <strong style={{ fontSize: '1.45rem', color: '#4ade80' }}>{qtdEnvelopados}</strong>
              <span style={{ fontSize: '0.80rem', color: '#86efac', fontWeight: 700 }}>({pctEnvelopados}%)</span>
            </div>
            <span style={{ fontSize: '0.70rem', color: '#86efac', display: 'block', marginTop: 1 }}>
              Liberados para transporte
            </span>
          </div>
        </div>

        {/* Sem Envelopamento */}
        <div className="glass-panel" style={{
          padding: '16px 20px',
          borderLeft: '4px solid #0284c7',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <Ban size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', fontWeight: 600, display: 'block' }}>
              Sem Envelopamento
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <strong style={{ fontSize: '1.45rem', color: '#38bdf8' }}>{qtdSemEnvelopamento}</strong>
              <span style={{ fontSize: '0.80rem', color: '#7dd3fc', fontWeight: 700 }}>({pctSemEnvelopamento}%)</span>
            </div>
            <span style={{ fontSize: '0.70rem', color: '#7dd3fc', display: 'block', marginTop: 1 }}>
              Sem necessidade de envelopamento
            </span>
          </div>
        </div>

        {/* Pendentes */}
        <div className="glass-panel" style={{
          padding: '16px 20px',
          borderLeft: '4px solid #f59e0b',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24'
          }}>
            <Clock size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', fontWeight: 600, display: 'block' }}>
              Pendente no Pátio
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <strong style={{ fontSize: '1.45rem', color: '#fbbf24' }}>{qtdPendentes}</strong>
              <span style={{ fontSize: '0.80rem', color: '#fcd34d', fontWeight: 700 }}>({pctPendentes}%)</span>
            </div>
            <span style={{ fontSize: '0.70rem', color: '#fcd34d', display: 'block', marginTop: 1 }}>
              Aguardando envelopamento
            </span>
          </div>
        </div>

        {/* Peso Total (Toneladas) */}
        <div className="glass-panel" style={{
          padding: '16px 20px',
          borderLeft: '4px solid #a855f7',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#c084fc'
          }}>
            <Scale size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', fontWeight: 600, display: 'block' }}>
              Volume em Toneladas
            </span>
            <strong style={{ fontSize: '1.45rem', color: '#c084fc' }}>{pesoTotalToneladas} t</strong>
            <span style={{ fontSize: '0.70rem', color: 'var(--slate-400)', display: 'block', marginTop: 1 }}>
              Média: {Number(pesoMedioKg).toLocaleString('pt-BR')} kg/bloco
            </span>
          </div>
        </div>
      </div>

      {/* 3. Linha de Gráficos Principais (Distribuição de Status + Volume por Pedreira) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 18 }}>
        
        {/* Gráfico 1: Distribuição de Status (Donut Visual + Barra de Progresso) */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PieChart size={18} color="#4ade80" />
              <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#fff', fontWeight: 700 }}>
                Distribuição por Status de Envelopamento
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
              Total: <strong>{totalBlocos}</strong> blocos
            </span>
          </div>

          {/* Barra Segmentada de Proporção Total */}
          <div style={{
            height: 22,
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 8,
            overflow: 'hidden',
            display: 'flex',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)'
          }}>
            {qtdEnvelopados > 0 && (
              <div 
                style={{ 
                  width: `${pctEnvelopados}%`, 
                  background: 'linear-gradient(90deg, #16a34a, #22c55e)', 
                  transition: 'width 0.5s' 
                }} 
                title={`Envelopados: ${qtdEnvelopados} (${pctEnvelopados}%)`} 
              />
            )}
            {qtdSemEnvelopamento > 0 && (
              <div 
                style={{ 
                  width: `${pctSemEnvelopamento}%`, 
                  background: 'linear-gradient(90deg, #0284c7, #38bdf8)', 
                  transition: 'width 0.5s' 
                }} 
                title={`Sem Envelopamento: ${qtdSemEnvelopamento} (${pctSemEnvelopamento}%)`} 
              />
            )}
            {qtdPendentes > 0 && (
              <div 
                style={{ 
                  width: `${pctPendentes}%`, 
                  background: 'linear-gradient(90deg, #d97706, #f59e0b)', 
                  transition: 'width 0.5s' 
                }} 
                title={`Pendentes: ${qtdPendentes} (${pctPendentes}%)`} 
              />
            )}
          </div>

          {/* Detalhes dos 3 Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Envelopados */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              borderRadius: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: '0.84rem', color: '#fff', fontWeight: 600 }}>Envelopado</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '0.84rem', color: '#4ade80', fontWeight: 800 }}>{qtdEnvelopados} blocos</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--slate-400)', minWidth: 46, textAlign: 'right' }}>{pctEnvelopados}%</span>
              </div>
            </div>

            {/* Sem Envelopamento */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#38bdf8' }} />
                <span style={{ fontSize: '0.84rem', color: '#fff', fontWeight: 600 }}>Sem Envelopamento</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '0.84rem', color: '#38bdf8', fontWeight: 800 }}>{qtdSemEnvelopamento} blocos</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--slate-400)', minWidth: 46, textAlign: 'right' }}>{pctSemEnvelopamento}%</span>
              </div>
            </div>

            {/* Pendente de Envelopamento */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ fontSize: '0.84rem', color: '#fff', fontWeight: 600 }}>Pendente de Envelopamento</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '0.84rem', color: '#fbbf24', fontWeight: 800 }}>{qtdPendentes} blocos</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--slate-400)', minWidth: 46, textAlign: 'right' }}>{pctPendentes}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Volume por Pedreira */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={18} color="#38bdf8" />
              <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#fff', fontWeight: 700 }}>
                Demanda de Envelopamento por Pedreira
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
              {dadosPorPedreira.length} Pedreiras Ativas
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dadosPorPedreira.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.84rem' }}>
                Nenhum dado de pedreira no período selecionado.
              </div>
            ) : (
              dadosPorPedreira.map(p => {
                const pctBarra = maxQtdPedreira > 0 ? (p.total / maxQtdPedreira) * 100 : 0;
                const pctEnv = p.total > 0 ? ((p.envelopado / p.total) * 100).toFixed(0) : 0;

                return (
                  <div key={p.pedreira} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <strong style={{ color: '#fff' }}>{p.pedreira}</strong>
                      <span style={{ color: 'var(--slate-300)' }}>
                        <strong>{p.total}</strong> blocos ({(p.pesoKg / 1000).toFixed(1)} t) • <span style={{ color: '#4ade80' }}>{pctEnv}% Envelopados</span>
                      </span>
                    </div>

                    {/* Barra de Progresso Empilhada da Pedreira */}
                    <div style={{
                      height: 14,
                      width: '100%',
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 6,
                      overflow: 'hidden',
                      display: 'flex'
                    }}>
                      <div 
                        style={{ 
                          width: `${(p.envelopado / maxQtdPedreira) * 100}%`, 
                          background: '#22c55e' 
                        }} 
                        title={`Envelopados: ${p.envelopado}`} 
                      />
                      <div 
                        style={{ 
                          width: `${(p.sem_envelopamento / maxQtdPedreira) * 100}%`, 
                          background: '#0284c7' 
                        }} 
                        title={`Sem Envelopamento: ${p.sem_envelopamento}`} 
                      />
                      <div 
                        style={{ 
                          width: `${(p.pendente / maxQtdPedreira) * 100}%`, 
                          background: '#f59e0b' 
                        }} 
                        title={`Pendentes: ${p.pendente}`} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. Linha de Gráficos Secundários (Top Clientes + Materiais) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 18 }}>
        
        {/* Top 10 Clientes */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} color="#a855f7" />
              <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#fff', fontWeight: 700 }}>
                Top 10 Clientes por Volume de Blocos
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
              Ranking por demanda
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dadosPorCliente.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.84rem' }}>
                Nenhum cliente registrado no período.
              </div>
            ) : (
              dadosPorCliente.map((c, idx) => {
                const pctBar = maxQtdCliente > 0 ? (c.total / maxQtdCliente) * 100 : 0;
                return (
                  <div key={c.cliente} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.80rem' }}>
                      <span style={{ color: '#fff', fontWeight: 600, maxWidth: '65%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ color: 'var(--slate-400)', marginRight: 6 }}>#{idx + 1}</span>
                        {c.cliente}
                      </span>
                      <span style={{ color: 'var(--slate-300)', fontSize: '0.76rem' }}>
                        <strong>{c.total}</strong> blocos ({(c.pesoKg / 1000).toFixed(1)} t)
                      </span>
                    </div>

                    <div style={{
                      height: 8,
                      width: '100%',
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${pctBar}%`,
                        background: 'linear-gradient(90deg, #9333ea, #c084fc)',
                        borderRadius: 4
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Distribuição por Material */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={18} color="#f59e0b" />
              <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#fff', fontWeight: 700 }}>
                Distribuição por Tipo de Material / Rocha
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
              {dadosPorMaterial.length} Tipos de Material
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dadosPorMaterial.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.84rem' }}>
                Nenhum material encontrado no período.
              </div>
            ) : (
              dadosPorMaterial.slice(0, 10).map((m, idx) => {
                const pct = totalBlocos > 0 ? ((m.total / totalBlocos) * 100).toFixed(1) : 0;
                return (
                  <div key={m.material} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                      <strong style={{ fontSize: '0.82rem', color: '#fff' }}>{m.material}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--slate-300)' }}>
                        {(m.pesoKg / 1000).toFixed(1)} t
                      </span>
                      <span style={{ fontSize: '0.80rem', color: '#fbbf24', fontWeight: 800 }}>
                        {m.total} ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 5. Linha do Tempo / Evolução Temporal */}
      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="#22c55e" />
            <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#fff', fontWeight: 700 }}>
              Evolução Temporal de Blocos Cadastrados
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
            Últimos registros consolidados por data
          </span>
        </div>

        {dadosPorData.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.84rem' }}>
            Nenhum histórico temporal no período selecionado.
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            height: 180,
            padding: '16px 8px 10px',
            overflowX: 'auto',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            {dadosPorData.map(d => {
              const alturaPct = maxQtdTempo > 0 ? Math.max(8, (d.total / maxQtdTempo) * 100) : 8;
              const [ano, mes, dia] = d.data.split('-');
              const labelData = `${dia}/${mes}`;

              return (
                <div key={d.data} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  minWidth: 42,
                  flex: 1
                }}>
                  <span style={{ fontSize: '0.70rem', color: '#fff', fontWeight: 700 }}>
                    {d.total}
                  </span>

                  {/* Barra Vertical Empilhada */}
                  <div style={{
                    width: '100%',
                    maxWidth: 24,
                    height: `${alturaPct}%`,
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 4,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                  }}>
                    <div 
                      style={{ 
                        height: `${(d.envelopado / d.total) * 100}%`, 
                        background: '#22c55e' 
                      }} 
                      title={`${d.data}: ${d.envelopado} Envelopados`} 
                    />
                    <div 
                      style={{ 
                        height: `${(d.sem_envelopamento / d.total) * 100}%`, 
                        background: '#0284c7' 
                      }} 
                      title={`${d.data}: ${d.sem_envelopamento} Sem Envelopamento`} 
                    />
                    <div 
                      style={{ 
                        height: `${(d.pendente / d.total) * 100}%`, 
                        background: '#f59e0b' 
                      }} 
                      title={`${d.data}: ${d.pendente} Pendentes`} 
                    />
                  </div>

                  <span style={{ fontSize: '0.66rem', color: 'var(--slate-400)', whiteSpace: 'nowrap' }}>
                    {labelData}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, fontSize: '0.76rem', color: 'var(--slate-300)', marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e' }} />
            <span>Envelopado</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#0284c7' }} />
            <span>Sem Envelopamento</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b' }} />
            <span>Pendente</span>
          </div>
        </div>
      </div>

      {/* 6. Tabela Analítica Consolidada por Romaneios */}
      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#fff', fontWeight: 700 }}>
              Consolidado de Romaneios Recentes
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
            Exibindo os maiores romaneios no período
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '0.80rem' }}>
            <thead>
              <tr>
                <th>Romaneio</th>
                <th>Cliente</th>
                <th>Pedreira</th>
                <th style={{ textAlign: 'center' }}>Total Blocos</th>
                <th style={{ textAlign: 'center' }}>Envelopados</th>
                <th style={{ textAlign: 'center' }}>Sem Envelop.</th>
                <th style={{ textAlign: 'center' }}>Pendentes</th>
                <th style={{ textAlign: 'right' }}>Peso Total</th>
              </tr>
            </thead>
            <tbody>
              {dadosPorRomaneio.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 20, color: 'var(--slate-400)' }}>
                    Nenhum romaneio encontrado no período selecionado.
                  </td>
                </tr>
              ) : (
                dadosPorRomaneio.map(r => (
                  <tr key={r.romaneio}>
                    <td>
                      <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{r.romaneio}</strong>
                    </td>
                    <td>{r.cliente}</td>
                    <td>{r.pedreira}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800 }}>{r.total}</td>
                    <td style={{ textAlign: 'center', color: '#4ade80', fontWeight: 700 }}>{r.envelopado}</td>
                    <td style={{ textAlign: 'center', color: '#38bdf8', fontWeight: 700 }}>{r.sem_envelopamento}</td>
                    <td style={{ textAlign: 'center', color: '#fbbf24', fontWeight: 700 }}>{r.pendente}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>
                      {(r.pesoKg / 1000).toFixed(1)} t
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
