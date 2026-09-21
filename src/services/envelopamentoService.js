import { supabase, isSupabaseConfigurado } from '../lib/supabase.js';

const LOCAL_STORAGE_KEY = 'vermont_envelopamentos_locais';
const CLIENTES_STORAGE_KEY = 'vermont_clientes_cadastrados';

/**
 * Definição oficial dos 3 Status de Envelopamento de Bloco da Vermont Mineração
 */
export const STATUS_ENVELOPAMENTO = {
  PENDENTE_ENVELOPAMENTO: {
    id: 'pendente_envelopamento',
    label: 'Pendente de Envelopamento',
    cor: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.15)',
    border: '#64748b',
    descricao: 'Aguardando envelopamento no pátio'
  },
  SEM_ENVELOPAMENTO: {
    id: 'sem_envelopamento',
    label: 'Sem envelopamento',
    cor: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: '#0284c7',
    descricao: 'Bloco liberado sem necessidade de envelopamento'
  },
  ENVELOPADO: {
    id: 'envelopado',
    label: 'Envelopado',
    cor: '#4ade80',
    bg: 'rgba(34, 197, 94, 0.15)',
    border: '#22c55e',
    descricao: 'Bloco devidamente envelopado e liberado'
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
  let dataRom = row.data_romaneio || row.data_emissao || '';

  const matchRom = obs.match(/\[ROM:\s*([^\]]+)\]/i);
  if (matchRom) {
    rom = matchRom[1].trim();
  } else if (!rom) {
    const matchRomTexto = obs.match(/(?:Romaneio\s+N[º°o]?\s*|Romaneio\s+|ROM:\s*)([0-9A-Za-z/]+)/i);
    if (matchRomTexto) rom = matchRomTexto[1].trim();
  }

  const matchPeso = obs.match(/\[PESO:\s*([^\]]+)\]/i);
  if (matchPeso) {
    peso = matchPeso[1].trim();
  } else if (!peso) {
    const matchPesoTexto = obs.match(/(?:Peso:\s*|Peso\s*|PESO:\s*)([0-9.,]+)\s*(?:kg)?/i);
    if (matchPesoTexto) peso = matchPesoTexto[1].trim();
  }

  const matchData = obs.match(/\[DATA_ROM:\s*([^\]]+)\]/i);
  if (matchData) {
    dataRom = matchData[1].trim();
  } else if (!dataRom) {
    const matchDataTexto = obs.match(/(?:Romaneio\s+N[º°o]?\s*[0-9A-Za-z/]+\s*\(([0-9]{2}\/[0-9]{2}\/[0-9]{4})\)|([0-9]{2}\/[0-9]{2}\/[0-9]{4}))/i);
    if (matchDataTexto) {
      dataRom = matchDataTexto[1] || matchDataTexto[2];
    }
  }

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
  } else if (matUpper.includes('TELLUS BLUE')) {
    matFinal = 'Tellus Blue';
    pedId = 'serrote';
    pedNome = 'São Gonçalo do Amarante - CE (Serrote)';
  } else if (matUpper === 'TELLUS' || matUpper.startsWith('TELLUS ')) {
    matFinal = 'Tellus';
    pedId = 'massape_negresco';
    pedNome = 'Massapê - CE (Negresco)';
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
    numero_bloco: String(row.numero_bloco || '').trim().replace(/[.\s]+$/, ''),
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
    .replace(/[.\s]+$/, '')
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

  return str.replace(/[.\s]+$/, '');
};

/**
 * Normaliza o número de romaneio para comparação independente de zeros à esquerda ou pontuação
 */
export const normalizarRomaneio = (rom = '') => {
  const str = String(rom || '')
    .trim()
    .toUpperCase()
    .replace(/^(N[º°.]*|ROMANEIO|N)\s*/i, '')
    .replace(/^0+/, '')
    .replace(/[^\w]/g, '');
  return str;
};

/**
 * Extrai a raiz textual significativa do nome do cliente, removendo tipos societários e palavras genéricas
 */
