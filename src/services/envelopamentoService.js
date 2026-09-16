import { supabase, isSupabaseConfigurado } from '../lib/supabase.js';

const LOCAL_STORAGE_KEY = 'vermont_envelopamentos_locais';
const CLIENTES_STORAGE_KEY = 'vermont_clientes_cadastrados';

/**
 * Definição oficial dos Status de Envelopamento de Bloco da Vermont Mineração
 */
export const STATUS_ENVELOPAMENTO = {
  PENDENTE_ENVELOPAMENTO: {
    id: 'pendente_envelopamento',
    label: 'Pendente de Envelopamento',
    cor: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.15)',
    border: '#64748b',
    descricao: 'Aguardando início do envelopamento no pátio'
  },
  EM_ANDAMENTO: {
    id: 'em_andamento',
    label: 'Em andamento',
    cor: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: '#d97706',
    descricao: 'Bloco passando pelo processo físico de envelopamento'
  },
  AGUARDANDO_CORTE_REPARO: {
    id: 'aguardando_corte_reparo',
    label: 'Aguardando corte e reparo',
    cor: '#f87171',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: '#dc2626',
    descricao: 'Bloco necessita de corte ou reparo antes de ser liberado'
  },
  ENVELOPADO: {
    id: 'envelopado',
    label: 'Envelopado',
    cor: '#4ade80',
    bg: 'rgba(34, 197, 94, 0.15)',
    border: '#22c55e',
    descricao: 'Bloco devidamente envelopado e liberado'
  },
  SEM_ENVELOPAMENTO: {
    id: 'sem_envelopamento',
    label: 'Sem envelopamento',
    cor: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: '#0284c7',
    descricao: 'Bloco liberado sem necessidade de envelopamento'
  }
};

/**
 * Lê os envelopamentos armazenados localmente no navegador
 */
export const carregarEnvelopamentosLocais = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Erro ao ler envelopamentos locais:', err);
    return [];
  }
};

/**
 * Salva os envelopamentos no armazenamento local
 */
export const salvarEnvelopamentosLocais = (lista) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lista));
  } catch (err) {
    console.error('Erro ao salvar envelopamentos locais:', err);
  }
};

const SYNC_ENV_CPF = 'ENV_STORAGE_VERMONT';
const SYNC_CLI_CPF = 'CLI_STORAGE_VERMONT';

/**
 * Persiste a lista completa de envelopamentos na nuvem (Supabase) garantindo sincronização instantânea
 * mesmo caso a tabela dedicada 'envelopamentos' ainda não tenha sido criada via SQL Editor.
 */
const sincronizarEnvelopamentosNuvem = async (lista) => {
  if (!isSupabaseConfigurado() || !Array.isArray(lista)) return;
  try {
    await supabase.from('base_motoristas').upsert({
      cpf: SYNC_ENV_CPF,
      nome: 'SISTEMA_ENVELOPAMENTO_VERMONT',
      observacoes: JSON.stringify(lista),
      status_documental: 'REGULAR',
      atualizado_por: 'Sistema Envelopamento Vermont',
      atualizado_em: new Date().toISOString()
    }, { onConflict: 'cpf' });
  } catch (err) {
    console.warn('[Envelopamento] Falha ao sincronizar espelho na nuvem:', err);
  }
};

/**
 * Consulta a lista de envelopamentos na nuvem com failover inteligente
 */
