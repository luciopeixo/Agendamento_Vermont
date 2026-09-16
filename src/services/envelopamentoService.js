import { supabase, isSupabaseConfigurado } from '../lib/supabase.js';

const LOCAL_STORAGE_KEY = 'vermont_envelopamentos_locais';

/**
 * Definição dos Status possíveis do Envelopamento de Bloco
 */
export const STATUS_ENVELOPAMENTO = {
  PENDENTE: {
    id: 'pendente',
    label: 'Pendente',
    cor: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.15)',
    border: '#64748b',
    descricao: 'Aguardando início do envelopamento'
  },
  EM_ENVELOPAMENTO: {
    id: 'em_envelopamento',
    label: 'Em Envelopamento',
    cor: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: '#d97706',
    descricao: 'Bloco passando pelo processo físico de envelopamento'
  },
  CONFERIDO: {
    id: 'conferido',
    label: 'Conferido',
    cor: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: '#0284c7',
    descricao: 'Qualidade e medidas conferidas pela equipe Vermont'
  },
  LIBERADO: {
    id: 'liberado',
    label: 'Liberado p/ Agendamento',
    cor: '#4ade80',
    bg: 'rgba(34, 197, 94, 0.15)',
    border: '#22c55e',
    descricao: 'Bloco pronto e disponível para agendamento de carregamento'
  },
  AGENDADO: {
    id: 'agendado',
    label: 'Agendado',
    cor: '#c084fc',
    bg: 'rgba(192, 132, 252, 0.15)',
    border: '#a855f7',
    descricao: 'Bloco vinculado a um agendamento de transporte'
  },
  CARREGADO: {
    id: 'carregado',
    label: 'Carregado',
    cor: '#a3e635',
    bg: 'rgba(163, 230, 53, 0.15)',
    border: '#84cc16',
    descricao: 'Carregamento finalizado e caminhão liberado'
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

/**
 * Salva ou atualiza um registro de envelopamento
 */
export const salvarEnvelopamento = async (dados, usuarioNome = 'Equipe Vermont') => {
  const agora = new Date().toISOString();
  const id = dados.id || `env_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  const registroCompleto = {
    id,
    numero_bloco: String(dados.numero_bloco || '').trim().toUpperCase(),
    cliente_nome: String(dados.cliente_nome || '').trim(),
    cliente_cnpj: String(dados.cliente_cnpj || '').trim(),
    material: String(dados.material || '').trim(),
    pedreira_id: dados.pedreira_id || '',
    pedreira_nome: dados.pedreira_nome || '',
    comprimento: dados.comprimento ? Number(dados.comprimento) : null,
    largura: dados.largura ? Number(dados.largura) : null,
    altura: dados.altura ? Number(dados.altura) : null,
    metro_cubico: dados.metro_cubico ? Number(dados.metro_cubico) : (
      dados.comprimento && dados.largura && dados.altura
        ? Number((Number(dados.comprimento) * Number(dados.largura) * Number(dados.altura)).toFixed(3))
        : null
    ),
    peso_ton: dados.peso_ton ? Number(dados.peso_ton) : null,
    status: dados.status || 'pendente',
    responsavel_envelopamento: dados.responsavel_envelopamento || (dados.status === 'em_envelopamento' ? usuarioNome : null),
    responsavel_conferencia: dados.responsavel_conferencia || (dados.status === 'conferido' ? usuarioNome : null),
    responsavel_liberacao: dados.responsavel_liberacao || (dados.status === 'liberado' ? usuarioNome : null),
    data_cadastro: dados.data_cadastro || agora,
    data_envelopamento: dados.data_envelopamento || (dados.status === 'em_envelopamento' ? agora : null),
    data_liberacao: dados.data_liberacao || (dados.status === 'liberado' ? agora : null),
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

  if (novoStatus === 'em_envelopamento') {
    atualizacoes.responsavel_envelopamento = usuarioNome;
    atualizacoes.data_envelopamento = agora;
  } else if (novoStatus === 'conferido') {
    atualizacoes.responsavel_conferencia = usuarioNome;
  } else if (novoStatus === 'liberado') {
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
    } catch (err) {
      console.warn('[Envelopamento] Falha ao excluir do Supabase:', err);
    }
  }

  return true;
};

/**
 * Importa múltiplos blocos em lote (ex: colando lista de números de blocos)
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
 * Calcula os totais e métricas para os cards de resumo
 */
export const calcularMetricasEnvelopamento = (lista = []) => {
  return {
    total: lista.length,
    pendentes: lista.filter(i => i.status === 'pendente').length,
    em_envelopamento: lista.filter(i => i.status === 'em_envelopamento').length,
    conferidos: lista.filter(i => i.status === 'conferido').length,
    liberados: lista.filter(i => i.status === 'liberado').length,
    agendados: lista.filter(i => i.status === 'agendado' || i.status === 'carregado').length,
  };
};

/**
 * Obtém todos os clientes únicos existentes no banco de dados / agendamentos / envelopamentos
 */
export const obterClientesDoBancoDeDados = async () => {
  const mapaClientes = new Map();

  const adicionarCliente = (nome, cnpj) => {
    if (!nome) return;
    const nomeLimpo = String(nome).trim().toUpperCase();
    if (!nomeLimpo || nomeLimpo.length < 2) return;

    const cnpjLimpo = cnpj ? String(cnpj).trim() : '';
    const chave = nomeLimpo;

    if (!mapaClientes.has(chave)) {
      mapaClientes.set(chave, {
        nome: nomeLimpo,
        cnpj: cnpjLimpo
      });
    } else if (cnpjLimpo && !mapaClientes.get(chave).cnpj) {
      mapaClientes.get(chave).cnpj = cnpjLimpo;
    }
  };

  // Clientes comuns da Vermont
  const clientesPadrao = [
    { nome: 'THOR GRANITOS LTDA', cnpj: '08.234.567/0001-89' },
    { nome: 'ARGOS GRANITOS E ROCHAS LTDA', cnpj: '10.987.654/0001-32' },
    { nome: 'GRANITOS DO BRASIL S/A', cnpj: '' },
    { nome: 'MINERAÇÃO SANTA LUZIA', cnpj: '' }
  ];
  clientesPadrao.forEach(c => adicionarCliente(c.nome, c.cnpj));

  // Ler dos Envelopamentos locais
  const envLocais = carregarEnvelopamentosLocais();
  envLocais.forEach(e => adicionarCliente(e.cliente_nome, e.cliente_cnpj));

  // Ler dos Agendamentos locais
  try {
    const rawAg = localStorage.getItem('vermont_agendamentos_locais');
    if (rawAg) {
      const ags = JSON.parse(rawAg);
      if (Array.isArray(ags)) {
        ags.forEach(a => adicionarCliente(a.cliente, a.cliente_cnpj));
      }
    }
  } catch (err) {}

  // Consultar no Supabase se conectado
  if (isSupabaseConfigurado()) {
    try {
      const { data: agsSupabase } = await supabase
        .from('agendamentos')
        .select('cliente, cliente_cnpj')
        .limit(2000);

      if (Array.isArray(agsSupabase)) {
        agsSupabase.forEach(a => adicionarCliente(a.cliente, a.cliente_cnpj));
      }
    } catch (err) {}

    try {
      const { data: envSupabase } = await supabase
        .from('envelopamentos')
        .select('cliente_nome, cliente_cnpj')
        .limit(2000);

      if (Array.isArray(envSupabase)) {
        envSupabase.forEach(e => adicionarCliente(e.cliente_nome, e.cliente_cnpj));
      }
    } catch (err) {}
  }

  const resultado = Array.from(mapaClientes.values());
  resultado.sort((a, b) => a.nome.localeCompare(b.nome));
  return resultado;
};