export const extrairRaizCliente = (nome = '') => {
  return String(nome || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\b(LTDA|ME|EPP|EIRELI|S\/A|SA|SOCIEDADE|ANONIMA|LIMITADA|DO BRASIL|BRASIL|COMERCIO|EXPORTACAO|IMPORTACAO|ROCHAS|MINERACAO|MARMORES|GRANITOS|INDUSTRIA)\b/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .trim();
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
 * Normaliza o cliente produzindo uma chave canônica estável,
 * permitindo correspondência exata mesmo quando o CNPJ está preenchido em um registro e ausente no outro.
 */
export const normalizarCliente = (nome = '', cnpj = '') => {
  const raiz = extrairRaizCliente(nome);
  if (raiz && raiz.length >= 3) {
    return `CLI_${raiz.slice(0, 15)}`;
  }
  const cnpjDigitos = String(cnpj || '').replace(/\D/g, '');
  if (cnpjDigitos.length === 14) {
    return `CNPJ_${cnpjDigitos}`;
  }
  return raiz ? `CLI_${raiz}` : 'CLI_GENERICO';
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

const collatorBlocos = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });

/**
 * Compara dois blocos ou números de bloco em ordem DECRESCENTE (maior para o menor),
 * tratando perfeitamente blocos numéricos puros (ex: 70526 > 69826 > 69626 > 69426),
 * sufixos de letras (ex: 70526-B > 70526-A > 70526), prefixos (ex: VT-200 > VT-100)
 * e subdivisões (ex: 70526/2 > 70526/1).
 */
export const compararNumeroBlocoDecrescente = (a, b) => {
  const strA = String(a?.numero_bloco || a || '').trim().toUpperCase();
  const strB = String(b?.numero_bloco || b || '').trim().toUpperCase();

  if (!strA && !strB) return 0;
  if (!strA) return 1;
  if (!strB) return -1;

  return collatorBlocos.compare(strB, strA);
};

/**
 * Verifica de forma inteligente e profunda se dois registros referem-se rigorosamente ao mesmo bloco físico.
 * Suporta:
 * - Correspondência de número de bloco (com/sem barras, pontuações ou zeros à esquerda).
 * - Correspondência definitiva por número de romaneio idêntico.
 * - Correspondência por cliente com ou sem CNPJ (comparação fonética/raiz textual da empresa).
 * - Correspondência por pedreira e material.
 */
export const saoBlocosCorrespondentes = (itemA, itemB) => {
  if (!itemA || !itemB) return false;

  const numA = normalizarNumeroBloco(itemA.numero_bloco || itemA);
  const numB = normalizarNumeroBloco(itemB.numero_bloco || itemB);
  if (!numA || !numB) return false;

  const numASemBarra = numA.replace(/[\/\-_.]/g, '');
  const numBSemBarra = numB.replace(/[\/\-_.]/g, '');

  const blocoIgual = (numA === numB || numASemBarra === numBSemBarra);
  if (!blocoIgual) return false;

  // 1. Se ambos têm número de romaneio especificado e são iguais -> MATCH INCONDICIONAL (mesmo bloco no mesmo romaneio)
  const romA = normalizarRomaneio(itemA.numero_romaneio || itemA.romaneio_numero);
  const romB = normalizarRomaneio(itemB.numero_romaneio || itemB.romaneio_numero);
  if (romA && romB && romA === romB) {
    return true;
  }

  // 2. Validação de Cliente
  const cnpjA = String(itemA.cliente_cnpj || '').replace(/\D/g, '');
  const cnpjB = String(itemB.cliente_cnpj || '').replace(/\D/g, '');
  const nomeA = String(itemA.cliente_nome || itemA.cliente || '').trim();
  const nomeB = String(itemB.cliente_nome || itemB.cliente || '').trim();

  let clienteBate = true;
  if (cnpjA.length === 14 && cnpjB.length === 14) {
    clienteBate = (cnpjA === cnpjB);
  } else if (nomeA && nomeB) {
    const rA = extrairRaizCliente(nomeA);
    const rB = extrairRaizCliente(nomeB);
    if (rA && rB) {
      clienteBate = (rA === rB || rA.includes(rB) || rB.includes(rA));
    }
  }

  if (!clienteBate) return false;

  // 3. Validação de Pedreira
  const pedA = normalizarPedreira(itemA.pedreira_id, itemA.pedreira_nome || itemA.pedreira);
  const pedB = normalizarPedreira(itemB.pedreira_id, itemB.pedreira_nome || itemB.pedreira);
  let pedreiraBate = true;
  if (pedA && pedB) {
    pedreiraBate = (pedA === pedB || (pedA.startsWith('massape') && pedB.startsWith('massape')));
  }
  if (!pedreiraBate) return false;

  // 4. Validação de Material
  const matA = normalizarMaterial(itemA.material);
  const matB = normalizarMaterial(itemB.material);
  let materialBate = true;
  if (matA && matB) {
    materialBate = (matA === matB || matA.includes(matB) || matB.includes(matA));
  }
  if (!materialBate) return false;

  return true;
};

/**
 * Encontra o registro correspondente em uma lista de envelopamentos
 */
export const encontrarItemCorrespondente = (itemAlvo, lista = [], ignorarId = null) => {
  if (!itemAlvo) return null;
  return (Array.isArray(lista) ? lista : []).find(item => {
    if (ignorarId && item.id === ignorarId) return false;
    return saoBlocosCorrespondentes(itemAlvo, item);
  }) || null;
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
  numero_romaneio,
  idAtual = null,
  listaExistente = []
}) => {
  if (!numero_bloco) return { ehDuplicado: false, existente: null };
  const alvo = {
    numero_bloco,
    cliente_nome,
    cliente_cnpj,
    material,
    pedreira_id,
    pedreira_nome,
    numero_romaneio
  };
  const existente = encontrarItemCorrespondente(alvo, listaExistente, idAtual);

  return {
    ehDuplicado: !!existente,
    existente: existente || null
  };
};

export const verificarDuplicidadeIndividual = verificarDuplicidadeBloco;

/**
 * Converte qualquer representação de peso para float padronizado em kg
 * Suporta formatos brasileiros (36.312,00 kg / 36.312,00) e internacionais (36312.00)
 */
export const normalizarPeso = (peso) => {
  if (!peso && peso !== 0) return 0;
  let str = String(peso).trim();
  // Se contiver ponto e vírgula (ex: 36.312,00), remove ponto e troca vírgula por ponto
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const limpo = str.replace(/[^\d.-]/g, '');
  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
};

/**
 * Analisa uma lista de blocos (ex: importação PDF ou lote) identificando duplicidades
 * tanto em relação aos registros já salvos no sistema quanto entre si mesmos.
 * 
 * Regras Inteligentes:
 * 1. Bloco idêntico já cadastrado (mesmo cliente, material, pedreira e peso):
 *    -> Marcado como duplicado/já cadastrado (NÃO é necessário reimportar, desmarcado por padrão).
 * 2. Bloco já cadastrado, MAS com peso alterado no romaneio novo:
 *    -> Sugerido para atualização de peso (ehAtualizacaoPeso: true, marcado por padrão),
 *       mantendo RIGOROSAMENTE o status já salvo no pátio (envelopado, sem_envelopamento ou pendente).
 * 3. Bloco novo:
 *    -> Marcado como novo e selecionado por padrão para importação com status sugerido.
 */
export const identificarDuplicidadesEmLista = (listaNova = [], listaExistente = []) => {
  const processadosNoLote = [];

  return (Array.isArray(listaNova) ? listaNova : []).map((item) => {
    if (!item || !item.numero_bloco) {
      return { 
        ...item, 
        ehDuplicado: false, 
        ehAtualizacaoPeso: false,
        motivoDuplicidade: null, 
        itemOriginal: null 
      };
    }

    // 1. Verificar correspondência com registros já existentes na base de dados
    const original = encontrarItemCorrespondente(item, listaExistente);

    if (original) {
      const romOrig = original.numero_romaneio || 'S/N';
      const pesoNovoNum = normalizarPeso(item.peso_kg);
      const pesoAntigoNum = normalizarPeso(original.peso_kg);
      
      // Verifica se o peso foi preenchido ou modificado
      const pesoMudou = (pesoNovoNum > 0 && pesoAntigoNum > 0 && Math.abs(pesoNovoNum - pesoAntigoNum) > 0.01) ||
                        (pesoNovoNum > 0 && (!original.peso_kg || pesoAntigoNum === 0));

      if (pesoMudou) {
        // Bloco já existe, mas o peso mudou: sugere atualizar o peso mantendo o status do banco
        return {
          ...item,
          id: original.id,
          ehDuplicado: false,
          ehAtualizacaoPeso: true,
          pesoOriginal: original.peso_kg || '',
          pesoNovo: item.peso_kg || '',
          status: original.status || item.status || 'pendente_envelopamento', // PRESERVA RIGOROSAMENTE O STATUS DO BANCO
          statusOriginalPreservado: original.status,
          motivoDuplicidade: `Peso alterado de ${original.peso_kg || 'sem peso'} para ${item.peso_kg} kg (Status mantido: ${original.status})`,
          itemOriginal: original
        };
      }

      // Bloco já cadastrado e sem alteração de peso (não é necessário reimportar)
      return {
        ...item,
        id: original.id,
        ehDuplicado: true,
        ehAtualizacaoPeso: false,
        pesoOriginal: original.peso_kg || '',
        motivoDuplicidade: `Já cadastrado no sistema (Romaneio: ${romOrig}, Status: ${original.status}) - Sem alterações`,
        itemOriginal: original
      };
    }

    // 2. Verificar duplicidade em relação a blocos anteriores deste mesmo lote
    const repetidoLote = processadosNoLote.find(p => saoBlocosCorrespondentes(item, p));
    if (repetidoLote) {
      return {
        ...item,
        ehDuplicado: true,
        ehAtualizacaoPeso: false,
        motivoDuplicidade: `Repetido neste mesmo romaneio/lote (Bloco duplicado)`,
        itemOriginal: null
      };
    }

    processadosNoLote.push(item);
    return { 
      ...item, 
      ehDuplicado: false, 
      ehAtualizacaoPeso: false, 
      motivoDuplicidade: null, 
      itemOriginal: null 
    };
  });
};

