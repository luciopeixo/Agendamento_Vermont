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

/**
 * Lista todos os envelopamentos (Supabase com fallback para LocalStorage)
 */
export const listarEnvelopamentos = async (filtros = {}) => {
  let dados = [];

  if (isSupabaseConfigurado()) {
    try {
      let query = supabase.from('envelopamentos').select('*').order('created_at', { ascending: false });

      if (filtros.pedreira) {
        query = query.eq('pedreira_nome', filtros.pedreira);
      }
      if (filtros.status) {
        query = query.eq('status', filtros.status);
      }
      if (filtros.cliente) {
        query = query.ilike('cliente_nome', `%${filtros.cliente}%`);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        dados = data;
      } else {
        dados = carregarEnvelopamentosLocais();
      }
    } catch (err) {
      dados = carregarEnvelopamentosLocais();
    }
  } else {
    dados = carregarEnvelopamentosLocais();
  }

  if (dados.length === 0) {
    dados = carregarEnvelopamentosLocais();
  }

  // Normalizar status legados caso existam
  dados = dados.map(item => {
    let st = item.status;
    if (st === 'pendente') st = 'pendente_envelopamento';
    if (st === 'em_envelopamento') st = 'em_andamento';
    if (st === 'conferido' || st === 'liberado') st = 'envelopado';
    return { ...item, status: st };
  });

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
 * (via Supabase Realtime, eventos da janela local e Storage entre abas).
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

  // Notificar ouvintes locais imediatamente
  notificarAlteracaoEnvelopamento();

  // Também registra automaticamente o cliente na base de clientes se informado
  if (registroCompleto.cliente_nome) {
    salvarClienteCadastrado({
      nome: registroCompleto.cliente_nome,
      cnpj: registroCompleto.cliente_cnpj
    }).catch(() => {});
  }

  // 2. Tentar persistir no Supabase se disponível
  if (isSupabaseConfigurado()) {
    try {
      const { error } = await supabase.from('envelopamentos').upsert(registroCompleto);
      if (error) {
        console.warn('[Envelopamento] Aviso ao sincronizar com Supabase:', error.message);
      }
    } catch (err) {
      console.warn('[Envelopamento] Falha ao persistir no Supabase (salvo apenas localmente):', err);
    }
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

  notificarAlteracaoEnvelopamento();

  if (isSupabaseConfigurado()) {
    try {
      await supabase.from('envelopamentos').delete().eq('id', id);
    } catch (err) {
      console.warn('[Envelopamento] Falha ao excluir do Supabase:', err);
    }
  }

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

// ==========================================
// CADASTRO E GESTÃO DE CLIENTES
// ==========================================

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

  // Tentar salvar no Supabase
  if (isSupabaseConfigurado()) {
    try {
      await supabase.from('clientes').upsert(clienteObj);
    } catch (err) {}
  }

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
  }

  return true;
};

import { 
  CNPJ_CONHECIDOS_PADRAO, 
  formatarCNPJ, 
  limparNomeEmpresa, 
  resolverCnpjCliente, 
  extrairCnpj 
} from './agendamentoService.js';

/**
 * Obtém todos os clientes e CNPJs únicos existentes em todas as bases do sistema
 */
