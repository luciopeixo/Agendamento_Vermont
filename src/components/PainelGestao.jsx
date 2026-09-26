import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, RefreshCw, Printer, CheckCircle, CheckCircle2, Clock, Truck, Mail, FileText, 
  AlertCircle, AlertTriangle, Trash2, ShieldCheck, ShieldAlert, RotateCcw, Edit3, CheckCheck, PlayCircle,
  FileSpreadsheet, Download, History, Bell, BellRing, Volume2, VolumeX, Eye, Check, X, BarChart3, TrendingUp,
  Filter, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileCheck, Layers
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
  formatarDataHoraBR,
  formatarCNPJ,
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
  limparNomeEmpresa,
  limparTagsInternasObservacoes,
  alternarNotaFiscalEmitida,
  verificarConformidadeDocumental,
  obterBaseMotoristas,
  carregarBaseMotoristasUnificada,
  invalidarCacheMotoristas,
  isSupabaseConfigurado
} from '../services/agendamentoService';
import { 
  listarEnvelopamentos, 
  verificarStatusEnvelopamentoAgendamento, 
  inscreverEnvelopamentosRealtime,
  invalidarCacheEnvelopamentos
} from '../services/envelopamentoService';
import { supabase } from '../lib/supabase';
import { ModalEditarAgendamento } from './ModalEditarAgendamento';
import { ModalHistoricoStatus } from './ModalHistoricoStatus';
import { ModalConfirmarStatus } from './ModalConfirmarStatus';
import { ModalLimpezaTestes } from './ModalLimpezaTestes';
import { GraficosBlocosAdmin } from './GraficosBlocosAdmin';
import { AutorizacaoCarregamentoModal } from './AutorizacaoCarregamentoModal';
import { ModalGestaoMotoristasFrota } from './ModalGestaoMotoristasFrota';
import { ModalConformidadeMotorista } from './ModalConformidadeMotorista';

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