/**
 * Consulta a lista de envelopamentos na nuvem com paginação automática,
 * superando o limite restrito de 1.000 linhas por requisição do Supabase/PostgREST.
 */
const consultarEnvelopamentosNuvem = async () => {
  if (!isSupabaseConfigurado()) return null;

  try {
    let todosRegistros = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('envelopamentos')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('[Envelopamento] Erro ao paginar envelopamentos:', error);
        break;
      }

      if (Array.isArray(data) && data.length > 0) {
        todosRegistros = todosRegistros.concat(data);
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    if (todosRegistros.length > 0) {
      return todosRegistros.map(parseItemDeSupabaseEnvelopamentos);
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

  // Normalizar status legados caso existam para os 3 status oficiais
  dados = dados.map(item => {
    let st = item.status;
    if (st === 'pendente' || st === 'em_envelopamento' || st === 'em_andamento' || st === 'aguardando_corte_reparo') {
      st = 'pendente_envelopamento';
    } else if (st === 'conferido' || st === 'liberado') {
      st = 'envelopado';
    }
    return { ...item, status: st };
  });

  // Ordenar por data mais recente
  dados.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  // Aplicar filtros em memória
  return dados.filter(item => {
    if (filtros.pedreira) {
      const pF = normalizarPedreira(filtros.pedreira);
      const pI = normalizarPedreira(item.pedreira_id, item.pedreira_nome);
      if (pF && pI && pF !== pI && !pI.startsWith(pF) && !pF.startsWith(pI)) {
        return false;
      }
    }
    if (filtros.status && item.status !== filtros.status) return false;
    if (filtros.cliente && !String(item.cliente_nome || '').toLowerCase().includes(filtros.cliente.toLowerCase())) return false;
    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase().trim();
      const termoSemZeros = termo.replace(/^0+/, '');
      const bloco = String(item.numero_bloco || '').toLowerCase();
      const cli = String(item.cliente_nome || '').toLowerCase();
      const cnpj = String(item.cliente_cnpj || '').toLowerCase();
      const mat = String(item.material || '').toLowerCase();
      const ped = String(item.pedreira_nome || '').toLowerCase();
      const rom = String(item.numero_romaneio || '').toLowerCase();
      const dataRom = String(item.data_romaneio || '').toLowerCase();
      const obs = String(item.observacoes || '').toLowerCase();

      const bate = bloco.includes(termo) ||
                   cli.includes(termo) ||
                   cnpj.includes(termo) ||
                   mat.includes(termo) ||
                   ped.includes(termo) ||
                   rom.includes(termo) ||
                   (termoSemZeros && rom.includes(termoSemZeros)) ||
                   dataRom.includes(termo) ||
                   obs.includes(termo);

      if (!bate) {
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

const HISTORICO_STORAGE_KEY = 'vermont_envelopamentos_historico_locais';

/**
 * Lê o histórico de alterações local
 */
export const carregarHistoricoLocais = () => {
  try {
    const raw = localStorage.getItem(HISTORICO_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
};

/**
 * Salva o histórico no LocalStorage
 */
export const salvarHistoricoLocais = (lista) => {
  try {
    localStorage.setItem(HISTORICO_STORAGE_KEY, JSON.stringify(lista.slice(0, 500)));
  } catch (err) {}
};

/**
 * Registra uma entrada de auditoria/histórico de envelopamento
 */
export const registrarHistoricoEnvelopamento = async ({
  tipo_acao, // 'CRIACAO', 'EDICAO', 'STATUS_ALTERADO', 'STATUS_LOTE', 'EXCLUSAO', 'EXCLUSAO_LOTE', 'IMPORTACAO_ROMANEIO'
  numero_bloco = '',
  cliente_nome = '',
  material = '',
  pedreira_nome = '',
  numero_romaneio = '',
  status_anterior = null,
  status_novo = null,
  usuario_nome = 'Equipe Vermont',
  detalhes = ''
}) => {
  const agora = new Date().toISOString();
  const id = `hist_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  const entrada = {
    id,
    tipo_acao,
    numero_bloco: String(numero_bloco || '').trim(),
    cliente_nome: String(cliente_nome || '').trim(),
    material: String(material || '').trim(),
    pedreira_nome: String(pedreira_nome || '').trim(),
    numero_romaneio: String(numero_romaneio || '').trim(),
    status_anterior: status_anterior || null,
    status_novo: status_novo || null,
    usuario_nome: usuario_nome || 'Equipe Vermont',
    detalhes: detalhes || '',
    created_at: agora
  };

  // 1. Salvar no LocalStorage
  const locais = carregarHistoricoLocais();
  locais.unshift(entrada);
  salvarHistoricoLocais(locais);

  // 2. Disparar Realtime Broadcast e tentar persistir no Supabase se tabela existir
  if (isSupabaseConfigurado()) {
    try {
      await supabase.from('envelopamentos_historico').insert(entrada);
    } catch (e) {}

    try {
      const canalBroadcast = supabase.channel('canal_historico_envelopamentos');
      canalBroadcast.send({
        type: 'broadcast',
        event: 'novo_registro_historico',
        payload: entrada
      });
    } catch (e) {}
  }

  // Notificar evento local
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vermont_historico_envelopamento_changed', { detail: entrada }));
  }

  return entrada;
};

/**
 * Consulta o histórico de alterações (Supabase + LocalStorage)
 */
export const listarHistoricoEnvelopamentos = async () => {
  if (isSupabaseConfigurado()) {
    try {
      const { data, error } = await supabase
        .from('envelopamentos_historico')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);

      if (!error && Array.isArray(data) && data.length > 0) {
        salvarHistoricoLocais(data);
        return data;
      }
    } catch (e) {}
  }
  return carregarHistoricoLocais();
};

/**
 * Inscreve listener para histórico de alterações em tempo real
 */
export const inscreverHistoricoRealtime = (callback) => {
  let supabaseChannel = null;

  if (isSupabaseConfigurado()) {
    try {
      supabaseChannel = supabase
        .channel(`realtime_historico_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`)
        .on('broadcast', { event: 'novo_registro_historico' }, (payload) => {
          if (typeof callback === 'function') callback(payload?.payload);
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'envelopamentos_historico' }, (payload) => {
          if (typeof callback === 'function') callback(payload?.new);
        })
        .subscribe();
    } catch (e) {}
  }

  const handleLocal = (e) => {
    if (typeof callback === 'function') callback(e.detail);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('vermont_historico_envelopamento_changed', handleLocal);
  }

  return () => {
    if (supabaseChannel && isSupabaseConfigurado()) {
      try {
        supabase.removeChannel(supabaseChannel);
      } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('vermont_historico_envelopamento_changed', handleLocal);
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
    data_cadastro: dados.data_cadastro ? converterDataParaIsoComHoraAtual(dados.data_cadastro) : agora,
    data_envelopamento: dados.data_envelopamento ? converterDataParaIsoComHoraAtual(dados.data_envelopamento) : (statusNormalizado === 'em_andamento' || statusNormalizado === 'envelopado' ? agora : null),
    data_liberacao: dados.data_liberacao ? converterDataParaIsoComHoraAtual(dados.data_liberacao) : (statusNormalizado === 'envelopado' || statusNormalizado === 'sem_envelopamento' ? (dados.data_envelopamento ? converterDataParaIsoComHoraAtual(dados.data_envelopamento) : agora) : null),
    observacoes: dados.observacoes || '',
    agendamento_id: dados.agendamento_id || null,
    created_at: dados.created_at || agora,
    updated_at: agora
  };

  // 1. Atualizar LocalStorage
  const index = locais.findIndex(item => item.id === id);
  const isEdicao = index >= 0;
  const itemAnterior = isEdicao ? locais[index] : null;

  if (isEdicao) {
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

  // 3. Registrar Histórico de Auditoria
  try {
    const statusMudou = isEdicao && itemAnterior?.status !== registroCompleto.status;
    const tipoAcao = !isEdicao 
      ? 'CRIACAO' 
      : (statusMudou ? 'STATUS_ALTERADO' : 'EDICAO');
    
    let det = !isEdicao 
      ? `Bloco ${registroCompleto.numero_bloco} cadastrado como ${STATUS_ENVELOPAMENTO[registroCompleto.status?.toUpperCase()]?.label || registroCompleto.status}` 
      : (statusMudou 
          ? `Status alterado de "${STATUS_ENVELOPAMENTO[itemAnterior?.status?.toUpperCase()]?.label || itemAnterior?.status}" para "${STATUS_ENVELOPAMENTO[registroCompleto.status?.toUpperCase()]?.label || registroCompleto.status}"`
          : `Dados do bloco ${registroCompleto.numero_bloco} editados`);

    await registrarHistoricoEnvelopamento({
      tipo_acao: tipoAcao,
      numero_bloco: registroCompleto.numero_bloco,
      cliente_nome: registroCompleto.cliente_nome,
      material: registroCompleto.material,
      pedreira_nome: registroCompleto.pedreira_nome,
      numero_romaneio: registroCompleto.numero_romaneio,
      status_anterior: isEdicao ? itemAnterior?.status : null,
      status_novo: registroCompleto.status,
      usuario_nome: usuarioNome,
      detalhes: det
    });
  } catch (errHist) {}

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
 * Converte string de data (ex: '2026-09-21' ou ISO) para ISO string preservando a hora atual se aplicável
 */
export const converterDataParaIsoComHoraAtual = (dataStr) => {
  if (!dataStr) return new Date().toISOString();
  if (typeof dataStr === 'string' && dataStr.includes('T')) return dataStr;
  try {
    const agora = new Date();
    if (typeof dataStr === 'string' && dataStr.includes('-')) {
      const partes = dataStr.slice(0, 10).split('-').map(Number);
      if (partes.length === 3) {
        const [y, m, d] = partes;
        const dt = new Date(y, m - 1, d, agora.getHours(), agora.getMinutes(), agora.getSeconds());
        return dt.toISOString();
      }
    }
    const dObj = new Date(dataStr);
    return isNaN(dObj.getTime()) ? agora.toISOString() : dObj.toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
};

/**
 * Atualiza o status de um envelopamento rapidamente
 */
export const atualizarStatusEnvelopamento = async (id, novoStatus, usuarioNome = 'Equipe Vermont', dataPersonalizada = null) => {
  const locais = carregarEnvelopamentosLocais();
  const index = locais.findIndex(item => item.id === id);
  if (index < 0) return null;

  const agora = new Date().toISOString();
  const dataEvento = dataPersonalizada ? converterDataParaIsoComHoraAtual(dataPersonalizada) : agora;
  const itemAtual = locais[index];

  const atualizacoes = {
    status: novoStatus,
    updated_at: agora
  };

  if (novoStatus === 'em_andamento') {
    atualizacoes.responsavel_envelopamento = usuarioNome;
    atualizacoes.data_envelopamento = dataEvento;
  } else if (novoStatus === 'envelopado' || novoStatus === 'sem_envelopamento') {
    atualizacoes.responsavel_liberacao = usuarioNome;
    atualizacoes.data_liberacao = dataEvento;
    if (novoStatus === 'envelopado') {
      atualizacoes.data_envelopamento = dataEvento;
    }
  } else if (novoStatus === 'pendente_envelopamento') {
    atualizacoes.responsavel_liberacao = null;
    atualizacoes.data_liberacao = null;
  }

  return await salvarEnvelopamento({ ...itemAtual, ...atualizacoes }, usuarioNome);
};

/**
 * Atualiza o status de múltiplos registros de envelopamento em lote
 */
export const atualizarStatusEnvelopamentosEmLote = async (ids = [], novoStatus, usuarioNome = 'Equipe Vermont', dataPersonalizada = null) => {
  if (!Array.isArray(ids) || ids.length === 0 || !novoStatus) return true;

  const setIds = new Set(ids);
  const locais = carregarEnvelopamentosLocais();
  const agora = new Date().toISOString();
  const dataEvento = dataPersonalizada ? converterDataParaIsoComHoraAtual(dataPersonalizada) : agora;

  const itensAtualizados = [];

  const novaLista = locais.map(item => {
    if (!setIds.has(item.id)) return item;

    const atualizacoes = {
      status: novoStatus,
      updated_at: agora
    };

    if (novoStatus === 'em_andamento') {
      atualizacoes.responsavel_envelopamento = usuarioNome;
      atualizacoes.data_envelopamento = dataEvento;
    } else if (novoStatus === 'envelopado' || novoStatus === 'sem_envelopamento') {
      atualizacoes.responsavel_liberacao = usuarioNome;
      atualizacoes.data_liberacao = dataEvento;
      if (novoStatus === 'envelopado') {
        atualizacoes.data_envelopamento = dataEvento;
      }
    } else if (novoStatus === 'pendente_envelopamento') {
      atualizacoes.responsavel_liberacao = null;
      atualizacoes.data_liberacao = null;
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

  // Registrar histórico em lote
  try {
    const lblStatus = STATUS_ENVELOPAMENTO[novoStatus?.toUpperCase()]?.label || novoStatus;
    for (const at of itensAtualizados) {
      await registrarHistoricoEnvelopamento({
        tipo_acao: 'STATUS_LOTE',
        numero_bloco: at.numero_bloco,
        cliente_nome: at.cliente_nome,
        material: at.material,
        pedreira_nome: at.pedreira_nome,
        numero_romaneio: at.numero_romaneio,
        status_novo: novoStatus,
        usuario_nome: usuarioNome,
        detalhes: `Status atualizado em lote para "${lblStatus}"`
      });
    }
  } catch (eH) {}

  notificarAlteracaoEnvelopamento();
  return true;
};

/**
 * Exclui um registro de envelopamento
 */
export const excluirEnvelopamento = async (id, usuarioNome = 'Equipe Vermont') => {
  const locais = carregarEnvelopamentosLocais();
  const itemExcluido = locais.find(item => item.id === id);
  const novaLista = locais.filter(item => item.id !== id);
  salvarEnvelopamentosLocais(novaLista);

  if (isSupabaseConfigurado()) {
    try {
      const { error } = await supabase.from('envelopamentos').delete().eq('id', id);
      if (error) {
        console.error('[Envelopamento] Erro ao excluir no Supabase:', error);
      }
    } catch (err) {
      console.warn('[Envelopamento] Exceção ao excluir no Supabase:', err);
    }
  }

  // Registrar histórico de exclusão
  if (itemExcluido) {
    try {
      await registrarHistoricoEnvelopamento({
        tipo_acao: 'EXCLUSAO',
        numero_bloco: itemExcluido.numero_bloco,
        cliente_nome: itemExcluido.cliente_nome,
        material: itemExcluido.material,
        pedreira_nome: itemExcluido.pedreira_nome,
        numero_romaneio: itemExcluido.numero_romaneio,
        usuario_nome: usuarioNome,
        detalhes: `Bloco ${itemExcluido.numero_bloco} excluído do sistema`
      });
    } catch (eH) {}
  }

  notificarAlteracaoEnvelopamento();
  return true;
};

/**
 * Exclui múltiplos registros de envelopamento em lote por lista de IDs
 */
export const excluirEnvelopamentosEmLote = async (ids = [], usuarioNome = 'Equipe Vermont', motivo = '') => {
  if (!Array.isArray(ids) || ids.length === 0) return true;

  const setIds = new Set(ids);
  const locais = carregarEnvelopamentosLocais();
  const excluidos = locais.filter(item => setIds.has(item.id));
  const novaLista = locais.filter(item => !setIds.has(item.id));
  salvarEnvelopamentosLocais(novaLista);

  if (isSupabaseConfigurado()) {
    // Excluir em lotes de até 30 IDs para evitar restrições de tamanho de query no Supabase PostgREST
    const chunkSize = 30;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      try {
        const { error } = await supabase.from('envelopamentos').delete().in('id', chunk);
        if (error) {
          console.error('[Envelopamento] Erro ao excluir lote no Supabase:', error);
        }
      } catch (err) {
        console.warn('[Envelopamento] Exceção ao excluir lote no Supabase:', err);
      }
    }
  }

  // Registrar histórico
  try {
    for (const ex of excluidos) {
      await registrarHistoricoEnvelopamento({
        tipo_acao: 'EXCLUSAO_LOTE',
        numero_bloco: ex.numero_bloco,
        cliente_nome: ex.cliente_nome,
        material: ex.material,
        pedreira_nome: ex.pedreira_nome,
        numero_romaneio: ex.numero_romaneio,
        usuario_nome: usuarioNome,
        detalhes: motivo || `Bloco ${ex.numero_bloco} excluído em operação de lote (${excluidos.length} blocos)`
      });
    }
  } catch (eH) {}

  notificarAlteracaoEnvelopamento();
  return true;
};

/**
 * Exclui totalmente um romaneio e todos os seus blocos associados, garantindo limpeza profunda
 * tanto por lista de IDs quanto por tags de romaneio no banco de dados e no cache local.
 */
export const excluirRomaneioTotalmente = async ({
  numeroRomaneio = '',
  clienteNome = '',
  ids = []
}, usuarioNome = 'Equipe Vermont') => {
  const romNorm = normalizarRomaneio(numeroRomaneio);
  const locais = carregarEnvelopamentosLocais();
  const setIds = new Set(ids || []);

  // 1. Identifica todos os blocos locais que batem com os IDs ou com o número do romaneio
  const excluidos = locais.filter(item => {
    if (setIds.has(item.id)) return true;
    if (romNorm) {
      const romItem = normalizarRomaneio(item.numero_romaneio);
      if (romItem && romItem === romNorm) return true;
      if (item.observacoes && (item.observacoes.includes(`[ROM:${numeroRomaneio}]`) || item.observacoes.includes(`[ROM:${romNorm}]`))) {
        return true;
      }
    }
    return false;
  });

  const idsParaExcluir = Array.from(new Set([...ids, ...excluidos.map(e => e.id)]));
  const idsSetCompleto = new Set(idsParaExcluir);

  // 2. Remove imediatamente do LocalStorage
  const novaLista = locais.filter(item => !idsSetCompleto.has(item.id));
  salvarEnvelopamentosLocais(novaLista);

  // 3. Remove do Supabase com tratamento em lotes e consultas por tag de observação
  if (isSupabaseConfigurado()) {
    // 3.1 Exclusão por IDs em chunks
    const chunkSize = 30;
    for (let i = 0; i < idsParaExcluir.length; i += chunkSize) {
      const chunk = idsParaExcluir.slice(i, i + chunkSize);
      try {
        const { error } = await supabase.from('envelopamentos').delete().in('id', chunk);
        if (error) {
          console.error('[Envelopamento] Erro ao excluir lote por ID no Supabase:', error);
        }
      } catch (eChunk) {
        console.warn('[Envelopamento] Exceção ao excluir chunk no Supabase:', eChunk);
      }
    }

    // 3.2 Exclusão adicional por tag de observações para limpar eventuais duplicatas órfãs
    if (romNorm) {
      try {
        await supabase.from('envelopamentos').delete().ilike('observacoes', `%[ROM:${numeroRomaneio}]%`);
        if (romNorm !== numeroRomaneio) {
          await supabase.from('envelopamentos').delete().ilike('observacoes', `%[ROM:${romNorm}]%`);
        }
      } catch (eTag) {
        console.warn('[Envelopamento] Exceção ao limpar tags de romaneio no Supabase:', eTag);
      }
    }
  }

  // 4. Registrar histórico da exclusão
  try {
    const qtd = excluidos.length || idsParaExcluir.length;
    await registrarHistoricoEnvelopamento({
      tipo_acao: 'EXCLUSAO_ROMANEIO',
      numero_bloco: excluidos[0]?.numero_bloco || 'ROMANEIO_COMPLETO',
      numero_romaneio: numeroRomaneio || romNorm,
      cliente_nome: clienteNome || (excluidos[0]?.cliente_nome) || 'Não especificado',
      usuario_nome: usuarioNome,
      detalhes: `Romaneio Nº ${numeroRomaneio || romNorm} excluído completamente (${qtd} bloco(s) removidos)`
    });
  } catch (eH) {}

  // 5. Notificar ouvintes
  notificarAlteracaoEnvelopamento();
  return true;
};

/**
 * Importa múltiplos blocos em lote de forma atômica e com sincronização instantânea,
 * bloqueando estritamente a inserção de quaisquer blocos duplicados.
 */
export const importarBlocosEmLote = async (itens, usuarioNome = 'Equipe Vermont') => {
  if (!Array.isArray(itens) || itens.length === 0) return [];

  // 1. Sempre consulta a base mais recente (Supabase + LocalStorage) para evitar condições de corrida ou dados defasados
  let locais = carregarEnvelopamentosLocais();
  try {
    const baseMaisRecente = await listarEnvelopamentos();
    if (Array.isArray(baseMaisRecente) && baseMaisRecente.length > 0) {
      locais = baseMaisRecente;
    }
  } catch (errDb) {
    console.warn('[Envelopamento] Falha ao consultar base recente para importação:', errDb);
  }

  const agora = new Date().toISOString();
  const registrosCompletos = [];
  const rowsParaDB = [];
  const idsJaProcessados = new Set();

  for (const dados of itens) {
    if (!dados || !dados.numero_bloco) continue;

    // Buscar se o bloco já existe na base de dados (mesmo bloco/cliente/romaneio)
    const existente = encontrarItemCorrespondente(dados, locais);

    if (existente) {
      if (idsJaProcessados.has(existente.id)) continue;
      idsJaProcessados.add(existente.id);

      const pesoNovoNum = normalizarPeso(dados.pesoNovo || dados.peso_kg);
      const pesoAntigoNum = normalizarPeso(existente.peso_kg);

      const pesoMudou = (pesoNovoNum > 0 && pesoAntigoNum > 0 && Math.abs(pesoNovoNum - pesoAntigoNum) > 0.01) ||
                        (pesoNovoNum > 0 && (!existente.peso_kg || pesoAntigoNum === 0));

      if (dados.ehAtualizacaoPeso || pesoMudou) {
        // Bloco existente com alteração de peso: atualiza apenas dados cadastrais mantendo RIGOROSAMENTE o status original
        const pesoNovo = String(dados.pesoNovo || dados.peso_kg || existente.peso_kg || '').trim();
        const pesoAntigo = existente.peso_kg || 'sem peso';
        const romAtualizado = String(dados.numero_romaneio || existente.numero_romaneio || '').trim().toUpperCase();

        const registroAtualizado = {
          ...existente,
          peso_kg: pesoNovo,
          numero_romaneio: romAtualizado || existente.numero_romaneio,
          data_romaneio: String(dados.data_romaneio || existente.data_romaneio || '').trim(),
          observacoes: existente.observacoes 
            ? `${existente.observacoes} | [Peso atualizado de ${pesoAntigo} para ${pesoNovo} kg via Romaneio ${romAtualizado}]` 
            : `Peso atualizado de ${pesoAntigo} para ${pesoNovo} kg via Romaneio ${romAtualizado}`,
          status: existente.status || 'pendente_envelopamento', // PRESERVA RIGOROSAMENTE O STATUS DO BANCO
          updated_at: agora
        };

        registrosCompletos.push(registroAtualizado);
        rowsParaDB.push(formatarItemParaSupabaseEnvelopamentos(registroAtualizado));
      } else {
        // Bloco idêntico já cadastrado sem alteração de peso: BLOQUEIA criação de nova linha
        console.log(`[Importação] Bloco "${dados.numero_bloco}" já existe idêntico no Romaneio ${existente.numero_romaneio}. Nenhuma duplicata inserida.`);
      }
      continue;
    }

    // Bloco novo (não existe na base)
    const id = dados.id && !dados.id.startsWith('pdf_') ? dados.id : `env_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    if (idsJaProcessados.has(id)) continue;
    idsJaProcessados.add(id);

    let statusNormalizado = dados.status || 'pendente_envelopamento';
    if (statusNormalizado === 'pendente' || statusNormalizado === 'em_envelopamento' || statusNormalizado === 'em_andamento') {
      statusNormalizado = 'pendente_envelopamento';
    }
    if (statusNormalizado === 'liberado' || statusNormalizado === 'conferido') {
      statusNormalizado = 'envelopado';
    }

    const registroCompleto = {
      id,
      numero_bloco: String(dados.numero_bloco || '').trim().toUpperCase().replace(/[.\s]+$/, ''),
      cliente_nome: String(dados.cliente_nome || '').trim().toUpperCase(),
      cliente_cnpj: String(dados.cliente_cnpj || '').trim(),
      material: String(dados.material || '').trim(),
      peso_kg: String(dados.peso_kg || '').trim(),
      numero_romaneio: String(dados.numero_romaneio || dados.romaneio_numero || '').trim().toUpperCase(),
      data_romaneio: String(dados.data_romaneio || dados.data_emissao || '').trim(),
      pedreira_id: dados.pedreira_id || '',
      pedreira_nome: dados.pedreira_nome || '',
      status: statusNormalizado,
      responsavel_envelopamento: dados.responsavel_envelopamento || null,
      responsavel_liberacao: dados.responsavel_liberacao || (statusNormalizado === 'envelopado' || statusNormalizado === 'sem_envelopamento' ? usuarioNome : null),
      data_cadastro: dados.data_cadastro || agora,
      data_envelopamento: dados.data_envelopamento || null,
      data_liberacao: dados.data_liberacao || (statusNormalizado === 'envelopado' || statusNormalizado === 'sem_envelopamento' ? agora : null),
      observacoes: dados.observacoes || '',
      agendamento_id: dados.agendamento_id || null,
      created_at: dados.created_at || agora,
      updated_at: agora
    };

    registrosCompletos.push(registroCompleto);
    rowsParaDB.push(formatarItemParaSupabaseEnvelopamentos(registroCompleto));
  }

  if (registrosCompletos.length === 0) {
    return [];
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

  // 3. Registrar no histórico
  try {
    for (const reg of registrosCompletos) {
      const ehAtualizacao = itens.some(iv => iv.numero_bloco === reg.numero_bloco && iv.ehAtualizacaoPeso);
      await registrarHistoricoEnvelopamento({
        tipo_acao: ehAtualizacao ? 'ATUALIZACAO_PESO_ROMANEIO' : 'IMPORTACAO_ROMANEIO',
        numero_bloco: reg.numero_bloco,
        cliente_nome: reg.cliente_nome,
        material: reg.material,
        pedreira_nome: reg.pedreira_nome,
        numero_romaneio: reg.numero_romaneio,
        status_novo: reg.status,
        usuario_nome: usuarioNome,
        detalhes: ehAtualizacao 
          ? `Peso atualizado no Romaneio Nº ${reg.numero_romaneio || 'S/N'} para ${reg.peso_kg} kg (Status preservado: ${reg.status})` 
          : `Importado via Romaneio Nº ${reg.numero_romaneio || 'S/N'}`
      });
    }
  } catch (eH) {}

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

  if (info.encontrado && info.registro) {
    return info.registro;
  }

  // Se não encontrou na lista local (ex: usuário anônimo com RLS ativa), consulta via RPC segura
  if (isSupabaseConfigurado()) {
    try {
      const { data, error } = await supabase.rpc('rpc_consultar_status_envelopamento_bloco', {
        p_numero_bloco: String(numeroBloco).trim(),
        p_cliente: String(clienteNome || '').trim(),
        p_material: String(material || '').trim(),
        p_pedreira: String(pedreira || '').trim()
      });
      if (!error && data && data.encontrado) {
        return data;
      }
    } catch (e) {}
  }

  return null;
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
 * Calcula os totais e métricas para os cards de resumo com os 3 status oficiais
 */
export const calcularMetricasEnvelopamento = (lista = []) => {
  return {
    total: lista.length,
    pendente_envelopamento: lista.filter(i => i.status === 'pendente_envelopamento' || i.status === 'pendente' || i.status === 'em_andamento' || i.status === 'aguardando_corte_reparo').length,
    sem_envelopamento: lista.filter(i => i.status === 'sem_envelopamento').length,
    envelopado: lista.filter(i => i.status === 'envelopado' || i.status === 'liberado' || i.status === 'conferido').length
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
  
  let score = qtdEspacos * 15 + texto.length;
  if (/\bLTDA\b|\bS\/A\b|\bSA\b|\bEIRELI\b|\bME\b|\bEPP\b/i.test(texto)) score += 30;
  if (texto.includes(' - ')) score -= 5;
  return score;
};

/**
 * Obtém todos os clientes e importadores cadastrados e operados no sistema,
 * preservando todas as empresas cadastradas e deduplicando de forma segura (por CNPJ exato ou nome completo).
 */
export const obterClientesDoBancoDeDados = async () => {
  const itensColetados = [];

  const coletar = (nomeBruto, cnpjBruto, extra = {}) => {
    if (!nomeBruto && !cnpjBruto) return;

    let nome = String(nomeBruto || '').trim().replace(/\s+/g, ' ').toUpperCase();
    let cnpj = String(cnpjBruto || extrairCnpj(nomeBruto) || '').trim();

    if (!cnpj && nome) {
      const cnpjResolvido = obterCnpjEmpresaCache(nome);
      if (cnpjResolvido) cnpj = cnpjResolvido;
    }

    const cnpjFmt = cnpj ? formatarCNPJ(cnpj) : '';
    const cnpjDigitos = cnpjFmt.replace(/\D/g, '');

    // Descartar entradas inválidas
    if (!nome && !cnpjFmt) return;
    if (/^\d+$/.test(nome)) return;
    if (nome.startsWith('TESTE') || nome.startsWith('UNDEFINED') || nome === 'NULL') return;

    itensColetados.push({
      id: extra.id || (cnpjDigitos.length === 14 ? `cli_${cnpjDigitos}` : `cli_${Math.random().toString(36).substr(2, 6)}`),
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

  // 2. Clientes do módulo de envelopamentos (Local e Nuvem)
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
        .limit(10000);

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
  // DEDUPLICAÇÃO SEGURA:
  // Preserva 100% das empresas distintas sem agrupar nomes diferentes
  // ========================================================
  const mapaPorChaveUnica = new Map();

  for (const item of itensColetados) {
    const nomeLimpo = item.nome.trim().toUpperCase();
    const normKey = nomeLimpo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]/g, '');
    if (!normKey && !item.cnpjDigitos) continue;

    // Chave única: Se tiver CNPJ válido de 14 dígitos usa o CNPJ; senão usa o nome completo normalizado
    const chaveUnica = (item.cnpjDigitos && item.cnpjDigitos.length === 14) 
      ? `CNPJ_${item.cnpjDigitos}` 
      : `NOME_${normKey}`;

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
        observacoes: item.observacoes
      });
    } else {
      const existente = mapaPorChaveUnica.get(chaveUnica);
      // Mantém o nome com melhor formatação
      if (calcularScoreNomeCliente(nomeLimpo) > calcularScoreNomeCliente(existente.nome)) {
        existente.nome = nomeLimpo;
      }
      if (!existente.cnpj && item.cnpj) {
        existente.cnpj = item.cnpj;
        existente.cnpjDigitos = item.cnpjDigitos;
      }
      if (item.telefone && !existente.telefone) existente.telefone = item.telefone;
      if (item.email && !existente.email) existente.email = item.email;
      if (item.cidade && !existente.cidade) existente.cidade = item.cidade;
      if (item.uf && !existente.uf) existente.uf = item.uf;
    }
  }

  const resultado = Array.from(mapaPorChaveUnica.values());
  resultado.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  return resultado;
};

/**
 * Cruza um bloco do módulo de Envelopamento com a lista de Agendamentos / Carregamentos.
 * Retorna o status operacional de expedição:
 * - 🚚 Carregado (Finalizado / Concluído)
 * - ⏳ Carregando (Em processo de carregamento na pedreira)
 * - 📅 Agendado (Agendamento ativo aguardando / liberado)
 * - 📦 No Pátio (Sem agendamento ativo de transporte)
 */
export const verificarStatusCarregamentoBloco = (bloco, listaAgendamentos = []) => {
  if (!bloco || !bloco.numero_bloco) {
    return {
      encontrado: false,
      isCarregado: false,
      isAgendado: false,
      isCarregando: false,
      isNoPatio: true,
      status: 'no_patio',
      label: 'No Pátio',
      badgeText: '📦 No Pátio',
      cor: '#64748b',
      bg: 'rgba(148, 163, 184, 0.12)',
      border: 'rgba(148, 163, 184, 0.35)',
      tooltip: 'Bloco em estoque no pátio (sem agendamento de carregamento)',
      agendamento: null
    };
  }

  const numBloco = normalizarNumeroBloco(bloco.numero_bloco);
  const numBlocoSemBarra = numBloco.replace(/\//g, '');
  const clienteNome = String(bloco.cliente_nome || '').trim();
  const clienteCnpj = String(bloco.cliente_cnpj || '').replace(/\D/g, '');

  // Filtra agendamentos que contêm este bloco
  const agendamentosCandidatos = (Array.isArray(listaAgendamentos) ? listaAgendamentos : []).filter(ag => {
    if (!ag || !ag.numero_bloco) return false;
    const numAg = normalizarNumeroBloco(ag.numero_bloco);
    const numAgSemBarra = numAg.replace(/\//g, '');

    // Verifica se bate exatamente ou se o campo possui múltiplos blocos separados por vírgula/espaço/barra
    const bateNumero = numAg === numBloco || 
                       numAgSemBarra === numBlocoSemBarra ||
                       numAg.split(/[\s,;/]+/).some(part => {
                         if (!part) return false;
                         const nPart = normalizarNumeroBloco(part);
                         return nPart === numBloco || nPart.replace(/\//g, '') === numBlocoSemBarra;
                       });

    if (!bateNumero) return false;

    // Se o agendamento estiver cancelado, ignorar
    const st = String(ag.status || '').toLowerCase();
    if (st.includes('cancelad')) return false;

    return true;
  });

  if (agendamentosCandidatos.length === 0) {
    return {
      encontrado: false,
      isCarregado: false,
      isAgendado: false,
      isCarregando: false,
      isNoPatio: true,
      status: 'no_patio',
      label: 'No Pátio',
      badgeText: '📦 No Pátio',
      cor: '#64748b',
      bg: 'rgba(148, 163, 184, 0.12)',
      border: 'rgba(148, 163, 184, 0.35)',
      tooltip: 'Bloco em estoque no pátio da pedreira (aguardando agendamento de transporte)',
      agendamento: null
    };
  }

  // Ordena por prioridade de status: Finalizado/Carregado > Carregando > Liberado/Aguardando
  const obterPesoStatus = (ag) => {
    const st = String(ag.status || '').toLowerCase();
    if (st.includes('finaliz') || st.includes('concluid') || st.includes('carregado')) return 4;
    if (st.includes('carregando')) return 3;
    if (st.includes('liberad')) return 2;
    if (st.includes('aguard')) return 1;
    return 0;
  };

  agendamentosCandidatos.sort((a, b) => obterPesoStatus(b) - obterPesoStatus(a));
  const principalAg = agendamentosCandidatos[0];
  const st = String(principalAg.status || '').toLowerCase();

  let dataFmt = principalAg.data_agendamento || '';
  if (dataFmt && dataFmt.includes('-')) {
    const p = dataFmt.split('-');
    if (p.length === 3) dataFmt = `${p[2]}/${p[1]}/${p[0]}`;
  }
  const motorista = principalAg.motorista_nome ? ` • Motorista: ${principalAg.motorista_nome}` : '';
  const placa = principalAg.placa_cavalo ? ` • Placa: ${principalAg.placa_cavalo}` : '';
  const transp = principalAg.transportadora ? ` • Transp: ${principalAg.transportadora}` : '';

  if (st.includes('finaliz') || st.includes('concluid') || st.includes('carregado')) {
    return {
      encontrado: true,
      isCarregado: true,
      isAgendado: false,
      isCarregando: false,
      isNoPatio: false,
      status: 'carregado',
      label: 'Carregado',
      badgeText: '🚚 Carregado',
      cor: '#16a34a',
      bg: 'rgba(34, 197, 94, 0.15)',
      border: '#16a34a',
      tooltip: `🚚 Bloco Carregado e Expedido em ${dataFmt}${motorista}${placa}${transp}`,
      agendamento: principalAg
    };
  }

  if (st.includes('carregando')) {
    return {
      encontrado: true,
      isCarregado: false,
      isAgendado: false,
      isCarregando: true,
      isNoPatio: false,
      status: 'carregando',
      label: 'Carregando',
      badgeText: '⏳ Carregando',
      cor: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.15)',
      border: '#f59e0b',
      tooltip: `⏳ Em Carregamento na Pedreira em ${dataFmt}${motorista}${placa}`,
      agendamento: principalAg
    };
  }

  // Agendado (Aguardando Liberação ou Liberado para Carregar)
  return {
    encontrado: true,
    isCarregado: false,
    isAgendado: true,
    isCarregando: false,
    isNoPatio: false,
    status: 'agendado',
    label: 'Agendado',
    badgeText: `📅 Agendado (${dataFmt})`,
    cor: '#0284c7',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: '#0284c7',
    tooltip: `📅 Agendado para ${dataFmt} às ${principalAg.horario_agendamento || '-'}${motorista}${placa}${transp}`,
    agendamento: principalAg
  };
};