const consultarEnvelopamentosNuvem = async () => {
  if (!isSupabaseConfigurado()) return null;

  // 1. Tentar primeiro na tabela oficial 'envelopamentos'
  try {
    const { data, error } = await supabase
      .from('envelopamentos')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (e) {}

  // 2. Fallback na nuvem via espelho de sincronização em 'base_motoristas'
  try {
    const { data, error } = await supabase
      .from('base_motoristas')
      .select('observacoes')
      .eq('cpf', SYNC_ENV_CPF)
      .maybeSingle();

    if (!error && data?.observacoes) {
      const parsed = JSON.parse(data.observacoes);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {}

  return null;
};

/**
 * Lista todos os envelopamentos (Supabase com fallback para LocalStorage e mesclagem bidirecional)
 */
export const listarEnvelopamentos = async (filtros = {}) => {
  let dados = [];
  const dadosLocais = carregarEnvelopamentosLocais();

  if (isSupabaseConfigurado()) {
    const dadosNuvem = await consultarEnvelopamentosNuvem();
    if (Array.isArray(dadosNuvem) && dadosNuvem.length > 0) {
      // Mesclar nuvem com local (priorizando os registros mais recentes pelo updated_at)
      const mapa = new Map();
      dadosLocais.forEach(item => { if (item?.id) mapa.set(item.id, item); });
      dadosNuvem.forEach(item => {
        if (!item?.id) return;
        const local = mapa.get(item.id);
        if (!local || new Date(item.updated_at || item.created_at || 0) >= new Date(local.updated_at || local.created_at || 0)) {
          mapa.set(item.id, item);
        }
      });
      dados = Array.from(mapa.values());
      salvarEnvelopamentosLocais(dados);
    } else {
      dados = dadosLocais;
      if (dadosLocais.length > 0) {
        // Envia os dados locais existentes para a nuvem para que outros usuários recebam
        sincronizarEnvelopamentosNuvem(dadosLocais);
      }
    }
  } else {
    dados = dadosLocais;
  }

  if (dados.length === 0) {
    dados = dadosLocais;
  }

  // Normalizar status legados caso existam
  dados = dados.map(item => {
    let st = item.status;
    if (st === 'pendente') st = 'pendente_envelopamento';
    if (st === 'em_envelopamento') st = 'em_andamento';
    if (st === 'conferido' || st === 'liberado') st = 'envelopado';
    return { ...item, status: st };
  });

  // Ordenar por data mais recente
  dados.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  // Aplicar filtros em memória
  return dados.filter(item => {
    if (filtros.pedreira && item.pedreira_nome !== filtros.pedreira) return false;
    if (filtros.status && item.status !== filtros.status) return false;
    if (filtros.cliente && !String(item.cliente_nome || '').toLowerCase().includes(filtros.cliente.toLowerCase())) return false;
    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase().trim();
      const bloco = String(item.numero_bloco || '').toLowerCase();
      const cli = String(item.cliente_nome || '').toLowerCase();
      const mat = String(item.material || '').toLowerCase();
      const ped = String(item.pedreira_nome || '').toLowerCase();
      if (!bloco.includes(termo) && !cli.includes(termo) && !mat.includes(termo) && !ped.includes(termo)) {
        return false;
      }
    }
    return true;
  });
};

// Dispara evento local para sincronização reativa instantânea entre componentes e abas
export const notificarAlteracaoEnvelopamento = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vermont_envelopamento_changed'));
  }
};

/**
 * Inscreve um callback para ser notificado sempre que houver alterações nos envelopamentos
 * (via Supabase Realtime em 'envelopamentos' e 'base_motoristas', eventos da janela local e Storage entre abas).
 */
