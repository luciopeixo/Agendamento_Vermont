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
    return Array.isArray(parsed) ? parsed.map(item => parseItemDeSupabaseEnvelopamentos(item)) : [];
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

const COLUNAS_VALIDAS_ENVELOPAMENTOS = new Set([
  'id',
  'numero_bloco',
  'cliente_nome',
  'cliente_cnpj',
  'material',
  'pedreira_id',
  'pedreira_nome',
  'status',
  'responsavel_envelopamento',
  'responsavel_liberacao',
  'data_cadastro',
  'data_envelopamento',
  'data_liberacao',
  'observacoes',
  'agendamento_id',
  'created_at',
  'updated_at'
]);

/**
 * Formata um item de envelopamento garantindo compatibilidade estrita com a tabela do Supabase
 * e serializando campos adicionais (romaneio, peso) nas observações
 */
export const formatarItemParaSupabaseEnvelopamentos = (item) => {
  let obs = (item.observacoes || '')
    .replace(/\[ROM:[^\]]*\]/gi, '')
    .replace(/\[PESO:[^\]]*\]/gi, '')
    .replace(/\[DATA_ROM:[^\]]*\]/gi, '')
    .trim();

  const tags = [];
  if (item.numero_romaneio) tags.push(`[ROM:${item.numero_romaneio}]`);
  if (item.peso_kg) tags.push(`[PESO:${item.peso_kg}]`);
  if (item.data_romaneio) tags.push(`[DATA_ROM:${item.data_romaneio}]`);

  const observacoesComTags = tags.length > 0 ? `${tags.join('')} ${obs}`.trim() : obs;
  const row = {};
  for (const col of COLUNAS_VALIDAS_ENVELOPAMENTOS) {
    if (col === 'observacoes') {
      row.observacoes = observacoesComTags;
    } else if (item[col] !== undefined) {
      row[col] = item[col];
    }
  }
  return row;
};

const MAPA_MATERIAL_PADRAO_PEDREIRA = {
  'taj mahal': { id: 'uruoca', nome: 'Uruoca - CE (Taj Mahal)' },
  'infinity brown': { id: 'massape_negresco', nome: 'Massapê - CE (Negresco)' },
  'infinity black': { id: 'massape_negresco', nome: 'Massapê - CE (Negresco)' },
  'negresco': { id: 'massape_negresco', nome: 'Massapê - CE (Negresco)' },
  'brownie': { id: 'massape_negresco', nome: 'Massapê - CE (Negresco)' },
  'brown strings': { id: 'massape_negresco', nome: 'Massapê - CE (Negresco)' },
  'kouros': { id: 'massape_negresco', nome: 'Massapê - CE (Negresco)' },
  'jj brown': { id: 'massape_negresco', nome: 'Massapê - CE (Negresco)' },
  'tellus': { id: 'massape_negresco', nome: 'Massapê - CE (Negresco)' },
  'del mare': { id: 'massape_delmare', nome: 'Massapê - CE (Del Mare)' },
  'chateau blanc': { id: 'massape_delmare', nome: 'Massapê - CE (Del Mare)' },
  'breccia viola': { id: 'massape_delmare', nome: 'Massapê - CE (Del Mare)' },
  'evora': { id: 'massape_delmare', nome: 'Massapê - CE (Del Mare)' },
  'breccia imperiale': { id: 'sobral_jaibaras', nome: 'Sobral - CE (Jaibaras)' },
  'zitan': { id: 'sobral_jaibaras', nome: 'Sobral - CE (Jaibaras)' },
  'scenario': { id: 'sobral_jaibaras', nome: 'Sobral - CE (Jaibaras)' },
  'naurika': { id: 'beberibe', nome: 'Beberibe - CE' },
  'blue deep': { id: 'serrote', nome: 'São Gonçalo do Amarante - CE (Serrote)' },
  'panettone': { id: 'serrote', nome: 'São Gonçalo do Amarante - CE (Serrote)' },
  'roma imperiale': { id: 'serrote', nome: 'São Gonçalo do Amarante - CE (Serrote)' },
  'tellus blue': { id: 'serrote', nome: 'São Gonçalo do Amarante - CE (Serrote)' },
  'atlantic blue': { id: 'serrote', nome: 'São Gonçalo do Amarante - CE (Serrote)' },
  'illusion': { id: 'serrote', nome: 'São Gonçalo do Amarante - CE (Serrote)' },
  'blue mare': { id: 'serrote', nome: 'São Gonçalo do Amarante - CE (Serrote)' },
  'blue roma': { id: 'serrote', nome: 'São Gonçalo do Amarante - CE (Serrote)' },
  'raffinato': { id: 'beberibe', nome: 'Beberibe - CE' },
  'guiness': { id: 'beberibe', nome: 'Beberibe - CE' },
  'nouveau': { id: 'beberibe', nome: 'Beberibe - CE' },
  'cristallo absolut': { id: 'uruacu', nome: 'Uruaçu - GO' },
  'cristallo absolute': { id: 'uruacu', nome: 'Uruaçu - GO' },
  'cristallo': { id: 'uruacu', nome: 'Uruaçu - GO' }
};