export const obterClientesDoBancoDeDados = async () => {
  const mapaClientes = new Map();

  const adicionarCliente = (nome, cnpj, extra = {}) => {
    if (!nome && !cnpj) return;
    
    // Tenta extrair CNPJ se estiver dentro do nome
    const cnpjExtraido = cnpj || extrairCnpj(nome) || '';
    const nomeLimpo = limparNomeEmpresa(String(nome || '')).trim().toUpperCase();
    const cnpjFmt = cnpjExtraido ? formatarCNPJ(cnpjExtraido) : '';

    if (!nomeLimpo && !cnpjFmt) return;
    
    // Chave única primária por nome ou por CNPJ
    const chave = nomeLimpo || cnpjFmt;

    if (!mapaClientes.has(chave)) {
      mapaClientes.set(chave, {
        id: extra.id || `cli_${Math.random().toString(36).substr(2, 6)}`,
        nome: nomeLimpo || `EMPRESA CNPJ ${cnpjFmt}`,
        cnpj: cnpjFmt,
        telefone: extra.telefone || '',
        email: extra.email || '',
        observacoes: extra.observacoes || ''
      });
    } else {
      const existente = mapaClientes.get(chave);
      if (cnpjFmt && !existente.cnpj) existente.cnpj = cnpjFmt;
      if (nomeLimpo && (!existente.nome || existente.nome.startsWith('EMPRESA CNPJ'))) existente.nome = nomeLimpo;
      if (extra.telefone && !existente.telefone) existente.telefone = extra.telefone;
      if (extra.email && !existente.email) existente.email = extra.email;
    }
  };

  // 1. Clientes da lista oficial conhecida
  if (typeof CNPJ_CONHECIDOS_PADRAO === 'object') {
    Object.entries(CNPJ_CONHECIDOS_PADRAO).forEach(([chave, cnpj]) => {
      let nomeFormatado = chave
        .replace(/([A-Z])/g, ' $1')
        .replace(/\bLTDA\b/g, ' LTDA')
        .replace(/\bEIRELI\b/g, ' EIRELI')
        .replace(/\bSA\b/g, ' S/A')
        .trim();
      adicionarCliente(nomeFormatado, cnpj);
    });
  }

  // 2. Cache persistente de CNPJs de empresas (vermont_cnpj_empresas_cache)
  try {
    const rawCache = localStorage.getItem('vermont_cnpj_empresas_cache');
    if (rawCache) {
      const mapaCache = JSON.parse(rawCache);
      if (typeof mapaCache === 'object') {
        Object.entries(mapaCache).forEach(([k, cnpj]) => {
          adicionarCliente(k, cnpj);
        });
      }
    }
  } catch (err) {}

  // 3. Clientes cadastrados explicitamente pelo usuário
  const clientesCadastrados = carregarClientesLocais();
  clientesCadastrados.forEach(c => adicionarCliente(c.nome, c.cnpj, c));

  // 4. Ler de todos os agendamentos locais (vermont_agendamentos_local e variantes)
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
            adicionarCliente(ag.cliente, cnpjAg);
            
            // Ponto 2 e Ponto 3 de cargas combinadas
            if (ag.ponto2 && ag.ponto2.cliente) {
              adicionarCliente(ag.ponto2.cliente, ag.ponto2.cliente_cnpj);
            }
            if (ag.ponto3 && ag.ponto3.cliente) {
              adicionarCliente(ag.ponto3.cliente, ag.ponto3.cliente_cnpj);
            }
          });
        }
      }
    } catch (e) {}
  });

  // 5. Ler dos Envelopamentos locais
  const envLocais = carregarEnvelopamentosLocais();
  envLocais.forEach(e => adicionarCliente(e.cliente_nome, e.cliente_cnpj));

  // 6. Consultar no Supabase se conectado
  if (isSupabaseConfigurado()) {
    try {
      const { data: cliSupabase } = await supabase.from('clientes').select('*').limit(2000);
      if (Array.isArray(cliSupabase)) {
        cliSupabase.forEach(c => adicionarCliente(c.nome, c.cnpj, c));
      }
    } catch (err) {}

    try {
      const { data: agsSupabase } = await supabase
        .from('agendamentos')
        .select('*')
        .limit(3000);

      if (Array.isArray(agsSupabase)) {
        agsSupabase.forEach(ag => {
          if (!ag) return;
          const cnpjAg = ag.cliente_cnpj || ag.destinatario_cnpj || ag.cnpj_cliente || resolverCnpjCliente(ag);
          adicionarCliente(ag.cliente, cnpjAg);
          if (ag.ponto2?.cliente) adicionarCliente(ag.ponto2.cliente, ag.ponto2.cliente_cnpj);
          if (ag.ponto3?.cliente) adicionarCliente(ag.ponto3.cliente, ag.ponto3.cliente_cnpj);
        });
      }
    } catch (err) {}

    try {
      const { data: envSupabase } = await supabase.from('envelopamentos').select('cliente_nome, cliente_cnpj').limit(3000);
      if (Array.isArray(envSupabase)) {
        envSupabase.forEach(e => adicionarCliente(e.cliente_nome, e.cliente_cnpj));
      }
    } catch (err) {}
  }

  const resultado = Array.from(mapaClientes.values());
  resultado.sort((a, b) => a.nome.localeCompare(b.nome));
  return resultado;
};