export const inscreverEnvelopamentosRealtime = (callback) => {
  let supabaseChannel = null;

  // 1. Supabase Realtime
  if (isSupabaseConfigurado()) {
    try {
      supabaseChannel = supabase
        .channel(`realtime_envelopamentos_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'envelopamentos' },
          (payload) => {
            if (typeof callback === 'function') callback(payload);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'base_motoristas' },
          (payload) => {
            if (payload?.new?.cpf === SYNC_ENV_CPF || payload?.new?.cpf === SYNC_CLI_CPF) {
              if (typeof callback === 'function') callback(payload);
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('[Envelopamento Realtime] Falha ao criar canal Supabase:', err);
    }
  }

  // 2. Evento na janela atual
  const handleLocalEvent = () => {
    if (typeof callback === 'function') callback({ event: 'LOCAL_CHANGE' });
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('vermont_envelopamento_changed', handleLocalEvent);
  }

  // 3. Evento entre abas (Storage)
  const handleStorageEvent = (e) => {
    if (e.key === LOCAL_STORAGE_KEY && typeof callback === 'function') {
      callback({ event: 'STORAGE_CHANGE' });
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent);
  }

  // Retorna função de limpeza (unsubscribe)
  return () => {
    if (supabaseChannel && isSupabaseConfigurado()) {
      try {
        supabase.removeChannel(supabaseChannel);
      } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('vermont_envelopamento_changed', handleLocalEvent);
      window.removeEventListener('storage', handleStorageEvent);
    }
  };
};

/**
 * Salva ou atualiza um registro de envelopamento
 */
export const salvarEnvelopamento = async (dados, usuarioNome = 'Equipe Vermont') => {
  const agora = new Date().toISOString();
  const id = dados.id || `env_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  let statusNormalizado = dados.status || 'pendente_envelopamento';
  if (statusNormalizado === 'pendente') statusNormalizado = 'pendente_envelopamento';
  if (statusNormalizado === 'em_envelopamento') statusNormalizado = 'em_andamento';
  if (statusNormalizado === 'liberado' || statusNormalizado === 'conferido') statusNormalizado = 'envelopado';

  const registroCompleto = {
    id,
    numero_bloco: String(dados.numero_bloco || '').trim().toUpperCase(),
    cliente_nome: String(dados.cliente_nome || '').trim().toUpperCase(),
    cliente_cnpj: String(dados.cliente_cnpj || '').trim(),
    material: String(dados.material || '').trim(),
    peso_kg: String(dados.peso_kg || '').trim(),
    pedreira_id: dados.pedreira_id || '',
    pedreira_nome: dados.pedreira_nome || '',
    status: statusNormalizado,
    responsavel_envelopamento: dados.responsavel_envelopamento || (statusNormalizado === 'em_andamento' ? usuarioNome : null),
    responsavel_liberacao: dados.responsavel_liberacao || (statusNormalizado === 'envelopado' || statusNormalizado === 'sem_envelopamento' ? usuarioNome : null),
    data_cadastro: dados.data_cadastro || agora,
    data_envelopamento: dados.data_envelopamento || (statusNormalizado === 'em_andamento' ? agora : null),
    data_liberacao: dados.data_liberacao || (statusNormalizado === 'envelopado' || statusNormalizado === 'sem_envelopamento' ? agora : null),
    observacoes: dados.observacoes || '',
    agendamento_id: dados.agendamento_id || null,
    created_at: dados.created_at || agora,
    updated_at: agora
  };

  // 1. Atualizar LocalStorage
  const locais = carregarEnvelopamentosLocais();
  const index = locais.findIndex(item => item.id === id);
  if (index >= 0) {
    locais[index] = { ...locais[index], ...registroCompleto };
  } else {
    locais.unshift(registroCompleto);
  }
  salvarEnvelopamentosLocais(locais);

  // 2. Sincronizar na nuvem (Supabase)
  if (isSupabaseConfigurado()) {
    // A. Tentar na tabela 'envelopamentos'
    try {
      await supabase.from('envelopamentos').upsert(registroCompleto);
    } catch (e) {}
    // B. Sincronizar no espelho em tempo real
    sincronizarEnvelopamentosNuvem(locais);
  }

  // Notificar ouvintes locais imediatamente
  notificarAlteracaoEnvelopamento();

  // Também registra automaticamente o cliente na base de clientes se informado
  if (registroCompleto.cliente_nome) {
    try {
      await salvarClienteCadastrado({
        nome: registroCompleto.cliente_nome,
        cnpj: registroCompleto.cliente_cnpj
      });
    } catch (e) {}
  }

  return registroCompleto;
};

/**
 * Atualiza o status de um envelopamento rapidamente
 */
export const atualizarStatusEnvelopamento = async (id, novoStatus, usuarioNome = 'Equipe Vermont') => {
  const locais = carregarEnvelopamentosLocais();
  const index = locais.findIndex(item => item.id === id);
  if (index < 0) return null;

  const agora = new Date().toISOString();
  const itemAtual = locais[index];

  const atualizacoes = {
    status: novoStatus,
    updated_at: agora
  };

  if (novoStatus === 'em_andamento') {
    atualizacoes.responsavel_envelopamento = usuarioNome;
    atualizacoes.data_envelopamento = agora;
  } else if (novoStatus === 'envelopado' || novoStatus === 'sem_envelopamento') {
    atualizacoes.responsavel_liberacao = usuarioNome;
    atualizacoes.data_liberacao = agora;
  }

  return await salvarEnvelopamento({ ...itemAtual, ...atualizacoes }, usuarioNome);
};

/**
 * Exclui um registro de envelopamento
 */
export const excluirEnvelopamento = async (id) => {
  const locais = carregarEnvelopamentosLocais();
  const novaLista = locais.filter(item => item.id !== id);
  salvarEnvelopamentosLocais(novaLista);

  if (isSupabaseConfigurado()) {
    try {
      await supabase.from('envelopamentos').delete().eq('id', id);
    } catch (err) {}
    sincronizarEnvelopamentosNuvem(novaLista);
  }

  notificarAlteracaoEnvelopamento();
  return true;
};

/**
 * Importa múltiplos blocos em lote
 */
export const importarBlocosEmLote = async (itens, usuarioNome = 'Equipe Vermont') => {
  const resultados = [];
  for (const item of itens) {
    if (item.numero_bloco) {
      const salvo = await salvarEnvelopamento(item, usuarioNome);
      resultados.push(salvo);
    }
  }
  return resultados;
};

/**
 * Busca o status de envelopamento de um bloco específico para um cliente
 */
export const buscarStatusEnvelopamentoPorBloco = async (numeroBloco, clienteNome = '') => {
  if (!numeroBloco) return null;

  const blocoFormatado = String(numeroBloco).trim().toUpperCase();
  const todos = await listarEnvelopamentos();

  const encontrado = todos.find(item => {
    const mesmoBloco = String(item.numero_bloco || '').trim().toUpperCase() === blocoFormatado;
    if (!mesmoBloco) return false;
    if (clienteNome) {
      const cli1 = String(item.cliente_nome || '').toLowerCase().trim();
      const cli2 = String(clienteNome || '').toLowerCase().trim();
      return cli1.includes(cli2) || cli2.includes(cli1);
    }
    return true;
  });

  return encontrado || null;
};

/**
 * Verifica e sincroniza o status de envelopamento de um bloco de agendamento.
 * Realiza a correspondência por:
 * 1. numero_bloco (chave primária)
 * 2. cliente (opcional / reforço de correspondência)
 * 3. material (opcional)
 * 4. pedreira (opcional)
 * 
 * Regra visual Vermont:
 * - 🟢 Verde: Envelopado OU Sem envelopamento (liberado)
 * - 🔴 Vermelho: Pendente de Envelopamento, Em andamento, Aguardando corte e reparo, ou Não Envelopado/Não Cadastrado
 */
export const verificarStatusEnvelopamentoAgendamento = (agendamento, listaEnvelopamentos = []) => {
  if (!agendamento || !agendamento.numero_bloco) {
    return {
      encontrado: false,
      isEnvelopadoOuLiberado: false,
      status: 'pendente_envelopamento',
      label: 'Não Envelopado',
      cor: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.15)',
      border: '#dc2626',
      descricao: 'Bloco sem registro de envelopamento'
    };
  }

  const numBlocoAg = String(agendamento.numero_bloco).trim().toUpperCase();
  const clienteAg = String(agendamento.cliente || '').trim().toLowerCase();
  const materialAg = String(agendamento.material || '').trim().toLowerCase();
  const pedreiraAg = String(agendamento.pedreira || '').trim().toLowerCase();

  // Filtrar todos os que batem com o número do bloco
  const candidatos = (Array.isArray(listaEnvelopamentos) ? listaEnvelopamentos : []).filter(env => {
    const numEnv = String(env.numero_bloco || '').trim().toUpperCase();
    return numEnv === numBlocoAg;
  });

  let correspondente = null;

  if (candidatos.length === 1) {
    correspondente = candidatos[0];
  } else if (candidatos.length > 1) {
    // Tenta encontrar o melhor match com cliente, material ou pedreira
    correspondente = candidatos.find(env => {
      const cliEnv = String(env.cliente_nome || '').trim().toLowerCase();
      const matEnv = String(env.material || '').trim().toLowerCase();
      const pedEnv = String(env.pedreira_nome || '').trim().toLowerCase();

      const bateCliente = clienteAg && cliEnv && (cliEnv.includes(clienteAg) || clienteAg.includes(cliEnv));
      const bateMaterial = materialAg && matEnv && (matEnv.includes(materialAg) || materialAg.includes(matEnv));
      const batePedreira = pedreiraAg && pedEnv && (pedEnv.includes(pedreiraAg) || pedreiraAg.includes(pedEnv));

      return (bateCliente && bateMaterial) || (bateCliente && batePedreira) || bateCliente;
    }) || candidatos[0];
  }

  if (!correspondente) {
    return {
      encontrado: false,
      isEnvelopadoOuLiberado: false,
      status: 'pendente_envelopamento',
      label: 'Não Envelopado',
      cor: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.15)',
      border: '#dc2626',
      descricao: 'Bloco não cadastrado no módulo de envelopamento'
    };
  }

  const st = correspondente.status;
  const isLiberado = st === 'envelopado' || st === 'sem_envelopamento';

  if (isLiberado) {
    return {
      encontrado: true,
      isEnvelopadoOuLiberado: true,
      status: st,
      label: st === 'sem_envelopamento' ? 'Sem envelopamento' : 'Envelopado',
      cor: '#22c55e',
      bg: 'rgba(34, 197, 94, 0.15)',
      border: '#16a34a',
      descricao: st === 'sem_envelopamento' ? 'Bloco liberado sem necessidade de envelopamento' : 'Bloco envelopado e liberado',
      registro: correspondente
    };
  } else {
    let label = 'Não Envelopado';
    if (st === 'em_andamento') label = 'Em andamento';
    else if (st === 'aguardando_corte_reparo') label = 'Aguardando corte/reparo';
    else if (st === 'pendente_envelopamento' || st === 'pendente') label = 'Pendente';

    return {
      encontrado: true,
      isEnvelopadoOuLiberado: false,
      status: st,
      label,
      cor: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.15)',
      border: '#dc2626',
      descricao: STATUS_ENVELOPAMENTO[st?.toUpperCase()]?.descricao || 'Bloco não liberado para carregamento',
      registro: correspondente
    };
  }
};