/**
 * Reconstrói os campos expandidos a partir das linhas retornadas pelo Supabase
 */
export const parseItemDeSupabaseEnvelopamentos = (row) => {
  if (!row) return row;
  let obs = row.observacoes || '';
  let rom = row.numero_romaneio || '';
  let peso = row.peso_kg || '';
  let dataRom = row.data_romaneio || '';

  const matchRom = obs.match(/\[ROM:\s*([^\]]+)\]/i);
  if (matchRom) rom = matchRom[1].trim();

  const matchPeso = obs.match(/\[PESO:\s*([^\]]+)\]/i);
  if (matchPeso) peso = matchPeso[1].trim();

  const matchData = obs.match(/\[DATA_ROM:\s*([^\]]+)\]/i);
  if (matchData) dataRom = matchData[1].trim();

  const obsLimpa = obs
    .replace(/\[ROM:[^\]]*\]/gi, '')
    .replace(/\[PESO:[^\]]*\]/gi, '')
    .replace(/\[DATA_ROM:[^\]]*\]/gi, '')
    .trim();

  let pedId = row.pedreira_id;
  let pedNome = row.pedreira_nome;
  let matFinal = row.material || '';
  const matUpper = String(row.material || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  if (matUpper.includes('CRISTALLO')) {
    matFinal = 'Cristallo Absolut';
    pedId = 'uruacu';
    pedNome = 'Uruaçu - GO';
  } else if (matUpper.includes('NAURIKA')) {
    matFinal = 'Naurika';
    pedId = 'beberibe';
    pedNome = 'Beberibe - CE';
  } else if (matUpper.includes('BLUE DEEP')) {
    matFinal = 'Blue Deep';
    pedId = 'serrote';
    pedNome = 'São Gonçalo do Amarante - CE (Serrote)';
  } else if (matUpper.includes('NEGRESCO')) {
    matFinal = 'Negresco';
    pedId = 'massape_negresco';
    pedNome = 'Massapê - CE (Negresco)';
  } else if (matUpper.includes('DEL MARE') || matUpper.includes('DELMARE')) {
    matFinal = 'Del Mare';
    pedId = 'massape_delmare';
    pedNome = 'Massapê - CE (Del Mare)';
  } else if (matUpper.includes('TAJ MAHAL') || matUpper.includes('TAJMAHAL')) {
    matFinal = 'Taj Mahal';
    pedId = 'uruoca';
    pedNome = 'Uruoca - CE (Taj Mahal)';
  } else {
    const matKey = String(row.material || '').toLowerCase().trim();
    const pedPadrao = MAPA_MATERIAL_PADRAO_PEDREIRA[matKey];
    if (pedPadrao) {
      if (!pedId || pedId === 'uruoca' || pedId !== pedPadrao.id) {
        pedId = pedPadrao.id;
        pedNome = pedPadrao.nome;
      }
    }
  }

  return {
    ...row,
    material: matFinal,
    pedreira_id: pedId,
    pedreira_nome: pedNome,
    numero_romaneio: rom,
    peso_kg: peso,
    data_romaneio: dataRom,
    observacoes: obsLimpa
  };
};

/**
 * Normaliza o número do bloco para comparação e padronização (ex: 126 -> 0126, 1/26 -> 01/26)
 */