export const STATUS_OPCOES_FILTRO = [
  { id: 'Aguardando Liberação', label: 'Aguardando Liberação', cor: '#f59e0b', dot: '🟡', bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b' },
  { id: 'Liberado para Carregar', label: 'Liberados p/ Carregar', cor: '#a855f7', dot: '🟣', bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7' },
  { id: 'Carregando', label: 'Carregando', cor: '#38bdf8', dot: '🔵', bg: 'rgba(56, 189, 248, 0.15)', border: '#38bdf8' },
  { id: 'Finalizado', label: 'Finalizados', cor: '#22c55e', dot: '🟢', bg: 'rgba(34, 197, 94, 0.15)', border: '#22c55e' },
  { id: 'Cancelado', label: 'Cancelados', cor: '#ef4444', dot: '🔴', bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444' }
];

export function PainelGestao({ 
  onVisualizarComprovante,
  usuario = null,
  isAdmin = false,
  pedreiraOperador = null,
  abaExterna = null,
  onTrocarAba = null
}) {
  const { dataHoje } = obterDataHoraAtualBrasil();
  const hojeStr = dataHoje || new Date().toISOString().split('T')[0];

  // Validação de perfil: Administrador Geral vs Operador de Pedreira
  const isAcessoAdminGeral = Boolean(isAdmin);

  const usuarioInfo = {
    nome: usuario?.user_metadata?.nome || (usuario?.email ? usuario.email.split('@')[0].toUpperCase() : (isAcessoAdminGeral ? 'ADMINISTRADOR GERAL' : 'OPERADOR PEDREIRA')),
    email: usuario?.email || '',
    role: isAcessoAdminGeral ? 'Administrador Geral' : `Operador (${pedreiraOperador || 'Pedreira'})`,
    isAdmin: isAcessoAdminGeral
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

  const [filtroStatus, setFiltroStatus] = useState(['todos']);
  const [dropdownStatusAberto, setDropdownStatusAberto] = useState(false);
  const dropdownStatusRef = useRef(null);

  // Fecha o dropdown de status ao clicar fora
  useEffect(() => {
    const handleClickFora = (event) => {
      if (dropdownStatusRef.current && !dropdownStatusRef.current.contains(event.target)) {
        setDropdownStatusAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  const isTodosStatus = useMemo(() => {
    if (!filtroStatus || filtroStatus === 'todos') return true;
    if (Array.isArray(filtroStatus)) {
      return filtroStatus.length === 0 || filtroStatus.includes('todos') || filtroStatus.length === STATUS_OPCOES_FILTRO.length;
    }
    return false;
  }, [filtroStatus]);

  const isStatusSelecionado = (statusId) => {
    if (isTodosStatus) return true;
    if (Array.isArray(filtroStatus)) {
      return filtroStatus.includes(statusId);
    }
    return filtroStatus === statusId;
  };

  const handleToggleStatus = (statusId) => {
    if (statusId === 'todos') {
      setFiltroStatus(['todos']);
      return;
    }

    const selecionadosAtuais = isTodosStatus 
      ? [] 
      : (Array.isArray(filtroStatus) ? [...filtroStatus.filter(s => s !== 'todos')] : [filtroStatus]);

    let novos;
    if (isTodosStatus) {
      novos = [statusId];
    } else if (selecionadosAtuais.includes(statusId)) {
      novos = selecionadosAtuais.filter(s => s !== statusId);
    } else {
      novos = [...selecionadosAtuais, statusId];
    }

    if (novos.length === 0 || novos.length === STATUS_OPCOES_FILTRO.length) {
      setFiltroStatus(['todos']);
    } else {
      setFiltroStatus(novos);
    }
  };

  const handleSelecionarTodosStatus = () => {
    setFiltroStatus(['todos']);
  };

  const [filtroData, setFiltroData] = useState(() => hojeStr);
  const [abaAtiva, setAbaAtiva] = useState('tabela');

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
  const INTERVALO_ATUALIZACAO_SEGUNDOS = 180; // 3 minutos para economia de banda da cota Supabase
  const [segundosRestantes, setSegundosRestantes] = useState(INTERVALO_ATUALIZACAO_SEGUNDOS);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(new Date());

  const statusAnterioresMapRef = useRef(new Map());
  const isPrimeiraCargaRef = useRef(true);

  // Estado para o modal de edição de agendamento e modal de histórico
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState(null);
  const [agendamentoParaHistorico, setAgendamentoParaHistorico] = useState(null);
  const [agendamentoParaAutorizacao, setAgendamentoParaAutorizacao] = useState(null);

  // Estado para a tela de atenção e confirmação de mudança de status
  const [mudancaStatusPendente, setMudancaStatusPendente] = useState(null); // { agendamento, novoStatus }
  const [processandoMudancaStatus, setProcessandoMudancaStatus] = useState(false);

  // Estado para o modal de limpeza de registros de teste em lote
  const [modalLimpezaAberto, setModalLimpezaAberto] = useState(false);

  // Estados para Gestão de Conformidade de Motoristas & Frota (Exclusivo Pedreiras & Admin)
  const [modalGestaoFrotaAberto, setModalGestaoFrotaAberto] = useState(false);
  const [motoristaParaConformidade, setMotoristaParaConformidade] = useState(null);
  const [versaoBaseMotoristas, setVersaoBaseMotoristas] = useState(0);

  // Estado de processamento da alteração de Nota Fiscal (Exclusivo Admin)
  const [salvandoNFId, setSalvandoNFId] = useState(null);

  const handleAbrirConformidadeDireta = (ag) => {
    const cpfLimpo = String(ag.motorista_cpf || '').replace(/\D/g, '');
    const base = obterBaseMotoristas();
    let motExistente = null;
    if (cpfLimpo) {
      motExistente = base.find(m => String(m.cpf).replace(/\D/g, '') === cpfLimpo);
    }
    const limpaCav = String(ag.placa_cavalo || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const veicCav = limpaCav ? base.find(m => String(m.placa_cavalo || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === limpaCav && m.crlv_validade_cavalo) : null;
    const limpaCarr = String(ag.placa_carreta || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const veicCarr = limpaCarr ? base.find(m => (
      String(m.placa_carreta || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === limpaCarr ||
      String(m.placa_carreta_2 || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === limpaCarr
    ) && (m.crlv_validade_carreta || m.validade_laudo_rocha)) : null;
    const limpaCarr2 = String(ag.placa_carreta_2 || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const veicCarr2 = limpaCarr2 ? base.find(m => (
      String(m.placa_carreta_2 || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === limpaCarr2 ||
      String(m.placa_carreta || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === limpaCarr2
    ) && (m.crlv_validade_carreta_2 || m.crlv_validade_carreta)) : null;

    setMotoristaParaConformidade({
      cpf: ag.motorista_cpf || motExistente?.cpf || '',
      nome: ag.motorista_nome || motExistente?.nome || '',
      telefone: ag.motorista_telefone || motExistente?.telefone || '',
      transportadora: ag.transportadora || motExistente?.transportadora || '',
      transportadora_cnpj: ag.transportadora_cnpj || motExistente?.transportadora_cnpj || '',
      tipo_veiculo: ag.tipo_veiculo || motExistente?.tipo_veiculo || 'Carreta / Bitrem',
      placa_cavalo: ag.placa_cavalo || motExistente?.placa_cavalo || '',
      placa_carreta: ag.placa_carreta || motExistente?.placa_carreta || '',
      placa_carreta_2: ag.placa_carreta_2 || motExistente?.placa_carreta_2 || '',
      cnh_categoria: motExistente?.cnh_categoria || 'E',
      cnh_validade: motExistente?.cnh_validade || '',
      crlv_validade_cavalo: motExistente?.crlv_validade_cavalo || veicCav?.crlv_validade_cavalo || '',
      crlv_validade_carreta: motExistente?.crlv_validade_carreta || veicCarr?.crlv_validade_carreta || '',
      validade_laudo_rocha: motExistente?.validade_laudo_rocha || veicCarr?.validade_laudo_rocha || '',
      crlv_validade_carreta_2: motExistente?.crlv_validade_carreta_2 || veicCarr2?.crlv_validade_carreta_2 || '',
      validade_laudo_rocha_2: motExistente?.validade_laudo_rocha_2 || veicCarr2?.validade_laudo_rocha_2 || '',
      status_documental: motExistente?.status_documental || 'REGULAR',
      observacoes: motExistente?.observacoes || ''
    });
  };

  // Estados de Paginação da Tabela Operacional (padrão 20 por página)
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(20);

  // Filtro exclusivo para visualizar apenas agendamentos finalizados sem NF
  const [exibindoApenasSemNF, setExibindoApenasSemNF] = useState(false);

  // Base de envelopamentos sincronizada em tempo real para status visual dos blocos
  const [envelopamentos, setEnvelopamentos] = useState([]);

  // Agendamentos Finalizados sem confirmação de emissão de Nota Fiscal (para alerta ao Admin)
  const finalizadosSemNF = useMemo(() => {
    const base = todosAgendamentos.length > 0 ? todosAgendamentos : agendamentos;
    return base.filter(a => {
      const st = (a.status || '').trim();
      const isFinalizado = st === 'Finalizado' || st === 'Carregado';
      return isFinalizado && !a.nota_fiscal_emitida;
    });
  }, [todosAgendamentos, agendamentos]);

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
      const promises = [
        listarAgendamentos({
          pedreira: filtroPedreira,
          status: filtroStatus,
          data: filtroData || null
        }),
        obterPendenciasAnteriores({
          pedreira: filtroPedreira,
          dataReferencia: hojeStr
        })
      ];

      // Busca base histórica completa apenas em carga manual, ao acessar aba de gráficos ou na primeira carga
      const precisaHistorico = isManual || abaAtiva === 'graficos' || todosAgendamentos.length === 0;
      if (precisaHistorico) {
        promises.push(listarAgendamentos({}));
      } else {
        promises.push(Promise.resolve(todosAgendamentos));
      }

      // Base de envelopamentos: o Supabase Realtime já sincroniza em tempo real, portanto recarregamos na íntegra apenas na primeira vez ou refresh manual
      const precisaEnvelopamentos = isManual || envelopamentos.length === 0;
      if (precisaEnvelopamentos) {
        promises.push(listarEnvelopamentos());
      } else {
        promises.push(Promise.resolve(envelopamentos));
      }

      const [lista, pendentes, listaCompletaGeral, envsData] = await Promise.all(promises);

      setPendenciasAnteriores(pendentes);
      setTodosAgendamentos(listaCompletaGeral);
      if (Array.isArray(envsData) && envsData.length > 0) {
        setEnvelopamentos(envsData);
      }

      // Sincroniza a base de motoristas apenas na primeira carga ou refresh manual (Supabase Realtime cuida do restante)
      if (isManual || versaoBaseMotoristas === 0) {
        try {
          await carregarBaseMotoristasUnificada(listaCompletaGeral);
          setVersaoBaseMotoristas(v => v + 1);
        } catch (e) {
          console.warn('Sync motoristas:', e);
        }
      }

      const mapaAnterior = statusAnterioresMapRef.current;
      const novosCarregamentos = [];

      lista.forEach(ag => {
        const agIdStr = String(ag.id).trim();
        const statusAntigo = mapaAnterior.get(agIdStr);
        // Se mudou para 'Carregando' em relação à checagem anterior:
        if (!isPrimeiraCargaRef.current && statusAntigo && statusAntigo !== 'Carregando' && ag.status === 'Carregando') {
          novosCarregamentos.push(ag);
        }
        mapaAnterior.set(agIdStr, ag.status);
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
      setSegundosRestantes(INTERVALO_ATUALIZACAO_SEGUNDOS);
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

  // Carrega base histórica se o usuário entrar na aba de gráficos e ela estiver vazia
  useEffect(() => {
    if (abaAtiva === 'graficos' && todosAgendamentos.length === 0) {
      carregarDados(true);
    }
  }, [abaAtiva]);

  // Sincronização em tempo real via Supabase Realtime para agendamentos, base de motoristas e envelopamentos
  useEffect(() => {
    let channel = null;
    if (isSupabaseConfigurado()) {
      channel = supabase
        .channel('realtime_painel_gestao_sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'base_motoristas' },
          () => {
            invalidarCacheMotoristas();
            carregarBaseMotoristasUnificada()
              .then(() => setVersaoBaseMotoristas(v => v + 1))
              .catch(() => {});
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'agendamentos_pedreira' },
          () => {
            carregarDados(false);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'envelopamentos' },
          () => {
            invalidarCacheEnvelopamentos();
            listarEnvelopamentos().then(envs => setEnvelopamentos(envs)).catch(() => {});
          }
        )
        .subscribe();
    }

    // Ouvinte em tempo real para atualizações locais/janelas de envelopamentos
    const unsubEnvelopamento = inscreverEnvelopamentosRealtime(() => {
      listarEnvelopamentos().then(envs => setEnvelopamentos(envs)).catch(() => {});
    });

    return () => {
      if (channel && isSupabaseConfigurado()) {
        try {
          supabase.removeChannel(channel);
        } catch (e) {}
      }
      if (typeof unsubEnvelopamento === 'function') {
        unsubEnvelopamento();
      }
    };
  }, []);

  // Intervalo de Auto-Atualização inteligente (com pausa em segundo plano para economia de dados)
  useEffect(() => {
    const timer = setInterval(() => {
      // Se a aba estiver oculta / minimizada, suspende o timer para poupar cota de banda do Supabase
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }

      setSegundosRestantes(prev => {
        if (prev <= 1) {
          carregarDados(false);
          return INTERVALO_ATUALIZACAO_SEGUNDOS;
        }
        return prev - 1;
      });
    }, 1000);

    const handleVisibilidade = () => {
      if (!document.hidden) {
        // Ao retornar para a aba visível, atualiza suavemente se necessário
        carregarDados(false);
        setSegundosRestantes(INTERVALO_ATUALIZACAO_SEGUNDOS);
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilidade);
    }

    return () => {
      clearInterval(timer);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilidade);
      }
    };
  }, [filtroPedreira, filtroStatus, filtroData, somAtivado, abaAtiva]);

  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida);

  const marcarTodasLidas = () => {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
  };

  const limparNotificacoes = () => {
    setNotificacoes([]);
  };

  const handleImprimirRelatorio = () => {
    document.body.classList.add('imprimindo-relatorio');
    const styleEl = document.createElement('style');
    styleEl.id = 'relatorio-landscape-print-style';
    styleEl.innerHTML = '@page { size: A4 landscape !important; margin: 6mm 8mm !important; }';
    document.head.appendChild(styleEl);

    window.print();

    setTimeout(() => {
      document.body.classList.remove('imprimindo-relatorio');
      const el = document.getElementById('relatorio-landscape-print-style');
      if (el) el.remove();
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
      'Nota Fiscal Emitida',
      'Data Emissão NF',
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
        'CNPJ Transportadora': formatarCNPJ(ag.transportadora_cnpj || resolverCnpjTransportadora(ag)) || '',
        'Motorista': ag.motorista_nome || '',
        'CPF Motorista': ag.motorista_cpf || '',
        'Telefone Motorista': ag.motorista_telefone || '',
        'Tipo de Veículo': ag.tipo_veiculo || '',
        'Placa Cavalo': ag.placa_cavalo || '',
        'Placa Carreta 1': ag.placa_carreta || '',
        'Placa Carreta 2': ag.placa_carreta_2 || '',
        'Status Atual': ag.status || '',
        'Nota Fiscal Emitida': ag.nota_fiscal_emitida ? 'SIM' : 'NÃO',
        'Data Emissão NF': ag.nota_fiscal_data ? formatarDataHoraBR(ag.nota_fiscal_data) : '',
        'Último Editor': ultimoEditor,
        'Histórico de Alterações': histTexto,
        'Observações / Ocorrências': limparTagsInternasObservacoes(ag.observacoes || '').replace(/[\r\n]+/g, ' ')
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

    if (!isAdmin && agendamento.status === 'Aguardando Liberação') {
      alert('Acesso restrito: Agendamentos com status "Aguardando Liberação" só podem ser liberados ou alterados pelo Administrador Geral.');
      return;
    }

    if (!isAdmin && (agendamento.status === 'Finalizado' || agendamento.status === 'Carregado')) {
      alert('Acesso restrito: Agendamentos com status "Finalizado" estão concluídos e bloqueados para alteração pelas pedreiras. Apenas o Administrador Geral pode alterar ou reverter.');
      return;
    }

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

      const agIdStr = String(agendamento.id).trim();
      setAgendamentos(prev => prev.map(ag => String(ag.id).trim() === agIdStr ? agAtualizado : ag));
      setTodosAgendamentos(prev => prev.map(ag => String(ag.id).trim() === agIdStr ? agAtualizado : ag));

      // Mantém a lista de pendências anteriores sincronizada
      setPendenciasAnteriores(prev => {
        if (['Finalizado', 'Carregado', 'Cancelado'].includes(novoStatus)) {
          return prev.filter(ag => String(ag.id).trim() !== agIdStr);
        }
        return prev.map(ag => String(ag.id).trim() === agIdStr ? agAtualizado : ag);
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
    const agIdStr = String(itemFormatado.id).trim();

    setAgendamentos(prev => prev.map(ag => String(ag.id).trim() === agIdStr ? itemFormatado : ag));
    setTodosAgendamentos(prev => prev.map(ag => String(ag.id).trim() === agIdStr ? itemFormatado : ag));

    setPendenciasAnteriores(prev => {
      const isAnterior = itemFormatado.data_agendamento && itemFormatado.data_agendamento < hojeStr;
      const isPendente = itemFormatado.status && !['Finalizado', 'Carregado', 'Cancelado'].includes(itemFormatado.status);
      if (!isAnterior || !isPendente) {
        return prev.filter(ag => String(ag.id).trim() !== agIdStr);
      }
      const existe = prev.some(ag => String(ag.id).trim() === agIdStr);
      if (existe) {
        return prev.map(ag => String(ag.id).trim() === agIdStr ? itemFormatado : ag);
      }
      return [itemFormatado, ...prev];
    });

    setMensagemAviso(`Informações do Bloco ${itemFormatado.numero_bloco} atualizadas com sucesso!`);
    setTimeout(() => setMensagemAviso(''), 6000);
  };

  const handleAlternarNotaFiscal = async (ag) => {
    if (!isAdmin) {
      alert('Apenas o Administrador Geral pode alterar o status de emissão da Nota Fiscal.');
      return;
    }
    const idStr = String(ag.id).trim();
    setSalvandoNFId(idStr);

    const statusAtual = Boolean(ag.nota_fiscal_emitida);
    const res = await alternarNotaFiscalEmitida(idStr, statusAtual, usuarioInfo);
    setSalvandoNFId(null);

    if (res.success) {
      const agAtualizado = {
        ...ag,
        nota_fiscal_emitida: res.nota_fiscal_emitida,
        nota_fiscal_data: res.nota_fiscal_data,
        nota_fiscal_usuario: res.nota_fiscal_usuario
      };

      setAgendamentos(prev => prev.map(item => String(item.id).trim() === idStr ? agAtualizado : item));
      setTodosAgendamentos(prev => prev.map(item => String(item.id).trim() === idStr ? agAtualizado : item));
      setPendenciasAnteriores(prev => prev.map(item => String(item.id).trim() === idStr ? agAtualizado : item));

      const textoAviso = res.nota_fiscal_emitida
        ? `Nota Fiscal do Bloco ${ag.numero_bloco} marcada como EMITIDA com sucesso!`
        : `Nota Fiscal do Bloco ${ag.numero_bloco} desmarcada com sucesso.`;
      setMensagemAviso(textoAviso);
      setTimeout(() => setMensagemAviso(''), 5000);
    } else {
      alert('Erro ao atualizar status da Nota Fiscal: ' + (res.error || 'Falha na comunicação'));
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

    const agIdStr = String(ag.id).trim();
    setExcluindoId(ag.id);
    const res = await excluirAgendamento(ag);
    setExcluindoId(null);

    if (res.success) {
      setAgendamentos(prev => prev.filter(item => String(item.id).trim() !== agIdStr));
      setTodosAgendamentos(prev => prev.filter(item => String(item.id).trim() !== agIdStr));
      setPendenciasAnteriores(prev => prev.filter(item => String(item.id).trim() !== agIdStr));

      if (statusAnterioresMapRef.current) {
        statusAnterioresMapRef.current.delete(ag.id);
        statusAnterioresMapRef.current.delete(agIdStr);
      }

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
      setAgendamentos(prev => prev.map(ag => String(ag.id).trim() === String(agendamento.id).trim() ? { ...ag, email_notificado: true } : ag));
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

  const listaBase = exibindoApenasSemNF
    ? (todosAgendamentos.length > 0 ? todosAgendamentos : agendamentos).filter(a => {
        const st = (a.status || '').trim();
        const isFinalizado = st === 'Finalizado' || st === 'Carregado';
        return isFinalizado && !a.nota_fiscal_emitida;
      })
    : exibindoPendenciasAnteriores
      ? pendenciasAnteriores
      : agendamentos;

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

  // Reseta para a primeira página quando qualquer filtro ou termo de busca for alterado
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroPedreira, filtroStatus, filtroData, termoBusca, exibindoPendenciasAnteriores, exibindoApenasSemNF]);

  // Cálculos de Paginação
  const totalItens = agendamentosFiltrados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItens / itensPorPagina));
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const indiceFinal = Math.min(indiceInicial + itensPorPagina, totalItens);

  const agendamentosPaginados = useMemo(() => {
    return agendamentosFiltrados.slice(indiceInicial, indiceFinal);
  }, [agendamentosFiltrados, indiceInicial, indiceFinal]);

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
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(217, 119, 6, 0.4)',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--slate-100)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>
                  {pendenciasAnteriores.length === 1
                    ? '1 veículo de data anterior ainda não foi finalizado'
                    : `${pendenciasAnteriores.length} veículos de datas anteriores ainda não foram finalizados`}
                </span>
                <span className="badge" style={{
                  background: 'rgba(245, 158, 11, 0.18)',
                  border: '1px solid #d97706',
                  color: '#b45309',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  Atenção Operacional
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--slate-400)' }}>
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
                background: exibindoPendenciasAnteriores ? '#d97706' : 'rgba(245, 158, 11, 0.20)',
                color: exibindoPendenciasAnteriores ? '#ffffff' : '#b45309',
                border: '1px solid #d97706',
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
            <h1 style={{ fontSize: '1.4rem', margin: 0, color: 'inherit' }}>
              Controle de Carregamento
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
                        {isAcessoAdminGeral && n.agendamento && (
                          <button
                            onClick={() => {
                              if (onVisualizarComprovante) onVisualizarComprovante(n.agendamento);
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
            onClick={() => setModalGestaoFrotaAberto(true)}
            className="btn btn-secondary"
            style={{ padding: '9px 16px', fontWeight: 600, gap: 8, background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
            title="Gerenciar base interna de motoristas e conformidade de frota (CNH, CRLVs e Laudos de Rocha/CSV)"
          >
            <ShieldCheck size={18} />
            Motoristas & Frota
          </button>

          <button
            onClick={handleExportarExcel}
            className="btn btn-secondary"
            style={{ padding: '9px 16px', fontWeight: 600, gap: 8, background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.12)' }}
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
            <span>Atualiza em <strong>{segundosRestantes >= 60 ? `${Math.floor(segundosRestantes / 60)}m ${String(segundosRestantes % 60).padStart(2, '0')}s` : `${segundosRestantes}s`}</strong></span>
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
            {isAcessoAdminGeral && bannerAlerta.agendamento && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => {
                    if (onVisualizarComprovante) onVisualizarComprovante(bannerAlerta.agendamento);
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



      {/* Navegação entre Módulos Internos do Painel (Carregamento e Gráficos Admin) */}
      {isAdmin && (
        <div className="no-print" style={{
          display: 'flex',
          gap: 10,
          marginBottom: 20,
          background: 'var(--bg-mode-selector)',
          padding: '6px',
          borderRadius: 12,
          border: '1px solid var(--border-subtle)',
          width: 'fit-content',
          flexWrap: 'wrap'
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
              color: abaAtiva === 'tabela' ? '#4ade80' : 'var(--text-inactive-tab)',
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
              color: abaAtiva === 'graficos' ? '#0284c7' : 'var(--text-inactive-tab)',
              boxShadow: abaAtiva === 'graficos' ? '0 0 15px rgba(56, 189, 248, 0.3)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <BarChart3 size={16} />
            Gráficos & Análise de Blocos (Admin)
          </button>
        </div>
      )}

      {/* VISÃO 1: GRÁFICOS & ANÁLISE DE BLOCOS (EXCLUSIVO ADMIN) */}
      {isAdmin && abaAtiva === 'graficos' ? (
        <GraficosBlocosAdmin agendamentos={todosAgendamentos.length > 0 ? todosAgendamentos : agendamentos} />
      ) : (
        /* VISÃO 2: TABELA OPERACIONAL & ROMANEIO DE CARREGAMENTOS */
        <>
          {/* Métricas Rápidas (Oculto na impressão) */}
          <div className="no-print stats-grid-container">
            <div className="glass-panel" style={{ padding: '14px 16px' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Registrado
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'inherit', marginTop: 4 }}>
                {agendamentos.length}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>Carregamentos no Sistema</span>
            </div>

        <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #16a34a' }}>
          <span style={{ fontSize: '0.74rem', color: '#16a34a', textTransform: 'uppercase', fontWeight: 700 }}>
            Carregamentos Hoje
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
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
          onClick={() => {
            if (pendenciasAnteriores.length > 0) {
              setExibindoPendenciasAnteriores(!exibindoPendenciasAnteriores);
            }
          }}
          style={{ 
            padding: '14px 16px', 
            borderLeft: '4px solid #f59e0b',
            cursor: pendenciasAnteriores.length > 0 ? 'pointer' : 'default',
            background: exibindoPendenciasAnteriores ? 'rgba(245, 158, 11, 0.15)' : undefined,
            boxShadow: exibindoPendenciasAnteriores ? '0 0 15px rgba(245, 158, 11, 0.3)' : undefined,
            transition: 'all 0.2s'
          }}
          title="Clique para alternar entre ver a lista normal ou as pendências de datas anteriores"
        >
          <span style={{ fontSize: '0.74rem', color: '#d97706', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <AlertTriangle size={13} /> Pendentes Anteriores
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: pendenciasAnteriores.length > 0 ? '#d97706' : 'var(--slate-400)', marginTop: 4 }}>
            {pendenciasAnteriores.length}
          </div>
          <span style={{ fontSize: '0.72rem', color: exibindoPendenciasAnteriores ? '#b45309' : 'var(--slate-400)', fontWeight: exibindoPendenciasAnteriores ? 700 : 400 }}>
            {exibindoPendenciasAnteriores ? 'Visualizando agora 👁️' : 'Não finalizados de ontem/antes'}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: '0.74rem', color: '#d97706', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={13} /> Aguardando Liberação
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706', marginTop: 4 }}>
            {agendamentos.filter(a => a.status === 'Aguardando Liberação').length}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>Aguardando aval</span>
        </div>

        <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #a855f7' }}>
          <span style={{ fontSize: '0.74rem', color: '#9333ea', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <CheckCircle2 size={13} /> Liberados p/ Carregar
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#9333ea', marginTop: 4 }}>
            {agendamentos.filter(a => a.status === 'Liberado para Carregar' || a.status === 'Confirmado').length}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>Aprovados p/ pátio</span>
        </div>

        <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #38bdf8' }}>
          <span style={{ fontSize: '0.74rem', color: '#0284c7', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <PlayCircle size={13} /> Carregando
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', marginTop: 4 }}>
            {agendamentos.filter(a => a.status === 'Carregando').length}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>Em operação na pedreira</span>
        </div>

        <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '0.74rem', color: '#16a34a', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <CheckCheck size={13} /> Finalizados
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
            {agendamentos.filter(a => a.status === 'Finalizado' || a.status === 'Carregado').length}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>Pesagem & NFE ok</span>
        </div>
      </div>

      {/* Alerta de Nota Fiscal Pendente para o Administrador Geral */}
      {isAdmin && finalizadosSemNF.length > 0 && (
        <div className="animate-fade no-print" style={{
          marginBottom: 20,
          padding: '14px 18px',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(217, 119, 6, 0.4)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: '#d97706',
              color: '#fff',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem',
              flexShrink: 0
            }}>
              <AlertTriangle size={18} color="#fff" />
            </div>
            <div>
              <strong style={{ color: '#b45309', fontSize: '0.95rem', display: 'block', fontWeight: 800 }}>
                Atenção Admin: {finalizadosSemNF.length} agendamento{finalizadosSemNF.length > 1 ? 's' : ''} com status "Finalizado" sem confirmação de Nota Fiscal (NF)
              </strong>
              <span style={{ color: 'var(--slate-400)', fontSize: '0.82rem' }}>
                Existem blocos carregados e finalizados que ainda estão sem o check de NF emitida. Fique atento e faça a conferência para manter o controle fiscal em dia.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setExibindoApenasSemNF(prev => !prev);
              setExibindoPendenciasAnteriores(false);
            }}
            className="btn"
            style={{
              background: exibindoApenasSemNF ? '#16a34a' : '#d97706',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.80rem',
              padding: '7px 14px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)'
            }}
          >
            <FileCheck size={14} />
            {exibindoApenasSemNF ? 'Voltar para Todos' : `Ver Apenas os ${finalizadosSemNF.length} com NF Pendente`}
          </button>
        </div>
      )}

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

          <div ref={dropdownStatusRef} style={{ flex: '0 1 230px', position: 'relative' }}>
            <button
              type="button"
              onClick={() => !exibindoPendenciasAnteriores && setDropdownStatusAberto(prev => !prev)}
              disabled={exibindoPendenciasAnteriores}
              className="form-select"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 6,
                textAlign: 'left',
                padding: '8px 12px',
                cursor: exibindoPendenciasAnteriores ? 'not-allowed' : 'pointer',
                background: !isTodosStatus ? 'rgba(0, 118, 44, 0.14)' : undefined,
                borderColor: !isTodosStatus ? 'var(--vermont-green)' : undefined,
                userSelect: 'none'
              }}
              title="Filtrar por um ou múltiplos status"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <Filter size={15} color={!isTodosStatus ? '#4ade80' : 'var(--slate-400)'} style={{ flexShrink: 0 }} />
                {isTodosStatus ? (
                  <span style={{ color: 'var(--slate-200)', fontSize: '0.85rem' }}>Todos os Status</span>
                ) : filtroStatus.length === 1 ? (
                  (() => {
                    const opt = STATUS_OPCOES_FILTRO.find(o => o.id === filtroStatus[0]);
                    return (
                      <span style={{ color: opt?.cor || '#fff', fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {opt?.dot} {opt?.label || filtroStatus[0]}
                      </span>
                    );
                  })()
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                    <span style={{ color: '#4ade80', fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {filtroStatus.length} status sel.
                    </span>
                    <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                      {filtroStatus.map(stId => {
                        const opt = STATUS_OPCOES_FILTRO.find(o => o.id === stId);
                        return opt ? <span key={stId} style={{ fontSize: '0.75rem' }}>{opt.dot}</span> : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                {!isTodosStatus && (
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFiltroStatus(['todos']);
                    }}
                    title="Limpar filtro de status (selecionar todos)"
                    style={{
                      cursor: 'pointer',
                      padding: '2px',
                      color: 'var(--slate-400)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <X size={14} />
                  </span>
                )}
                <ChevronDown size={15} style={{ transform: dropdownStatusAberto ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', color: 'var(--slate-400)' }} />
              </div>
            </button>

            {/* Menu Popover Multi-Select */}
            {dropdownStatusAberto && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                minWidth: 260,
                width: '100%',
                zIndex: 600,
                background: '#0d1512',
                border: '1px solid var(--vermont-green-border)',
                borderRadius: 10,
                boxShadow: '0 15px 35px rgba(0,0,0,0.85), var(--vermont-green-glow)',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                animation: 'fadeIn 0.15s ease'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 8px 8px 8px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: 4
                }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--slate-300)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Status ({isTodosStatus ? 'Todos' : `${filtroStatus.length}/${STATUS_OPCOES_FILTRO.length}`})
                  </span>
                  <button
                    type="button"
                    onClick={handleSelecionarTodosStatus}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#4ade80',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      padding: '2px 4px'
                    }}
                  >
                    Marcar Todos
                  </button>
                </div>

                {/* Opção: Todos os Status */}
                <div
                  onClick={() => handleToggleStatus('todos')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: isTodosStatus ? 'rgba(0, 118, 44, 0.25)' : 'transparent',
                    border: isTodosStatus ? '1px solid var(--vermont-green-border)' : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { if (!isTodosStatus) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                  onMouseLeave={(e) => { if (!isTodosStatus) e.currentTarget.style.background = 'transparent'; }}
                >
                  <input
                    type="checkbox"
                    checked={isTodosStatus}
                    onChange={() => handleToggleStatus('todos')}
                    style={{ accentColor: '#00762c', cursor: 'pointer' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span style={{ fontSize: '0.84rem', fontWeight: isTodosStatus ? 700 : 500, color: isTodosStatus ? '#fff' : 'var(--slate-300)' }}>
                    📋 Todos os Status
                  </span>
                </div>

                <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.06)', margin: '2px 0' }} />

                {/* Lista de Status com Checkbox e Cores */}
                {STATUS_OPCOES_FILTRO.map((opt) => {
                  const selecionado = isStatusSelecionado(opt.id);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleToggleStatus(opt.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '7px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: (!isTodosStatus && selecionado) ? opt.bg : 'transparent',
                        border: (!isTodosStatus && selecionado) ? `1px solid ${opt.border}` : '1px solid transparent',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => { if (isTodosStatus || !selecionado) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                      onMouseLeave={(e) => { if (isTodosStatus || !selecionado) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <input
                        type="checkbox"
                        checked={selecionado}
                        onChange={() => handleToggleStatus(opt.id)}
                        style={{ accentColor: opt.cor, cursor: 'pointer' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span style={{ fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 6, color: selecionado ? '#fff' : 'var(--slate-300)', fontWeight: (!isTodosStatus && selecionado) ? 700 : 500 }}>
                        <span>{opt.dot}</span>
                        <span>{opt.label}</span>
                      </span>
                    </div>
                  );
                })}

                {/* Rodapé com botão Fechar */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6, marginTop: 4, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <button
                    type="button"
                    onClick={() => setDropdownStatusAberto(false)}
                    className="btn btn-vermont"
                    style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: 6 }}
                  >
                    Aplicar / Fechar
                  </button>
                </div>
              </div>
            )}
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
              onClick={() => {
                setExibindoPendenciasAnteriores(prev => !prev);
                setExibindoApenasSemNF(false);
              }}
              className="btn"
              style={{
                padding: '9px 14px',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                background: exibindoPendenciasAnteriores ? '#d97706' : 'rgba(245, 158, 11, 0.15)',
                color: exibindoPendenciasAnteriores ? '#fff' : '#b45309',
                border: '1px solid #d97706',
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

          {isAdmin && finalizadosSemNF.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setExibindoApenasSemNF(prev => !prev);
                setExibindoPendenciasAnteriores(false);
              }}
              className="btn"
              style={{
                padding: '9px 14px',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                background: exibindoApenasSemNF ? '#d97706' : 'rgba(245, 158, 11, 0.15)',
                color: exibindoApenasSemNF ? '#fff' : '#b45309',
                border: '1px solid #d97706',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
              title="Filtrar e visualizar apenas os agendamentos Finalizados que estão sem confirmação de Nota Fiscal"
            >
              <FileCheck size={14} />
              {exibindoApenasSemNF ? 'Voltar para Todos' : `Sem Nota Fiscal (${finalizadosSemNF.length})`}
            </button>
          )}
        </div>
      </div>

      {/* BARRA DE PAGINAÇÃO & CONTROLE DE VISUALIZAÇÃO (Abaixo dos Filtros de Busca) */}
      <div className="glass-panel no-print" style={{
        padding: '10px 18px',
        marginBottom: 16,
        background: 'var(--bg-mode-selector)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Contagem de Registros e Seletor de visualização */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.86rem', color: 'var(--slate-300)' }}>
            Mostrando <strong>{totalItens === 0 ? 0 : indiceInicial + 1}</strong> a <strong>{indiceFinal}</strong> de <strong>{totalItens}</strong> carregamentos
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>Exibir:</span>
            <select
              value={itensPorPagina}
              onChange={(e) => {
                setItensPorPagina(Number(e.target.value));
                setPaginaAtual(1);
              }}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 6,
                color: '#4ade80',
                fontWeight: 700,
                padding: '4px 10px',
                fontSize: '0.82rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>
          </div>
        </div>

        {/* Botões de Navegação entre Páginas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Botão Primeira Página */}
          <button
            type="button"
            onClick={() => setPaginaAtual(1)}
            disabled={paginaAtual === 1}
            className="btn btn-secondary"
            style={{
              padding: '6px 8px',
              opacity: paginaAtual === 1 ? 0.35 : 1,
              cursor: paginaAtual === 1 ? 'not-allowed' : 'pointer'
            }}
            title="Primeira página"
          >
            <ChevronsLeft size={16} />
          </button>

          {/* Botão Página Anterior */}
          <button
            type="button"
            onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
            disabled={paginaAtual === 1}
            className="btn btn-secondary"
            style={{
              padding: '6px 10px',
              fontSize: '0.82rem',
              gap: 4,
              opacity: paginaAtual === 1 ? 0.35 : 1,
              cursor: paginaAtual === 1 ? 'not-allowed' : 'pointer'
            }}
            title="Página anterior"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>

          {/* Indicador de Página Atual / Total */}
          <div style={{
            background: 'rgba(0, 118, 44, 0.18)',
            border: '1px solid var(--vermont-green-border)',
            borderRadius: 6,
            padding: '5px 12px',
            fontSize: '0.82rem',
            color: '#4ade80',
            fontWeight: 700
          }}>
            Página {paginaAtual} de {totalPaginas}
          </div>

          {/* Botão Próxima Página */}
          <button
            type="button"
            onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
            disabled={paginaAtual === totalPaginas}
            className="btn btn-secondary"
            style={{
              padding: '6px 10px',
              fontSize: '0.82rem',
              gap: 4,
              opacity: paginaAtual === totalPaginas ? 0.35 : 1,
              cursor: paginaAtual === totalPaginas ? 'not-allowed' : 'pointer'
            }}
            title="Próxima página"
          >
            Próxima
            <ChevronRight size={16} />
          </button>

          {/* Botão Última Página */}
          <button
            type="button"
            onClick={() => setPaginaAtual(totalPaginas)}
            disabled={paginaAtual === totalPaginas}
            className="btn btn-secondary"
            style={{
              padding: '6px 8px',
              opacity: paginaAtual === totalPaginas ? 0.35 : 1,
              cursor: paginaAtual === totalPaginas ? 'not-allowed' : 'pointer'
            }}
            title="Última página"
          >
            <ChevronsRight size={16} />
          </button>
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
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'inherit', letterSpacing: 0.5 }}>
                VERMONT MINERAÇÃO LTDA.
              </span>
              <span className="badge badge-vermont" style={{ fontSize: '0.72rem' }}>
                CONTROLE DE CARREGAMENTOS & ROMANEIO
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginTop: 2 }}>
              Unidade: <strong>{filtroPedreira === 'todas' ? 'Todas as Pedreiras (Ceará & Goiás)' : filtroPedreira}</strong> | 
              Data de Emissão: <strong>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}</strong>
              {filtroData && <> | Filtrado para a data: <strong>{formatarDataBR(filtroData)}</strong></>}
              {!isTodosStatus && <> | Status: <strong>{filtroStatus.join(', ')}</strong></>}
            </div>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: 700 }}>
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

        {/* Aviso de contextualização quando filtrando agendamentos sem nota fiscal */}
        {exibindoApenasSemNF && (
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
              <FileCheck size={16} color="#fbbf24" />
              <span>
                Exibindo exclusivamente os <strong>{agendamentosFiltrados.length} agendamentos finalizados com Nota Fiscal pendente</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExibindoApenasSemNF(false)}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.76rem', gap: 4 }}
            >
              <RotateCcw size={12} /> Voltar para Todos os Agendamentos
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
                            setFiltroStatus(['todos']);
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
                agendamentosPaginados.map((ag) => {
                  const isSabado = ag.tipo_dia === 'sabado' || isDataSabado(ag.data_agendamento) || String(ag.horario_agendamento || '').includes('Sábado');
                  const isOutros = ag.horario_agendamento === 'outros' || String(ag.horario_agendamento).toLowerCase().startsWith('outro');
                  const listaPlacasTabela = formatarPlacasExibicao(ag);
                  const estaExcluindo = String(excluindoId) === String(ag.id);
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
                        <div style={{ fontWeight: 700, color: 'inherit' }}>{formatarDataBR(ag.data_agendamento)}</div>
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: isSabado ? '#d97706' : isOutros ? '#d97706' : '#16a34a', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 4, 
                          marginTop: 2 
                        }}>
                          <Clock size={13} />
                          {isOutros ? 'Outros (Especial)' : ag.horario_agendamento}
                        </div>
                        {isOutros && ag.justificativa_outros && (
                          <div style={{ fontSize: '0.72rem', color: '#d97706', marginTop: 3, lineHeight: '1.2' }} title={ag.justificativa_outros}>
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
                            color: '#b45309',
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
                          <strong style={{ color: 'inherit' }}>{ag.pedreira}</strong>
                          {(ag.is_combinado || ag.observacoes?.includes('[Carga Combinada') || ag.observacoes?.includes('[Carga Mista')) && (
                            <span 
                              title="Carregamento Misto / Carga Combinada (múltiplos blocos no mesmo veículo)"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                background: 'rgba(56, 189, 248, 0.18)',
                                border: '1px solid rgba(56, 189, 248, 0.5)',
                                color: '#0284c7',
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
                        <div style={{ fontSize: '0.82rem', color: 'var(--slate-400)', fontWeight: 600 }}>
                          Material: {ag.material}
                        </div>
                      </td>

                      {/* Bloco / Cliente com Sincronização Visual de Envelopamento */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: 'inherit', fontSize: '0.94rem' }}>
                            Bloco: {ag.numero_bloco}
                          </span>
                          {(() => {
                            const infoEnv = verificarStatusEnvelopamentoAgendamento(ag, envelopamentos);
                            const pesoBloco = infoEnv?.registro?.peso_kg || ag.peso_kg || ag.peso;

                            return (
                              <>
                                {/* Indicador discreto de Peso (?) com Tooltip ao passar o mouse */}
                                {Boolean(pesoBloco) && (
                                  <span 
                                    title={`⚖️ Peso Cadastrado: ${pesoBloco} kg`}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: 17,
                                      height: 17,
                                      borderRadius: '50%',
                                      background: 'rgba(56, 189, 248, 0.15)',
                                      border: '1px solid rgba(56, 189, 248, 0.45)',
                                      color: '#0284c7',
                                      fontSize: '0.68rem',
                                      fontWeight: 800,
                                      cursor: 'help',
                                      userSelect: 'none',
                                      lineHeight: 1
                                    }}
                                  >
                                    ?
                                  </span>
                                )}

                                <span 
                                  title={`Status do Bloco: ${infoEnv.label} (${infoEnv.descricao})`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    background: infoEnv.bg,
                                    border: `1px solid ${infoEnv.border}`,
                                    color: infoEnv.cor,
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    whiteSpace: 'nowrap',
                                    cursor: 'help'
                                  }}
                                >
                                  <span 
                                    style={{
                                      width: 7,
                                      height: 7,
                                      borderRadius: '50%',
                                      backgroundColor: infoEnv.cor,
                                      boxShadow: infoEnv.isEnvelopadoOuLiberado 
                                        ? '0 0 6px rgba(34, 197, 94, 0.9)' 
                                        : infoEnv.status === 'nao_registrado'
                                          ? 'none'
                                          : '0 0 6px rgba(239, 68, 68, 0.9)',
                                      display: 'inline-block'
                                    }}
                                  />
                                  {infoEnv.label}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                          Cliente: <strong style={{ color: 'inherit' }}>{limparNomeEmpresa(ag.cliente)}</strong>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                          Transp: <strong style={{ color: 'inherit' }}>{limparNomeEmpresa(ag.transportadora)}</strong>
                          {(ag.transportadora_cnpj || resolverCnpjTransportadora(ag)) ? (
                            <span style={{ fontSize: '0.70rem', color: '#0284c7', fontFamily: 'monospace', fontWeight: 600, marginLeft: '4px' }}>
                              (CNPJ: {formatarCNPJ(ag.transportadora_cnpj || resolverCnpjTransportadora(ag))})
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Motorista / CPF & Conformidade */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'inherit' }}>{ag.motorista_nome}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', fontFamily: 'monospace' }}>CPF: {ag.motorista_cpf}</div>
                        {ag.motorista_telefone && (
                          <div style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 600 }}>{ag.motorista_telefone}</div>
                        )}

                        {/* Selo de Conformidade Documental (CNH, CRLVs, Laudo de Rocha) */}
                        {(() => {
                          const conf = verificarConformidadeDocumental({
                            cpf: ag.motorista_cpf,
                            nome: ag.motorista_nome,
                            placaCavalo: ag.placa_cavalo,
                            placaCarreta: ag.placa_carreta,
                            placaCarreta2: ag.placa_carreta_2,
                            dataAgendamento: ag.data_agendamento,
                            tipoVeiculo: ag.tipo_veiculo
                          });

                          if (conf.statusGeral === 'VENCIDO') {
                            return (
                              <div style={{ marginTop: 4 }}>
                                <button
                                  type="button"
                                  onClick={() => handleAbrirConformidadeDireta(ag)}
                                  className="badge"
                                  style={{
                                    cursor: 'pointer',
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    color: '#dc2626',
                                    border: '1px solid #ef4444',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                  title={`Documentação Vencida: ${conf.itensVencidos?.map(i => `${i.titulo} (${i.labelData})`)?.join(' | ') || ''}. Clique para regularizar.`}
                                >
                                  <AlertCircle size={10} /> Doc Vencido
                                </button>
                              </div>
                            );
                          }
                          if (conf.statusGeral === 'AVENCER') {
                            return (
                              <div style={{ marginTop: 4 }}>
                                <button
                                  type="button"
                                  onClick={() => handleAbrirConformidadeDireta(ag)}
                                  className="badge"
                                  style={{
                                    cursor: 'pointer',
                                    background: 'rgba(245, 158, 11, 0.15)',
                                    color: '#b45309',
                                    border: '1px solid #d97706',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                  title={`Documento a vencer: ${conf.itensAVencer?.map(i => `${i.titulo} (${i.labelData})`)?.join(' | ') || ''}. Clique para verificar.`}
                                >
                                  <AlertTriangle size={10} /> Doc A Vencer
                                </button>
                              </div>
                            );
                          }
                          if (conf.statusGeral === 'REGULAR') {
                            return (
                              <div style={{ marginTop: 4 }}>
                                <button
                                  type="button"
                                  onClick={() => handleAbrirConformidadeDireta(ag)}
                                  className="badge"
                                  style={{
                                    cursor: 'pointer',
                                    background: 'rgba(34, 197, 94, 0.15)',
                                    color: '#15803d',
                                    border: '1px solid #16a34a',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                  title="Documentação em dia (CNH, CRLVs e Laudo de Rocha válidos). Clique para ver detalhes."
                                >
                                  <CheckCircle2 size={10} /> Doc Regular
                                </button>
                              </div>
                            );
                          }
                          return (
                            <div style={{ marginTop: 4 }}>
                              <button
                                type="button"
                                onClick={() => handleAbrirConformidadeDireta(ag)}
                                className="badge"
                                style={{
                                  cursor: 'pointer',
                                  background: 'rgba(100, 116, 139, 0.15)',
                                  color: '#475569',
                                  border: '1px solid #94a3b8',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                                title={conf.camposFaltando?.length > 0 ? `Documentos pendentes de preenchimento: ${conf.camposFaltando.join(', ')}. Clique para regularizar.` : "Motorista/Veículo ainda não possui cadastro completo de conformidade. Clique para cadastrar."}
                              >
                                <ShieldAlert size={10} /> Doc Não Cad.
                              </button>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Veículo / Placas Dinâmicas */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '0.76rem', color: 'var(--slate-400)', fontWeight: 600 }}>
                          {ag.tipo_veiculo}
                        </div>
                        <div style={{ fontSize: '0.78rem', marginTop: 2 }}>
                          {listaPlacasTabela.map((p, idx) => (
                            <div key={idx} style={{ color: 'var(--slate-400)' }}>
                              <span>{p.label}:</span>{' '}
                              <strong style={{ fontFamily: 'monospace', color: 'inherit' }}>{p.placa}</strong>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px', minWidth: 175 }}>
                        {ag.status === 'Aguardando Liberação' && (
                          <span className="badge" style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#b45309',
                            border: '1px solid rgba(217, 119, 6, 0.45)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 8px',
                            fontSize: '0.76rem',
                            fontWeight: 800
                          }}>
                            <Clock size={12} /> Aguardando Liberação
                          </span>
                        )}
                        {(ag.status === 'Liberado para Carregar' || ag.status === 'Confirmado') && (
                          <span className="badge" style={{
                            background: 'rgba(168, 85, 247, 0.15)',
                            color: '#9333ea',
                            border: '1px solid rgba(147, 51, 234, 0.45)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 8px',
                            fontSize: '0.76rem',
                            fontWeight: 800
                          }}>
                            <CheckCircle2 size={12} /> Liberado p/ Carregar
                          </span>
                        )}
                        {ag.status === 'Carregando' && (
                          <span className="badge" style={{
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#0284c7',
                            border: '1px solid rgba(2, 132, 199, 0.45)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 8px',
                            fontSize: '0.76rem',
                            fontWeight: 800
                          }}>
                            <PlayCircle size={12} /> Carregando
                          </span>
                        )}
                        {(ag.status === 'Finalizado' || ag.status === 'Carregado') && (
                          <span className="badge" style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#16a34a',
                            border: '1px solid rgba(22, 163, 74, 0.45)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 8px',
                            fontSize: '0.76rem',
                            fontWeight: 800
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
                            background: !isAdmin && (ag.status === 'Aguardando Liberação' || ag.status === 'Finalizado' || ag.status === 'Carregado') ? 'rgba(15, 23, 42, 0.45)' : 'rgba(15, 23, 42, 0.85)',
                            border: !isAdmin && ag.status === 'Aguardando Liberação' ? '1px solid rgba(245, 158, 11, 0.25)' : !isAdmin && (ag.status === 'Finalizado' || ag.status === 'Carregado') ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: 8,
                            padding: '2px 6px',
                            opacity: !isAdmin && (ag.status === 'Aguardando Liberação' || ag.status === 'Finalizado' || ag.status === 'Carregado') ? 0.75 : 1
                          }}>
                            <span style={{ fontSize: '0.68rem', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase' }}>
                              Mudar:
                            </span>
                            <select
                              value={ag.status === 'Carregado' ? 'Finalizado' : ag.status}
                              onChange={(e) => solicitarMudancaStatus(ag, e.target.value)}
                              disabled={!isAdmin && (ag.status === 'Aguardando Liberação' || ag.status === 'Finalizado' || ag.status === 'Carregado')}
                              title={!isAdmin && (ag.status === 'Finalizado' || ag.status === 'Carregado') ? 'Agendamentos Finalizados estão concluídos e bloqueados para alteração' : (!isAdmin && ag.status === 'Aguardando Liberação' ? 'Apenas o Administrador Geral pode liberar ou alterar agendamentos em Aguardando Liberação' : 'Alterar status operacional')}
                              style={{
                                flex: 1,
                                padding: '4px 6px',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                borderRadius: 5,
                                background: '#111915',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                color: '#f1f5f9',
                                cursor: !isAdmin && (ag.status === 'Aguardando Liberação' || ag.status === 'Finalizado' || ag.status === 'Carregado') ? 'not-allowed' : 'pointer',
                                outline: 'none'
                              }}
                            >
                              {isAdmin && (
                                <option value="Aguardando Liberação" style={{ background: '#111915', color: '#fbbf24' }}>
                                  🟡 Aguardando Liberação
                                </option>
                              )}
                              {!isAdmin && ag.status === 'Aguardando Liberação' && (
                                <option value="Aguardando Liberação" style={{ background: '#111915', color: '#fbbf24' }}>
                                  🟡 Aguardando Liberação (Bloqueado)
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
                          {!isAdmin && ag.status === 'Aguardando Liberação' && (
                            <span style={{ fontSize: '0.67rem', color: '#fde68a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 3 }}>
                              🔒 Liberação exclusiva do Admin
                            </span>
                          )}
                          {!isAdmin && (ag.status === 'Finalizado' || ag.status === 'Carregado') && (
                            <span style={{ fontSize: '0.67rem', color: '#86efac', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 3 }}>
                              🔒 Finalizado (Bloqueado)
                            </span>
                          )}
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
                          <div style={{ fontSize: '0.76rem', color: '#d97706', marginBottom: 4, fontWeight: 600 }}>
                            📌 Horário Solicitado: {ag.justificativa_outros}
                          </div>
                        )}
                        {ag.observacoes ? (
                          <div style={{ fontSize: '0.78rem', color: 'inherit', lineHeight: '1.3' }}>
                            {limparTagsInternasObservacoes(ag.observacoes)}
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

                          {/* BOTÃO DE CONTROLE DE EMISSÃO DE NOTA FISCAL (Oculto se Cancelado; Admin edita, Pedreira visualiza) */}
                          {ag.status !== 'Cancelado' && (
                            isAcessoAdminGeral ? (
                              <button
                                type="button"
                                onClick={() => handleAlternarNotaFiscal(ag)}
                                className="btn"
                                disabled={salvandoNFId === String(ag.id).trim()}
                                style={{
                                  padding: '6px 10px',
                                  fontSize: '0.78rem',
                                  gap: 5,
                                  transition: 'all 0.2s',
                                  background: ag.nota_fiscal_emitida 
                                    ? 'rgba(34, 197, 94, 0.18)' 
                                    : (ag.status === 'Finalizado' || ag.status === 'Carregado')
                                      ? 'rgba(245, 158, 11, 0.15)'
                                      : 'rgba(255, 255, 255, 0.05)',
                                  borderColor: ag.nota_fiscal_emitida 
                                    ? '#22c55e' 
                                    : (ag.status === 'Finalizado' || ag.status === 'Carregado')
                                      ? '#f59e0b'
                                      : 'rgba(255, 255, 255, 0.2)',
                                  color: ag.nota_fiscal_emitida 
                                    ? '#4ade80' 
                                    : (ag.status === 'Finalizado' || ag.status === 'Carregado')
                                      ? '#fbbf24'
                                      : 'var(--slate-300)',
                                  fontWeight: ag.nota_fiscal_emitida || ag.status === 'Finalizado' || ag.status === 'Carregado' ? 700 : 500,
                                  cursor: 'pointer',
                                  boxShadow: (!ag.nota_fiscal_emitida && (ag.status === 'Finalizado' || ag.status === 'Carregado')) 
                                    ? '0 0 8px rgba(245, 158, 11, 0.25)' 
                                    : 'none'
                                }}
                                title={
                                  ag.nota_fiscal_emitida
                                    ? `Nota Fiscal Emitida${ag.nota_fiscal_data ? ' em ' + formatarDataHoraBR(ag.nota_fiscal_data) : ''}${ag.nota_fiscal_usuario ? ' por ' + ag.nota_fiscal_usuario : ''}. Clique para desmarcar.`
                                    : (ag.status === 'Finalizado' || ag.status === 'Carregado')
                                      ? '⚠️ Bloco Finalizado sem Nota Fiscal! Clique para confirmar que a NF foi emitida (Exclusivo Admin)'
                                      : 'Clique para marcar que a Nota Fiscal deste bloco foi emitida (Exclusivo Admin)'
                                }
                              >
                                {salvandoNFId === String(ag.id).trim() ? (
                                  <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
                                ) : ag.nota_fiscal_emitida ? (
                                  <CheckCircle2 size={14} color="#4ade80" />
                                ) : (ag.status === 'Finalizado' || ag.status === 'Carregado') ? (
                                  <AlertTriangle size={14} color="#fbbf24" />
                                ) : (
                                  <FileCheck size={14} color="var(--slate-400)" />
                                )}
                                <span>{ag.nota_fiscal_emitida ? 'NF OK' : 'NF Pendente'}</span>
                              </button>
                            ) : (
                              /* Visualização para Usuários da Pedreira (Somente Leitura) */
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '5px 8px',
                                  borderRadius: 6,
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  background: ag.nota_fiscal_emitida ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.08)',
                                  border: `1px solid ${ag.nota_fiscal_emitida ? 'rgba(34, 197, 94, 0.35)' : 'rgba(148, 163, 184, 0.2)'}`,
                                  color: ag.nota_fiscal_emitida ? '#4ade80' : 'var(--slate-400)',
                                  cursor: 'default'
                                }}
                                title={
                                  ag.nota_fiscal_emitida
                                    ? `Nota Fiscal deste bloco já emitida${ag.nota_fiscal_data ? ' em ' + formatarDataHoraBR(ag.nota_fiscal_data) : ''}`
                                    : 'Aguardando emissão da Nota Fiscal'
                                }
                              >
                                {ag.nota_fiscal_emitida ? (
                                  <>
                                    <CheckCircle2 size={13} color="#4ade80" />
                                    <span>NF OK</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock size={13} color="var(--slate-400)" />
                                    <span>NF Pendente</span>
                                  </>
                                )}
                              </div>
                            )
                          )}

                          {/* BOTÃO VER COMPROVANTE (Exclusivo Administrador Geral) */}
                          {isAcessoAdminGeral && onVisualizarComprovante && (
                            <button
                              type="button"
                              onClick={() => onVisualizarComprovante(ag)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                              title="Ver Comprovante Oficial de Agendamento (Apenas Administrador Geral)"
                            >
                              <FileText size={14} />
                              Ver
                            </button>
                          )}

                          {/* BOTÃO AUTORIZAÇÃO DE CARREGAMENTO (Disponível apenas após liberação: Liberado para Carregar e Carregando) */}
                          {(ag.status === 'Liberado para Carregar' || ag.status === 'Carregando') && (
                            <button
                              type="button"
                              onClick={() => setAgendamentoParaAutorizacao(ag)}
                              className="btn btn-secondary"
                              style={{ 
                                padding: '6px 10px', 
                                fontSize: '0.78rem',
                                gap: 4,
                                background: 'rgba(217, 119, 6, 0.15)',
                                borderColor: 'rgba(217, 119, 6, 0.4)',
                                color: '#fbbf24'
                              }}
                              title="Gerar Autorização de Carregamento oficial da pedreira (Cargas mistas isoladas por pedreira)"
                            >
                              <FileCheck size={14} />
                              Aut.
                            </button>
                          )}

                          {/* BOTÃO EXCLUIR AGENDAMENTO (Exclusivo para ADMIN GERAL) */}
                          {isAcessoAdminGeral && (
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
      </>
      )}

      {/* Modal de Autorização de Carregamento Oficial da Pedreira */}
      {agendamentoParaAutorizacao && (
        <AutorizacaoCarregamentoModal
          agendamento={agendamentoParaAutorizacao}
          todosAgendamentos={todosAgendamentos.length > 0 ? todosAgendamentos : agendamentos}
          pedreiraOperador={pedreiraOperador}
          onFechar={() => setAgendamentoParaAutorizacao(null)}
        />
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

      {/* Modal de Limpeza em Lote de Testes e Cache */}
      {modalLimpezaAberto && (
        <ModalLimpezaTestes
          agendamentos={todosAgendamentos.length > 0 ? todosAgendamentos : agendamentos}
          usuarioInfo={usuarioInfo}
          onFechar={() => setModalLimpezaAberto(false)}
          onConcluido={() => {
            setModalLimpezaAberto(false);
            carregarDados(true);
          }}
        />
      )}

      {/* Modal de Central de Gestão de Motoristas & Frota (Pedreiras & Admin) */}
      {modalGestaoFrotaAberto && (
        <ModalGestaoMotoristasFrota
          usuarioNome={usuarioInfo.nome}
          usuarioInfo={usuarioInfo}
          isAdmin={isAdmin}
          todosAgendamentos={todosAgendamentos.length > 0 ? todosAgendamentos : agendamentos}
          aoFechar={() => setModalGestaoFrotaAberto(false)}
        />
      )}

      {/* Modal de Conformidade Rápida de Motorista & Frota (ao clicar no selo da tabela) */}
      {motoristaParaConformidade && (
        <ModalConformidadeMotorista
          motoristaInicial={motoristaParaConformidade}
          usuarioNome={usuarioInfo.nome}
          usuarioInfo={usuarioInfo}
          isAdmin={isAdmin}
          aoFechar={() => setMotoristaParaConformidade(null)}
          aoSalvar={() => {
            setMotoristaParaConformidade(null);
            carregarDados(true);
          }}
        />
      )}
    </div>
  );
}