/**
 * Calcula os totais e métricas para os cards de resumo com os status oficiais
 */
export const calcularMetricasEnvelopamento = (lista = []) => {
  return {
    total: lista.length,
    pendente_envelopamento: lista.filter(i => i.status === 'pendente_envelopamento' || i.status === 'pendente').length,
    em_andamento: lista.filter(i => i.status === 'em_andamento' || i.status === 'em_envelopamento').length,
    aguardando_corte_reparo: lista.filter(i => i.status === 'aguardando_corte_reparo').length,
    envelopado: lista.filter(i => i.status === 'envelopado' || i.status === 'liberado' || i.status === 'conferido').length,
    sem_envelopamento: lista.filter(i => i.status === 'sem_envelopamento').length
  };
};

/**
 * Persiste clientes na nuvem
 */
const sincronizarClientesNuvem = async (lista) => {
  if (!isSupabaseConfigurado() || !Array.isArray(lista)) return;
  try {
    await supabase.from('base_motoristas').upsert({
      cpf: SYNC_CLI_CPF,
      nome: 'SISTEMA_CLIENTES_VERMONT',
      observacoes: JSON.stringify(lista),
      status_documental: 'REGULAR',
      atualizado_por: 'Sistema Envelopamento Vermont',
      atualizado_em: new Date().toISOString()
    }, { onConflict: 'cpf' });
  } catch (err) {}
};