export const normalizarNumeroBloco = (bloco = '') => {
  let str = String(bloco || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');

  if (/^\d{3}$/.test(str)) {
    const seq = str.slice(0, 1);
    const ano = str.slice(1);
    const anoNum = parseInt(ano, 10);
    if (anoNum >= 20 && anoNum <= 35) {
      str = `0${seq}${ano}`;
    }
  } else if (/^\d\/\d{2}$/.test(str)) {
    const partes = str.split('/');
    str = `0${partes[0]}/${partes[1]}`;
  }

  return str;
};

/**
 * Normaliza a pedreira para identificação consistente
 */
export const normalizarPedreira = (pedId = '', pedNome = '') => {
  const texto = `${pedId || ''} ${pedNome || ''}`.toLowerCase();
  if (texto.includes('uruoca')) return 'uruoca';
  if (texto.includes('massape') || texto.includes('massapê')) return 'massape';
  if (texto.includes('sobral') || texto.includes('jaibaras')) return 'sobral';
  if (texto.includes('serrote') || texto.includes('sao goncalo') || texto.includes('são gonçalo')) return 'serrote';
  if (texto.includes('beberibe')) return 'beberibe';
  if (texto.includes('uruacu') || texto.includes('uruaçu') || texto.includes('goias') || texto.includes('goiás')) return 'uruacu';
  if (texto.includes('hidrolandia') || texto.includes('hidrolândia')) return 'hidrolandia';
  if (texto.includes('banabuiu') || texto.includes('banabuiú')) return 'banabuiu';
  if (texto.includes('santa_quiteria') || texto.includes('quiteria') || texto.includes('quitéria')) return 'santa_quiteria';
  return String(pedId || pedNome || '').trim().toLowerCase();
};

/**
 * Normaliza o cliente (preferência por dígitos do CNPJ, ou raiz textual do nome)
 */
export const normalizarCliente = (nome = '', cnpj = '') => {
  const cnpjDigitos = String(cnpj || '').replace(/\D/g, '');
  if (cnpjDigitos.length === 14) {
    return `CNPJ_${cnpjDigitos}`;
  }
  const nomeLimpo = String(nome || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\b(LTDA|ME|EPP|EIRELI|S\/A|SA|SOCIEDADE|ANONIMA|LIMITADA|DO BRASIL|BRASIL|COMERCIO|EXPORTACAO|IMPORTACAO|ROCHAS|MINERACAO|MARMORES|GRANITOS)\b/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .trim();
  return `NOME_${nomeLimpo.slice(0, 15)}`;
};

/**
 * Normaliza o material
 */
export const normalizarMaterial = (material = '') => {
  return String(material || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
};

/**
 * Gera uma chave unificada de duplicidade para Bloco + Cliente + Material + Pedreira
 */
export const gerarChaveDuplicidade = ({ numero_bloco, cliente_nome, cliente_cnpj, material, pedreira_id, pedreira_nome }) => {
  const b = normalizarNumeroBloco(numero_bloco);
  const c = normalizarCliente(cliente_nome, cliente_cnpj);
  const m = normalizarMaterial(material);
  const p = normalizarPedreira(pedreira_id, pedreira_nome);
  if (!b) return '';
  return `${b}___${c}___${m}___${p}`;
};

/**
 * Verifica se um bloco já existe cadastrado com o mesmo cliente, material e pedreira
 */
export const verificarDuplicidadeBloco = ({
  numero_bloco,
  cliente_nome,
  cliente_cnpj,
  material,
  pedreira_id,
  pedreira_nome,
  idAtual = null,
  listaExistente = []
}) => {
  if (!numero_bloco) return { ehDuplicado: false, existente: null };
  const chaveAlvo = gerarChaveDuplicidade({ numero_bloco, cliente_nome, cliente_cnpj, material, pedreira_id, pedreira_nome });
  if (!chaveAlvo) return { ehDuplicado: false, existente: null };

  const existente = listaExistente.find(item => {
    if (idAtual && item.id === idAtual) return false;
    const chaveItem = gerarChaveDuplicidade({
      numero_bloco: item.numero_bloco,
      cliente_nome: item.cliente_nome,
      cliente_cnpj: item.cliente_cnpj,
      material: item.material,
      pedreira_id: item.pedreira_id,
      pedreira_nome: item.pedreira_nome
    });
    return chaveItem === chaveAlvo;
  });

  return {
    ehDuplicado: !!existente,
    existente: existente || null
  };
};

export const verificarDuplicidadeIndividual = verificarDuplicidadeBloco;

/**
 * Analisa uma lista de blocos (ex: importação PDF ou lote) identificando duplicidades
 * tanto em relação aos registros já salvos no sistema quanto entre si mesmos.
 */
export const identificarDuplicidadesEmLista = (listaNova = [], listaExistente = []) => {
  const mapaExistentes = new Map();
  listaExistente.forEach(item => {
    const chave = gerarChaveDuplicidade({
      numero_bloco: item.numero_bloco,
      cliente_nome: item.cliente_nome,
      cliente_cnpj: item.cliente_cnpj,
      material: item.material,
      pedreira_id: item.pedreira_id,
      pedreira_nome: item.pedreira_nome
    });
    if (chave && !mapaExistentes.has(chave)) {
      mapaExistentes.set(chave, item);
    }
  });

  const chavesNoLote = new Map();

  return listaNova.map((item, idx) => {
    const chave = gerarChaveDuplicidade({
      numero_bloco: item.numero_bloco,
      cliente_nome: item.cliente_nome,
      cliente_cnpj: item.cliente_cnpj,
      material: item.material,
      pedreira_id: item.pedreira_id,
      pedreira_nome: item.pedreira_nome
    });

    if (!chave) {
      return { ...item, ehDuplicado: false, motivoDuplicidade: null, itemOriginal: null };
    }

    if (mapaExistentes.has(chave)) {
      const original = mapaExistentes.get(chave);
      const romOrig = original.numero_romaneio || 'S/N';
      return {
        ...item,
        ehDuplicado: true,
        motivoDuplicidade: `Já cadastrado no sistema (Romaneio: ${romOrig}, Status: ${original.status})`,
        itemOriginal: original
      };
    }

    if (chavesNoLote.has(chave)) {
      return {
        ...item,
        ehDuplicado: true,
        motivoDuplicidade: `Repetido neste mesmo romaneio/lote (Bloco duplicado)`,
        itemOriginal: null
      };
    }

    chavesNoLote.set(chave, idx);
    return { ...item, ehDuplicado: false, motivoDuplicidade: null, itemOriginal: null };
  });
};

/**
 * Consulta a lista de envelopamentos na nuvem diretamente na tabela oficial
 */
const consultarEnvelopamentosNuvem = async () => {
  if (!isSupabaseConfigurado()) return null;

  try {
    const { data, error } = await supabase
      .from('envelopamentos')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      return data.map(parseItemDeSupabaseEnvelopamentos);
    }
  } catch (e) {
    console.warn('[Envelopamento] Falha ao consultar tabela envelopamentos:', e);
  }

  return null;
};

/**
 * Lista todos os envelopamentos (Supabase é a fonte da verdade; LocalStorage atua como cache/fallback offline)
 */
export const listarEnvelopamentos = async (filtros = {}) => {
  let dados = [];
  const dadosLocais = carregarEnvelopamentosLocais();

  if (isSupabaseConfigurado()) {
    const dadosNuvem = await consultarEnvelopamentosNuvem();
    if (dadosNuvem !== null && Array.isArray(dadosNuvem)) {
      dados = dadosNuvem;
      // Atualiza o cache do LocalStorage para manter paridade exata com o banco de dados
      salvarEnvelopamentosLocais(dados);
    } else {
      // Fallback para cache local apenas se a consulta ao Supabase falhar completamente (offline)
      dados = dadosLocais;
    }
  } else {
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
 * (via Supabase Realtime na tabela 'envelopamentos', eventos da janela local e Storage entre abas).
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
  const locais = carregarEnvelopamentosLocais();

  // Validação e bloqueio estrito contra duplicidades
  const checagemDuplicidade = verificarDuplicidadeBloco({
    numero_bloco: dados.numero_bloco,
    cliente_nome: dados.cliente_nome,
    cliente_cnpj: dados.cliente_cnpj,
    material: dados.material,
    pedreira_id: dados.pedreira_id,
    pedreira_nome: dados.pedreira_nome,
    idAtual: dados.id,
    listaExistente: locais
  });

  if (checagemDuplicidade.ehDuplicado) {
    const orig = checagemDuplicidade.existente;
    const msgRomaneio = orig?.numero_romaneio ? ` (Romaneio original: ${orig.numero_romaneio})` : '';
    throw new Error(`Inclusão bloqueada: O bloco "${dados.numero_bloco}" já está cadastrado para o cliente "${dados.cliente_nome}" (${dados.material} - ${dados.pedreira_nome || dados.pedreira_id})${msgRomaneio}.`);
  }

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
    numero_romaneio: String(dados.numero_romaneio || dados.romaneio_numero || '').trim().toUpperCase(),
    data_romaneio: String(dados.data_romaneio || dados.data_emissao || '').trim(),
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
  const index = locais.findIndex(item => item.id === id);
  if (index >= 0) {
    locais[index] = { ...locais[index], ...registroCompleto };
  } else {
    locais.unshift(registroCompleto);
  }
  salvarEnvelopamentosLocais(locais);

  // 2. Sincronizar na nuvem (Supabase)
  if (isSupabaseConfigurado()) {
    try {
      const rowDB = formatarItemParaSupabaseEnvelopamentos(registroCompleto);
      await supabase.from('envelopamentos').upsert(rowDB, { onConflict: 'id' });
    } catch (e) {
      console.warn('[Envelopamento] Falha ao upsert na tabela envelopamentos:', e);
    }
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
 * Atualiza o status de múltiplos registros de envelopamento em lote
 */
export const atualizarStatusEnvelopamentosEmLote = async (ids = [], novoStatus, usuarioNome = 'Equipe Vermont') => {
  if (!Array.isArray(ids) || ids.length === 0 || !novoStatus) return true;

  const setIds = new Set(ids);
  const locais = carregarEnvelopamentosLocais();
  const agora = new Date().toISOString();

  const itensAtualizados = [];

  const novaLista = locais.map(item => {
    if (!setIds.has(item.id)) return item;

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

    const atualizado = { ...item, ...atualizacoes };
    itensAtualizados.push(atualizado);
    return atualizado;
  });

  salvarEnvelopamentosLocais(novaLista);

  if (isSupabaseConfigurado()) {
    try {
      const rowsDB = itensAtualizados.map(formatarItemParaSupabaseEnvelopamentos);
      await supabase.from('envelopamentos').upsert(rowsDB, { onConflict: 'id' });
    } catch (err) {
      console.warn('Erro ao atualizar lote no Supabase envelopamentos:', err);
    }
  }

  notificarAlteracaoEnvelopamento();
  return true;
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
  }

  notificarAlteracaoEnvelopamento();
  return true;
};

/**
 * Exclui múltiplos registros de envelopamento em lote por lista de IDs
 */
export const excluirEnvelopamentosEmLote = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) return true;

  const setIds = new Set(ids);
  const locais = carregarEnvelopamentosLocais();
  const novaLista = locais.filter(item => !setIds.has(item.id));
  salvarEnvelopamentosLocais(novaLista);

  if (isSupabaseConfigurado()) {
    try {
      await supabase.from('envelopamentos').delete().in('id', ids);
    } catch (err) {
      console.warn('Erro ao excluir lote no Supabase:', err);
    }
  }

  notificarAlteracaoEnvelopamento();
  return true;
};

/**
 * Importa múltiplos blocos em lote de forma atômica e com sincronização instantânea,
 * bloqueando estritamente a inserção de quaisquer blocos duplicados.
 */
export const importarBlocosEmLote = async (itens, usuarioNome = 'Equipe Vermont') => {
  if (!Array.isArray(itens) || itens.length === 0) return [];

  const locais = carregarEnvelopamentosLocais();

  // Filtragem estrita contra duplicidades
  const itensAvaliados = identificarDuplicidadesEmLista(itens, locais);
  const itensValidos = itensAvaliados.filter(item => !item.ehDuplicado);

  if (itensValidos.length === 0) {
    throw new Error('Inclusão bloqueada: Todos os blocos informados já se encontram cadastrados no sistema para este cliente, material e pedreira.');
  }

  const agora = new Date().toISOString();
  const registrosCompletos = [];
  const rowsParaDB = [];

  for (const dados of itensValidos) {
    if (!dados.numero_bloco) continue;

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
      numero_romaneio: String(dados.numero_romaneio || dados.romaneio_numero || '').trim().toUpperCase(),
      data_romaneio: String(dados.data_romaneio || dados.data_emissao || '').trim(),
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

    registrosCompletos.push(registroCompleto);
    rowsParaDB.push(formatarItemParaSupabaseEnvelopamentos(registroCompleto));
  }

  // 1. Atualizar LocalStorage mesclando
  const mapa = new Map();
  locais.forEach(item => { if (item?.id) mapa.set(item.id, item); });
  registrosCompletos.forEach(item => mapa.set(item.id, item));
  const novaLista = Array.from(mapa.values());
  salvarEnvelopamentosLocais(novaLista);

  // 2. Sincronizar na nuvem (Supabase)
  if (isSupabaseConfigurado()) {
    try {
      await supabase.from('envelopamentos').upsert(rowsParaDB, { onConflict: 'id' });
    } catch (e) {
      console.warn('[Envelopamento] Falha ao importar em lote na tabela envelopamentos:', e);
    }
  }

  // Notificar ouvintes
  notificarAlteracaoEnvelopamento();

  return registrosCompletos;
};

/**
 * Busca o status de envelopamento de um bloco específico validando cliente, CNPJ, material e pedreira
 */
export const buscarStatusEnvelopamentoPorBloco = async (
  numeroBloco, 
  clienteNome = '', 
  clienteCnpj = '', 
  material = '', 
  pedreira = ''
) => {
  if (!numeroBloco) return null;

  const todos = await listarEnvelopamentos();
  const info = verificarStatusEnvelopamentoAgendamento({
    numero_bloco: numeroBloco,
    cliente: clienteNome,
    cliente_cnpj: clienteCnpj,
    material: material,
    pedreira: pedreira
  }, todos);

  return info.encontrado ? info.registro : null;
};

/**
 * Verifica e sincroniza o status de envelopamento de um bloco de agendamento.
 * Valida estritamente a correspondência entre:
 * 1. numero_bloco (com/sem barra e zeros normalizados)
 * 2. cliente e CNPJ (se CNPJs informados forem diferentes, descarta)
 * 3. pedreira (unidade extratora)
 * 4. material (tipo de rocha)
 * 
 * Regra visual Vermont:
 * - 🟢 Verde: Envelopado OU Sem envelopamento (liberado)
 * - 🔴 Vermelho: Pendente de Envelopamento, Em andamento, Aguardando corte e reparo, ou Não Registrado
 */
export const verificarStatusEnvelopamentoAgendamento = (agendamento, listaEnvelopamentos = []) => {
  if (!agendamento || !agendamento.numero_bloco) {
    return {
      encontrado: false,
      isEnvelopadoOuLiberado: false,
      status: 'nao_registrado',
      label: 'Não Registrado',
      cor: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.12)',
      border: 'rgba(148, 163, 184, 0.35)',
      descricao: 'Bloco sem registro de envelopamento',
      registro: null
    };
  }

  const numBlocoAg = normalizarNumeroBloco(agendamento.numero_bloco);
  const numBlocoAgSemBarra = numBlocoAg.replace(/\//g, '');
  
  const clienteNomeAg = String(agendamento.cliente || agendamento.cliente_nome || '').trim();
  const clienteCnpjAg = String(agendamento.cliente_cnpj || '').replace(/\D/g, '');
  const materialAg = normalizarMaterial(agendamento.material);
  const pedreiraAg = normalizarPedreira(agendamento.pedreira || agendamento.pedreira_id || agendamento.pedreira_nome);

  // 1. Filtrar todos os que batem com o número do bloco
  const candidatosPorNumero = (Array.isArray(listaEnvelopamentos) ? listaEnvelopamentos : []).filter(env => {
    const numEnv = normalizarNumeroBloco(env.numero_bloco);
    const numEnvSemBarra = numEnv.replace(/\//g, '');
    return numEnv === numBlocoAg || numEnvSemBarra === numBlocoAgSemBarra;
  });

  if (candidatosPorNumero.length === 0) {
    return {
      encontrado: false,
      isEnvelopadoOuLiberado: false,
      status: 'nao_registrado',
      label: 'Não Registrado',
      cor: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.12)',
      border: 'rgba(148, 163, 184, 0.35)',
      descricao: 'Bloco não cadastrado no módulo de envelopamento',
      registro: null
    };
  }

  // 2. Validação estrita de Cliente (CNPJ / Razão Social)
  const matchCliente = (env) => {
    const cnpjEnv = String(env.cliente_cnpj || '').replace(/\D/g, '');
    const nomeEnv = String(env.cliente_nome || '').trim();

    // Se ambos tiverem CNPJs com 14 dígitos, a igualdade do CNPJ é definitiva
    if (clienteCnpjAg.length === 14 && cnpjEnv.length === 14) {
      return clienteCnpjAg === cnpjEnv;
    }

    // Se um tem CNPJ e o outro tem CNPJ diferente válido, não bate
    if (clienteCnpjAg.length === 14 && cnpjEnv.length === 14 && clienteCnpjAg !== cnpjEnv) {
      return false;
    }

    // Comparação por nomes
    if (clienteNomeAg && nomeEnv) {
      const c1 = normalizarCliente(clienteNomeAg, clienteCnpjAg);
      const c2 = normalizarCliente(nomeEnv, cnpjEnv);
      if (c1 === c2) return true;

      const n1 = clienteNomeAg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const n2 = nomeEnv.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      if (n1.length >= 3 && n2.length >= 3 && (n1.includes(n2) || n2.includes(n1))) {
        return true;
      }
    }

    // Se nenhum dos dois tem cliente informado
    if (!clienteNomeAg && !clienteCnpjAg && !nomeEnv && !cnpjEnv) {
      return true;
    }

    return false;
  };

  // 3. Validação de Pedreira
  const matchPedreira = (env) => {
    const pedEnv = normalizarPedreira(env.pedreira_id, env.pedreira_nome);
    if (!pedreiraAg || !pedEnv) return true;
    if (pedreiraAg === pedEnv) return true;
    if (pedreiraAg.startsWith('massape') && pedEnv.startsWith('massape')) return true;
    return false;
  };

  // 4. Validação de Material
  const matchMaterial = (env) => {
    const matEnv = normalizarMaterial(env.material);
    if (!materialAg || !matEnv) return true;
    return materialAg === matEnv || materialAg.includes(matEnv) || matEnv.includes(materialAg);
  };

  // Filtrar candidatos estritamente válidos
  const candidatosValidos = candidatosPorNumero.filter(env => {
    const cliOk = matchCliente(env);
    if (!cliOk) return false;

    const pedOk = matchPedreira(env);
    if (!pedOk) return false;

    const matOk = matchMaterial(env);
    if (!matOk) return false;

    return true;
  });

  let correspondente = null;

  if (candidatosValidos.length === 1) {
    correspondente = candidatosValidos[0];
  } else if (candidatosValidos.length > 1) {
    // Escolhe o melhor candidato dando prioridade para CNPJ idêntico e registro mais recente
    correspondente = candidatosValidos.slice().sort((a, b) => {
      const aCnpjMatch = (clienteCnpjAg && String(a.cliente_cnpj || '').replace(/\D/g, '') === clienteCnpjAg) ? 1 : 0;
      const bCnpjMatch = (clienteCnpjAg && String(b.cliente_cnpj || '').replace(/\D/g, '') === clienteCnpjAg) ? 1 : 0;
      if (aCnpjMatch !== bCnpjMatch) return bCnpjMatch - aCnpjMatch;
      return (new Date(b.created_at || b.updated_at || 0)) - (new Date(a.created_at || a.updated_at || 0));
    })[0];
  }

  if (!correspondente) {
    return {
      encontrado: false,
      isEnvelopadoOuLiberado: false,
      status: 'nao_registrado',
      label: 'Não Registrado',
      cor: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.12)',
      border: 'rgba(148, 163, 184, 0.35)',
      descricao: 'Bloco não cadastrado no envelopamento para este cliente/pedreira/material',
      registro: null
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
    let cor = '#ef4444';
    let bg = 'rgba(239, 68, 68, 0.15)';
    let border = '#dc2626';

    if (st === 'em_andamento') {
      label = 'Em andamento';
      cor = '#f59e0b';
      bg = 'rgba(245, 158, 11, 0.15)';
      border = '#d97706';
    } else if (st === 'aguardando_corte_reparo') {
      label = 'Aguardando corte/reparo';
      cor = '#f87171';
      bg = 'rgba(239, 68, 68, 0.15)';
      border = '#dc2626';
    } else if (st === 'pendente_envelopamento' || st === 'pendente') {
      label = 'Não Envelopado';
      cor = '#ef4444';
      bg = 'rgba(239, 68, 68, 0.15)';
      border = '#dc2626';
    }

    return {
      encontrado: true,
      isEnvelopadoOuLiberado: false,
      status: st,
      label,
      cor,
      bg,
      border,
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
 * Consulta clientes cadastrados na nuvem
 */
const consultarClientesCadastradosNuvem = async () => {
  if (!isSupabaseConfigurado()) return [];

  try {
    const { data, error } = await supabase.from('clientes').select('*').limit(3000);
    if (!error && Array.isArray(data)) {
      return data;
    }
  } catch (e) {
    console.warn('Erro ao consultar clientes no Supabase:', e);
  }

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
 * Cadastra ou atualiza um cliente com ID determinístico, evitando duplicações
 */
export const salvarClienteCadastrado = async (dadosCliente) => {
  if (!dadosCliente || !dadosCliente.nome) return null;

  const nomeLimpo = String(dadosCliente.nome).trim().toUpperCase();
  const cnpjLimpo = String(dadosCliente.cnpj || '').trim();
  const cnpjNumeros = cnpjLimpo.replace(/\D/g, '');

  const locais = carregarClientesLocais();

  // Localiza se o cliente já existe por ID, por CNPJ ou por Nome
  const clienteExistente = locais.find(c => {
    if (dadosCliente.id && c.id === dadosCliente.id) return true;
    const cCnpjNum = (c.cnpj || '').replace(/\D/g, '');
    if (cnpjNumeros && cCnpjNum && cCnpjNum === cnpjNumeros) return true;
    if (c.nome && c.nome.trim().toUpperCase() === nomeLimpo) return true;
    return false;
  });

  // Garante ID estável/determinístico: se tiver CNPJ, usa cli_CNPJNUMEROS; caso contrário, mantém ID estável
  const id = dadosCliente.id || clienteExistente?.id || (cnpjNumeros ? `cli_${cnpjNumeros}` : `cli_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);
  const agora = new Date().toISOString();

  const clienteObj = {
    id,
    nome: nomeLimpo,
    cnpj: cnpjLimpo || clienteExistente?.cnpj || '',
    telefone: dadosCliente.telefone || clienteExistente?.telefone || '',
    email: dadosCliente.email || clienteExistente?.email || '',
    cidade: dadosCliente.cidade || clienteExistente?.cidade || '',
    uf: dadosCliente.uf || clienteExistente?.uf || '',
    observacoes: dadosCliente.observacoes || clienteExistente?.observacoes || '',
    created_at: clienteExistente?.created_at || dadosCliente.created_at || agora,
    updated_at: agora
  };

  // Salvar no LocalStorage substituindo duplicatas
  const index = locais.findIndex(c => c.id === id || (cnpjNumeros && (c.cnpj || '').replace(/\D/g, '') === cnpjNumeros) || c.nome === nomeLimpo);
  if (index >= 0) {
    locais[index] = { ...locais[index], ...clienteObj };
  } else {
    locais.unshift(clienteObj);
  }
  salvarClientesLocais(locais);

  // Sincronizar no Supabase (com onConflict em 'id')
  if (isSupabaseConfigurado()) {
    try {
      await supabase.from('clientes').upsert(clienteObj, { onConflict: 'id' });
    } catch (e) {
      console.warn('Erro ao salvar cliente no Supabase:', e);
    }
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
