import React, { useState, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, Calendar, MapPin, Layers, Users, Truck, Filter, 
  Download, RefreshCw, CheckCircle2, Award, PieChart, ArrowUpRight, Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  PEDREIRAS_CEARA, 
  saoMesmaPedreira, 
  formatarDataBR, 
  obterMateriaisPorPedreira 
} from '../services/agendamentoService';

export function GraficosBlocosAdmin({ agendamentos = [] }) {
  // Filtros de Análise
  const [filtroPeriodo, setFiltroPeriodo] = useState('30_dias'); // '7_dias', '30_dias', 'mes_atual', 'ano_atual', 'todos', 'custom'
  const [dataInicioCustom, setDataInicioCustom] = useState('');
  const [dataFimCustom, setDataFimCustom] = useState('');
  const [filtroPedreira, setFiltroPedreira] = useState('todas');
  const [filtroMaterial, setFiltroMaterial] = useState('todos');
  const [filtroCliente, setFiltroCliente] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('apenas_finalizados'); // 'apenas_finalizados' ou 'todos'
  const [tipoGraficoTempo, setTipoGraficoTempo] = useState('barras'); // 'barras' ou 'linha'

  // Lista única de Clientes presentes nos agendamentos
  const listaClientesUnicos = useMemo(() => {
    const setC = new Set();
    agendamentos.forEach(a => {
      if (a.cliente && a.cliente.trim()) {
        setC.add(a.cliente.trim().toUpperCase());
      }
    });
    return Array.from(setC).sort();
  }, [agendamentos]);

  // Lista dinâmica de Materiais baseada na pedreira selecionada ou geral
  const listaMateriaisDisponiveis = useMemo(() => {
    if (filtroPedreira && filtroPedreira !== 'todas') {
      const mats = obterMateriaisPorPedreira(filtroPedreira);
      if (mats && mats.length > 0) return mats;
    }
    const setM = new Set();
    agendamentos.forEach(a => {
      if (a.material && a.material.trim()) {
        setM.add(a.material.trim());
      }
    });
    return Array.from(setM).sort();
  }, [agendamentos, filtroPedreira]);

  // Filtra agendamentos conforme período e seleções
  const agendamentosFiltrados = useMemo(() => {
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

    return agendamentos.filter(ag => {
      // Filtro de Status
      if (filtroStatus === 'apenas_finalizados') {
        const statusValido = ['Finalizado', 'Carregado'].includes(ag.status);
        if (!statusValido) return false;
      }

      // Filtro de Data
      if (ag.data_agendamento) {
        const [ano, mes, dia] = ag.data_agendamento.split('-').map(Number);
        const dtAg = new Date(ano, mes - 1, dia, 12, 0, 0);
        if (dataMin && dtAg < dataMin) return false;
        if (dataMax && dtAg > dataMax) return false;
      }

      // Filtro de Pedreira
      if (filtroPedreira !== 'todas' && !saoMesmaPedreira(ag.pedreira, filtroPedreira)) {
        return false;
      }

      // Filtro de Material
      if (filtroMaterial !== 'todos' && ag.material?.trim().toLowerCase() !== filtroMaterial.trim().toLowerCase()) {
        return false;
      }

      // Filtro de Cliente
      if (filtroCliente !== 'todos' && ag.cliente?.trim().toUpperCase() !== filtroCliente.trim().toUpperCase()) {
        return false;
      }

      return true;
    });
  }, [agendamentos, filtroPeriodo, dataInicioCustom, dataFimCustom, filtroPedreira, filtroMaterial, filtroCliente, filtroStatus]);

  // Total de Blocos Carregados
  const totalBlocos = agendamentosFiltrados.length;

  // Agrupamento por Data (Evolução Temporal)
  const dadosPorData = useMemo(() => {
    const mapa = {};
    agendamentosFiltrados.forEach(ag => {
      const data = ag.data_agendamento || 'Sem Data';
      mapa[data] = (mapa[data] || 0) + 1;
    });

    const ordenados = Object.entries(mapa).sort(([a], [b]) => a.localeCompare(b));
    return ordenados.map(([data, qtd]) => ({
      data,
      dataBR: formatarDataBR(data),
      qtd
    }));
  }, [agendamentosFiltrados]);

  // Agrupamento por Pedreira
  const dadosPorPedreira = useMemo(() => {
    const mapa = {};
    agendamentosFiltrados.forEach(ag => {
      const ped = ag.pedreira || 'Outra';
      mapa[ped] = (mapa[ped] || 0) + 1;
    });

    return Object.entries(mapa)
      .map(([pedreira, qtd]) => ({
        pedreira,
        qtd,
        porcentagem: totalBlocos > 0 ? ((qtd / totalBlocos) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.qtd - a.qtd);
  }, [agendamentosFiltrados, totalBlocos]);

  // Agrupamento por Material
  const dadosPorMaterial = useMemo(() => {
    const mapa = {};
    agendamentosFiltrados.forEach(ag => {
      const mat = (ag.material || 'Não informado').trim();
      mapa[mat] = (mapa[mat] || 0) + 1;
    });

    return Object.entries(mapa)
      .map(([material, qtd]) => ({
        material,
        qtd,
        porcentagem: totalBlocos > 0 ? ((qtd / totalBlocos) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.qtd - a.qtd);
  }, [agendamentosFiltrados, totalBlocos]);

  // Agrupamento por Cliente
  const dadosPorCliente = useMemo(() => {
    const mapa = {};
    agendamentosFiltrados.forEach(ag => {
      const cli = (ag.cliente || 'Consumidor Final').trim().toUpperCase();
      mapa[cli] = (mapa[cli] || 0) + 1;
    });

    return Object.entries(mapa)
      .map(([cliente, qtd]) => ({
        cliente,
        qtd,
        porcentagem: totalBlocos > 0 ? ((qtd / totalBlocos) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.qtd - a.qtd);
  }, [agendamentosFiltrados, totalBlocos]);

  // Exportar Relatório Analítico em Excel
  const exportarAnaliticoExcel = () => {
    if (agendamentosFiltrados.length === 0) {
      alert('Nenhum dado para exportar com os filtros selecionados.');
      return;
    }

    const cabecalhos = [
      'Data do Carregamento',
      'Horário',
      'Pedreira',
      'Material',
      'Nº do Bloco',
      'Cliente Destinatário',
      'Transportadora',
      'CNPJ Transportadora',
      'Motorista',
      'CPF Motorista',
      'Placa Cavalo',
      'Placa Carreta',
      'Status',
      'Observações'
    ];

    const dados = agendamentosFiltrados.map(ag => ({
      'Data do Carregamento': formatarDataBR(ag.data_agendamento),
      'Horário': ag.horario_agendamento || '',
      'Pedreira': ag.pedreira || '',
      'Material': ag.material || '',
      'Nº do Bloco': ag.numero_bloco || '',
      'Cliente Destinatário': ag.cliente || '',
      'Transportadora': ag.transportadora || '',
      'CNPJ Transportadora': ag.transportadora_cnpj || '',
      'Motorista': ag.motorista_nome || '',
      'CPF Motorista': ag.motorista_cpf || '',
      'Placa Cavalo': ag.placa_cavalo || '',
      'Placa Carreta': ag.placa_carreta || '',
      'Status': ag.status || '',
      'Observações': ag.observacoes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dados, { header: cabecalhos });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Blocos Carregados');
    XLSX.writeFile(workbook, `relatorio_analitico_blocos_vermont_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Altura máxima para cálculo das barras do gráfico temporal
  const maxQtdData = Math.max(1, ...dadosPorData.map(d => d.qtd));

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Barra de Filtros Analíticos Exclusivos do Admin */}
      <div className="glass-panel" style={{ padding: '20px 24px', background: 'rgba(10, 18, 14, 0.75)', border: '1px solid var(--vermont-green-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--vermont-green-subtle)',
              border: '1px solid var(--vermont-green-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4ade80'
            }}>
              <Filter size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#fff' }}>
                Filtros de Análise & Volume de Blocos
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>
                Personalize o recorte temporal, unidade, material e cliente
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={exportarAnaliticoExcel}
              className="btn btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.82rem', gap: 6, color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
            >
              <Download size={15} />
              Exportar Análise Excel
            </button>
          </div>
        </div>

        {/* Grade de Controles de Filtros */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          
          {/* Período */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-300)', marginBottom: 5, fontWeight: 700 }}>
              📅 PERÍODO:
            </label>
            <select
              className="form-select"
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              style={{ fontSize: '0.84rem' }}
            >
              <option value="7_dias">Últimos 7 dias</option>
              <option value="30_dias">Últimos 30 dias</option>
              <option value="mes_atual">Este Mês</option>
              <option value="ano_atual">Este Ano (Consolidado)</option>
              <option value="todos">Todo o Histórico</option>
              <option value="custom">Personalizado (Selecionar Datas)</option>
            </select>
          </div>

          {/* Pedreira */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-300)', marginBottom: 5, fontWeight: 700 }}>
              🏢 PEDREIRA:
            </label>
            <select
              className="form-select"
              value={filtroPedreira}
              onChange={(e) => {
                setFiltroPedreira(e.target.value);
                setFiltroMaterial('todos');
              }}
              style={{ fontSize: '0.84rem' }}
            >
              <option value="todas">Todas as Pedreiras</option>
              {PEDREIRAS_CEARA.map(p => (
                <option key={p.id} value={p.nome}>{p.nome}</option>
              ))}
            </select>
          </div>

          {/* Material */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-300)', marginBottom: 5, fontWeight: 700 }}>
              💎 MATERIAL:
            </label>
            <select
              className="form-select"
              value={filtroMaterial}
              onChange={(e) => setFiltroMaterial(e.target.value)}
              style={{ fontSize: '0.84rem' }}
            >
              <option value="todos">Todos os Materiais</option>
              {listaMateriaisDisponiveis.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Cliente */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-300)', marginBottom: 5, fontWeight: 700 }}>
              💼 CLIENTE DESTINATÁRIO:
            </label>
            <select
              className="form-select"
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              style={{ fontSize: '0.84rem' }}
            >
              <option value="todos">Todos os Clientes</option>
              {listaClientesUnicos.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status dos Blocos */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-300)', marginBottom: 5, fontWeight: 700 }}>
              🔵 STATUS DOS BLOCOS:
            </label>
            <select
              className="form-select"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              style={{ fontSize: '0.84rem' }}
            >
              <option value="apenas_finalizados">Apenas Carregados / Finalizados</option>
              <option value="todos">Todos os Status (Geral)</option>
            </select>
          </div>
        </div>

        {/* Seletor Customizado de Datas (Quando Período = 'custom') */}
        {filtroPeriodo === 'custom' && (
          <div className="animate-fade" style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', marginRight: 6 }}>De:</span>
              <input
                type="date"
                className="form-input"
                value={dataInicioCustom}
                onChange={(e) => setDataInicioCustom(e.target.value)}
                style={{ width: 170, colorScheme: 'dark', fontSize: '0.84rem' }}
              />
            </div>
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', marginRight: 6 }}>Até:</span>
              <input
                type="date"
                className="form-input"
                value={dataFimCustom}
                onChange={(e) => setDataFimCustom(e.target.value)}
                style={{ width: 170, colorScheme: 'dark', fontSize: '0.84rem' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Cards de Métricas e Indicadores Chave (KPIs) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        
        {/* Total de Blocos Carregados */}
        <div className="glass-panel" style={{ padding: '18px 20px', borderLeft: '4px solid #4ade80' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#4ade80' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Total de Blocos
            </span>
            <Layers size={18} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginTop: 8 }}>
            {totalBlocos}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
            {filtroStatus === 'apenas_finalizados' ? 'Blocos com pesagem e carregamento finalizados' : 'Blocos registrados no período'}
          </span>
        </div>

        {/* Pedreira Líder */}
        <div className="glass-panel" style={{ padding: '18px 20px', borderLeft: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#38bdf8' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Pedreira com Maior Volume
            </span>
            <MapPin size={18} />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {dadosPorPedreira[0]?.pedreira ? dadosPorPedreira[0].pedreira.split('-')[0].trim() : 'N/A'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
            {dadosPorPedreira[0] ? `${dadosPorPedreira[0].qtd} blocos (${dadosPorPedreira[0].porcentagem}%)` : 'Nenhum carregamento'}
          </span>
        </div>

        {/* Material Mais Expedido */}
        <div className="glass-panel" style={{ padding: '18px 20px', borderLeft: '4px solid #fbbf24' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fbbf24' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Material Mais Carregado
            </span>
            <Award size={18} />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {dadosPorMaterial[0]?.material || 'N/A'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>
            {dadosPorMaterial[0] ? `${dadosPorMaterial[0].qtd} blocos (${dadosPorMaterial[0].porcentagem}%)` : 'Nenhum carregamento'}
          </span>
        </div>

        {/* Cliente Líder */}
        <div className="glass-panel" style={{ padding: '18px 20px', borderLeft: '4px solid #a855f7' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#c084fc' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Cliente Mais Atendido
            </span>
            <Users size={18} />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {dadosPorCliente[0]?.cliente || 'N/A'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#c084fc' }}>
            {dadosPorCliente[0] ? `${dadosPorCliente[0].qtd} blocos (${dadosPorCliente[0].porcentagem}%)` : 'Nenhum carregamento'}
          </span>
        </div>
      </div>

      {/* Gráfico 1: Evolução Temporal de Blocos Carregados */}
      <div className="glass-panel" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', margin: '0 0 4px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="#4ade80" />
              Evolução Diária de Blocos Carregados
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>
              Quantidade de blocos expedidos por data no período selecionado
            </span>
          </div>

          <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              type="button"
              onClick={() => setTipoGraficoTempo('barras')}
              className={`btn ${tipoGraficoTempo === 'barras' ? 'btn-vermont' : 'btn-secondary'}`}
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              Barras
            </button>
            <button
              type="button"
              onClick={() => setTipoGraficoTempo('linha')}
              className={`btn ${tipoGraficoTempo === 'linha' ? 'btn-vermont' : 'btn-secondary'}`}
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              Linha / Área
            </button>
          </div>
        </div>

        {dadosPorData.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.9rem' }}>
            Nenhum bloco encontrado para o período e filtros atuais.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', paddingBottom: 10 }}>
            {tipoGraficoTempo === 'barras' ? (
              /* Gráfico de Barras SVG Interativo */
              <div style={{ minWidth: Math.max(dadosPorData.length * 45, 500), height: 220, display: 'flex', alignItems: 'flex-end', gap: 10, padding: '20px 10px 30px 10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {dadosPorData.map((d, i) => {
                  const alturaPorc = Math.max(12, (d.qtd / maxQtdData) * 100);
                  return (
                    <div 
                      key={i} 
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        height: '100%', 
                        justifyContent: 'flex-end',
                        position: 'relative'
                      }}
                      title={`${d.dataBR}: ${d.qtd} bloco(s)`}
                    >
                      {/* Valor no topo */}
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#4ade80', marginBottom: 4 }}>
                        {d.qtd}
                      </span>
                      {/* Barra */}
                      <div style={{
                        width: '100%',
                        maxWidth: 32,
                        height: `${alturaPorc}%`,
                        background: 'linear-gradient(180deg, #4ade80 0%, #00762c 100%)',
                        borderRadius: '6px 6px 2px 2px',
                        boxShadow: '0 0 10px rgba(74, 222, 128, 0.25)',
                        transition: 'height 0.4s ease'
                      }} />
                      {/* Rótulo Data */}
                      <span style={{ 
                        position: 'absolute', 
                        bottom: -25, 
                        fontSize: '0.68rem', 
                        color: 'var(--slate-400)', 
                        whiteSpace: 'nowrap',
                        transform: 'rotate(-30deg)',
                        transformOrigin: 'left top'
                      }}>
                        {d.dataBR.slice(0, 5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Gráfico de Linha / Área SVG */
              <div style={{ width: '100%', height: 220 }}>
                <svg viewBox="0 0 800 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="gradVermont" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#00762c" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y1="50" x2="800" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                  <line x1="0" y1="100" x2="800" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                  <line x1="0" y1="150" x2="800" y2="150" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

                  {/* Caminho da Linha & Área */}
                  {(() => {
                    const totalPontos = dadosPorData.length;
                    const stepX = totalPontos > 1 ? 800 / (totalPontos - 1) : 400;
                    const pontos = dadosPorData.map((d, idx) => {
                      const x = totalPontos === 1 ? 400 : idx * stepX;
                      const y = 180 - ((d.qtd / maxQtdData) * 150);
                      return { x, y, qtd: d.qtd, data: d.dataBR };
                    });

                    const pathArea = `M ${pontos[0].x} 180 L ` + pontos.map(p => `${p.x} ${p.y}`).join(' L ') + ` L ${pontos[pontos.length - 1].x} 180 Z`;
                    const pathLinha = 'M ' + pontos.map(p => `${p.x} ${p.y}`).join(' L ');

                    return (
                      <>
                        <path d={pathArea} fill="url(#gradVermont)" />
                        <path d={pathLinha} fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        {pontos.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="5" fill="#0e1412" stroke="#4ade80" strokeWidth="2.5" />
                            <text x={p.x} y={p.y - 10} fill="#86efac" fontSize="11" fontWeight="bold" textAnchor="middle">
                              {p.qtd}
                            </text>
                            <text x={p.x} y={195} fill="#94a3b8" fontSize="10" textAnchor="middle">
                              {p.data.slice(0, 5)}
                            </text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid 2 Colunas: Pedreiras & Materiais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 }}>
        
        {/* Distribuição por Pedreira */}
        <div className="glass-panel" style={{ padding: '22px 24px' }}>
          <h3 style={{ fontSize: '1.05rem', margin: '0 0 4px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} color="#38bdf8" />
            Distribuição por Pedreira
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.78rem', color: 'var(--slate-400)' }}>
            Volume de blocos carregados por unidade operacional
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dadosPorPedreira.length === 0 ? (
              <div style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>Nenhum registro.</div>
            ) : (
              dadosPorPedreira.map((p, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <strong style={{ fontSize: '0.86rem', color: '#fff' }}>{p.pedreira}</strong>
                    <span style={{ fontSize: '0.84rem', color: '#38bdf8', fontWeight: 800 }}>
                      {p.qtd} {p.qtd === 1 ? 'bloco' : 'blocos'} ({p.porcentagem}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${p.porcentagem}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                      borderRadius: 4
                    }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Distribuição por Material */}
        <div className="glass-panel" style={{ padding: '22px 24px' }}>
          <h3 style={{ fontSize: '1.05rem', margin: '0 0 4px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={18} color="#fbbf24" />
            Ranking por Material
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.78rem', color: 'var(--slate-400)' }}>
            Materiais com maior número de blocos expedidos
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 360, overflowY: 'auto' }}>
            {dadosPorMaterial.length === 0 ? (
              <div style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>Nenhum registro.</div>
            ) : (
              dadosPorMaterial.map((m, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <strong style={{ fontSize: '0.86rem', color: '#fff' }}>{m.material}</strong>
                    <span style={{ fontSize: '0.84rem', color: '#fbbf24', fontWeight: 800 }}>
                      {m.qtd} {m.qtd === 1 ? 'bloco' : 'blocos'} ({m.porcentagem}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${m.porcentagem}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #d97706 0%, #fbbf24 100%)',
                      borderRadius: 4
                    }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Clientes Destinatários */}
      <div className="glass-panel" style={{ padding: '22px 24px' }}>
        <h3 style={{ fontSize: '1.05rem', margin: '0 0 4px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={18} color="#c084fc" />
          Volume de Blocos por Cliente Destinatário
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '0.78rem', color: 'var(--slate-400)' }}>
          Distribuição dos clientes com maior movimentação no período
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {dadosPorCliente.length === 0 ? (
            <div style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>Nenhum cliente registrado.</div>
          ) : (
            dadosPorCliente.slice(0, 12).map((c, idx) => (
              <div key={idx} style={{
                background: 'rgba(168, 85, 247, 0.06)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                borderRadius: 10,
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ maxWidth: '70%' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.cliente}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#c084fc' }}>
                    {c.porcentagem}% do volume total
                  </span>
                </div>
                <div style={{
                  background: 'rgba(168, 85, 247, 0.25)',
                  border: '1px solid #a855f7',
                  color: '#e9d5ff',
                  borderRadius: 8,
                  padding: '4px 10px',
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}>
                  {c.qtd} {c.qtd === 1 ? 'bloco' : 'blocos'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
