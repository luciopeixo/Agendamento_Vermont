import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, Printer, CheckCircle, Clock, Truck, Mail, FileText, AlertCircle, Trash2
} from 'lucide-react';
import { 
  listarAgendamentos, 
  atualizarStatusAgendamento, 
  excluirAgendamento,
  dispararEmailConfirmacao,
  formatarPlacasExibicao,
  formatarDataBR,
  PEDREIRAS_CEARA, 
  EMAIL_NOTIFICACAO_DESTINO
} from '../services/agendamentoService';

export function PainelGestao({ onVisualizarComprovante }) {
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroPedreira, setFiltroPedreira] = useState('todas');
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
            <span className="badge badge-vermont">Admin</span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--slate-400)' }}>
            Fluxo de carregamentos, controle de slots, exclusão e gestão de vagas
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 20
      }}>
        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Registrado
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>
            {agendamentos.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Carregamentos no Sistema</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>
            Carregamentos Hoje
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4ade80', marginTop: 4 }}>
            {agendamentosHoje.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Veículos previstos para hoje</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>
            Status Confirmados
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', marginTop: 4 }}>
            {agendamentos.filter(a => a.status === 'Confirmado').length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Aguardando entrada/pesagem</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>
            Notificações por E-mail
          </span>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--info)', marginTop: 8, wordBreak: 'break-all' }}>
            {EMAIL_NOTIFICACAO_DESTINO}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Disparo automático ativo</span>
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

          <div style={{ flex: '0 1 230px' }}>
            <select
              className="form-select"
              value={filtroPedreira}
              onChange={(e) => setFiltroPedreira(e.target.value)}
            >
              <option value="todas">Todas as Pedreiras</option>
              {PEDREIRAS_CEARA.map(p => (
                <option key={p.id} value={p.nome}>{p.nome}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '0 1 160px' }}>
            <select
              className="form-select"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="todos">Todos os Status</option>
              <option value="Confirmado">Confirmado</option>
              <option value="Carregado">Carregado</option>
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
                        <span className={`badge ${
                          ag.status === 'Confirmado' ? 'badge-success' :
                          ag.status === 'Carregado' ? 'badge-info' : 'badge-danger'
                        }`}>
                          {ag.status}
                        </span>
                        {ag.email_notificado && (
                          <div style={{ fontSize: '0.7rem', color: '#86efac', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Mail size={11} /> Notificado
                          </div>
                        )}
                      </td>

                      {/* Ações Administrativas com Excluir */}
                      <td style={{ padding: '14px 16px' }} className="no-print">
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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

                          {ag.status !== 'Carregado' && (
                            <button
                              type="button"
                              onClick={() => handleMudarStatus(ag.id, 'Carregado')}
                              className="btn btn-success"
                              style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                              title="Marcar como Carregado"
                            >
                              <CheckCircle size={14} />
                              Carregado
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

                          {/* BOTÃO EXCLUIR AGENDAMENTO (ADMIN) */}
                          <button
                            type="button"
                            onClick={() => handleExcluir(ag)}
                            disabled={estaExcluindo}
                            className="btn btn-danger"
                            style={{ padding: '6px 8px', fontSize: '0.78rem' }}
                            title="Apagar este agendamento e liberar o horário imediatamente"
                          >
                            <Trash2 size={14} />
                          </button>
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
