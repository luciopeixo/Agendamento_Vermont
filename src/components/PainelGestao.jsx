import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, RefreshCw, Printer, CheckCircle, CheckCircle2, Clock, Truck, Mail, FileText, 
  AlertCircle, AlertTriangle, Trash2, ShieldCheck, ShieldAlert, RotateCcw, Edit3, CheckCheck, PlayCircle,
  FileSpreadsheet, Download, History, Bell, BellRing, Volume2, VolumeX, Eye, Check, X, BarChart3, TrendingUp
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  listarAgendamentos, 
  obterPendenciasAnteriores,
  atualizarStatusAgendamento, 
  excluirAgendamento,
  dispararEmailConfirmacao,
  formatarPlacasExibicao,
  formatarDataBR,
  normalizarHistoricoStatus,
  obterDataHoraAtualBrasil,
  isDataSabado,
  contarVeiculosUnicos,
  isPedreiraUruoca,
  PEDREIRAS_CEARA, 
  EMAIL_NOTIFICACAO_DESTINO,
  STATUS_AGENDAMENTO,
  resolverCnpjCliente,
  resolverCnpjTransportadora,
  limparNomeEmpresa
} from '../services/agendamentoService';
import { ModalEditarAgendamento } from './ModalEditarAgendamento';
import { ModalHistoricoStatus } from './ModalHistoricoStatus';
import { ModalConfirmarStatus } from './ModalConfirmarStatus';
import { GraficosBlocosAdmin } from './GraficosBlocosAdmin';

/**
 * Emite som harmônico suave usando a Web Audio API (sem arquivos externos)
 */
export function tocarAlertaSonoro() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // Tom 1 (agudo suave)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain1.gain.setValueAtTime(0.01, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Tom 2 (eco harmônico)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.3); // D6

    gain2.gain.setValueAtTime(0.01, ctx.currentTime + 0.12);
    gain2.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.55);
  } catch (e) {
    console.warn('Alerta sonoro:', e);
  }
}

