import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, Printer, CheckCircle, CheckCircle2, Clock, Truck, Mail, FileText, AlertCircle, Trash2, ShieldCheck, ShieldAlert, RotateCcw
} from 'lucide-react';
import { 
  listarAgendamentos, 
  atualizarStatusAgendamento, 
  excluirAgendamento,
  dispararEmailConfirmacao,
  formatarPlacasExibicao,
  formatarDataBR,
  PEDREIRAS_CEARA, 
  EMAIL_NOTIFICACAO_DESTINO,
  STATUS_AGENDAMENTO
} from '../services/agendamentoService';

export function PainelGestao({ 
  onVisualizarComprovante,
  usuario = null,
  isAdmin = false,
  pedreiraOperador = null
}) {
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  
  // Se for operador de pedreira, fixa na sua unidade atribuída
  const [filtroPedreira, setFiltroPedreira] = useState(() => {
    return (!isAdmin && pedreiraOperador) ? pedreiraOperador : 'todas';
  });

  useEffect(() => {
    if (!isAdmin && pedreiraOperador) {
      setFiltroPedreira(pedreiraOperador);
    }
  }, [isAdmin, pedreiraOperador]);

  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroData, setFiltroData] = useState('');
  const [notificandoEmailId, setNotificandoEmailId] = useState(null);
  const [excluindoId, setExcluindoId] = useState(null);
  const [mensagemAviso, setMensagemAviso] = useState('');
  const [testandoEmail, setTestandoEmail] = useState(false);
  const [statusEmailTeste, setStatusEmailTeste] = useState(null);

  const carregarDados = async () => {
    setCarregando(true);
    const lista = await listarAgendamentos({
      pedreira: filtroPedreira,
      status: filtroStatus,
      data: filtroData || null
    });
    setAgendamentos(lista);
    setCarregando(false);
  };

  useEffect(() => {
    carregarDados();
  }, [filtroPedreira, filtroStatus, filtroData]);

  const handleMudarStatus = async (id, novoStatus) => {
    const res = await atualizarStatusAgendamento(id, novoStatus);
    if (res.success) {
      setAgendamentos(prev => prev.map(ag => ag.id === id ? { ...ag, status: novoStatus } : ag));
    } else {
      alert('Erro ao atualizar status: ' + res.error);
    }
  };

  const handleExcluir = async (ag) => {
    if (!isAdmin) {
      alert('Acesso negado: Apenas o Administrador Geral possui autorização para apagar agendamentos.');
      return;
    }
    const confirmou = window.confirm(
      `ATENÇÃO: Deseja realmente APAGAR o agendamento?\n\n` +
      `• Bloco: ${ag.numero_bloco}\n` +
      `• Pedreira: ${ag.pedreira}\n` +
      `• Data: ${formatarDataBR(ag.data_agendamento)}\n` +
      `• Horário: ${ag.horario_agendamento}\n` +
      `• Motorista: ${ag.motorista_nome} (${ag.transportadora})\n\n` +
      `Ao apagar, este horário será LIBERADO IMEDIATAMENTE no portal para novos agendamentos!`
    );

    if (!confirmou) return;

    setExcluindoId(ag.id);
    const res = await excluirAgendamento(ag.id);
    setExcluindoId(null);

    if (res.success) {
      setAgendamentos(prev => prev.filter(item => item.id !== ag.id));
      setMensagemAviso(`Agendamento do Bloco ${ag.numero_bloco} apagado com sucesso. O horário ${ag.horario_agendamento} do dia ${formatarDataBR(ag.data_agendamento)} foi liberado!`);
      setTimeout(() => setMensagemAviso(''), 7000);
    } else {
      alert('Erro ao excluir agendamento: ' + res.error);
    }
  };

  const handleReenviarEmail = async (agendamento) => {
    setNotificandoEmailId(agendamento.id);
    const res = await dispararEmailConfirmacao(agendamento);
    setNotificandoEmailId(null);
    if (res.success) {
      setMensagemAviso(`Notificação enviada para ${EMAIL_NOTIFICACAO_DESTINO}! Verifique também a pasta de Spam.`);
      setTimeout(() => setMensagemAviso(''), 7000);
      setAgendamentos(prev => prev.map(ag => ag.id === agendamento.id ? { ...ag, email_notificado: true } : ag));
    } else {
      alert('Aviso no envio: ' + (res.error || 'Falha temporária'));
    }
  };

  const handleTestarEnvioDireto = async () => {
    setTestandoEmail(true);
    setStatusEmailTeste(null);

    try {
      const res = await fetch(`https://formsubmit.co/ajax/${EMAIL_NOTIFICACAO_DESTINO}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'https://vermontmineracao.com.br',
          'Referer': 'https://vermontmineracao.com.br/'
        },
        body: JSON.stringify({
          _subject: 'TESTE DE CONEXAO - PORTAL VERMONT MINERACAO',
          _template: 'table',
          _captcha: 'false',
          Destinatario: EMAIL_NOTIFICACAO_DESTINO,
          Data_Teste: new Date().toLocaleString('pt-BR'),
          Mensagem: 'Teste de disparo de e-mail do sistema de agendamentos.'
        })
      });

      const data = await res.json().catch(() => null);
      setTestandoEmail(false);

      if (data && (data.success === 'true' || data.success === true)) {
        setStatusEmailTeste({
          tipo: 'sucesso',
          mensagem: 'E-mail enviado com sucesso! Cheque sua caixa de entrada e spam.'
        });
      } else if (data && data.message && data.message.includes('Activation')) {
        setStatusEmailTeste({
          tipo: 'ativacao',
          mensagem: `O serviço enviou um e-mail com o assunto 'Action Required: Activate your Form' para ${EMAIL_NOTIFICACAO_DESTINO}. Abra a caixa postal e clique no link de ativação para autorizar o recebimento contínuo.`
        });
      } else {
        setStatusEmailTeste({
          tipo: 'aviso',
          mensagem: data?.message || 'Solicitação de e-mail enviada para processamento.'
        });
      }
    } catch (err) {
      setTestandoEmail(false);
      setStatusEmailTeste({
        tipo: 'erro',
        mensagem: 'Erro ao conectar ao serviço de envio: ' + err.message
      });
    }
  };

  const agendamentosFiltrados = agendamentos.filter(ag => {
    if (!termoBusca.trim()) return true;
    const busca = termoBusca.toLowerCase();
    return (
      (ag.numero_bloco && ag.numero_bloco.toLowerCase().includes(busca)) ||
      (ag.motorista_nome && ag.motorista_nome.toLowerCase().includes(busca)) ||
      (ag.placa_cavalo && ag.placa_cavalo.toLowerCase().includes(busca)) ||
      (ag.placa_carreta && ag.placa_carreta.toLowerCase().includes(busca)) ||
      (ag.placa_carreta_2 && ag.placa_carreta_2.toLowerCase().includes(busca)) ||
      (ag.transportadora && ag.transportadora.toLowerCase().includes(busca)) ||
      (ag.cliente && ag.cliente.toLowerCase().includes(busca)) ||
      (ag.pedreira && ag.pedreira.toLowerCase().includes(busca)) ||
      (ag.material && ag.material.toLowerCase().includes(busca))
    );
  });

  const agendamentosHoje = agendamentos.filter(ag => {
    const hojeStr = new Date().toISOString().split('T')[0];
    return ag.data_agendamento === hojeStr;
  });

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 0' }}>
      {/* Cabeçalho do Painel */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: '1.4rem', margin: 0 }}>Painel Operacional de Carregamentos</h1>
              {isAdmin ? (
                <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>🛡️ Admin Geral</span>
              ) : (
                <span className="badge badge-vermont" style={{ fontSize: '0.75rem' }}>
                  👷 Operador • {pedreiraOperador || 'Pedreira'}
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--slate-400)' }}>
              {isAdmin 
                ? 'Visão consolidada de todas as pedreiras, controle de slots e exclusão irrestrita' 
                : `Visão operacional exclusiva da pedreira ${pedreiraOperador}. Permissão: visualização e baixa.`}
            </p>
          </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => window.print()}
            className="btn btn-secondary"
            title="Imprimir lista de agendamentos para a balança"
          >
            <Printer size={18} />
            Imprimir Relatório
          </button>
          <button
            onClick={carregarDados}
            className="btn btn-vermont"
            disabled={carregando}
          >
            <RefreshCw size={18} className={carregando ? 'spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {mensagemAviso && (
        <div className="animate-fade" style={{
          background: 'var(--success-bg)',
          border: '1px solid var(--success-border)',
          color: '#6ee7b7',
          padding: '12px 16px',
          borderRadius: 10,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <CheckCircle size={20} />
          <span>{mensagemAviso}</span>
        </div>
      )}

      {/* Alerta de Status de Envio de E-mail */}
      <div className="glass-panel no-print" style={{
        padding: 16,
        marginBottom: 20,
        background: 'rgba(0, 118, 44, 0.08)',
        border: '1px solid var(--vermont-green-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, maxWidth: 800 }}>
          <Mail size={22} color="#4ade80" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.86rem' }}>
            <strong style={{ color: '#fff' }}>Notificações por E-mail para: </strong>
            <span style={{ color: '#4ade80', fontWeight: 600 }}>{EMAIL_NOTIFICACAO_DESTINO}</span>
            <p style={{ margin: '3px 0 0 0', color: 'var(--slate-300)', fontSize: '0.8rem' }}>
              Importante: Para autorizar o recebimento automático, certifique-se de que o e-mail de ativação (<strong>"Action Required: Activate your Form"</strong>) foi clicado em {EMAIL_NOTIFICACAO_DESTINO} (verifique a pasta de <strong>Spam / Lixo Eletrônico</strong>).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestarEnvioDireto}
          disabled={testandoEmail}
          className="btn btn-vermont"
          style={{ padding: '8px 16px', fontSize: '0.84rem' }}
        >
          {testandoEmail ? 'Testando envio...' : 'Testar Envio de E-mail'}
        </button>

        {statusEmailTeste && (
          <div style={{
            width: '100%',
            marginTop: 8,
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: '0.82rem',
            background: statusEmailTeste.tipo === 'sucesso' ? 'var(--success-bg)' : statusEmailTeste.tipo === 'ativacao' ? 'var(--warning-bg)' : 'var(--danger-bg)',
            border: statusEmailTeste.tipo === 'sucesso' ? '1px solid var(--success-border)' : statusEmailTeste.tipo === 'ativacao' ? '1px solid var(--warning-border)' : '1px solid var(--danger-border)',
            color: statusEmailTeste.tipo === 'sucesso' ? '#6ee7b7' : statusEmailTeste.tipo === 'ativacao' ? '#fef3c7' : '#fca5a5'
          }}>
            {statusEmailTeste.mensagem}
          </div>
        )}
      </div>

      {/* Métricas Rápidas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14,
        marginBottom: 20
      }}>
        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Registrado
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>
            {agendamentos.length}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)' }}>Carregamentos no Sistema</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px 18px', borderLeft: '4px solid #4ade80' }}>
          <span style={{ fontSize: '0.78rem', color: '#4ade80', textTransform: 'uppercase', fontWeight: 700 }}>
            Carregamentos Hoje
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4ade80', marginTop: 4 }}>
            {agendamentosHoje.length}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)' }}>Previstos para a data atual</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px 18px', borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: '0.78rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={13} /> Aguardando Liberação
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>
            {agendamentos.filter(a => a.status === 'Aguardando Liberação').length}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)' }}>Aguardando aval do Admin</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px 18px', borderLeft: '4px solid #22c55e' }}>
          <span style={{ fontSize: '0.78rem', color: '#86efac', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <CheckCircle2 size={13} /> Liberados p/ Carregar
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#86efac', marginTop: 4 }}>
            {agendamentos.filter(a => a.status === 'Liberado para Carregar' || a.status === 'Confirmado').length}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)' }}>Aprovados para expedição</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px 18px', borderLeft: '4px solid #3b82f6' }}>
          <span style={{ fontSize: '0.78rem', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Truck size={13} /> Carregados
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#93c5fd', marginTop: 4 }}>
            {agendamentos.filter(a => a.status === 'Carregado').length}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)' }}>Carga e pesagem concluídas</span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="glass-panel no-print" style={{ padding: 18, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={18} color="var(--slate-400)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por bloco, material, placa, motorista, cliente..."
              className="form-input"
              style={{ paddingLeft: 38 }}
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
          </div>

          <div style={{ flex: '0 1 240px' }}>
            {isAdmin ? (
              <select
                className="form-select"
                value={filtroPedreira}
                onChange={(e) => setFiltroPedreira(e.target.value)}
              >
                <option value="todas">Todas as Pedreiras (Geral)</option>
                {PEDREIRAS_CEARA.map(p => (
                  <option key={p.id} value={p.nome}>{p.nome}</option>
                ))}
              </select>
            ) : (
              <div style={{
                padding: '9px 14px',
                borderRadius: 8,
                background: 'rgba(0, 118, 44, 0.18)',
                border: '1px solid var(--vermont-green-border)',
                color: '#4ade80',
                fontSize: '0.82rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }} title={`Filtro travado na sua unidade: ${pedreiraOperador}`}>
                📍 {pedreiraOperador}
              </div>
            )}
          </div>

          <div style={{ flex: '0 1 190px' }}>
            <select
              className="form-select"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="todos">Todos os Status</option>
              <option value="Aguardando Liberação">🟡 Aguardando Liberação</option>
              <option value="Liberado para Carregar">🟢 Liberado p/ Carregar</option>
              <option value="Carregado">🔵 Carregado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          <div style={{ flex: '0 1 170px' }}>
            <input
              type="date"
              className="form-input"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
              style={{ colorScheme: 'dark' }}
              title="Filtrar por data específica"
            />
          </div>

          {filtroData && (
            <button
              onClick={() => setFiltroData('')}
              className="btn btn-secondary"
              style={{ padding: '10px 14px', fontSize: '0.8rem' }}
            >
              Limpar Data
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Agendamentos com Botão de Exclusão */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '14px 16px', color: 'var(--slate-400)', fontWeight: 600 }}>DATA / HORÁRIO</th>
                <th style={{ padding: '14px 16px', color: 'var(--slate-400)', fontWeight: 600 }}>PEDREIRA / MATERIAL</th>
                <th style={{ padding: '14px 16px', color: 'var(--slate-400)', fontWeight: 600 }}>BLOCO / CLIENTE</th>
                <th style={{ padding: '14px 16px', color: 'var(--slate-400)', fontWeight: 600 }}>MOTORISTA / CPF</th>
                <th style={{ padding: '14px 16px', color: 'var(--slate-400)', fontWeight: 600 }}>VEÍCULO / PLACAS</th>
                <th style={{ padding: '14px 16px', color: 'var(--slate-400)', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '14px 16px', color: 'var(--slate-400)', fontWeight: 600 }} className="no-print">AÇÕES DO ADMIN</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--slate-400)' }}>
                    Carregando agendamentos...
                  </td>
                </tr>
              ) : agendamentosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--slate-400)' }}>
                    Nenhum agendamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                agendamentosFiltrados.map((ag) => {
                  const isSabado = ag.tipo_dia === 'sabado';
                  const listaPlacasTabela = formatarPlacasExibicao(ag);
                  const estaExcluindo = excluindoId === ag.id;

                  return (
                    <tr 
                      key={ag.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Data / Horário */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{formatarDataBR(ag.data_agendamento)}</div>
                        <div style={{ fontSize: '0.8rem', color: isSabado ? '#fbbf24' : '#86efac', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Clock size={13} />
                          {ag.horario_agendamento}
                        </div>
                        {isSabado && (
                          <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '1px 6px', marginTop: 4 }}>
                            Sábado (Cota)
                          </span>
                        )}
                      </td>

                      {/* Pedreira / Material */}
                      <td style={{ padding: '14px 16px' }}>
                        <strong style={{ color: '#fff' }}>{ag.pedreira}</strong>
                        <div style={{ fontSize: '0.82rem', color: '#86efac', fontWeight: 500 }}>
                          Material: {ag.material}
                        </div>
                        {ag.observacoes?.includes('[Carga Combinada 1/2]') && (
                          <span className="badge" style={{
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            fontSize: '0.68rem',
                            padding: '2px 6px',
                            borderRadius: 4,
                            display: 'inline-block',
                            marginTop: 4
                          }}>
                            🔄 Carga Combinada (1/2)
                          </span>
                        )}
                        {ag.observacoes?.includes('[Carga Combinada 2/2]') && (
                          <span className="badge" style={{
                            background: 'rgba(168, 85, 247, 0.15)',
                            color: '#c084fc',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            fontSize: '0.68rem',
                            padding: '2px 6px',
                            borderRadius: 4,
                            display: 'inline-block',
                            marginTop: 4
                          }}>
                            🔄 Carga Combinada (2/2)
                          </span>
                        )}
                      </td>

                      {/* Bloco / Cliente */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>Bloco: {ag.numero_bloco}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>Cliente: {ag.cliente}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Transp: {ag.transportadora}</div>
                      </td>

                      {/* Motorista / CPF */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{ag.motorista_nome}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', fontFamily: 'monospace' }}>CPF: {ag.motorista_cpf}</div>
                        {ag.motorista_telefone && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--info)' }}>{ag.motorista_telefone}</div>
                        )}
                      </td>

                      {/* Veículo / Placas Dinâmicas */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: '0.78rem', color: '#86efac', fontWeight: 600 }}>
                          {ag.tipo_veiculo}
                        </div>
                        <div style={{ fontSize: '0.78rem', marginTop: 2 }}>
                          {listaPlacasTabela.map((p, idx) => (
                            <div key={idx} style={{ color: 'var(--slate-300)' }}>
                              <span style={{ color: 'var(--slate-400)' }}>{p.label}:</span>{' '}
                              <strong style={{ fontFamily: 'monospace', color: '#fff' }}>{p.placa}</strong>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        {ag.status === 'Aguardando Liberação' && (
                          <span className="badge" style={{
                            background: 'rgba(245, 158, 11, 0.18)',
                            color: '#fbbf24',
                            border: '1px solid rgba(245, 158, 11, 0.45)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5
                          }}>
                            <Clock size={12} /> Aguardando Liberação
                          </span>
                        )}
                        {(ag.status === 'Liberado para Carregar' || ag.status === 'Confirmado') && (
                          <span className="badge" style={{
                            background: 'rgba(34, 197, 94, 0.18)',
                            color: '#4ade80',
                            border: '1px solid rgba(74, 222, 128, 0.45)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5
                          }}>
                            <CheckCircle2 size={12} /> Liberado p/ Carregar
                          </span>
                        )}
                        {ag.status === 'Carregado' && (
                          <span className="badge" style={{
                            background: 'rgba(59, 130, 246, 0.18)',
                            color: '#60a5fa',
                            border: '1px solid rgba(59, 130, 246, 0.45)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5
                          }}>
                            <Truck size={12} /> Carregado
                          </span>
                        )}
                        {ag.status !== 'Aguardando Liberação' && ag.status !== 'Liberado para Carregar' && ag.status !== 'Confirmado' && ag.status !== 'Carregado' && (
                          <span className="badge badge-danger">
                            {ag.status}
                          </span>
                        )}
                        {ag.email_notificado && (
                          <div style={{ fontSize: '0.7rem', color: '#86efac', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Mail size={11} /> Notificado
                          </div>
                        )}
                      </td>

                      {/* Ações Administrativas e Operacionais */}
                      <td style={{ padding: '14px 16px' }} className="no-print">
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => onVisualizarComprovante(ag)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                            title="Ver Comprovante Oficial"
                          >
                            <FileText size={14} />
                            Ver
                          </button>

                          {/* BOTÃO EXCLUSIVO ADMIN: LIBERAR CARREGAMENTO */}
                          {isAdmin && ag.status === 'Aguardando Liberação' && (
                            <button
                              type="button"
                              onClick={() => handleMudarStatus(ag.id, 'Liberado para Carregar')}
                              className="btn btn-vermont glow-effect"
                              style={{ padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, gap: 5 }}
                              title="Validar documentação e autorizar o carregamento na pedreira"
                            >
                              <ShieldCheck size={15} />
                              Liberar
                            </button>
                          )}

                          {/* BLOQUEIO OPERACIONAL QUANDO AGUARDANDO ADMIN (Visão do Operador) */}
                          {!isAdmin && ag.status === 'Aguardando Liberação' && (
                            <span 
                              style={{
                                padding: '5px 8px',
                                background: 'rgba(245, 158, 11, 0.12)',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                borderRadius: 6,
                                color: '#fde047',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                              title="Aguardando liberação do Administrador Geral para poder iniciar o carregamento"
                            >
                              <ShieldAlert size={12} /> Aguarda Admin
                            </span>
                          )}

                          {/* MARCAR COMO CARREGADO: Disponível apenas se já estiver liberado */}
                          {(ag.status === 'Liberado para Carregar' || ag.status === 'Confirmado') && (
                            <button
                              type="button"
                              onClick={() => handleMudarStatus(ag.id, 'Carregado')}
                              className="btn btn-success"
                              style={{ padding: '6px 10px', fontSize: '0.78rem', fontWeight: 600 }}
                              title="Registrar que o veículo foi carregado e pesado"
                            >
                              <Truck size={14} />
                              Carregado
                            </button>
                          )}

                          {/* ADMIN: Opção de reverter status se necessário */}
                          {isAdmin && (ag.status === 'Liberado para Carregar' || ag.status === 'Confirmado') && (
                            <button
                              type="button"
                              onClick={() => handleMudarStatus(ag.id, 'Aguardando Liberação')}
                              className="btn btn-secondary"
                              style={{ padding: '6px 8px', fontSize: '0.78rem' }}
                              title="Reverter para Aguardando Liberação (Segurar carregamento)"
                            >
                              <RotateCcw size={13} color="#f59e0b" />
                            </button>
                          )}

                          {isAdmin && ag.status === 'Carregado' && (
                            <button
                              type="button"
                              onClick={() => handleMudarStatus(ag.id, 'Liberado para Carregar')}
                              className="btn btn-secondary"
                              style={{ padding: '6px 8px', fontSize: '0.78rem' }}
                              title="Reabrir status para Liberado para Carregar"
                            >
                              <RotateCcw size={13} color="#4ade80" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleReenviarEmail(ag)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 8px', fontSize: '0.78rem' }}
                            disabled={notificandoEmailId === ag.id}
                            title={`Reenviar e-mail para ${EMAIL_NOTIFICACAO_DESTINO}`}
                          >
                            <Mail size={14} color="var(--info)" />
                          </button>

                          {/* BOTÃO EXCLUIR AGENDAMENTO (Exclusivo para ADMIN GERAL) */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleExcluir(ag)}
                              disabled={estaExcluindo}
                              className="btn btn-danger"
                              style={{ padding: '6px 8px', fontSize: '0.78rem' }}
                              title="Apagar este agendamento e liberar o horário imediatamente (Apenas Admin)"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
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
  );
}