/**
 * Consulta clientes cadastrados na nuvem
 */
const consultarClientesCadastradosNuvem = async () => {
  if (!isSupabaseConfigurado()) return [];

  // 1. Tentar tabela 'clientes'
  try {
    const { data, error } = await supabase.from('clientes').select('*').limit(3000);
    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (e) {}

  // 2. Fallback via espelho de sincronização em 'base_motoristas'
  try {
    const { data, error } = await supabase
      .from('base_motoristas')
      .select('observacoes')
      .eq('cpf', SYNC_CLI_CPF)
      .maybeSingle();

    if (!error && data?.observacoes) {
      const parsed = JSON.parse(data.observacoes);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}

  return [];
};

/**
 * Lê os clientes cadastrados localmente
 */
export const carregarClientesLocais = () => {
  try {
    const raw = localStorage.getItem(CLIENTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
};

/**
 * Salva a lista de clientes no LocalStorage
 */
export const salvarClientesLocais = (lista) => {
  try {
    localStorage.setItem(CLIENTES_STORAGE_KEY, JSON.stringify(lista));
  } catch (err) {}
};

/**
 * Cadastra ou atualiza um cliente
 */
export const salvarClienteCadastrado = async (dadosCliente) => {
  if (!dadosCliente || !dadosCliente.nome) return null;

  const nomeLimpo = String(dadosCliente.nome).trim().toUpperCase();
  const cnpjLimpo = String(dadosCliente.cnpj || '').trim();
  const id = dadosCliente.id || `cli_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const agora = new Date().toISOString();

  const clienteObj = {
    id,
    nome: nomeLimpo,
    cnpj: cnpjLimpo,
    telefone: dadosCliente.telefone || '',
    email: dadosCliente.email || '',
    cidade: dadosCliente.cidade || '',
    uf: dadosCliente.uf || '',
    observacoes: dadosCliente.observacoes || '',
    created_at: dadosCliente.created_at || agora,
    updated_at: agora
  };

  // Salvar no LocalStorage
  const locais = carregarClientesLocais();
  const index = locais.findIndex(c => c.nome === nomeLimpo || (c.id && c.id === id));
  if (index >= 0) {
    locais[index] = { ...locais[index], ...clienteObj };
  } else {
    locais.unshift(clienteObj);
  }
  salvarClientesLocais(locais);

  // Sincronizar no Supabase
  if (isSupabaseConfigurado()) {
    try {
      await supabase.from('clientes').upsert(clienteObj);
    } catch (e) {}
    sincronizarClientesNuvem(locais);
  }

  notificarAlteracaoEnvelopamento();
  return clienteObj;
};

/**
 * Exclui um cliente da base cadastrada
 */
export const excluirClienteCadastrado = async (idOuNome) => {
  const locais = carregarClientesLocais();
  const filtrados = locais.filter(c => c.id !== idOuNome && c.nome !== idOuNome);
  salvarClientesLocais(filtrados);

  if (isSupabaseConfigurado()) {
    try {
      await supabase.from('clientes').delete().or(`id.eq.${idOuNome},nome.eq.${idOuNome}`);
    } catch (err) {}
    sincronizarClientesNuvem(filtrados);
  }

  notificarAlteracaoEnvelopamento();
  return true;
};

import { 
  formatarCNPJ, 
  limparNomeEmpresa, 
  resolverCnpjCliente, 
  extrairCnpj,
  obterCnpjEmpresaCache
} from './agendamentoService.js';

/**
 * Pontua a qualidade e legibilidade de um nome de empresa.
 * Dá preferência a nomes com espaçamento adequado, palavras completas e sufixos legais (LTDA, S.A.),
 * descartando nomes grudados/concatenados sem espaços (ex: FAVORITADOBRASILMARMORESEGRANITOSLTDA).
 */
const calcularScoreNomeCliente = (nome = '') => {
  if (!nome) return -999;
  const texto = String(nome).trim();
  const semEspacos = texto.replace(/\s+/g, '');
  const qtdEspacos = (texto.match(/\s+/g) || []).length;
  
  // Nomes longos totalmente sem espaços (concatenados) recebem pontuação muito baixa
  if (qtdEspacos === 0 && semEspacos.length >= 14) {
    return -50;
  }
  
  let score = qtdEspacos * 15 + texto.length;
  if (/\bLTDA\b|\bS\/A\b|\bSA\b|\bEIRELI\b|\bME\b|\bEPP\b/i.test(texto)) score += 30;
  if (texto.includes(' - ')) score -= 5;
  return score;
};

/**
 * Dicionário canônico de CNPJ para empresas de referência conhecidas
 */
const CANONICAL_CNPJ_MAP = {
  'BRUNOLUCCHETTI': '07.825.404/0001-63',
  'BRASIGRAN': '32.476.525/0001-94',
  'VERMONT': '07.498.412/0001-30',
  'FAVORITA': '02.611.161/0001-47',
  'ZUCCHI': '02.261.378/0001-93',
  'TESTI': '02.484.582/0001-95',
  'DECOLORES': '04.148.665/0001-20',
  'ANTOLINI': '04.819.349/0001-64'
};

const CANONICAL_NAMES_BY_CNPJ = {
  '07825404000163': 'BRUNO LUCCHETTI DO BRASIL COMÉRCIO DE ROCHAS LTDA',
  '32476525000194': 'BRASIGRAN BRASILEIRA DE GRANITOS LTDA',
  '07498412000130': 'VERMONT MINERAÇÃO LTDA',
  '02611161000147': 'FAVORITA DO BRASIL MÁRMORES E GRANITOS LTDA'
};

/**
 * Obtém todos os clientes e CNPJs cadastrados e operados no sistema,
 * com deduplicação avançada por CNPJ (14 dígitos) e unificação inteligente de variações de nomes.
 */
export const obterClientesDoBancoDeDados = async () => {
  const itensColetados = [];

  const coletar = (nomeBruto, cnpjBruto, extra = {}) => {
    if (!nomeBruto && !cnpjBruto) return;

    let nome = limparNomeEmpresa(String(nomeBruto || '')).replace(/\s+/g, ' ').trim().toUpperCase();
    let cnpj = String(cnpjBruto || extrairCnpj(nomeBruto) || '').trim();

    const normKey = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]/g, '');

    // Se não tiver CNPJ ou se tiver CNPJ inconsistente, verifica a associação canônica
    for (const [prefix, canonCnpj] of Object.entries(CANONICAL_CNPJ_MAP)) {
      if (normKey.includes(prefix)) {
        cnpj = canonCnpj;
        break;
      }
    }

    if (!cnpj && nome) {
      const cnpjResolvido = obterCnpjEmpresaCache(nome);
      if (cnpjResolvido) cnpj = cnpjResolvido;
    }

    const cnpjFmt = cnpj ? formatarCNPJ(cnpj) : '';
    const cnpjDigitos = cnpjFmt.replace(/\D/g, '');

    // Se o CNPJ for conhecido, garante o nome canônico correto
    if (cnpjDigitos && CANONICAL_NAMES_BY_CNPJ[cnpjDigitos]) {
      nome = CANONICAL_NAMES_BY_CNPJ[cnpjDigitos];
    }

    // Descartar nomes que sejam apenas números, vazios ou marcadores genéricos
    if (!nome && !cnpjFmt) return;
    if (/^\d+$/.test(nome)) return;
    if (nome.startsWith('TESTE') || nome.startsWith('UNDEFINED') || nome === 'NULL') return;

    itensColetados.push({
      id: extra.id || `cli_${Math.random().toString(36).substr(2, 6)}`,
      nome: nome || (cnpjFmt ? `EMPRESA CNPJ ${cnpjFmt}` : ''),
      cnpj: cnpjFmt,
      cnpjDigitos: cnpjDigitos.length === 14 ? cnpjDigitos : '',
      telefone: extra.telefone || '',
      email: extra.email || '',
      cidade: extra.cidade || '',
      uf: extra.uf || '',
      observacoes: extra.observacoes || ''
    });
  };

  // 1. Clientes cadastrados explicitamente pelo usuário (LocalStorage e Nuvem)
  const locaisCadastrados = carregarClientesLocais();
  locaisCadastrados.forEach(c => coletar(c.nome, c.cnpj, c));

  if (isSupabaseConfigurado()) {
    try {
      const nuvemCadastrados = await consultarClientesCadastradosNuvem();
      nuvemCadastrados.forEach(c => coletar(c.nome, c.cnpj, c));
    } catch (e) {}
  }

  // 2. Clientes do módulo de envelopamentos
  const envsLocais = carregarEnvelopamentosLocais();
  envsLocais.forEach(e => coletar(e.cliente_nome, e.cliente_cnpj));

  // 3. Clientes de agendamentos no LocalStorage
  const chavesAgendamentos = ['vermont_agendamentos_local', 'vermont_agendamentos_locais', 'vermont_agendamentos'];
  chavesAgendamentos.forEach(chaveStorage => {
    try {
      const raw = localStorage.getItem(chaveStorage);
      if (raw) {
        const lista = JSON.parse(raw);
        if (Array.isArray(lista)) {
          lista.forEach(ag => {
            if (!ag) return;
            const cnpjAg = ag.cliente_cnpj || resolverCnpjCliente(ag) || ag.destinatario_cnpj || ag.cnpj_cliente;
            coletar(ag.cliente, cnpjAg);
            if (ag.ponto2?.cliente) coletar(ag.ponto2.cliente, ag.ponto2.cliente_cnpj);
            if (ag.ponto3?.cliente) coletar(ag.ponto3.cliente, ag.ponto3.cliente_cnpj);
          });
        }
      }
    } catch (e) {}
  });

  // 4. Clientes reais registrados no Supabase (tabela 'agendamentos_pedreira')
  if (isSupabaseConfigurado()) {
    try {
      const { data: agsSupabase } = await supabase
        .from('agendamentos_pedreira')
        .select('cliente, cliente_cnpj, observacoes')
        .limit(3000);

      if (Array.isArray(agsSupabase)) {
        agsSupabase.forEach(ag => {
          if (!ag || !ag.cliente) return;
          const cnpjAg = ag.cliente_cnpj || resolverCnpjCliente(ag);
          coletar(ag.cliente, cnpjAg);
        });
      }
    } catch (err) {}
  }

  // ========================================================
  // DEDUPLICAÇÃO INTELIGENTE:
  // Agrupa exclusivamente por CNPJ ou por Raiz de Nome do Cliente
  // ========================================================
  const mapaPorChaveUnica = new Map();

  for (const item of itensColetados) {
    const nomeLimpo = item.nome.trim().toUpperCase();
    const normKey = nomeLimpo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]/g, '');
    if (!normKey && !item.cnpjDigitos) continue;

    // Chave única: se tiver CNPJ válido de 14 dígitos usa o CNPJ, caso contrário usa a chave do nome
    const chaveUnica = item.cnpjDigitos || `NOME_${normKey}`;

    if (!mapaPorChaveUnica.has(chaveUnica)) {
      mapaPorChaveUnica.set(chaveUnica, {
        id: item.id,
        nome: nomeLimpo,
        cnpj: item.cnpj,
        cnpjDigitos: item.cnpjDigitos,
        telefone: item.telefone,
        email: item.email,
        cidade: item.cidade,
        uf: item.uf,
        observacoes: item.observacoes,
        normKey
      });
    } else {
      const existente = mapaPorChaveUnica.get(chaveUnica);
      if (calcularScoreNomeCliente(nomeLimpo) > calcularScoreNomeCliente(existente.nome)) {
        existente.nome = nomeLimpo;
        existente.normKey = normKey;
      }
      if (!existente.cnpj && item.cnpj) {
        existente.cnpj = item.cnpj;
        existente.cnpjDigitos = item.cnpjDigitos;
      }
      if (item.telefone && !existente.telefone) existente.telefone = item.telefone;
      if (item.email && !existente.email) existente.email = item.email;
    }
  }

  // Segunda passada: Unifica nomes idênticos que possam ter ficado com chaves diferentes
  const mapaFinal = new Map();
  for (const cli of mapaPorChaveUnica.values()) {
    const chaveNome = cli.normKey.slice(0, 20); // Primeiras 20 letras da raiz
    if (!mapaFinal.has(chaveNome)) {
      mapaFinal.set(chaveNome, cli);
    } else {
      const existente = mapaFinal.get(chaveNome);
      // Se um tem CNPJ e o outro não, mantém o com CNPJ
      if (!existente.cnpj && cli.cnpj) {
        mapaFinal.set(chaveNome, cli);
      } else if (calcularScoreNomeCliente(cli.nome) > calcularScoreNomeCliente(existente.nome)) {
        existente.nome = cli.nome;
      }
    }
  }

  const resultado = Array.from(mapaFinal.values());
  resultado.sort((a, b) => a.nome.localeCompare(b.nome));
  return resultado;
};