export function PainelGestao({ 
  onVisualizarComprovante,
  usuario = null,
  isAdmin = false,
  pedreiraOperador = null
}) {
  const { dataHoje } = obterDataHoraAtualBrasil();
  const hojeStr = dataHoje || new Date().toISOString().split('T')[0];

  const usuarioInfo = {
    nome: usuario?.user_metadata?.nome || (usuario?.email ? usuario.email.split('@')[0].toUpperCase() : (isAdmin ? 'ADMINISTRADOR GERAL' : 'OPERADOR PEDREIRA')),
    email: usuario?.email || '',
    role: isAdmin ? 'Administrador Geral' : `Operador (${pedreiraOperador || 'Pedreira'})`,
    isAdmin
  };

  const [agendamentos, setAgendamentos] = useState([]);
  const [todosAgendamentos, setTodosAgendamentos] = useState([]);
  const [pendenciasAnteriores, setPendenciasAnteriores] = useState([]);
  const [exibindoPendenciasAnteriores, setExibindoPendenciasAnteriores] = useState(false);
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
  const [abaAtiva, setAbaAtiva] = useState('tabela'); // 'tabela' ou 'graficos'
  const [notificandoEmailId, setNotificandoEmailId] = useState(null);
  const [excluindoId, setExcluindoId] = useState(null);
  const [mensagemAviso, setMensagemAviso] = useState('');
  const [testandoEmail, setTestandoEmail] = useState(false);
  const [statusEmailTeste, setStatusEmailTeste] = useState(null);

  // Estados do Sistema de Sino, Alertas e Auto-Atualização a cada 1 minuto (60s)
  const [notificacoes, setNotificacoes] = useState([]);
  const [painelNotificacoesAberto, setPainelNotificacoesAberto] = useState(false);
  const [somAtivado, setSomAtivado] = useState(true);
  const [desktopPermitido, setDesktopPermitido] = useState(() => {
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
  });
  const [bannerAlerta, setBannerAlerta] = useState(null);
  const [segundosRestantes, setSegundosRestantes] = useState(60);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(new Date());

  const statusAnterioresMapRef = useRef(new Map());
  const isPrimeiraCargaRef = useRef(true);

  // Estado para o modal de edição de agendamento e modal de histórico
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState(null);
  const [agendamentoParaHistorico, setAgendamentoParaHistorico] = useState(null);

  // Estado para a tela de atenção e confirmação de mudança de status
  const [mudancaStatusPendente, setMudancaStatusPendente] = useState(null); // { agendamento, novoStatus }
  const [processandoMudancaStatus, setProcessandoMudancaStatus] = useState(false);

  // Solicita permissão para notificações na área de trabalho do navegador
  const solicitarPermissaoDesktop = async () => {
    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      try {
        const perm = await Notification.requestPermission();
        setDesktopPermitido(perm === 'granted');
      } catch (e) {}
    }
  };

  /**
   * Consulta os dados (com suporte a silent refresh sem congelar a tela)
   */
  const carregarDados = async (isManual = true) => {
    if (isManual) setCarregando(true);
    try {
      const [lista, pendentes, listaCompletaGeral] = await Promise.all([
        listarAgendamentos({
          pedreira: filtroPedreira,
          status: filtroStatus,
          data: filtroData || null
        }),
        obterPendenciasAnteriores({
          pedreira: filtroPedreira,
          dataReferencia: hojeStr
        }),
        // Busca base histórica completa sem restrição de data para alimentar a aba analítica / gráficos do Admin
        listarAgendamentos({})
      ]);

      setPendenciasAnteriores(pendentes);
      setTodosAgendamentos(listaCompletaGeral);

      const mapaAnterior = statusAnterioresMapRef.current;
      const novosCarregamentos = [];

      lista.forEach(ag => {
        const statusAntigo = mapaAnterior.get(ag.id);
        // Se mudou para 'Carregando' em relação à checagem anterior:
        if (!isPrimeiraCargaRef.current && statusAntigo && statusAntigo !== 'Carregando' && ag.status === 'Carregando') {
          novosCarregamentos.push(ag);
        }
        mapaAnterior.set(ag.id, ag.status);
      });

      if (isPrimeiraCargaRef.current) {
        isPrimeiraCargaRef.current = false;
      }

      // Dispara alerta se algum veículo entrou em Carregando
      if (novosCarregamentos.length > 0) {
        if (somAtivado) {
          tocarAlertaSonoro();
        }

        novosCarregamentos.forEach(ag => {
          const novaNotif = {
            id: `notif_${Date.now()}_${ag.id}`,
            tipo: 'carregando',
            titulo: '🚨 Início de Carregamento!',
            mensagem: `Bloco ${ag.numero_bloco} (${ag.material}) entrou em carregamento na pedreira ${ag.pedreira}. Motorista: ${ag.motorista_nome || 'Não informado'} (Placa: ${ag.placa_cavalo || '-'})`,
            agendamento: ag,
            dataHora: new Date(),
            lida: false
          };

          setNotificacoes(prev => [novaNotif, ...prev]);
          setBannerAlerta(novaNotif);
          setTimeout(() => setBannerAlerta(null), 10000);

          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try {
              new Notification('🚨 Vermont Mineração - Carregamento Iniciado', {
                body: `Bloco ${ag.numero_bloco} em ${ag.pedreira}. Motorista: ${ag.motorista_nome}`,
                icon: '/favicon.ico'
              });
            } catch (e) {}
          }
        });
      }

      setAgendamentos(lista);
      setUltimaAtualizacao(new Date());
      setSegundosRestantes(60);
    } catch (err) {
      console.error('Erro ao consultar agendamentos:', err);
    } finally {
      if (isManual) setCarregando(false);
    }
  };

  // Carrega ao mudar filtros
  useEffect(() => {
    carregarDados(true);
  }, [filtroPedreira, filtroStatus, filtroData]);

  // Intervalo de Auto-Atualização a cada 1 minuto (60 segundos) com contador em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setSegundosRestantes(prev => {
        if (prev <= 1) {
          carregarDados(false);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [filtroPedreira, filtroStatus, filtroData, somAtivado]);

  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida);

  const marcarTodasLidas = () => {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
  };

  const limparNotificacoes = () => {
    setNotificacoes([]);
  };

  const handleImprimirRelatorio = () => {
    document.body.classList.add('imprimindo-relatorio');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('imprimindo-relatorio');
    }, 1500);
  };

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
      'CNPJ Destinatário',
      'Transportadora',
      'CNPJ Transportadora',
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

      const historicoArr = normalizarHistoricoStatus(ag.historico_status);
      const histTexto = historicoArr.length > 0
        ? historicoArr.map(h => {
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

      const ultimoEditor = ag.ultimo_editor || (historicoArr.length > 0 ? historicoArr[0].usuario_nome : 'Sistema');

      return {
        'Protocolo': (ag.id || '').substring(0, 8).toUpperCase(),
        'Data Agendamento': formatarDataBR(ag.data_agendamento),
        'Horário': ag.horario_agendamento || '',
        'Pedreira': ag.pedreira || '',
        'Material': ag.material || '',
        'Nº Bloco': ag.numero_bloco || '',
        'Carga Mista / Combinada': isMisto,
        'Cliente Destinatário': limparNomeEmpresa(ag.cliente) || '',
        'CNPJ Destinatário': ag.cliente_cnpj || resolverCnpjCliente(ag) || '',
        'Transportadora': limparNomeEmpresa(ag.transportadora) || '',
        'CNPJ Transportadora': ag.transportadora_cnpj || resolverCnpjTransportadora(ag) || '',
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
    const res = await atualizarStatusAgendamento(agendamento, novoStatus, usuarioInfo);
    setProcessandoMudancaStatus(false);
    setMudancaStatusPendente(null);

    if (res.success) {
      const historicoAtualizado = normalizarHistoricoStatus(res.data?.historico_status || agendamento.historico_status);
      const agAtualizado = { 
        ...agendamento, 
        status: novoStatus, 
        historico_status: historicoAtualizado,
        ultimo_editor: usuarioInfo.nome || usuarioInfo.email || 'Sistema'
      };

      setAgendamentos(prev => prev.map(ag => ag.id === agendamento.id ? agAtualizado : ag));
      setTodosAgendamentos(prev => prev.map(ag => ag.id === agendamento.id ? agAtualizado : ag));

      // Mantém a lista de pendências anteriores sincronizada
      setPendenciasAnteriores(prev => {
        if (['Finalizado', 'Carregado', 'Cancelado'].includes(novoStatus)) {
          return prev.filter(ag => ag.id !== agendamento.id);
        }
        return prev.map(ag => ag.id === agendamento.id ? agAtualizado : ag);
      });

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
    const itemFormatado = {
      ...agendamentoAtualizado,
      historico_status: normalizarHistoricoStatus(agendamentoAtualizado.historico_status)
    };

    setAgendamentos(prev => prev.map(ag => ag.id === itemFormatado.id ? itemFormatado : ag));
    setTodosAgendamentos(prev => prev.map(ag => ag.id === itemFormatado.id ? itemFormatado : ag));

    setPendenciasAnteriores(prev => {
      const isAnterior = itemFormatado.data_agendamento && itemFormatado.data_agendamento < hojeStr;
      const isPendente = itemFormatado.status && !['Finalizado', 'Carregado', 'Cancelado'].includes(itemFormatado.status);
      if (!isAnterior || !isPendente) {
        return prev.filter(ag => ag.id !== itemFormatado.id);
      }
      const existe = prev.some(ag => ag.id === itemFormatado.id);
      if (existe) {
        return prev.map(ag => ag.id === itemFormatado.id ? itemFormatado : ag);
      }
      return [itemFormatado, ...prev];
    });

    setMensagemAviso(`Informações do Bloco ${itemFormatado.numero_bloco} atualizadas com sucesso!`);
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
      setTodosAgendamentos(prev => prev.filter(item => item.id !== ag.id));
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
    if (!EMAIL_NOTIFICACAO_DESTINO) {
      setStatusEmailTeste({
        tipo: 'aviso',
        mensagem: 'E-mail de notificação não configurado no arquivo .env (VITE_EMAIL_NOTIFICACAO_DESTINO).'
      });
      return;
    }

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

  const listaBase = exibindoPendenciasAnteriores ? pendenciasAnteriores : agendamentos;

  const agendamentosFiltrados = listaBase.filter(ag => {
    if (!termoBusca.trim()) return true;
    const busca = termoBusca.toLowerCase().trim();
    return (
      (ag.numero_bloco && ag.numero_bloco.toLowerCase().includes(busca)) ||
      (ag.motorista_nome && ag.motorista_nome.toLowerCase().includes(busca)) ||
      (ag.motorista_cpf && ag.motorista_cpf.toLowerCase().includes(busca)) ||
      (ag.motorista_telefone && ag.motorista_telefone.toLowerCase().includes(busca)) ||
      (ag.placa_cavalo && ag.placa_cavalo.toLowerCase().includes(busca)) ||
      (ag.placa_carreta && ag.placa_carreta.toLowerCase().includes(busca)) ||
      (ag.placa_carreta_2 && ag.placa_carreta_2.toLowerCase().includes(busca)) ||
      (ag.transportadora && ag.transportadora.toLowerCase().includes(busca)) ||
      (ag.transportadora_cnpj && ag.transportadora_cnpj.toLowerCase().includes(busca)) ||
      (ag.cliente && ag.cliente.toLowerCase().includes(busca)) ||
      (ag.cliente_cnpj && ag.cliente_cnpj.toLowerCase().includes(busca)) ||
      (ag.pedreira && ag.pedreira.toLowerCase().includes(busca)) ||
      (ag.material && ag.material.toLowerCase().includes(busca)) ||
      (ag.observacoes && ag.observacoes.toLowerCase().includes(busca)) ||
      (ag.justificativa_outros && ag.justificativa_outros.toLowerCase().includes(busca)) ||
      (ag.horario_agendamento && ag.horario_agendamento.toLowerCase().includes(busca))
    );
  });

  const agendamentosHoje = agendamentos.filter(ag => ag.data_agendamento === hojeStr);

  const dataFiltroOuHoje = filtroData || hojeStr;
  const isDataFiltroSabado = isDataSabado(dataFiltroOuHoje);

  // Contagem precisa de veículos únicos no sábado para a data filtrada / selecionada
  const estatisticasSabado = useMemo(() => {
    if (!isDataFiltroSabado) return null;
    const agsSabado = agendamentos.filter(a => {
      const matchData = a.data_agendamento === dataFiltroOuHoje;
      const matchPedreira = filtroPedreira === 'todas' || isPedreiraUruoca(a.pedreira);
      const matchStatus = String(a.status || '').toLowerCase() !== 'cancelado';
      return matchData && matchPedreira && matchStatus;
    });
    const veiculosUnicos = contarVeiculosUnicos(agsSabado);
    const limite = 12;
    const disponivel = Math.max(0, limite - veiculosUnicos);
    const lotado = veiculosUnicos >= limite;
    return {
      totalVeiculos: veiculosUnicos,
      totalBlocos: agsSabado.length,
      limite,
      disponivel,
      lotado,
      data: dataFiltroOuHoje
    };
  }, [isDataFiltroSabado, agendamentos, dataFiltroOuHoje, filtroPedreira]);

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: '16px 0' }}>

      {/* Banner de Aviso de Carregamentos Pendentes de Dias Anteriores */}
      {pendenciasAnteriores.length > 0 && (
        <div className="glass-panel no-print animate-fade" style={{
          padding: '14px 20px',
          marginBottom: 20,
          background: exibindoPendenciasAnteriores 
            ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.18) 100%)'
            : 'linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(180, 83, 9, 0.08) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.45)',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 4px 20px rgba(245, 158, 11, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: 'rgba(245, 158, 11, 0.25)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fef3c7', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>
                  {pendenciasAnteriores.length === 1
                    ? '1 veículo de data anterior ainda não foi finalizado'
                    : `${pendenciasAnteriores.length} veículos de datas anteriores ainda não foram finalizados`}
                </span>
                <span className="badge" style={{
                  background: 'rgba(245, 158, 11, 0.3)',
                  border: '1px solid #f59e0b',
                  color: '#fbbf24',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  Atenção Operacional
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#fde68a' }}>
                Existem agendamentos de dias anteriores a hoje ({formatarDataBR(hojeStr)}) pendentes de carregamento ou liberação.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setExibindoPendenciasAnteriores(!exibindoPendenciasAnteriores)}
              className="btn"
              style={{
                background: exibindoPendenciasAnteriores ? '#f59e0b' : 'rgba(245, 158, 11, 0.25)',
                color: exibindoPendenciasAnteriores ? '#111827' : '#fbbf24',
                border: '1px solid #f59e0b',
                fontWeight: 700,
                fontSize: '0.82rem',
                padding: '8px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Eye size={16} />
              {exibindoPendenciasAnteriores ? 'Voltar para Visão do Dia' : `Ver ${pendenciasAnteriores.length} Pendências Anteriores`}
            </button>
          </div>
        </div>
      )}
      
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

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Sino de Notificações / Alertas */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setPainelNotificacoesAberto(!painelNotificacoesAberto);
                solicitarPermissaoDesktop();
              }}
              className="btn btn-secondary"
              style={{
                padding: '9px 14px',
                fontWeight: 600,
                gap: 6,
                position: 'relative',
                background: notificacoesNaoLidas.length > 0 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                borderColor: notificacoesNaoLidas.length > 0 ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)',
                color: notificacoesNaoLidas.length > 0 ? '#38bdf8' : 'var(--slate-300)'
              }}
              title="Central de Notificações e Alertas em Tempo Real"
            >
              {notificacoesNaoLidas.length > 0 ? <BellRing size={18} /> : <Bell size={18} />}
              <span>Alertas</span>
              {notificacoesNaoLidas.length > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 2
                }}>
                  {notificacoesNaoLidas.length}
                </span>
              )}
            </button>

            {/* Dropdown Menu do Sino de Notificações */}
            {painelNotificacoesAberto && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                zIndex: 500,
                width: 360,
                maxWidth: '90vw',
                background: '#0e1613',
                border: '1px solid var(--vermont-green-border)',
                borderRadius: 12,
                boxShadow: '0 20px 50px rgba(0,0,0,0.85), var(--vermont-green-glow)',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 8 }}>
                  <strong style={{ fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Bell size={16} color="#38bdf8" /> Central de Alertas ({notificacoes.length})
                  </strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => setSomAtivado(!somAtivado)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: somAtivado ? '#4ade80' : 'var(--slate-500)',
                        cursor: 'pointer',
                        padding: 4
                      }}
                      title={somAtivado ? 'Som de alerta ativado (Clique para silenciar)' : 'Som de alerta silenciado (Clique para ativar)'}
                    >
                      {somAtivado ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>
                    {notificacoes.length > 0 && (
                      <button
                        onClick={marcarTodasLidas}
                        style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.74rem', cursor: 'pointer' }}
                      >
                        Marcar lidas
                      </button>
                    )}
                  </div>
                </div>

                {/* Lista de Notificações */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                  {notificacoes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--slate-400)', fontSize: '0.8rem' }}>
                      Nenhum alerta recente. O sistema avisará automaticamente aqui sempre que um novo veículo entrar em carregamento.
                    </div>
                  ) : (
                    notificacoes.map(n => (
                      <div key={n.id} style={{
                        background: n.lida ? 'rgba(255, 255, 255, 0.02)' : 'rgba(56, 189, 248, 0.08)',
                        border: n.lida ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontSize: '0.78rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <strong style={{ color: '#38bdf8' }}>{n.titulo}</strong>
                          <span style={{ color: 'var(--slate-400)', fontSize: '0.7rem' }}>
                            {n.dataHora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 6px 0', color: '#e2e8f0', lineHeight: '1.3' }}>{n.mensagem}</p>
                        {n.agendamento && (
                          <button
                            onClick={() => {
                              onVisualizarComprovante(n.agendamento);
                              setPainelNotificacoesAberto(false);
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#86efac', fontSize: '0.72rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                          >
                            Ver Comprovante
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {notificacoes.length > 0 && (
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={limparNotificacoes}
                      style={{ background: 'transparent', border: 'none', color: 'var(--slate-400)', fontSize: '0.74rem', cursor: 'pointer' }}
                    >
                      Limpar histórico
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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
            onClick={handleImprimirRelatorio}
            className="btn btn-secondary"
            style={{ padding: '9px 16px', fontWeight: 600, gap: 8 }}
            title="Imprimir romaneio e lista de carregamentos para a balança"
          >
            <Printer size={18} />
            Imprimir Relatório
          </button>

          {/* Indicador de Auto-Atualização a cada 1 minuto */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: '0.76rem',
            color: 'var(--slate-300)'
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 8px #22c55e'
            }} />
            <span>Atualiza em <strong>{segundosRestantes}s</strong></span>
          </div>

          <button
            onClick={() => carregarDados(true)}
            className="btn btn-vermont"
            disabled={carregando}
            style={{ padding: '9px 18px', fontWeight: 600, gap: 8 }}
            title="Atualizar lista de carregamentos agora"
          >
            <RefreshCw size={18} className={carregando ? 'spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Banner Flutuante de Alerta Imediato para Novos Carregamentos */}
      {bannerAlerta && (
        <div className="animate-fade no-print" style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 1000,
          maxWidth: 420,
          background: '#0d1914',
          border: '2px solid #38bdf8',
          boxShadow: '0 10px 40px rgba(0,0,0,0.85), 0 0 25px rgba(56, 189, 248, 0.35)',
          borderRadius: 12,
          padding: '16px 18px',
          color: '#fff',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start'
        }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'rgba(56, 189, 248, 0.2)',
            border: '1px solid #38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
            flexShrink: 0
          }}>
            <BellRing size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
              <strong style={{ fontSize: '0.95rem', color: '#38bdf8' }}>{bannerAlerta.titulo}</strong>
              <button
                onClick={() => setBannerAlerta(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--slate-400)', cursor: 'pointer', padding: 2 }}
              >
                <X size={16} />
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#e2e8f0', lineHeight: '1.4' }}>
              {bannerAlerta.mensagem}
            </p>
            {bannerAlerta.agendamento && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => {
                    onVisualizarComprovante(bannerAlerta.agendamento);
                    setBannerAlerta(null);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                >
                  Ver Agendamento
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
            <span style={{ color: '#4ade80', fontWeight: 600 }}>
              {EMAIL_NOTIFICACAO_DESTINO || 'E-mail Institucional da Logística (Configurado via .env)'}
            </span>
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

      {/* Aba de Navegação Exclusiva para Admin Geral */}
      {isAdmin && (
        <div className="no-print" style={{
          display: 'flex',
          gap: 10,
          marginBottom: 20,
          background: 'rgba(0, 0, 0, 0.45)',
          padding: '6px',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          width: 'fit-content'
        }}>
          <button
            type="button"
            onClick={() => setAbaAtiva('tabela')}
            className="btn"
            style={{
              padding: '9px 18px',
              fontSize: '0.86rem',
              fontWeight: 700,
              gap: 8,
              borderRadius: 8,
              background: abaAtiva === 'tabela' ? 'var(--vermont-green-subtle)' : 'transparent',
              border: abaAtiva === 'tabela' ? '1px solid var(--vermont-green-border)' : '1px solid transparent',
              color: abaAtiva === 'tabela' ? '#4ade80' : 'var(--slate-400)',
              boxShadow: abaAtiva === 'tabela' ? '0 0 15px rgba(0, 118, 44, 0.35)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <FileText size={16} />
            Controle de Carregamento
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('graficos')}
            className="btn"
            style={{
              padding: '9px 18px',
              fontSize: '0.86rem',
              fontWeight: 700,
              gap: 8,
              borderRadius: 8,
              background: abaAtiva === 'graficos' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              border: abaAtiva === 'graficos' ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid transparent',
              color: abaAtiva === 'graficos' ? '#38bdf8' : 'var(--slate-400)',
              boxShadow: abaAtiva === 'graficos' ? '0 0 15px rgba(56, 189, 248, 0.3)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <BarChart3 size={16} />
            Gráficos & Análise de Blocos (Admin)
          </button>
        </div>
      )}

      {/* VISÃO 1: GRÁFICOS & ANÁLISE DE BLOCOS (EXCLUSIVO ADMIN - USA O DATASET HISTÓRICO COMPLETO) */}
      {isAdmin && abaAtiva === 'graficos' ? (
        <GraficosBlocosAdmin agendamentos={todosAgendamentos.length > 0 ? todosAgendamentos : agendamentos} />
      ) : (
        /* VISÃO 2: TABELA OPERACIONAL & ROMANEIO */
        <>
          {/* Métricas Rápidas (Oculto na impressão) */}
          <div className="no-print stats-grid-container">
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

        {/* Card Especial de Cota do Sábado (Uruoca - Limite 12 Veículos) */}
        {estatisticasSabado && (
          <div className="glass-panel animate-fade" style={{ 
            padding: '14px 16px', 
            borderLeft: `4px solid ${estatisticasSabado.lotado ? '#ef4444' : estatisticasSabado.disponivel <= 3 ? '#f59e0b' : '#38bdf8'}`,
            background: 'rgba(56, 189, 248, 0.08)'
          }}>
            <span style={{ fontSize: '0.74rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Truck size={13} /> Cota do Sábado (Uruoca)
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: estatisticasSabado.lotado ? '#f87171' : '#38bdf8', marginTop: 4 }}>
              {estatisticasSabado.totalVeiculos} / 12
            </div>
            <span style={{ fontSize: '0.72rem', color: estatisticasSabado.lotado ? '#fca5a5' : 'var(--slate-300)', fontWeight: 600 }}>
              {estatisticasSabado.lotado 
                ? '🚨 Cota de 12 carros atingida' 
                : `${estatisticasSabado.disponivel} vaga${estatisticasSabado.disponivel === 1 ? '' : 's'} restante${estatisticasSabado.disponivel === 1 ? '' : 's'}`}
            </span>
          </div>
        )}

        {/* Card de Alerta de Pendências de Dias Anteriores */}
        <div 
          className="glass-panel" 
          onClick={() => setExibindoPendenciasAnteriores(prev => !prev)}
          style={{ 
            padding: '14px 16px', 
            borderLeft: '4px solid #f59e0b',
            cursor: 'pointer',
            background: exibindoPendenciasAnteriores ? 'rgba(245, 158, 11, 0.18)' : undefined,
            boxShadow: exibindoPendenciasAnteriores ? '0 0 15px rgba(245, 158, 11, 0.3)' : undefined,
            transition: 'all 0.2s'
          }}
          title="Clique para alternar entre ver a lista normal ou as pendências de datas anteriores"
        >
          <span style={{ fontSize: '0.74rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <AlertTriangle size={13} /> Pendentes Anteriores
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: pendenciasAnteriores.length > 0 ? '#fbbf24' : '#94a3b8', marginTop: 4 }}>
            {pendenciasAnteriores.length}
          </div>
          <span style={{ fontSize: '0.72rem', color: exibindoPendenciasAnteriores ? '#fbbf24' : 'var(--slate-400)', fontWeight: exibindoPendenciasAnteriores ? 700 : 400 }}>
            {exibindoPendenciasAnteriores ? 'Visualizando agora 👁️' : 'Não finalizados de ontem/antes'}
          </span>
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

        <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #a855f7' }}>
          <span style={{ fontSize: '0.74rem', color: '#c084fc', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <CheckCircle2 size={13} /> Liberados p/ Carregar
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#c084fc', marginTop: 4 }}>
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
              disabled={exibindoPendenciasAnteriores}
            >
              <option value="todos">Todos os Status</option>
              <option value="Aguardando Liberação">🟡 Aguardando Liberação</option>
              <option value="Liberado para Carregar">🟣 Liberados p/ Carregar</option>
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
              onChange={(e) => {
                setFiltroData(e.target.value);
                setExibindoPendenciasAnteriores(false);
              }}
              disabled={exibindoPendenciasAnteriores}
              style={{ colorScheme: 'dark' }}
              title="Filtrar por data específica (Padrão: Hoje)"
            />
          </div>

          {filtroData ? (
            <button
              onClick={() => {
                setFiltroData('');
                setExibindoPendenciasAnteriores(false);
              }}
              className="btn btn-secondary"
              style={{ padding: '9px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              title="Ver agendamentos de todas as datas (remover filtro de data)"
            >
              Ver Todas as Datas
            </button>
          ) : (
            <button
              onClick={() => {
                setFiltroData(hojeStr);
                setExibindoPendenciasAnteriores(false);
              }}
              className="btn btn-secondary"
              style={{ padding: '9px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              title="Filtrar agendamentos de hoje"
            >
              Ver Hoje
            </button>
          )}

          {pendenciasAnteriores.length > 0 && (
            <button
              type="button"
              onClick={() => setExibindoPendenciasAnteriores(prev => !prev)}
              className="btn"
              style={{
                padding: '9px 14px',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                background: exibindoPendenciasAnteriores ? '#f59e0b' : 'rgba(245, 158, 11, 0.18)',
                color: exibindoPendenciasAnteriores ? '#111827' : '#fbbf24',
                border: '1px solid #f59e0b',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
              title="Ver ou ocultar agendamentos de dias anteriores não finalizados"
            >
              <AlertTriangle size={14} />
              {exibindoPendenciasAnteriores ? 'Voltar para o Dia' : `Pendências Anteriores (${pendenciasAnteriores.length})`}
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

        {/* Aviso de contextualização quando filtrando pendências anteriores */}
        {exibindoPendenciasAnteriores && (
          <div className="no-print" style={{
            padding: '10px 20px',
            background: 'rgba(245, 158, 11, 0.12)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10
          }}>
            <div style={{ fontSize: '0.84rem', color: '#fef3c7', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={16} color="#fbbf24" />
              <span>
                Visualizando <strong>{agendamentosFiltrados.length}</strong> carregamento(s) de datas anteriores a hoje que ainda não foram finalizados.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExibindoPendenciasAnteriores(false)}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.76rem', gap: 4 }}
            >
              <RotateCcw size={12} /> Voltar para Carregamentos de Hoje
            </button>
          </div>
        )}

        <div className="table-responsive-container">
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
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <p style={{ margin: 0, fontSize: '0.95rem' }}>
                        {exibindoPendenciasAnteriores 
                          ? 'Nenhum carregamento pendente de datas anteriores encontrado.' 
                          : termoBusca 
                            ? `Nenhum agendamento encontrado para a busca "${termoBusca}".`
                            : filtroData 
                              ? `Nenhum agendamento encontrado para a data ${formatarDataBR(filtroData)}.` 
                              : 'Nenhum agendamento encontrado para os filtros selecionados.'}
                      </p>
                      {filtroData && !exibindoPendenciasAnteriores && (
                        <button
                          type="button"
                          onClick={() => {
                            setFiltroData('');
                            setFiltroStatus('todos');
                            setFiltroPedreira(isAdmin ? 'todas' : (pedreiraOperador || 'todas'));
                          }}
                          className="btn btn-vermont"
                          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                        >
                          Ver Agendamentos de Todas as Datas
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                agendamentosFiltrados.map((ag) => {
                  const isSabado = ag.tipo_dia === 'sabado' || isDataSabado(ag.data_agendamento) || String(ag.horario_agendamento || '').includes('Sábado');
                  const isOutros = ag.horario_agendamento === 'outros' || String(ag.horario_agendamento).toLowerCase().startsWith('outro');
                  const listaPlacasTabela = formatarPlacasExibicao(ag);
                  const estaExcluindo = excluindoId === ag.id;
                  const histArr = normalizarHistoricoStatus(ag.historico_status);
                  const isDataAnteriorPendente = ag.data_agendamento && ag.data_agendamento < hojeStr && !['Finalizado', 'Carregado', 'Cancelado'].includes(ag.status);

                  return (
                    <tr 
                      key={ag.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background-color 0.15s',
                        backgroundColor: isDataAnteriorPendente ? 'rgba(245, 158, 11, 0.03)' : undefined
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDataAnteriorPendente ? 'rgba(245, 158, 11, 0.03)' : 'transparent'}
                    >
                      {/* Data / Horário */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{formatarDataBR(ag.data_agendamento)}</div>
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: isSabado ? '#fbbf24' : isOutros ? '#f59e0b' : '#86efac', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 4, 
                          marginTop: 2 
                        }}>
                          <Clock size={13} />
                          {isOutros ? 'Outros (Especial)' : ag.horario_agendamento}
                        </div>
                        {isOutros && ag.justificativa_outros && (
                          <div style={{ fontSize: '0.72rem', color: '#fde68a', marginTop: 3, lineHeight: '1.2' }} title={ag.justificativa_outros}>
                            📌 {ag.justificativa_outros}
                          </div>
                        )}
                        {isDataAnteriorPendente && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            background: 'rgba(245, 158, 11, 0.2)',
                            border: '1px solid rgba(245, 158, 11, 0.5)',
                            color: '#fbbf24',
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 4,
                            marginTop: 4,
                            whiteSpace: 'nowrap'
                          }}>
                            <AlertTriangle size={10} /> Pendente Anterior
                          </span>
                        )}
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
                        <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>
                          Cliente: <strong style={{ color: 'var(--slate-200)' }}>{limparNomeEmpresa(ag.cliente)}</strong> {(ag.cliente_cnpj || resolverCnpjCliente(ag)) && <span style={{ fontSize: '0.72rem', color: '#60a5fa', fontFamily: 'monospace' }}>({ag.cliente_cnpj || resolverCnpjCliente(ag)})</span>}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--slate-500)' }}>
                          Transp: {limparNomeEmpresa(ag.transportadora)} {(ag.transportadora_cnpj || resolverCnpjTransportadora(ag)) && <span style={{ fontSize: '0.70rem', color: '#60a5fa', fontFamily: 'monospace' }}>({ag.transportadora_cnpj || resolverCnpjTransportadora(ag)})</span>}
                        </div>
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
                            background: 'rgba(168, 85, 247, 0.18)',
                            color: '#c084fc',
                            border: '1px solid rgba(192, 132, 252, 0.45)',
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
                              <option value="Liberado para Carregar" style={{ background: '#111915', color: '#c084fc' }}>
                                🟣 Liberado p/ Carregar
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
                          {histArr.length > 0 ? (
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
                              <History size={11} /> {histArr.length} {histArr.length === 1 ? 'alteração' : 'alterações'}
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
                      <td style={{ padding: '12px 14px', maxWidth: 240 }}>
                        {ag.justificativa_outros && (!ag.observacoes || !ag.observacoes.includes(ag.justificativa_outros)) && (
                          <div style={{ fontSize: '0.76rem', color: '#fde68a', marginBottom: 4, fontWeight: 600 }}>
                            📌 Horário Solicitado: {ag.justificativa_outros}
                          </div>
                        )}
                        {ag.observacoes ? (
                          <div style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: '1.3' }}>
                            {ag.observacoes}
                          </div>
                        ) : !ag.justificativa_outros ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontStyle: 'italic' }}>
                            Sem observações registradas.
                          </span>
                        ) : null}
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
      </>
      )}

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
