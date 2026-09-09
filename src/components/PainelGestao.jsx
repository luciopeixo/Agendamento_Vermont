import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, Printer, CheckCircle, CheckCircle2, Clock, Truck, Mail, FileText, 
  AlertCircle, Trash2, ShieldCheck, ShieldAlert, RotateCcw, Edit3, CheckCheck, PlayCircle,
  FileSpreadsheet, Download, History, MessageCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  listarAgendamentos, 
  atualizarStatusAgendamento, 
  excluirAgendamento,
  dispararEmailConfirmacao,
  formatarPlacasExibicao,
  formatarDataBR,
  abrirNotificacaoWhatsAppAdmin,
  PEDREIRAS_CEARA, 
  EMAIL_NOTIFICACAO_DESTINO,
  STATUS_AGENDAMENTO
} from '../services/agendamentoService';
import { ModalEditarAgendamento } from './ModalEditarAgendamento';
import { ModalHistoricoStatus } from './ModalHistoricoStatus';
import { ModalConfirmarStatus } from './ModalConfirmarStatus';

export function PainelGestao({ 
  onVisualizarComprovante,
  usuario = null,
  isAdmin = false,
  pedreiraOperador = null
}) {
  const hojeStr = new Date().toISOString().split('T')[0];

  const usuarioInfo = {
    nome: usuario?.user_metadata?.nome || (usuario?.email ? usuario.email.split('@')[0].toUpperCase() : (isAdmin ? 'ADMINISTRADOR GERAL' : 'OPERADOR PEDREIRA')),
    email: usuario?.email || '',
    role: isAdmin ? 'Administrador Geral' : `Operador (${pedreiraOperador || 'Pedreira'})`,
    isAdmin
  };

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
  const [filtroData, setFiltroData] = useState(() => hojeStr);
  const [notificandoEmailId, setNotificandoEmailId] = useState(null);
  const [excluindoId, setExcluindoId] = useState(null);
  const [mensagemAviso, setMensagemAviso] = useState('');
  const [testandoEmail, setTestandoEmail] = useState(false);
  const [statusEmailTeste, setStatusEmailTeste] = useState(null);

  // Estado para o modal de edição de agendamento e modal de histórico
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState(null);
  const [agendamentoParaHistorico, setAgendamentoParaHistorico] = useState(null);

  // Estado para a tela de atenção e confirmação de mudança de status
  const [mudancaStatusPendente, setMudancaStatusPendente] = useState(null); // { agendamento, novoStatus }
  const [processandoMudancaStatus, setProcessandoMudancaStatus] = useState(false);

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

  const handleExportarExcel = () => {
    if (agendamentosFiltrados.length === 0) {
      alert('Nenhum agendamento para exportar com os filtros atuais.');
      return;
    }

    const cabecalhos = [
      'Protocolo',
      'Data Agendamento',
      'Horário',
      'Pedreira',
      'Material',
      'Nº Bloco',
      'Carga Mista / Combinada',
      'Cliente Destinatário',
      'Transportadora',
      'Motorista',
      'CPF Motorista',
      'Telefone Motorista',
      'Tipo de Veículo',
      'Placa Cavalo',
      'Placa Carreta 1',
      'Placa Carreta 2',
      'Status Atual',
      'Último Editor',
      'Histórico de Alterações',
      'Observações / Ocorrências'
    ];

    const dados = agendamentosFiltrados.map(ag => {
      const isMisto = (ag.is_combinado || ag.observacoes?.includes('[Carga Combinada') || ag.observacoes?.includes('[Carga Mista')) 
        ? 'SIM (Carga Mista / Combinada)' 
        : 'NÃO (Simples)';

      const histTexto = Array.isArray(ag.historico_status) && ag.historico_status.length > 0
        ? ag.historico_status.map(h => {
            const dataFmt = h.data_hora ? new Date(h.data_hora).toLocaleString('pt-BR') : '';
            if (h.tipo === 'edicao_dados' || (Array.isArray(h.alteracoes) && h.alteracoes.length > 0)) {
              const mudancas = Array.isArray(h.alteracoes) 
                ? h.alteracoes.map(a => `${a.label || a.campo}: ${a.de} -> ${a.para}`).join(', ')
                : (h.descricao || 'Alteração de dados');
              return `[${dataFmt}] Alteração Cadastral: [${mudancas}] por ${h.usuario_nome} (${h.usuario_role})`;
            }
            return `[${dataFmt}] Status: "${h.status_anterior}" -> "${h.status_novo}" por ${h.usuario_nome} (${h.usuario_role})`;
          }).join(' | ')
        : 'Sem alterações registradas';

      const ultimoEditor = ag.ultimo_editor || (ag.historico_status && ag.historico_status.length > 0 ? ag.historico_status[0].usuario_nome : 'Sistema');

      return {
        'Protocolo': (ag.id || '').substring(0, 8).toUpperCase(),
        'Data Agendamento': formatarDataBR(ag.data_agendamento),
        'Horário': ag.horario_agendamento || '',
        'Pedreira': ag.pedreira || '',
        'Material': ag.material || '',
        'Nº Bloco': ag.numero_bloco || '',
        'Carga Mista / Combinada': isMisto,
        'Cliente Destinatário': ag.cliente || '',
        'Transportadora': ag.transportadora || '',
        'Motorista': ag.motorista_nome || '',
        'CPF Motorista': ag.motorista_cpf || '',
        'Telefone Motorista': ag.motorista_telefone || '',
        'Tipo de Veículo': ag.tipo_veiculo || '',
        'Placa Cavalo': ag.placa_cavalo || '',
        'Placa Carreta 1': ag.placa_carreta || '',
        'Placa Carreta 2': ag.placa_carreta_2 || '',
        'Status Atual': ag.status || '',
        'Último Editor': ultimoEditor,
        'Histórico de Alterações': histTexto,
        'Observações / Ocorrências': (ag.observacoes || '').replace(/[\r\n]+/g, ' ')
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dados, { header: cabecalhos });

    // Ajusta a largura das colunas dinamicamente
    worksheet['!cols'] = cabecalhos.map(header => {
      const maxLen = Math.max(
        header.length,
        ...dados.map(row => String(row[header] || '').length)
      );
      return { wch: Math.min(Math.max(maxLen + 2, 12), 45) };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Carregamentos');

    const dataHoraStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `relatorio_carregamentos_vermont_${dataHoraStr}.xlsx`);
  };

  const solicitarMudancaStatus = (agendamento, novoStatus) => {
    if (!agendamento || !novoStatus) return;
    const statusAtual = agendamento.status === 'Carregado' ? 'Finalizado' : agendamento.status;
    if (novoStatus === statusAtual) return;

    if (!isAdmin && novoStatus === 'Aguardando Liberação') {
      alert('Acesso restrito: Usuários da pedreira não possuem autorização para reverter o status para "Aguardando Liberação". Esta ação é exclusiva do Administrador Geral.');
      return;
    }

    // Abre a tela de atenção e confirmação com o usuário
    setMudancaStatusPendente({ agendamento, novoStatus });
  };

  const handleConfirmarMudancaStatus = async () => {
    if (!mudancaStatusPendente) return;
    const { agendamento, novoStatus } = mudancaStatusPendente;

    setProcessandoMudancaStatus(true);
    const res = await atualizarStatusAgendamento(agendamento.id, novoStatus, usuarioInfo);
    setProcessandoMudancaStatus(false);
    setMudancaStatusPendente(null);

    if (res.success) {
      setAgendamentos(prev => prev.map(ag => {
        if (ag.id === agendamento.id) {
          return { 
            ...ag, 
            status: novoStatus, 
            historico_status: res.data?.historico_status || ag.historico_status,
            ultimo_editor: usuarioInfo.nome || usuarioInfo.email || 'Sistema'
          };
        }
        return ag;
      }));
      setMensagemAviso(`Status do Bloco ${agendamento.numero_bloco} atualizado para "${novoStatus}" com sucesso.`);
      setTimeout(() => setMensagemAviso(''), 6000);
    } else {
      alert('Erro ao atualizar status: ' + res.error);
    }
  };

  const handleCancelarMudancaStatus = () => {
    setMudancaStatusPendente(null);
  };

  const handleSalvoEdicao = (agendamentoAtualizado) => {
    setAgendamentos(prev => prev.map(ag => ag.id === agendamentoAtualizado.id ? agendamentoAtualizado : ag));
    setMensagemAviso(`Informações do Bloco ${agendamentoAtualizado.numero_bloco} atualizadas com sucesso!`);
    setTimeout(() => setMensagemAviso(''), 6000);
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
      setMensagemAviso(`Notificação enviada para o e-mail da logística!`);
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
          mensagem: 'E-mail enviado com sucesso! Cheque a caixa de entrada da logística.'
        });
      } else if (data && data.message && data.message.includes('Activation')) {
        setStatusEmailTeste({
          tipo: 'ativacao',
          mensagem: `O serviço enviou um e-mail de ativação ('Action Required: Activate your Form') para ${EMAIL_NOTIFICACAO_DESTINO}. Abra a caixa postal e confirme para autorizar o envio automático.`
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
      (ag.material && ag.material.toLowerCase().includes(busca)) ||
      (ag.observacoes && ag.observacoes.toLowerCase().includes(busca))
    );
  });

  const agendamentosHoje = agendamentos.filter(ag => ag.data_agendamento === hojeStr);

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: '16px 0' }}>
      
      {/* Cabeçalho do Painel (Oculto na impressão) */}
      <div className="glass-panel no-print" style={{
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
            <h1 style={{ fontSize: '1.4rem', margin: 0, color: '#fff' }}>
              Painel Operacional de Carregamentos
            </h1>
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
              ? 'Gestão integrada de todas as unidades, edição de blocos, romaneios e fluxo de carregamento' 
              : `Controle de pátio e romaneio exclusivo da unidade ${pedreiraOperador}.`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={handleExportarExcel}
            className="btn btn-secondary"
            style={{ padding: '9px 16px', fontWeight: 600, gap: 8, background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
            title="Exportar dados da tabela para planilha Excel (CSV UTF-8)"
          >
            <FileSpreadsheet size={18} />
            Exportar Excel
          </button>
          <button
            onClick={() => window.print()}
            className="btn btn-secondary"
            style={{ padding: '9px 16px', fontWeight: 600, gap: 8 }}
            title="Imprimir romaneio e lista de carregamentos para a balança"
          >
            <Printer size={18} />
            Imprimir Relatório
          </button>
          <button
            onClick={carregarDados}
            className="btn btn-vermont"
            disabled={carregando}
            style={{ padding: '9px 18px', fontWeight: 600, gap: 8 }}
          >
            <RefreshCw size={18} className={carregando ? 'spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {mensagemAviso && (
        <div className="animate-fade no-print" style={{
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
              Cada agendamento e atualização é registrado com cópia imediata para a coordenação de logística.
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

      {/* Métricas Rápidas (Oculto na impressão) */}
      <div className="no-print" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: 12,
        marginBottom: 20
      }}>
        <div className="glass-panel" style={{ padding: '14px 16px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Registrado
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>
            {agendamentos.length}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>Carregamentos no Sistema</span>
        </div>

        <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #4ade80' }}>
          <span style={{ fontSize: '0.74rem', color: '#4ade80', textTransform: 'uppercase', fontWeight: 700 }}>
            Carregamentos Hoje
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4ade80', marginTop: 4 }}>
            {agendamentosHoje.length}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>Previstos para hoje</span>
        </div>

        <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: '0.74rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={13} /> Aguardando Liberação
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>
            {agendamentos.filter(a => a.status === 'Aguardando Liberação').length}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>Aguardando aval</span>
        </div>

        <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #22c55e' }}>
          <span style={{ fontSize: '0.74rem', color: '#86efac', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <CheckCircle2 size={13} /> Liberados p/ Carregar
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#86efac', marginTop: 4 }}>
            {agendamentos.filter(a => a.status === 'Liberado para Carregar' || a.status === 'Confirmado').length}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>Aprovados p/ pátio</span>
        </div>

        <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #38bdf8' }}>
          <span style={{ fontSize: '0.74rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <PlayCircle size={13} /> Carregando
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
            {agendamentos.filter(a => a.status === 'Carregando').length}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>Em operação na pedreira</span>
        </div>

        <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '0.74rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <CheckCheck size={13} /> Finalizados
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginTop: 4 }}>
            {agendamentos.filter(a => a.status === 'Finalizado' || a.status === 'Carregado').length}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>Pesagem & NFE ok</span>
        </div>
      </div>

      {/* Barra de Filtros (Oculto na impressão) */}
      <div className="glass-panel no-print" style={{ padding: 18, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={18} color="var(--slate-400)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por bloco, material, placa, motorista, cliente, obs..."
              className="form-input"
              style={{ paddingLeft: 38 }}
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
          </div>

          <div style={{ flex: '0 1 230px' }}>
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

          <div style={{ flex: '0 1 200px' }}>
            <select
              className="form-select"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="todos">Todos os Status</option>
              <option value="Aguardando Liberação">🟡 Aguardando Liberação</option>
              <option value="Liberado para Carregar">🟢 Liberados p/ Carregar</option>
              <option value="Carregando">🔵 Carregando</option>
              <option value="Finalizado">✅ Finalizados</option>
              <option value="Cancelado">❌ Cancelados</option>
            </select>
          </div>

          <div style={{ flex: '0 1 160px' }}>
            <input
              type="date"
              className="form-input"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
              style={{ colorScheme: 'dark' }}
              title="Filtrar por data específica (Padrão: Hoje)"
            />
          </div>

          {filtroData ? (
            <button
              onClick={() => setFiltroData('')}
              className="btn btn-secondary"
              style={{ padding: '9px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              title="Ver agendamentos de todas as datas (remover filtro de data)"
            >
              Ver Todas as Datas
            </button>
          ) : (
            <button
              onClick={() => setFiltroData(hojeStr)}
              className="btn btn-secondary"
              style={{ padding: '9px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              title="Filtrar agendamentos de hoje"
            >
              Ver Hoje
            </button>
          )}
        </div>
      </div>

      {/* ÁREA DE IMPRESSÃO DO RELATÓRIO / ROMANEIO (Visível na tela e perfeitamente formatada no papel/PDF) */}
      <div id="relatorio-imprimir" className="glass-panel" style={{ overflow: 'hidden' }}>
        
        {/* Cabeçalho Oficial do Relatório para a Balança */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '2px solid #00762c',
          background: 'rgba(0, 118, 44, 0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', letterSpacing: 0.5 }}>
                VERMONT MINERAÇÃO LTDA.
              </span>
              <span className="badge badge-vermont" style={{ fontSize: '0.72rem' }}>
                CONTROLE DE CARREGAMENTOS & ROMANEIO
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)', marginTop: 2 }}>
              Unidade: <strong>{filtroPedreira === 'todas' ? 'Todas as Pedreiras (Polo Ceará)' : filtroPedreira}</strong> | 
              Data de Emissão: <strong>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}</strong>
              {filtroData && <> | Filtrado para a data: <strong>{formatarDataBR(filtroData)}</strong></>}
            </div>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#4ade80', fontWeight: 700 }}>
            Total de Veículos Listados: {agendamentosFiltrados.length}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '12px 14px', color: 'var(--slate-400)', fontWeight: 600, width: '100px' }}>HORÁRIO</th>
                <th style={{ padding: '12px 14px', color: 'var(--slate-400)', fontWeight: 600 }}>PEDREIRA / MATERIAL</th>
                <th style={{ padding: '12px 14px', color: 'var(--slate-400)', fontWeight: 600 }}>BLOCO / CLIENTE</th>
                <th style={{ padding: '12px 14px', color: 'var(--slate-400)', fontWeight: 600 }}>MOTORISTA / CPF</th>
                <th style={{ padding: '12px 14px', color: 'var(--slate-400)', fontWeight: 600 }}>PLACAS</th>
                <th style={{ padding: '12px 14px', color: 'var(--slate-400)', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '12px 14px', color: 'var(--slate-400)', fontWeight: 600 }}>OBSERVAÇÕES / OCORRÊNCIAS</th>
                <th style={{ padding: '12px 14px', color: 'var(--slate-400)', fontWeight: 600 }} className="no-print">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--slate-400)' }}>
                    Carregando agendamentos...
                  </td>
                </tr>
              ) : agendamentosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--slate-400)' }}>
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
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{formatarDataBR(ag.data_agendamento)}</div>
                        <div style={{ fontSize: '0.8rem', color: isSabado ? '#fbbf24' : '#86efac', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Clock size={13} />
                          {ag.horario_agendamento}
                        </div>
                        {isSabado && (
                          <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '1px 6px', marginTop: 4 }}>
                            Sábado
                          </span>
                        )}
                      </td>

                      {/* Pedreira / Material */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <strong style={{ color: '#fff' }}>{ag.pedreira}</strong>
                          {(ag.is_combinado || ag.observacoes?.includes('[Carga Combinada') || ag.observacoes?.includes('[Carga Mista')) && (
                            <span 
                              title="Carregamento Misto / Carga Combinada (múltiplos blocos no mesmo veículo)"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                background: 'rgba(56, 189, 248, 0.18)',
                                border: '1px solid rgba(56, 189, 248, 0.5)',
                                color: '#38bdf8',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: 4,
                                cursor: 'help'
                              }}
                            >
                              ° Misto
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#86efac', fontWeight: 500 }}>
                          Material: {ag.material}
                        </div>
                      </td>

                      {/* Bloco / Cliente */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.94rem' }}>
                          Bloco: {ag.numero_bloco}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>Cliente: {ag.cliente}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--slate-500)' }}>Transp: {ag.transportadora}</div>
                      </td>

                      {/* Motorista / CPF */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{ag.motorista_nome}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', fontFamily: 'monospace' }}>CPF: {ag.motorista_cpf}</div>
                        {ag.motorista_telefone && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--info)' }}>{ag.motorista_telefone}</div>
                        )}
                      </td>

                      {/* Veículo / Placas Dinâmicas */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '0.76rem', color: '#86efac', fontWeight: 600 }}>
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
                      <td style={{ padding: '12px 14px', minWidth: 175 }}>
                        {ag.status === 'Aguardando Liberação' && (
                          <span className="badge" style={{
                            background: 'rgba(245, 158, 11, 0.18)',
                            color: '#fbbf24',
                            border: '1px solid rgba(245, 158, 11, 0.45)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 8px',
                            fontSize: '0.76rem',
                            fontWeight: 700
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
                            gap: 5,
                            padding: '4px 8px',
                            fontSize: '0.76rem',
                            fontWeight: 700
                          }}>
                            <CheckCircle2 size={12} /> Liberado p/ Carregar
                          </span>
                        )}
                        {ag.status === 'Carregando' && (
                          <span className="badge" style={{
                            background: 'rgba(56, 189, 248, 0.18)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.45)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 8px',
                            fontSize: '0.76rem',
                            fontWeight: 700
                          }}>
                            <PlayCircle size={12} /> Carregando
                          </span>
                        )}
                        {(ag.status === 'Finalizado' || ag.status === 'Carregado') && (
                          <span className="badge" style={{
                            background: 'rgba(16, 185, 129, 0.18)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.45)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 8px',
                            fontSize: '0.76rem',
                            fontWeight: 700
                          }}>
                            <CheckCheck size={12} /> Finalizado
                          </span>
                        )}
                        {ag.status === 'Cancelado' && (
                          <span className="badge badge-danger" style={{ padding: '4px 8px', fontSize: '0.76rem', fontWeight: 700 }}>
                            ❌ Cancelado
                          </span>
                        )}

                        {/* Seletor Moderno de Alteração de Status */}
                        <div className="no-print" style={{ marginTop: 8 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            background: 'rgba(15, 23, 42, 0.85)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: 8,
                            padding: '2px 6px'
                          }}>
                            <span style={{ fontSize: '0.68rem', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase' }}>
                              Mudar:
                            </span>
                            <select
                              value={ag.status === 'Carregado' ? 'Finalizado' : ag.status}
                              onChange={(e) => solicitarMudancaStatus(ag, e.target.value)}
                              style={{
                                flex: 1,
                                padding: '4px 6px',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                borderRadius: 5,
                                background: '#111915',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                color: '#f1f5f9',
                                cursor: 'pointer',
                                outline: 'none'
                              }}
                            >
                              {isAdmin && (
                                <option value="Aguardando Liberação" style={{ background: '#111915', color: '#fbbf24' }}>
                                  🟡 Aguardando Liberação
                                </option>
                              )}
                              <option value="Liberado para Carregar" style={{ background: '#111915', color: '#4ade80' }}>
                                🟢 Liberado p/ Carregar
                              </option>
                              <option value="Carregando" style={{ background: '#111915', color: '#38bdf8' }}>
                                🔵 Carregando
                              </option>
                              <option value="Finalizado" style={{ background: '#111915', color: '#34d399' }}>
                                ✅ Finalizado
                              </option>
                              <option value="Cancelado" style={{ background: '#111915', color: '#f87171' }}>
                                ❌ Cancelado
                              </option>
                            </select>
                          </div>
                        </div>

                        {/* Link / Botão para Histórico de Alterações de Status */}
                        <div className="no-print">
                          {Array.isArray(ag.historico_status) && ag.historico_status.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setAgendamentoParaHistorico(ag)}
                              style={{
                                marginTop: 5,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                background: 'rgba(56, 189, 248, 0.08)',
                                border: '1px dashed rgba(56, 189, 248, 0.35)',
                                color: '#38bdf8',
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: 4,
                                cursor: 'pointer',
                                width: '100%',
                                justifyContent: 'center',
                                transition: 'all 0.15s'
                              }}
                              title="Ver histórico completo de quem alterou o status e data/hora"
                            >
                              <History size={11} /> {ag.historico_status.length} {ag.historico_status.length === 1 ? 'alteração' : 'alterações'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAgendamentoParaHistorico(ag)}
                              style={{
                                marginTop: 5,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--slate-500)',
                                fontSize: '0.66rem',
                                padding: '2px 4px',
                                cursor: 'pointer',
                                width: '100%',
                                justifyContent: 'center'
                              }}
                              title="Ver registro de auditoria do status"
                            >
                              <History size={10} /> Histórico
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Observações Operacionais */}
                      <td style={{ padding: '12px 14px', maxWidth: 220 }}>
                        {ag.observacoes ? (
                          <div style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: '1.3' }}>
                            {ag.observacoes}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontStyle: 'italic' }}>
                            Sem observações registradas.
                          </span>
                        )}
                      </td>

                      {/* Ações Administrativas e Operacionais (Oculto na impressão) */}
                      <td style={{ padding: '12px 14px' }} className="no-print">
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          
                          {/* BOTÃO EDITAR INFORMAÇÕES DO BLOCO & OBSERVAÇÕES */}
                          <button
                            type="button"
                            onClick={() => setAgendamentoParaEditar(ag)}
                            className="btn btn-vermont"
                            style={{ padding: '6px 10px', fontSize: '0.78rem', gap: 4 }}
                            title="Editar bloco, material, motorista, placas ou adicionar observações"
                          >
                            <Edit3 size={14} />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => onVisualizarComprovante(ag)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                            title="Ver Comprovante Oficial de Agendamento"
                          >
                            <FileText size={14} />
                            Ver
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReenviarEmail(ag)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 8px', fontSize: '0.78rem' }}
                            disabled={notificandoEmailId === ag.id}
                            title="Reenviar e-mail de notificação para a logística"
                          >
                            <Mail size={14} color="var(--info)" />
                          </button>

                          <button
                            type="button"
                            onClick={() => abrirNotificacaoWhatsAppAdmin(ag, usuarioInfo)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 8px', fontSize: '0.78rem', color: '#4ade80', borderColor: 'rgba(74, 222, 128, 0.35)' }}
                            title="Disparar/Testar Notificação no WhatsApp do Admin"
                          >
                            <MessageCircle size={14} />
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

        {/* Rodapé Oficial da Balança para Impressão */}
        <div className="print-only" style={{
          marginTop: 24,
          padding: '16px 20px',
          borderTop: '1px solid #64748b',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 30
        }}>
          <div>
            <div style={{ borderBottom: '1px solid #334155', height: 36, marginBottom: 6 }} />
            <div style={{ fontSize: '11px', textAlign: 'center', color: '#1e293b', fontWeight: 600 }}>
              Assinatura do Conferente / Operador da Balança
            </div>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid #334155', height: 36, marginBottom: 6 }} />
            <div style={{ fontSize: '11px', textAlign: 'center', color: '#1e293b', fontWeight: 600 }}>
              Assinatura do Responsável pela Logística / Expedição
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edição de Agendamento */}
      {agendamentoParaEditar && (
        <ModalEditarAgendamento
          agendamento={agendamentoParaEditar}
          onFechar={() => setAgendamentoParaEditar(null)}
          onSalvo={handleSalvoEdicao}
          isAdmin={isAdmin}
          usuarioInfo={usuarioInfo}
        />
      )}

      {/* Modal de Histórico de Alterações de Status */}
      {agendamentoParaHistorico && (
        <ModalHistoricoStatus
          agendamento={agendamentoParaHistorico}
          onFechar={() => setAgendamentoParaHistorico(null)}
        />
      )}

      {/* Modal de Atenção e Confirmação de Alteração de Status */}
      {mudancaStatusPendente && (
        <ModalConfirmarStatus
          agendamento={mudancaStatusPendente.agendamento}
          novoStatus={mudancaStatusPendente.novoStatus}
          usuarioInfo={usuarioInfo}
          processando={processandoMudancaStatus}
          onConfirmar={handleConfirmarMudancaStatus}
          onCancelar={handleCancelarMudancaStatus}
        />
      )}
    </div>
  );
}
