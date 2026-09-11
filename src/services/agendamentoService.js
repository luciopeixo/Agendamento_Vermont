import { supabase } from '../lib/supabase.js';

// Nomenclatura oficial formatada
export const PEDREIRAS_CEARA = [
  {
    id: 'uruoca',
    nome: 'Uruoca - CE (Taj Mahal)',
    cidade: 'Uruoca - CE'
  },
  {
    id: 'massape_negresco',
    nome: 'Massapê - CE (Negresco)',
    cidade: 'Massapê - CE'
  },
  {
    id: 'massape_delmare',
    nome: 'Massapê - CE (Del Mare)',
    cidade: 'Massapê - CE'
  },
  {
    id: 'sobral_jaibaras',
    nome: 'Sobral - CE (Jaibaras)',
    cidade: 'Sobral - CE'
  },
  {
    id: 'serrote',
    nome: 'São Gonçalo do Amarante - CE (Serrote)',
    cidade: 'São Gonçalo do Amarante - CE'
  },
  {
    id: 'beberibe',
    nome: 'Beberibe - CE',
    cidade: 'Beberibe - CE'
  }
];

// Mapeamento oficial de materiais por pedreira da Vermont Mineração
export const MATERIAIS_POR_PEDREIRA = {
  uruoca: [
    'Taj Mahal'
  ],
  massape_negresco: [
    'Infinity Brown',
    'Infinity Black',
    'Negresco',
    'Brownie',
    'Brown Strings',
    'Kouros',
    'JJ Brown',
    'Tellus'
  ],
  massape_delmare: [
    'Del Mare',
    'Chateau Blanc',
    'Breccia Viola',
    'Evora'
  ],
  sobral_jaibaras: [
    'Breccia Imperiale',
    'Zitan',
    'Scenario'
  ],
  serrote: [
    'Blue Deep',
    'Panettone',
    'Roma Imperiale',
    'Tellus Blue',
    'Atlantic Blue',
    'Illusion',
    'Blue Mare',
    'Blue Roma'
  ],
  beberibe: [
    'Raffinato',
    'Naurika',
    'Guiness',
    'Nouveau'
  ]
};

/**
 * Retorna os materiais disponíveis para a pedreira selecionada
 */
export function obterMateriaisPorPedreira(pedreiraOuId = '') {
  if (!pedreiraOuId) return [];
  const maiusc = pedreiraOuId.toUpperCase();
  
  if (maiusc === 'URUOCA' || maiusc.includes('URUOCA')) {
    return MATERIAIS_POR_PEDREIRA.uruoca;
  }
  if (maiusc === 'MASSAPE_NEGRESCO' || maiusc.includes('NEGRESCO')) {
    return MATERIAIS_POR_PEDREIRA.massape_negresco;
  }
  if (maiusc === 'MASSAPE_DELMARE' || maiusc.includes('DEL MARE') || maiusc.includes('DELMARE')) {
    return MATERIAIS_POR_PEDREIRA.massape_delmare;
  }
  if (maiusc === 'SOBRAL_JAIBARAS' || maiusc.includes('JAIBARAS') || (maiusc.includes('SOBRAL') && !maiusc.includes('MASSAPÊ'))) {
    return MATERIAIS_POR_PEDREIRA.sobral_jaibaras;
  }
  if (maiusc === 'SERROTE' || maiusc.includes('SERROTE') || maiusc.includes('SÃO GONÇALO') || maiusc.includes('SAO GONCALO')) {
    return MATERIAIS_POR_PEDREIRA.serrote;
  }
  if (maiusc === 'BEBERIBE' || maiusc.includes('BEBERIBE')) {
    return MATERIAIS_POR_PEDREIRA.beberibe;
  }

  return [];
}

// Horários com espaçamento de 20 minutos
export const HORARIOS_SEMANA = [
  // Manhã (07:40 até 12:00)
  { id: '07:40', label: '07:40 - Manhã (Abertura)', turno: 'manha' },
  { id: '08:00', label: '08:00 - Manhã', turno: 'manha' },
  { id: '08:20', label: '08:20 - Manhã', turno: 'manha' },
  { id: '08:40', label: '08:40 - Manhã', turno: 'manha' },
  { id: '09:00', label: '09:00 - Manhã', turno: 'manha' },
  { id: '09:20', label: '09:20 - Manhã', turno: 'manha' },
  { id: '09:40', label: '09:40 - Manhã', turno: 'manha' },
  { id: '10:00', label: '10:00 - Manhã', turno: 'manha' },
  { id: '10:20', label: '10:20 - Manhã', turno: 'manha' },
  { id: '10:40', label: '10:40 - Manhã', turno: 'manha' },
  { id: '11:00', label: '11:00 - Manhã', turno: 'manha' },
  { id: '11:20', label: '11:20 - Manhã', turno: 'manha' },
  { id: '11:40', label: '11:40 - Manhã', turno: 'manha' },
  { id: '12:00', label: '12:00 - Manhã (Encerramento)', turno: 'manha' },

  // Tarde (13:30 até 15:30)
  { id: '13:30', label: '13:30 - Tarde (Retorno)', turno: 'tarde' },
  { id: '13:50', label: '13:50 - Tarde', turno: 'tarde' },
  { id: '14:10', label: '14:10 - Tarde', turno: 'tarde' },
  { id: '14:30', label: '14:30 - Tarde', turno: 'tarde' },
  { id: '14:50', label: '14:50 - Tarde', turno: 'tarde' },
  { id: '15:10', label: '15:10 - Tarde', turno: 'tarde' },
  { id: '15:30', label: '15:30 - Tarde (Encerramento)', turno: 'tarde' },

  // Outros
  { id: 'outros', label: 'Outros (Especificar Horário / Justificativa)', turno: 'especial' }
];

/**
 * Converte 'HH:MM' em minutos do dia (ex: '07:40' => 460)
 */
export function converterHorarioParaMinutos(horarioStr = '') {
  if (!horarioStr || typeof horarioStr !== 'string') return 0;
  const partes = horarioStr.trim().split(':');
  if (partes.length < 2) return 0;
  const h = parseInt(partes[0], 10);
  const m = parseInt(partes[1], 10);
  if (isNaN(h) || isNaN(m)) return 0;
  return h * 60 + m;
}

/**
 * Retorna a data e hora atuais no fuso horário do Brasil / Ceará (America/Fortaleza)
 */
export function obterDataHoraAtualBrasil() {
  const agora = new Date();
  
  // Data no padrão YYYY-MM-DD (en-CA)
  const formatadorData = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Fortaleza',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const dataHoje = formatadorData.format(agora);

  const formatadorHora = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Fortaleza',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const horaAtualStr = formatadorHora.format(agora);
  const minutosTotais = converterHorarioParaMinutos(horaAtualStr);

  return { dataHoje, horaAtualStr, minutosTotais };
}

/**
 * Verifica se um horário de agendamento específico já expirou / passou
 * para a data selecionada em relação ao momento atual.
 */
export function isHorarioPassado(dataStr, horarioId) {
  if (!dataStr || !horarioId || horarioId === 'outros' || String(horarioId).startsWith('Sábado')) {
    return false;
  }

  const { dataHoje, minutosTotais } = obterDataHoraAtualBrasil();

  // Se a data do agendamento for anterior a hoje, já passou
  if (dataStr < dataHoje) {
    return true;
  }

  // Se for para a data de hoje, compara os minutos do horário com os minutos atuais
  if (dataStr === dataHoje) {
    const slotMinutos = converterHorarioParaMinutos(horarioId);
    return slotMinutos <= minutosTotais;
  }

  // Se for data futura, não passou
  return false;
}

// ==========================================
// VALIDAÇÃO & CONSULTA DE CPF DE MOTORISTAS
// ==========================================

export const MOTORISTAS_BASE_KEY = 'vermont_base_motoristas';

/**
 * Validação algorítmica oficial de CPF (módulo 11 da Receita Federal)
 */
export function validarCPF(cpf = '') {
  if (!cpf) return false;
  const limpo = String(cpf).replace(/\D/g, '');
  if (limpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(limpo.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.charAt(9), 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(limpo.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.charAt(10), 10)) return false;

  return true;
}

/**
 * Decodifica o armazenamento local de motoristas com suporte a formato ofuscado e legado
 */
function decodificarBaseMotoristasLocal(raw) {
  if (!raw) return [];
  try {
    // Tenta primeiro o formato ofuscado em Base64
    const jsonStr = decodeURIComponent(escape(atob(raw)));
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_e) {
    try {
      // Fallback para JSON direto (compatibilidade)
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_e2) {
      return [];
    }
  }
}

/**
 * Codifica a base local para evitar texto puro em inspecionamento de navegador
 */
function codificarBaseMotoristasLocal(lista = []) {
  try {
    const json = JSON.stringify(lista);
    return btoa(unescape(encodeURIComponent(json)));
  } catch (_e) {
    return JSON.stringify(lista);
  }
}

/**
 * Retorna todos os motoristas salvos na base local interna
 */
export function obterBaseMotoristas() {
  try {
    const raw = localStorage.getItem(MOTORISTAS_BASE_KEY);
    return decodificarBaseMotoristasLocal(raw);
  } catch (e) {
    return [];
  }
}

/**
 * Salva ou atualiza um motorista na base cadastral (local e sincronizado criptografado no Supabase)
 */
export async function salvarMotoristaNaBase(dadosMotorista = {}) {
  try {
    const rawCpf = dadosMotorista.motorista_cpf || dadosMotorista.cpf;
    if (!rawCpf) return;
    const cpfLimpo = String(rawCpf).replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return;

    const base = obterBaseMotoristas();
    const index = base.findIndex(m => String(m.cpf).replace(/\D/g, '') === cpfLimpo);

    const transpLimpa = limparNomeEmpresa(dadosMotorista.transportadora || dadosMotorista.nome_transportadora || '').toUpperCase() || null;
    const transpCnpj = dadosMotorista.transportadora_cnpj || extrairCnpj(dadosMotorista.transportadora) || obterCnpjEmpresaCache(transpLimpa) || null;
    const nomeLimpo = (dadosMotorista.motorista_nome || dadosMotorista.nome || '').trim().toUpperCase();
    const telLimpo = dadosMotorista.motorista_telefone || dadosMotorista.telefone || null;

    const novoRegistro = {
      cpf: cpfLimpo,
      nome: nomeLimpo,
      telefone: telLimpo,
      transportadora: transpLimpa,
      transportadora_cnpj: transpCnpj,
      tipo_veiculo: dadosMotorista.tipo_veiculo || null,
      placa_cavalo: dadosMotorista.placa_cavalo || null,
      placa_carreta: dadosMotorista.placa_carreta || null,
      placa_carreta_2: dadosMotorista.placa_carreta_2 || null,
      atualizado_em: new Date().toISOString()
    };

    if (index !== -1) {
      base[index] = { ...base[index], ...novoRegistro };
    } else {
      base.push(novoRegistro);
    }

    localStorage.setItem(MOTORISTAS_BASE_KEY, codificarBaseMotoristasLocal(base));

    // Sincroniza de forma criptografada no Supabase via RPC segura se configurado
    if (isSupabaseConfigurado() && nomeLimpo) {
      try {
        await supabase.rpc('salvar_motorista', {
          p_cpf: cpfLimpo,
          p_nome: nomeLimpo,
          p_telefone: telLimpo || '',
          p_transportadora: transpLimpa || ''
        });
      } catch (_errRpc) {
        // Fallback silencioso se a migration RPC estiver pendente no banco
      }
    }
  } catch (e) {
    console.warn('Erro ao salvar motorista na base:', e);
  }
}

/**
 * Formata sequência numérica como CPF padrão XXX.XXX.XXX-XX
 */
export function formatarCPF(valor = '') {
  if (!valor) return '';
  const nums = String(valor).replace(/\D/g, '').slice(0, 11);
  if (!nums) return '';
  let fmt = nums;
  if (nums.length > 3) fmt = `${nums.slice(0, 3)}.${nums.slice(3)}`;
  if (nums.length > 6) fmt = `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
  if (nums.length > 9) fmt = `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
  return fmt;
}

/**
 * Consulta um motorista pelo CPF na base interna e no histórico (com suporte a criptografia Supabase)
 */
export async function consultarMotoristaPorCPF(cpf = '') {
  if (!cpf) return { valido: null, encontrado: false, motorista: null };
  const cpfLimpo = String(cpf).replace(/\D/g, '');

  if (cpfLimpo.length < 11) {
    return { valido: null, encontrado: false, motorista: null };
  }

  // 1. Validação matemática oficial
  const ehValido = validarCPF(cpfLimpo);
  if (!ehValido) {
    return {
      valido: false,
      erro: 'CPF inválido (dígitos verificadores incorretos).',
      encontrado: false,
      motorista: null
    };
  }

  const cpfFormatado = formatarCPF(cpfLimpo);

  // 2. Busca na base local (cadastros e sementes protegidos)
  const baseLocal = obterBaseMotoristas();
  const encontradoLocal = baseLocal.find(m => {
    const mCpf = String(m.cpf || '').replace(/\D/g, '');
    return mCpf === cpfLimpo;
  });

  if (encontradoLocal && encontradoLocal.nome) {
    const transpNome = limparNomeEmpresa(encontradoLocal.transportadora || '');
    const transpCnpj = encontradoLocal.transportadora_cnpj || obterCnpjEmpresaCache(transpNome) || null;
    return {
      valido: true,
      encontrado: true,
      origem: 'base_local',
      motorista: {
        nome: encontradoLocal.nome,
        telefone: encontradoLocal.telefone || '',
        transportadora: transpNome,
        transportadora_cnpj: transpCnpj,
        tipo_veiculo: encontradoLocal.tipo_veiculo || '',
        placa_cavalo: encontradoLocal.placa_cavalo || '',
        placa_carreta: encontradoLocal.placa_carreta || '',
        placa_carreta_2: encontradoLocal.placa_carreta_2 || ''
      }
    };
  }

  // 3. Se Supabase configurado, busca primeiro via RPC criptografada segura (PostgreSQL PGCrypto)
  if (isSupabaseConfigurado()) {
    try {
      // 3.1 Consulta via RPC segura criptografada (descriptografa em runtime no banco)
      const { data: dataRpc, error: errorRpc } = await supabase
        .rpc('consultar_motorista', { p_cpf: cpfLimpo });

      if (!errorRpc && dataRpc && dataRpc.length > 0 && dataRpc[0].nome) {
        const mot = {
          nome: dataRpc[0].nome,
          telefone: dataRpc[0].telefone || '',
          transportadora: dataRpc[0].transportadora || '',
          tipo_veiculo: '',
          placa_cavalo: '',
          placa_carreta: '',
          placa_carreta_2: ''
        };
        salvarMotoristaNaBase({ ...mot, motorista_cpf: cpfLimpo });
        return { valido: true, encontrado: true, origem: 'base_supabase_criptografada', motorista: mot };
      }

      // 3.2 Consulta direta na tabela base_motoristas (caso legado/não-migrado)
      const { data: dataBase, error: errorBase } = await supabase
        .from('base_motoristas')
        .select('nome, telefone, transportadora')
        .or(`cpf.eq.${cpfLimpo},cpf.eq.${cpfFormatado}`)
        .limit(1);

      if (!errorBase && dataBase && dataBase.length > 0 && dataBase[0].nome) {
        const mot = {
          nome: dataBase[0].nome,
          telefone: dataBase[0].telefone || '',
          transportadora: dataBase[0].transportadora || '',
          tipo_veiculo: '',
          placa_cavalo: '',
          placa_carreta: '',
          placa_carreta_2: ''
        };
        salvarMotoristaNaBase({ ...mot, motorista_cpf: cpfLimpo });
        return { valido: true, encontrado: true, origem: 'base_supabase', motorista: mot };
      }

      // 3.3 Consulta no histórico de agendamentos salvos no Supabase
      const { data, error } = await supabase
        .from('agendamentos_pedreira')
        .select('motorista_nome, motorista_telefone, transportadora, tipo_veiculo, placa_cavalo, placa_carreta, placa_carreta_2')
        .or(`motorista_cpf.eq.${cpfLimpo},motorista_cpf.eq.${cpfFormatado}`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0 && data[0].motorista_nome) {
        const mot = {
          nome: data[0].motorista_nome,
          telefone: data[0].motorista_telefone || '',
          transportadora: data[0].transportadora || '',
          tipo_veiculo: data[0].tipo_veiculo || '',
          placa_cavalo: data[0].placa_cavalo || '',
          placa_carreta: data[0].placa_carreta || '',
          placa_carreta_2: data[0].placa_carreta_2 || ''
        };
        salvarMotoristaNaBase({ ...mot, motorista_cpf: cpfLimpo });
        return { valido: true, encontrado: true, origem: 'historico_supabase', motorista: mot };
      }
    } catch (e) {
      console.warn('[Supabase Motorista] Erro ao consultar motorista no Supabase:', e);
    }
  }

  // 4. Busca no histórico de agendamentos locais
  const agendamentosLocais = obterAgendamentosLocais();
  const agLocal = agendamentosLocais.find(a => {
    const rawC = String(a.motorista_cpf || '').replace(/\D/g, '');
    return rawC === cpfLimpo && a.motorista_nome;
  });
  if (agLocal) {
    const transpNome = limparNomeEmpresa(agLocal.transportadora || '');
    const transpCnpj = agLocal.transportadora_cnpj || resolverCnpjTransportadora(agLocal) || null;
    const mot = {
      nome: agLocal.motorista_nome,
      telefone: agLocal.motorista_telefone || '',
      transportadora: transpNome,
      transportadora_cnpj: transpCnpj,
      tipo_veiculo: agLocal.tipo_veiculo || '',
      placa_cavalo: agLocal.placa_cavalo || '',
      placa_carreta: agLocal.placa_carreta || '',
      placa_carreta_2: agLocal.placa_carreta_2 || ''
    };
    salvarMotoristaNaBase({ ...mot, motorista_cpf: cpfLimpo });
    return { valido: true, encontrado: true, origem: 'historico_local', motorista: mot };
  }

  return { valido: true, encontrado: false, motorista: null };
}

// ==========================================
// FORMATAÇÃO, EXTRAÇÃO & CACHE INTELIGENTE DE CNPJ
// ==========================================

export const TRANSPORTADORAS_BASE_KEY = 'vermont_base_transportadoras';
export const CNPJ_EMPRESAS_KEY = 'vermont_cnpj_empresas_cache';

/**
 * Formata qualquer número ou sequência como CNPJ padrão brasileiro XX.XXX.XXX/XXXX-XX
 */
export function formatarCNPJ(valor = '') {
  if (!valor && valor !== 0) return '';
  const str = String(valor).trim();
  const nums = str.replace(/\D/g, '');
  if (!nums) return str;
  // Se for 14 dígitos ou 13 dígitos (quando perde o zero à esquerda)
  const limpo = (nums.length === 13 || (nums.length < 14 && nums.length >= 11 && str.includes('/'))) ? nums.padStart(14, '0') : nums.slice(0, 14);
  if (limpo.length === 14) {
    return limpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  let fmt = limpo;
  if (limpo.length > 2) fmt = `${limpo.slice(0, 2)}.${limpo.slice(2)}`;
  if (limpo.length > 5) fmt = `${limpo.slice(0, 2)}.${limpo.slice(2, 5)}.${limpo.slice(5)}`;
  if (limpo.length > 8) fmt = `${limpo.slice(0, 2)}.${limpo.slice(2, 5)}.${limpo.slice(5, 8)}/${limpo.slice(8)}`;
  if (limpo.length > 12) fmt = `${limpo.slice(0, 2)}.${limpo.slice(2, 5)}.${limpo.slice(5, 8)}/${limpo.slice(8, 12)}-${limpo.slice(12)}`;
  return fmt;
}

/**
 * Limpa o nome da empresa removendo CNPJs anexados ou resíduos textuais
 */
export function limparNomeEmpresa(nome = '') {
  if (!nome || typeof nome !== 'string') return '';
  return nome
    .replace(/\s*[-–/|]?\s*\(?\s*CNPJ[\s:.-]*[0-9./-]+\s*\)?/gi, '')
    .replace(/\s*\(\s*\)\s*$/, '')
    .trim();
}

/**
 * Normaliza o nome da empresa para chave de busca no cache
 */
export function normalizarNomeEmpresaChave(nome = '') {
  if (!nome || typeof nome !== 'string') return '';
  const limpo = limparNomeEmpresa(nome);
  return limpo
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .trim();
}

/**
 * Base oficial de CNPJs de empresas parceiras frequentes e da própria Vermont
 */
const CNPJ_CONHECIDOS_PADRAO = {
  // Vermont Mineração Ltda
  'VERMONTMINERACAOLTDA': '07.498.412/0001-30',
  'VERMONTMINERACAO': '07.498.412/0001-30',
  'VERMONT': '07.498.412/0001-30',
  // Brasigran Brasileira de Granitos Ltda
  'BRASIGRANBRASILEIRADEGRANITOSLTDA': '32.476.525/0001-94',
  'BRASIGRAN': '32.476.525/0001-94',
  'BRASIGRANLTDA': '32.476.525/0001-94',
  // J. M. Bergamini Transportes
  'JMBERGAMINITRANSPORTESEIRELI': '13.051.611/0002-91',
  'JMBERGAMINI': '13.051.611/0002-91',
  'BERGAMINITRANSPORTES': '13.051.611/0002-91',
  'BERGAMINI': '13.051.611/0002-91',
  // FBS Logística e Transporte
  'FBSLOGISTICATRANSPORTELTDA': '49.131.491/0001-07',
  'FBSLOGISTICAETRANSPORTELTDA': '49.131.491/0001-07',
  'FBSLOGISTICA': '49.131.491/0001-07',
  'FBSLOGISTICALTDA': '49.131.491/0001-07',
  'FBSTRANSPORTES': '49.131.491/0001-07',
  // Bruno Lucchetti do Brasil Comércio, Importação e Exportação de Rochas Ornamentais Ltda
  'BRUNOLUCCHETTI': '07.825.404/0001-63',
  'BRUNOLUCCHETTIDOBRASIL': '07.825.404/0001-63',
  'BRUNOLUCCHETTIDOBRASILCOMERCIO': '07.825.404/0001-63',
  'BRUNOLUCCHETTIDOBRASILCOMERCIOIMPORTACAO': '07.825.404/0001-63',
  'BRUNOLUCCHETTIDOBRASILCOMERCIOIMPORTACAOEXPORTACAODEROCHASORNAMENTAISLTDA': '07.825.404/0001-63',
  // GMA Transportes Ltda
  'GMATRANSPORTES': '09.201.403/0002-54',
  'GMATRANSPORTESLTDA': '09.201.403/0002-54',
  'GMATRANSPORTE': '09.201.403/0002-54'
};

/**
 * Busca CNPJ salvo no cache ou na lista oficial de conhecidos
 */
export function obterCnpjEmpresaCache(nomeEmpresa = '') {
  if (!nomeEmpresa) return null;
  const chave = normalizarNomeEmpresaChave(nomeEmpresa);
  if (!chave) return null;

  if (CNPJ_CONHECIDOS_PADRAO[chave]) {
    return CNPJ_CONHECIDOS_PADRAO[chave];
  }

  for (const [k, cnpj] of Object.entries(CNPJ_CONHECIDOS_PADRAO)) {
    if (chave === k || (chave.length >= 7 && (chave.includes(k) || k.includes(chave)))) {
      return cnpj;
    }
  }

  try {
    const raw = localStorage.getItem(CNPJ_EMPRESAS_KEY);
    if (raw) {
      const mapa = JSON.parse(raw);
      if (mapa[chave]) return mapa[chave];
      for (const [k, cnpj] of Object.entries(mapa)) {
        if (chave === k || (chave.length >= 7 && (chave.includes(k) || k.includes(chave)))) {
          return cnpj;
        }
      }
    }
  } catch (e) {}

  return null;
}

/**
 * Salva no cache persistente a associação entre o nome da empresa e seu CNPJ
 */
export function salvarEmpresaCnpjCache(nomeEmpresa = '', cnpj = '') {
  if (!nomeEmpresa || !cnpj) return;
  const chave = normalizarNomeEmpresaChave(nomeEmpresa);
  const digitos = String(cnpj).replace(/\D/g, '');
  if (!chave || digitos.length !== 14) return;

  const cnpjFormatado = formatarCNPJ(digitos);

  try {
    const raw = localStorage.getItem(CNPJ_EMPRESAS_KEY);
    const mapa = raw ? JSON.parse(raw) : {};
    mapa[chave] = cnpjFormatado;
    localStorage.setItem(CNPJ_EMPRESAS_KEY, JSON.stringify(mapa));
  } catch (e) {}
}

/**
 * Extrai CNPJ válido de qualquer string (inclusive se inserido dentro do nome ou observações)
 */
export function extrairCnpj(texto = '') {
  if (!texto || typeof texto !== 'string') return null;

  // 1. Padrão formatado exato: XX.XXX.XXX/XXXX-XX
  const matchFormatado = texto.match(/\b(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})\b/);
  if (matchFormatado) {
    return matchFormatado[1];
  }

  // 2. Menção a CNPJ textual
  const matchCnpjTexto = texto.match(/CNPJ[\s:.-]*([0-9./-]{14,18})/i);
  if (matchCnpjTexto) {
    const digitos = matchCnpjTexto[1].replace(/\D/g, '');
    if (digitos.length === 14) {
      return formatarCNPJ(digitos);
    }
  }

  // 3. Sequência numérica de 14 dígitos
  const match14 = texto.match(/\b\d{14}\b/);
  if (match14 && validarCNPJ(match14[0])) {
    return formatarCNPJ(match14[0]);
  }

  return null;
}

/**
 * Resolução completa em cascata para obter o CNPJ do Cliente Destinatário
 */
export function resolverCnpjCliente(agendamento = {}, localItem = null) {
  if (!agendamento) return null;

  const campoDireto = agendamento.cliente_cnpj || agendamento.cnpj_cliente || agendamento.destinatario_cnpj || localItem?.cliente_cnpj || localItem?.cnpj_cliente || localItem?.destinatario_cnpj;
  if (campoDireto) {
    const strDireto = String(campoDireto).trim();
    if (strDireto) {
      const fmt = formatarCNPJ(strDireto);
      salvarEmpresaCnpjCache(agendamento.cliente || localItem?.cliente, fmt);
      return fmt;
    }
  }

  const extraidoNome = extrairCnpj(agendamento.cliente || localItem?.cliente);
  if (extraidoNome) {
    salvarEmpresaCnpjCache(agendamento.cliente || localItem?.cliente, extraidoNome);
    return extraidoNome;
  }

  const doCache = obterCnpjEmpresaCache(agendamento.cliente || localItem?.cliente);
  if (doCache) {
    return doCache;
  }

  const extraidoObs = extrairCnpj(agendamento.observacoes || localItem?.observacoes);
  if (extraidoObs) {
    return extraidoObs;
  }

  return null;
}

/**
 * Resolução completa em cascata para obter o CNPJ da Transportadora
 */
export function resolverCnpjTransportadora(agendamento = {}, localItem = null) {
  if (!agendamento) return null;

  const campoDireto = agendamento.transportadora_cnpj || agendamento.cnpj_transportadora || localItem?.transportadora_cnpj || localItem?.cnpj_transportadora;
  if (campoDireto) {
    const strDireto = String(campoDireto).trim();
    if (strDireto) {
      const fmt = formatarCNPJ(strDireto);
      salvarEmpresaCnpjCache(agendamento.transportadora || localItem?.transportadora, fmt);
      return fmt;
    }
  }

  const extraidoNome = extrairCnpj(agendamento.transportadora || localItem?.transportadora);
  if (extraidoNome) {
    salvarEmpresaCnpjCache(agendamento.transportadora || localItem?.transportadora, extraidoNome);
    return extraidoNome;
  }

  const doCache = obterCnpjEmpresaCache(agendamento.transportadora || localItem?.transportadora);
  if (doCache) {
    return doCache;
  }

  const extraidoObs = extrairCnpj(agendamento.observacoes || localItem?.observacoes);
  if (extraidoObs) {
    return extraidoObs;
  }

  return null;
}

/**
 * Validação algorítmica oficial de dígitos verificadores do CNPJ (módulo 11)
 */
export function validarCNPJ(cnpj = '') {
  if (!cnpj) return false;
  const limpo = String(cnpj).replace(/\D/g, '');
  if (limpo.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(limpo)) return false;

  let tamanho = limpo.length - 2;
  let numeros = limpo.substring(0, tamanho);
  let digitos = limpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0), 10)) return false;

  tamanho = tamanho + 1;
  numeros = limpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1), 10)) return false;

  return true;
}

/**
 * Consulta em tempo real dados cadastrais do CNPJ diretamente na Receita Federal (via BrasilAPI / MinhaReceita)
 */
export async function consultarCNPJReceita(cnpj = '') {
  if (!cnpj) return { valido: null, encontrado: false, empresa: null };
  const limpo = String(cnpj).replace(/\D/g, '');

  if (limpo.length < 14) {
    return { valido: null, encontrado: false, empresa: null };
  }

  // 1. Validação matemática do CNPJ
  if (!validarCNPJ(limpo)) {
    return {
      valido: false,
      erro: 'CNPJ inválido (dígitos verificadores incorretos).',
      encontrado: false,
      empresa: null
    };
  }

  // 2. Consulta primária via BrasilAPI (Dados Oficiais da Receita Federal)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${limpo}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const razaoSocial = (data.razao_social || data.nome_fantasia || '').toUpperCase().trim();
      const nomeFantasia = (data.nome_fantasia || '').toUpperCase().trim();
      const situacao = (data.descricao_situacao_cadastral || 'ATIVA').toUpperCase();
      const cidade = data.municipio ? `${data.municipio} - ${data.uf}` : '';

      return {
        valido: true,
        encontrado: true,
        fonte: 'Receita Federal (BrasilAPI)',
        empresa: {
          razao_social: razaoSocial,
          nome_fantasia: nomeFantasia,
          nome_exibicao: razaoSocial,
          situacao_cadastral: situacao,
          cidade: cidade,
          telefone: data.ddd_telefone_1 || ''
        }
      };
    }
  } catch (eBrasilApi) {
    console.warn('Consulta BrasilAPI indisponível ou lenta, acionando fallback MinhaReceita...', eBrasilApi);
  }

  // 3. Consulta secundária via MinhaReceita.org (Fallback público da Receita Federal)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const res = await fetch(`https://minhareceita.org/${limpo}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const razaoSocial = (data.razao_social || data.nome_fantasia || '').toUpperCase().trim();
      const nomeFantasia = (data.nome_fantasia || '').toUpperCase().trim();
      const situacao = (data.descricao_situacao_cadastral || 'ATIVA').toUpperCase();
      const cidade = data.municipio ? `${data.municipio} - ${data.uf}` : '';

      return {
        valido: true,
        encontrado: true,
        fonte: 'Receita Federal (MinhaReceita)',
        empresa: {
          razao_social: razaoSocial,
          nome_fantasia: nomeFantasia,
          nome_exibicao: razaoSocial,
          situacao_cadastral: situacao,
          cidade: cidade,
          telefone: data.ddd_telefone_1 || ''
        }
      };
    }
  } catch (eMinhaReceita) {
    console.warn('Fallback MinhaReceita indisponível:', eMinhaReceita);
  }

  // 4. Se a API estiver offline mas o CNPJ for autêntico:
  return {
    valido: true,
    encontrado: false,
    aviso: 'CNPJ autêntico. Conexão temporariamente lenta com a Receita Federal; você pode digitar a Razão Social manualmente.',
    empresa: null
  };
}

/**
 * Retorna o primeiro horário livre e válido (não ocupado e não expirado) para uma pedreira e data
 */
export function obterPrimeiroHorarioDisponivel(horariosOcupados = [], dataStr = '') {
  for (const h of HORARIOS_SEMANA) {
    if (h.id === 'outros') continue;
    const ocupado = Array.isArray(horariosOcupados) && horariosOcupados.includes(h.id);
    const expirado = isHorarioPassado(dataStr, h.id);
    if (!ocupado && !expirado) {
      return h.id;
    }
  }
  return 'outros';
}

/**
 * Sanitiza a numeração do bloco para remover textos extras (ex: 'BLOCO:', 'Bloco', 'Nº', 'Quartzito', 'Taj Mahal')
 * deixando apenas a numeração/código oficial do bloco a ser imputado no campo.
 */
export function sanitizarNumeroBloco(texto = '') {
  if (!texto || typeof texto !== 'string') return '';
  let str = String(texto).trim().toUpperCase();
  
  // 1. Remove prefixos comuns de bloco como "BLOCO:", "BLOCO", "BL.", "BL", "Nº", "N°", "NUMERO:", "NUMERO", "NUM:", "NUM"
  str = str.replace(/^(?:BLOCO\s*[:.-]?|BL\s*[:.-]?|N[º°]\s*[:.-]?|N[O0]\s*[:.-]?|NUMERO\s*[:.-]?|NUM\s*[:.-]?)\s*/i, '');
  
  // 2. Remove conteúdos explicativos entre parênteses (ex: "1256926 (QUARTZITO)" -> "1256926")
  str = str.replace(/\s*\([^)]*\)/g, '');
  
  // 3. Se contiver traço ou barra com texto explicativo e não outro número de bloco
  // Ex: "1256926 - TAJ MAHAL" -> "1256926"
  const partesTraco = str.split(/\s*[-–]\s*/);
  if (partesTraco.length > 1) {
    if (!/^\d+$/.test(partesTraco[1]) && !/^VT-/i.test(partesTraco[1]) && !/^\d{2,}\/\d{2,}$/.test(partesTraco[1])) {
      str = partesTraco[0];
    }
  }

  // 4. Remove palavras descritivas comuns caso fiquem soltas no texto (ex: "1256926 TAJ MAHAL" -> "1256926")
  str = str.replace(/\s+(?:TAJ\s+MAHAL|QUARTZITO|GRANITO|MARMORE|CARGA\s*\d*|MATERIAL).*$/i, '');

  // 5. Remove pontuações desnecessárias no início ou fim
  str = str.replace(/^[^\w]+|[^\w]+$/g, '');
  
  return str.trim();
}

/**
 * Remove duplicações acidentais de justificativas embutidas no campo observações
 */
export function limparObservacoesDuplicadas(obs = '') {
  if (!obs || typeof obs !== 'string') return '';
  let str = obs.trim();
  // Padrão: "TEXTO | [Horário: TEXTO]"
  const regexDuplicado = /^(.*?)\s*\|\s*\[Horário:\s*\1\s*\]$/i;
  const match = str.match(regexDuplicado);
  if (match) {
    return match[1].trim();
  }
  // Padrão: "[Horário: TEXTO]"
  const regexHorario = /^\[Horário:\s*(.*?)\]$/i;
  const matchH = str.match(regexHorario);
  if (matchH) {
    return matchH[1].trim();
  }
  return str;
}

/**
 * Extrai números de blocos individuais se o usuário digitou múltiplos blocos no mesmo campo
 * Exemplos aceitos: "1256926 - 1256972", "1256926 e 1256972", "1256926 / 1256972", "1256926, 1256972"
 */
export function extrairBlocosDigitados(texto = '') {
  if (!texto || typeof texto !== 'string') return [];
  const limpo = texto.trim();
  if (!limpo) return [];

  let partes = [];

  // 1. Separadores textuais explícitos com espaços: ' e ', ' E ', ' & ', ' + ', ' / ', ' - ', ' – '
  if (/\s+(?:e|E|&|\+|\/|-|–)\s+/.test(limpo)) {
    partes = limpo.split(/\s+(?:e|E|&|\+|\/|-|–)\s+/);
  } 
  // 2. Separadores por vírgula ou ponto-e-vírgula
  else if (/[,;]/.test(limpo)) {
    partes = limpo.split(/[,;]+/);
  } 
  // 3. Padrão numérico duplo (ex: "1256926-1256972" ou "1256926/1256972" onde ambos são números longos)
  else if (/(\d{3,})\s*[-/–]\s*(\d{3,})/.test(limpo)) {
    partes = limpo.split(/\s*[-/–]\s*/);
  } 
  // 4. Espaço simples entre dois códigos numéricos longos (ex: "1256926 1256972")
  else if (/\s+/.test(limpo) && !limpo.toUpperCase().startsWith('BLOCO')) {
    const pedacos = limpo.split(/\s+/);
    if (pedacos.length >= 2 && pedacos.every(p => p.length >= 3 && /^\d+$/.test(p))) {
      partes = pedacos;
    }
  }

  const blocos = (partes.length > 1 ? partes : [limpo])
    .map(b => sanitizarNumeroBloco(b))
    .filter(b => b.length > 0);

  return blocos;
}

/**
 * Detecta se o campo de bloco contém mais de 1 numeração informada
 */
export function detectarMultiplosBlocos(texto = '') {
  const blocos = extrairBlocosDigitados(texto);
  return {
    isMultiplos: blocos.length > 1,
    quantidade: blocos.length,
    blocos
  };
}

export const TIPOS_VEICULO = [
  'Carreta LS (6 Eixos)',
  'LS 7 Eixos (4 Eixos no Cavalo)',
  'LS 7 Eixos (4 Eixos na Carreta)',
  'Carreta Vanderleia',
  'Bitrem (7 Eixos)',
  'Rodotrem (9 Eixos)',
  'Bitruck (4 Eixos)',
  'Truck (3 Eixos)',
  'Outro'
];

export const EMAIL_NOTIFICACAO_DESTINO = import.meta.env.VITE_EMAIL_NOTIFICACAO_DESTINO || '';
export const WHATSAPP_ADMIN_PADRAO = import.meta.env.VITE_WHATSAPP_ADMIN_NUMERO || '';

/**
 * Gera mensagem estruturada para notificação via WhatsApp no início do carregamento
 */
export function gerarMensagemWhatsAppCarregando(agendamento, usuarioInfo = {}) {
  const protocolo = (agendamento.id || 'VT-' + Date.now()).substring(0, 8).toUpperCase();
  const placas = formatarPlacasExibicao(agendamento).map(p => `   🔹 *${p.label}:* ${p.placa}`).join('\n');
  const dataFmt = formatarDataBR(agendamento.data_agendamento);
  const dataHoraAtual = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Fortaleza'
  }).format(new Date());

  const operadorNome = usuarioInfo.nome || usuarioInfo.email?.split('@')[0]?.toUpperCase() || 'Operador da Pedreira';
  const operadorRole = usuarioInfo.role || (usuarioInfo.isAdmin ? 'Administrador Geral' : 'Operador Pedreira');

  return `🚨 *[VERMONT MINERAÇÃO] - INÍCIO DE CARREGAMENTO* 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *Protocolo:* #${protocolo}
🔵 *Status:* *CARREGANDO (EM ANDAMENTO)*

🪨 *DADOS DO BLOCO & PEDREIRA:*
🏢 *Pedreira:* *${agendamento.pedreira}*
🏷️ *Nº do Bloco:* *${agendamento.numero_bloco}*
💎 *Material:* *${agendamento.material}*
📅 *Data Agendada:* ${dataFmt} às ${agendamento.horario_agendamento}

🚛 *TRANSPORTE & MOTORISTA:*
👤 *Motorista:* *${agendamento.motorista_nome}*
🪪 *CPF:* ${agendamento.motorista_cpf}
📱 *WhatsApp Motorista:* ${agendamento.motorista_telefone || 'Não informado'}
🏢 *Transportadora:* ${agendamento.transportadora} ${agendamento.transportadora_cnpj ? `(CNPJ: ${agendamento.transportadora_cnpj})` : ''}
🛣️ *Tipo Veículo:* ${agendamento.tipo_veiculo}
⚖️ *Placas:*
${placas}
💼 *Cliente Destino:* *${agendamento.cliente}* ${agendamento.cliente_cnpj ? `(CNPJ: ${agendamento.cliente_cnpj})` : ''}
${agendamento.observacoes ? `\n📝 *Observações / Balança:* _${agendamento.observacoes}_\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👷 *Operador Responsável:* ${operadorNome} (${operadorRole})
⏱️ *Horário do Registro:* ${dataHoraAtual}
_Acompanhe em tempo real no Portal de Gestão Vermont_`;
}

/**
 * Dispara link ou requisição de WhatsApp para notificar o Admin
 */
export function abrirNotificacaoWhatsAppAdmin(agendamento, usuarioInfo = {}, numeroPersonalizado = '') {
  const mensagem = gerarMensagemWhatsAppCarregando(agendamento, usuarioInfo);
  const numeroLimpo = (numeroPersonalizado || WHATSAPP_ADMIN_PADRAO || '').replace(/\D/g, '');
  
  let url = '';
  if (numeroLimpo) {
    const numFinal = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`;
    url = `https://api.whatsapp.com/send?phone=${numFinal}&text=${encodeURIComponent(mensagem)}`;
  } else {
    url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
  }

  // Tenta webhook se configurado
  const webhookUrl = import.meta.env.VITE_WHATSAPP_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento: 'carregamento_iniciado',
          telefone_destino: numeroLimpo,
          mensagem: mensagem,
          agendamento: agendamento,
          usuario: usuarioInfo
        })
      }).catch(e => console.warn('Erro ao disparar webhook WhatsApp:', e));
    } catch (e) {}
  }

  window.open(url, '_blank');
  return { success: true, url };
}

/**
 * Verifica se a pedreira é Uruoca (única que opera aos sábados)
 */
export function isPedreiraUruoca(nomePedreira) {
  if (!nomePedreira) return false;
  return nomePedreira.toUpperCase().includes('URUOCA');
}

/**
 * Relação oficial de documentos obrigatórios para apresentação na pedreira
 */
export const DOCUMENTOS_OBRIGATORIOS_PEDREIRA = [
  'Obrigatório apresentação de CRLVs do cavalo e carreta atualizados;',
  'CNH compatível com o veículo;',
  'Motorista deve possuir o curso de cargas indivisíveis;',
  'Laudo de inspeção de rochas ou CSV dentro da validade.'
];

export const AVISO_CONFIRMACAO_CLIENTE = 'O transportador deverá sempre confirmar com o cliente, antes de realizar o carregamento, se os blocos estão devidamente envelopados e se encontram finalizados e liberados para transporte. Essa confirmação é fundamental para evitar imprevistos, atrasos ou problemas durante o carregamento e o transporte.';

export const STATUS_AGENDAMENTO = {
  AGUARDANDO: 'Aguardando Liberação',
  LIBERADO: 'Liberado para Carregar',
  CARREGANDO: 'Carregando',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado'
};



/**
 * Retorna o nome amigável e resumido da pedreira para o título
 */
export function formatarNomePedreiraCurto(pedreira = '') {
  if (!pedreira) return 'Pedreira';
  const maiusc = pedreira.toUpperCase();
  if (maiusc.includes('URUOCA')) return 'Uruoca';
  if (maiusc.includes('NEGRESCO')) return 'Massapê (Negresco)';
  if (maiusc.includes('DEL MARE')) return 'Massapê (Del Mare)';
  if (maiusc.includes('MASSAPÊ') || maiusc.includes('MASSAPE')) return 'Massapê';
  if (maiusc.includes('JAIBARAS') || maiusc.includes('SOBRAL')) return 'Sobral (Jaibaras)';
  if (maiusc.includes('SERROTE') || maiusc.includes('SÃO GONÇALO') || maiusc.includes('SAO GONCALO')) return 'São Gonçalo do Amarante (Serrote)';
  if (maiusc.includes('BEBERIBE')) return 'Beberibe';
  return pedreira.split('-')[0].trim();
}

/**
 * Gera o título do e-mail de confirmação no padrão Vermont Mineração
 * Ex: Agendamento - Uruoca - 07/09/26 - VT-5502
 * Ex Sábado: Agendamento - Uruoca - Sábado - 12/09/26 - VT-5502
 */
export function gerarAssuntoEmail(agendamento) {
  const pedreiraCurta = formatarNomePedreiraCurto(agendamento.pedreira);
  const dataFormatada = formatarDataBR(agendamento.data_agendamento);
  const bloco = agendamento.numero_bloco ? agendamento.numero_bloco.toUpperCase().trim() : 'Bloco';

  let isSabado = agendamento.tipo_dia === 'sabado';
  if (!isSabado && agendamento.data_agendamento) {
    const partes = agendamento.data_agendamento.split('-');
    if (partes.length === 3) {
      const dt = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
      isSabado = dt.getDay() === 6;
    }
  }

  const isCombinado = agendamento.is_combinado || (agendamento.observacoes && agendamento.observacoes.includes('CARGA COMBINADA'));
  const tagCombinado = isCombinado ? ' [Carga Combinada]' : '';

  if (isSabado) {
    return `Agendamento${tagCombinado} - ${pedreiraCurta} - Sábado - ${dataFormatada} - ${bloco}`;
  }
  return `Agendamento${tagCombinado} - ${pedreiraCurta} - ${dataFormatada} - ${bloco}`;
}

/**
 * Retorna a configuração de placas exigidas para o tipo de veículo
 */
export function obterConfigPlacas(tipoVeiculo) {
  if (tipoVeiculo === 'Bitrem (7 Eixos)' || tipoVeiculo === 'Rodotrem (9 Eixos)') {
    return {
      quantidade: 3,
      isBitrem: true,
      isTruck: false,
      exigeCarreta1: true,
      exigeCarreta2: true,
      labelCavalo: 'Placa do Cavalo',
      labelCarreta1: 'Placa da 1ª Carreta',
      labelCarreta2: 'Placa da 2ª Carreta'
    };
  }

  if (tipoVeiculo === 'Bitruck (4 Eixos)' || tipoVeiculo === 'Truck (3 Eixos)') {
    return {
      quantidade: 1,
      isBitrem: false,
      isTruck: true,
      exigeCarreta1: false,
      exigeCarreta2: false,
      labelCavalo: 'Placa do Veículo (Caminhão)',
      labelCarreta1: null,
      labelCarreta2: null
    };
  }

  return {
    quantidade: 2,
    isBitrem: false,
    isTruck: false,
    exigeCarreta1: true,
    exigeCarreta2: false,
    labelCavalo: 'Placa do Cavalo',
    labelCarreta1: 'Placa da Carreta',
    labelCarreta2: null
  };
}

/**
 * Retorna a formatação de placas para texto/visualização
 */
export function formatarPlacasExibicao(ag) {
  const isBitrem = ag.tipo_veiculo === 'Bitrem (7 Eixos)' || ag.tipo_veiculo === 'Rodotrem (9 Eixos)';
  const isTruck = ag.tipo_veiculo === 'Bitruck (4 Eixos)' || ag.tipo_veiculo === 'Truck (3 Eixos)';

  if (isTruck) {
    return [
      { label: 'Veículo (Caminhão)', placa: ag.placa_cavalo }
    ];
  }

  if (isBitrem) {
    return [
      { label: 'Cavalo', placa: ag.placa_cavalo },
      { label: '1ª Carreta', placa: ag.placa_carreta || '-' },
      { label: '2ª Carreta', placa: ag.placa_carreta_2 || '-' }
    ];
  }

  return [
    { label: 'Cavalo', placa: ag.placa_cavalo },
    { label: 'Carreta', placa: ag.placa_carreta || '-' }
  ];
}

// Utilitários de Persistência Local (Fallback transparente quando Supabase não estiver conectado ou em ambiente local)
const LOCAL_STORAGE_KEY = 'vermont_agendamentos_local';
export const AGENDAMENTOS_EXCLUIDOS_KEY = 'vermont_agendamentos_excluidos_ids';

/**
 * Retorna o conjunto (Set) de IDs de agendamentos excluídos definitivamente pelo administrador
 */
export function obterIdsExcluidos() {
  try {
    const raw = localStorage.getItem(AGENDAMENTOS_EXCLUIDOS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      return new Set(arr.map(id => String(id).trim()).filter(Boolean));
    }
    return new Set();
  } catch (e) {
    return new Set();
  }
}

/**
 * Registra um ID de agendamento na lista de exclusão permanente (tombstone)
 */
export function registrarIdExcluido(id) {
  if (!id && id !== 0) return;
  try {
    const idStr = String(typeof id === 'object' && id?.id ? id.id : id).trim();
    if (!idStr) return;
    const setIds = obterIdsExcluidos();
    setIds.add(idStr);
    localStorage.setItem(AGENDAMENTOS_EXCLUIDOS_KEY, JSON.stringify(Array.from(setIds)));
  } catch (e) {
    console.warn('Erro ao registrar ID excluído:', e);
  }
}

export function isSupabaseConfigurado() {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return Boolean(url && key && !url.includes('seu-projeto.supabase.co') && !key.includes('sua-chave-anon'));
}

/**
 * Garante que o histórico de status seja sempre um array válido de objetos,
 * mesmo se retornado como string JSON pelo Supabase ou localStorage
 */
export function normalizarHistoricoStatus(hist) {
  if (!hist) return [];
  if (Array.isArray(hist)) return hist;
  if (typeof hist === 'string') {
    try {
      const parsed = JSON.parse(hist);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

/**
 * Mescla e unifica duas listas de histórico (ex: Supabase e LocalStorage),
 * eliminando duplicatas por ID/Timestamp e ordenando cronologicamente (mais recente primeiro).
 * Isso garante que NUNCA haja perda ou desaparecimento de histórico de alterações.
 */
export function fundirHistoricosStatus(histA = [], histB = []) {
  const normA = normalizarHistoricoStatus(histA);
  const normB = normalizarHistoricoStatus(histB);
  if (normA.length === 0) return normB;
  if (normB.length === 0) return normA;

  const mapa = new Map();

  const extrairTimestamp = (item) => {
    if (!item?.data_hora) return 0;
    const t = new Date(item.data_hora).getTime();
    return isNaN(t) ? 0 : t;
  };

  const gerarChave = (item) => {
    if (item.id && typeof item.id === 'string' && !item.id.startsWith('temp_')) {
      return item.id;
    }
    const dh = item.data_hora ? new Date(item.data_hora).toISOString() : '';
    const st = item.status_novo || item.status || '';
    const tp = item.tipo || '';
    const desc = item.descricao || '';
    const usr = item.usuario_nome || item.usuario_email || '';
    return `${dh}_${st}_${tp}_${desc}_${usr}`;
  };

  // Processa B primeiro, depois A (para que A possa enriquecer ou sobrescrever B se tiver mais dados)
  for (const item of [...normB, ...normA]) {
    if (!item || typeof item !== 'object') continue;
    const chave = gerarChave(item);
    if (!mapa.has(chave)) {
      mapa.set(chave, item);
    } else {
      const existente = mapa.get(chave);
      mapa.set(chave, {
        ...existente,
        ...item,
        alteracoes: (item.alteracoes && item.alteracoes.length > 0) ? item.alteracoes : existente.alteracoes
      });
    }
  }

  const resultado = Array.from(mapa.values());
  resultado.sort((a, b) => extrairTimestamp(b) - extrairTimestamp(a));
  return resultado;
}

export function obterAgendamentosLocais() {
  try {
    const idsExcluidos = obterIdsExcluidos();
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const lista = raw ? JSON.parse(raw) : [];
    if (Array.isArray(lista)) {
      return lista
        .filter(item => item && !idsExcluidos.has(String(item.id).trim()))
        .map(item => ({
          ...item,
          historico_status: normalizarHistoricoStatus(item.historico_status)
        }));
    }
    return [];
  } catch (e) {
    return [];
  }
}

export function salvarAgendamentoLocal(registro) {
  try {
    const lista = obterAgendamentosLocais();
    const protocoloNumero = Math.floor(100000 + Math.random() * 900000);
    const idFinal = registro.id || `VT-${protocoloNumero}`;
    const idxExistente = lista.findIndex(item => String(item.id) === String(idFinal));

    const clienteCnpj = registro.cliente_cnpj || (idxExistente !== -1 ? lista[idxExistente].cliente_cnpj : null) || resolverCnpjCliente(registro);
    const transportadoraCnpj = registro.transportadora_cnpj || (idxExistente !== -1 ? lista[idxExistente].transportadora_cnpj : null) || resolverCnpjTransportadora(registro);

    const histExistente = idxExistente !== -1 ? lista[idxExistente].historico_status : [];
    const histFinal = fundirHistoricosStatus(registro.historico_status, histExistente);

    const itemMesclado = {
      ...(idxExistente !== -1 ? lista[idxExistente] : {}),
      ...registro,
      id: idFinal,
      cliente: limparNomeEmpresa(registro.cliente || (idxExistente !== -1 ? lista[idxExistente].cliente : '')),
      cliente_cnpj: clienteCnpj || null,
      transportadora: limparNomeEmpresa(registro.transportadora || (idxExistente !== -1 ? lista[idxExistente].transportadora : '')),
      transportadora_cnpj: transportadoraCnpj || null,
      historico_status: histFinal,
      created_at: (idxExistente !== -1 ? lista[idxExistente].created_at : null) || registro.created_at || new Date().toISOString()
    };

    if (idxExistente !== -1) {
      lista[idxExistente] = itemMesclado;
    } else {
      lista.unshift(itemMesclado);
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lista));
    return itemMesclado;
  } catch (e) {
    return {
      ...registro,
      id: registro.id || `VT-${Math.floor(100000 + Math.random() * 900000)}`,
      cliente: limparNomeEmpresa(registro.cliente),
      cliente_cnpj: registro.cliente_cnpj || resolverCnpjCliente(registro) || null,
      transportadora: limparNomeEmpresa(registro.transportadora),
      transportadora_cnpj: registro.transportadora_cnpj || resolverCnpjTransportadora(registro) || null,
      historico_status: normalizarHistoricoStatus(registro.historico_status),
      created_at: new Date().toISOString()
    };
  }
}

/**
 * Rótulos amigáveis para campos auditados
 */
export const ROTULOS_CAMPOS_AUDITORIA = {
  numero_bloco: 'Nº do Bloco',
  tipo_veiculo: 'Tipo de Veículo',
  pedreira: 'Pedreira',
  material: 'Material',
  cliente: 'Cliente',
  cliente_cnpj: 'CNPJ do Destinatário',
  transportadora: 'Transportadora',
  transportadora_cnpj: 'CNPJ da Transportadora',
  motorista_nome: 'Motorista',
  motorista_cpf: 'CPF do Motorista',
  motorista_telefone: 'WhatsApp / Telefone',
  placa_cavalo: 'Placa Cavalo',
  placa_carreta: 'Placa Carreta',
  placa_carreta_2: 'Placa 2ª Carreta',
  data_agendamento: 'Data do Agendamento',
  horario_agendamento: 'Horário Agendado',
  observacoes: 'Observações / Balança',
  justificativa_outros: 'Justificativa Horário'
};

/**
 * Detecta alterações entre o agendamento atual e o novo objeto editado
 */
export function detectarAlteracoesCampos(itemAtual = {}, itemNovo = {}) {
  const alteracoes = [];
  
  for (const [campo, label] of Object.entries(ROTULOS_CAMPOS_AUDITORIA)) {
    let valorAntigo = itemAtual[campo] !== undefined && itemAtual[campo] !== null ? String(itemAtual[campo]).trim() : '';
    let valorNovo = itemNovo[campo] !== undefined && itemNovo[campo] !== null ? String(itemNovo[campo]).trim() : '';

    if (campo === 'data_agendamento') {
      if (valorAntigo !== valorNovo && (valorAntigo || valorNovo)) {
        alteracoes.push({
          campo,
          label,
          de: formatarDataBR(valorAntigo) || valorAntigo || '(não informado)',
          para: formatarDataBR(valorNovo) || valorNovo || '(não informado)'
        });
      }
      continue;
    }

    if (valorAntigo !== valorNovo) {
      if (!valorAntigo && !valorNovo) continue;
      alteracoes.push({
        campo,
        label,
        de: valorAntigo || '(vazio)',
        para: valorNovo || '(vazio)'
      });
    }
  }

  return alteracoes;
}

/**
 * Registra um evento de histórico de alteração de campos e status combinados
 */
export function registrarHistoricoEdicao(itemAtual = {}, itemAtualizado = {}, usuarioInfo = {}) {
  const alteracoes = detectarAlteracoesCampos(itemAtual, itemAtualizado);
  const statusMudou = itemAtualizado.status && itemAtual.status && itemAtualizado.status !== itemAtual.status;

  const histItemAtualizado = normalizarHistoricoStatus(itemAtualizado.historico_status);
  const histItemAtual = normalizarHistoricoStatus(itemAtual.historico_status);

  let historicoBase = fundirHistoricosStatus(histItemAtualizado, histItemAtual);

  const dataHora = new Date().toISOString();
  const usuarioNome = usuarioInfo.nome || usuarioInfo.email?.split('@')[0]?.toUpperCase() || 'SISTEMA';
  const usuarioEmail = usuarioInfo.email || '';
  const usuarioRole = usuarioInfo.role || (usuarioInfo.isAdmin ? 'Administrador Geral' : 'Operador Pedreira');

  // Se houve alteração de campos cadastrais (ex: bloco, veículo, placas, motorista, etc.)
  if (alteracoes.length > 0) {
    const resumoAlteracoes = alteracoes.map(a => a.label).join(', ');
    const novaEntradaEdicao = {
      id: `hist_edit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      tipo: 'edicao_dados',
      descricao: `Alteração em: ${resumoAlteracoes}`,
      alteracoes: alteracoes,
      usuario_nome: usuarioNome,
      usuario_email: usuarioEmail,
      usuario_role: usuarioRole,
      data_hora: dataHora
    };
    historicoBase.unshift(novaEntradaEdicao);
  }

  // Se houve mudança de status simultânea
  if (statusMudou) {
    const novaEntradaStatus = {
      id: `hist_status_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      tipo: 'mudanca_status',
      status_anterior: itemAtual.status || 'Aguardando Liberação',
      status_novo: itemAtualizado.status,
      usuario_nome: usuarioNome,
      usuario_email: usuarioEmail,
      usuario_role: usuarioRole,
      data_hora: dataHora
    };
    historicoBase.unshift(novaEntradaStatus);
  }

  return historicoBase;
}

/**
 * Registra um evento de histórico de alteração de status
 */
export function registrarHistoricoStatus(agendamentoAtual, novoStatus, usuarioInfo = {}) {
  const statusAnterior = agendamentoAtual.status || 'Aguardando Liberação';
  const historicoExistente = normalizarHistoricoStatus(agendamentoAtual.historico_status);

  if (statusAnterior === novoStatus) {
    return historicoExistente;
  }

  const novaEntrada = {
    id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    tipo: 'mudanca_status',
    status_anterior: statusAnterior,
    status_novo: novoStatus,
    usuario_nome: usuarioInfo.nome || usuarioInfo.email?.split('@')[0]?.toUpperCase() || 'SISTEMA',
    usuario_email: usuarioInfo.email || '',
    usuario_role: usuarioInfo.role || (usuarioInfo.isAdmin ? 'Administrador Geral' : 'Operador Pedreira'),
    data_hora: new Date().toISOString()
  };

  return [novaEntrada, ...historicoExistente];
}

export function atualizarAgendamentoLocal(id, novoStatus, usuarioInfo = {}) {
  try {
    const idStr = String(typeof id === 'object' && id?.id ? id.id : id).trim();
    const lista = obterAgendamentosLocais();
    const index = lista.findIndex(item => String(item.id).trim() === idStr);
    if (index !== -1) {
      const historicoAtualizado = registrarHistoricoStatus(lista[index], novoStatus, usuarioInfo);
      lista[index].status = novoStatus;
      lista[index].historico_status = historicoAtualizado;
      lista[index].ultimo_editor = usuarioInfo.nome || usuarioInfo.email || 'Sistema';
      lista[index].updated_at = new Date().toISOString();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lista));
      return lista[index];
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function atualizarAgendamentoLocalCompleto(agendamentoAtualizado, usuarioInfo = {}) {
  try {
    const idStr = String(agendamentoAtualizado?.id || '').trim();
    const lista = obterAgendamentosLocais();
    const index = lista.findIndex(item => String(item.id).trim() === idStr);
    if (index !== -1) {
      const itemAtual = lista[index];
      const historicoNovo = normalizarHistoricoStatus(agendamentoAtualizado.historico_status);
      const historicoExistente = normalizarHistoricoStatus(itemAtual.historico_status);
      const historicoFinal = fundirHistoricosStatus(historicoNovo, historicoExistente);

      lista[index] = { 
        ...lista[index], 
        ...agendamentoAtualizado, 
        historico_status: historicoFinal,
        ultimo_editor: usuarioInfo.nome || usuarioInfo.email || itemAtual.ultimo_editor || 'Sistema',
        updated_at: new Date().toISOString() 
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lista));
      return lista[index];
    } else {
      const novoItem = {
        ...agendamentoAtualizado,
        historico_status: normalizarHistoricoStatus(agendamentoAtualizado.historico_status)
      };
      lista.unshift(novoItem);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lista));
      return novoItem;
    }
  } catch (e) {
    return agendamentoAtualizado;
  }
}

export async function salvarEdicaoAgendamento(agendamentoAtualizado, usuarioInfo = {}, agendamentoOriginal = null) {
  try {
    if (!agendamentoAtualizado || !agendamentoAtualizado.id) {
      throw new Error('ID do agendamento inválido para edição.');
    }

    const id = agendamentoAtualizado.id;
    const idStr = String(id).trim();

    // 1. Obtém o item anterior de forma 100% confiável
    let itemAtual = agendamentoOriginal && String(agendamentoOriginal.id).trim() === idStr ? { ...agendamentoOriginal } : null;

    if (!itemAtual) {
      const listaLocal = obterAgendamentosLocais();
      const achado = listaLocal.find(item => String(item.id).trim() === idStr);
      if (achado) itemAtual = { ...achado };
    }

    if ((!itemAtual || !itemAtual.status) && isSupabaseConfigurado()) {
      try {
        const { data: dataRemota } = await supabase
          .from('agendamentos_pedreira')
          .select('*')
          .eq('id', id)
          .single();
        if (dataRemota) itemAtual = { ...dataRemota };
      } catch (e) {}
    }

    if (!itemAtual) {
      itemAtual = { ...agendamentoAtualizado };
    }

    // Verificação de permissão para 'Aguardando Liberação'
    const statusOriginal = (itemAtual.status || 'Aguardando Liberação').trim();
    if (!usuarioInfo?.isAdmin && statusOriginal === 'Aguardando Liberação' && agendamentoAtualizado.status !== 'Aguardando Liberação') {
      return {
        success: false,
        error: 'Acesso restrito: Agendamentos com status "Aguardando Liberação" só podem ser liberados ou alterados pelo Administrador Geral.'
      };
    }

    // 2. Registra o histórico comparando o item anterior com os novos valores
    const historicoAtualizado = registrarHistoricoEdicao(itemAtual, agendamentoAtualizado, usuarioInfo);
    agendamentoAtualizado.historico_status = historicoAtualizado;

    const payloadBase = {
      pedreira: agendamentoAtualizado.pedreira,
      material: agendamentoAtualizado.material,
      numero_bloco: agendamentoAtualizado.numero_bloco ? String(agendamentoAtualizado.numero_bloco).toUpperCase().trim() : '',
      cliente: agendamentoAtualizado.cliente ? String(agendamentoAtualizado.cliente).toUpperCase().trim() : '',
      cliente_cnpj: agendamentoAtualizado.cliente_cnpj ? String(agendamentoAtualizado.cliente_cnpj).trim() : null,
      transportadora: agendamentoAtualizado.transportadora ? String(agendamentoAtualizado.transportadora).toUpperCase().trim() : '',
      transportadora_cnpj: agendamentoAtualizado.transportadora_cnpj ? String(agendamentoAtualizado.transportadora_cnpj).trim() : null,
      motorista_nome: agendamentoAtualizado.motorista_nome ? String(agendamentoAtualizado.motorista_nome).toUpperCase().trim() : '',
      motorista_cpf: agendamentoAtualizado.motorista_cpf,
      motorista_telefone: agendamentoAtualizado.motorista_telefone || null,
      tipo_veiculo: agendamentoAtualizado.tipo_veiculo,
      placa_cavalo: agendamentoAtualizado.placa_cavalo ? String(agendamentoAtualizado.placa_cavalo).toUpperCase().replace(/[^A-Z0-9]/g, '') : '',
      placa_carreta: agendamentoAtualizado.placa_carreta ? String(agendamentoAtualizado.placa_carreta).toUpperCase().replace(/[^A-Z0-9]/g, '') : null,
      placa_carreta_2: agendamentoAtualizado.placa_carreta_2 ? String(agendamentoAtualizado.placa_carreta_2).toUpperCase().replace(/[^A-Z0-9]/g, '') : null,
      data_agendamento: agendamentoAtualizado.data_agendamento,
      horario_agendamento: agendamentoAtualizado.horario_agendamento,
      justificativa_outros: agendamentoAtualizado.justificativa_outros || null,
      observacoes: agendamentoAtualizado.observacoes || null,
      status: agendamentoAtualizado.status
    };

    let resultado = null;

    if (isSupabaseConfigurado()) {
      try {
        // 1. Tenta atualizar incluindo colunas de auditoria
        let resSup = await supabase
          .from('agendamentos_pedreira')
          .update({
            ...payloadBase,
            historico_status: historicoAtualizado,
            ultimo_editor: usuarioInfo.nome || usuarioInfo.email || 'Sistema'
          })
          .eq('id', agendamentoAtualizado.id)
          .select()
          .single();

        // 1.1 Se falhar, tenta com JSON string caso a coluna seja tipo text
        if (resSup.error) {
          try {
            resSup = await supabase
              .from('agendamentos_pedreira')
              .update({
                ...payloadBase,
                historico_status: JSON.stringify(historicoAtualizado),
                ultimo_editor: usuarioInfo.nome || usuarioInfo.email || 'Sistema'
              })
              .eq('id', agendamentoAtualizado.id)
              .select()
              .single();
          } catch (eStr) {}
        }

        if (!resSup.error && resSup.data) {
          resultado = resSup.data;
        } else if (resSup.error) {
          console.warn('Erro ao atualizar com campos de auditoria no Supabase. Tentando campos padrão:', resSup.error.message);
          // 2. Se falhar (ex: colunas extras não criadas no Supabase), atualiza os campos padrão da tabela
          const { data: dataPadrao, error: errorPadrao } = await supabase
            .from('agendamentos_pedreira')
            .update(payloadBase)
            .eq('id', agendamentoAtualizado.id)
            .select()
            .single();

          if (!errorPadrao && dataPadrao) {
            resultado = { ...dataPadrao, historico_status: historicoAtualizado, ultimo_editor: usuarioInfo.nome || usuarioInfo.email || 'Sistema' };
          } else if (errorPadrao) {
            console.warn('Tentando atualizar payload essencial no Supabase sem colunas opcionais de CNPJ:', errorPadrao.message);
            const payloadSemCnpj = { ...payloadBase };
            delete payloadSemCnpj.cliente_cnpj;
            delete payloadSemCnpj.transportadora_cnpj;

            const { data: dataSemCnpj, error: errorSemCnpj } = await supabase
              .from('agendamentos_pedreira')
              .update(payloadSemCnpj)
              .eq('id', agendamentoAtualizado.id)
              .select()
              .single();

            if (!errorSemCnpj && dataSemCnpj) {
              resultado = { ...dataSemCnpj, historico_status: historicoAtualizado, ultimo_editor: usuarioInfo.nome || usuarioInfo.email || 'Sistema' };
            } else if (errorSemCnpj) {
              console.error('Erro definitivo ao atualizar agendamento no Supabase:', errorSemCnpj);
            }
          }
        }
      } catch (eSup) {
        console.warn('Erro de conexão ao atualizar agendamento no Supabase:', eSup);
      }
    }

    if (agendamentoAtualizado.cliente && agendamentoAtualizado.cliente_cnpj) {
      salvarEmpresaCnpjCache(agendamentoAtualizado.cliente, agendamentoAtualizado.cliente_cnpj);
    }
    if (agendamentoAtualizado.transportadora && agendamentoAtualizado.transportadora_cnpj) {
      salvarEmpresaCnpjCache(agendamentoAtualizado.transportadora, agendamentoAtualizado.transportadora_cnpj);
    }

    const clienteLimpo = limparNomeEmpresa(agendamentoAtualizado.cliente || (itemAtual && itemAtual.cliente));
    const transpLimpa = limparNomeEmpresa(agendamentoAtualizado.transportadora || (itemAtual && itemAtual.transportadora));
    const clienteCnpj = agendamentoAtualizado.cliente_cnpj || (resultado && resultado.cliente_cnpj) || (itemAtual && itemAtual.cliente_cnpj) || resolverCnpjCliente(agendamentoAtualizado);
    const transpCnpj = agendamentoAtualizado.transportadora_cnpj || (resultado && resultado.transportadora_cnpj) || (itemAtual && itemAtual.transportadora_cnpj) || resolverCnpjTransportadora(agendamentoAtualizado);

    const histConsolidado = fundirHistoricosStatus(
      historicoAtualizado,
      resultado?.historico_status || itemAtual?.historico_status
    );

    const dadosConsolidados = {
      ...itemAtual,
      ...agendamentoAtualizado,
      ...(resultado || {}),
      cliente: clienteLimpo,
      cliente_cnpj: clienteCnpj || null,
      transportadora: transpLimpa,
      transportadora_cnpj: transpCnpj || null,
      historico_status: histConsolidado
    };

    const localAtualizado = atualizarAgendamentoLocalCompleto(dadosConsolidados, usuarioInfo);
    return { success: true, data: { ...localAtualizado, ...dadosConsolidados } };
  } catch (err) {
    console.error('Erro ao salvar edição de agendamento:', err);
    return { success: false, error: err.message };
  }
}

export function excluirAgendamentoLocal(id) {
  try {
    const idStr = String(typeof id === 'object' && id?.id ? id.id : id).trim();
    if (!idStr) return false;
    registrarIdExcluido(idStr);
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const lista = raw ? JSON.parse(raw) : [];
    const filtrados = Array.isArray(lista)
      ? lista.filter(item => item && String(item.id).trim() !== idStr)
      : [];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtrados));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Normaliza o nome da pedreira para chave única insensível a maiúsculas/minúsculas e acentuação
 */
export function normalizarChavePedreira(nome) {
  if (!nome) return '';
  const up = String(nome).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (up.includes('URUOCA')) return 'URUOCA';
  if (up.includes('NEGRESCO')) return 'MASSAPE_NEGRESCO';
  if (up.includes('DEL MARE') || up.includes('DELMARE')) return 'MASSAPE_DELMARE';
  if (up.includes('JAIBARAS') || (up.includes('SOBRAL') && !up.includes('MASSAPE'))) return 'SOBRAL_JAIBARAS';
  if (up.includes('SERROTE') || up.includes('SAO GONCALO')) return 'SERROTE';
  if (up.includes('BEBERIBE')) return 'BEBERIBE';
  return up.replace(/[^A-Z0-9]/g, '');
}

/**
 * Compara se duas strings de pedreira referem-se à mesma unidade
 */
export function saoMesmaPedreira(p1, p2) {
  if (!p1 || !p2) return false;
  if (p1 === p2) return true;
  if (p1.toLowerCase() === p2.toLowerCase()) return true;
  return normalizarChavePedreira(p1) === normalizarChavePedreira(p2);
}

/**
 * Retorna o nome canônico e formatado da pedreira a partir de qualquer variação ou chave
 */
export function normalizarNomePedreira(nome) {
  if (!nome) return '';
  const chave = normalizarChavePedreira(nome);
  const encontrada = PEDREIRAS_CEARA.find(p => normalizarChavePedreira(p.nome) === chave || p.id === chave.toLowerCase());
  return encontrada ? encontrada.nome : nome.trim();
}

/**
 * Normaliza e padroniza o nome do material (ex: unifica variações de Taj Mahal, Quartzito, etc.)
 */
export function normalizarNomeMaterial(material, pedreira = '') {
  if (!material) return 'Não informado';
  const clean = String(material).trim();
  const up = clean.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Taj Mahal e variações (incluindo quando cadastrado como Quartzito ou quando a pedreira for Uruoca)
  if (
    up.includes('TAJ MAHAL') || 
    up.includes('TAJMAHAL') || 
    up === 'QUARTZITO' || 
    up.includes('QUARTZITO') ||
    (pedreira && normalizarChavePedreira(pedreira) === 'URUOCA')
  ) {
    return 'Taj Mahal';
  }

  // Verificar correspondência com materiais oficiais cadastrados
  for (const lista of Object.values(MATERIAIS_POR_PEDREIRA)) {
    for (const matOficial of lista) {
      const upOficial = matOficial.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (up === upOficial || up.replace(/\s+/g, '') === upOficial.replace(/\s+/g, '')) {
        return matOficial;
      }
    }
  }

  // Se não encontrar na lista oficial, formata em Title Case mantendo legibilidade
  return clean.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/**
 * Consulta horários que já foram agendados para a pedreira e data selecionadas
 */
export async function obterHorariosOcupados(dataStr, pedreira) {
  try {
    if (!dataStr || !pedreira) return [];
    const idsExcluidos = obterIdsExcluidos();

    let ocupados = [];
    if (isSupabaseConfigurado()) {
      try {
        const { data, error } = await supabase
          .from('agendamentos_pedreira')
          .select('id, horario_agendamento, pedreira, status, observacoes')
          .eq('data_agendamento', dataStr)
          .neq('status', 'Cancelado');

        if (!error && data) {
          ocupados = data
            .filter(item => {
              const idStr = String(item.id).trim();
              if (idsExcluidos.has(idStr)) return false;
              if (typeof item.observacoes === 'string' && item.observacoes.includes('[EXCLUÍDO DEFINITIVAMENTE PELO ADMINISTRADOR]')) {
                registrarIdExcluido(idStr);
                return false;
              }
              return true;
            })
            .filter(item => saoMesmaPedreira(item.pedreira, pedreira))
            .map(item => item.horario_agendamento)
            .filter(h => h && h !== 'outros' && !h.startsWith('Sábado'));
          return Array.from(new Set(ocupados));
        }
      } catch (e) {
        console.warn('Erro ao consultar Supabase, buscando dados locais:', e);
      }
    }

    const locais = obterAgendamentosLocais();
    ocupados = locais
      .filter(item => !idsExcluidos.has(String(item.id).trim()))
      .filter(item => item.data_agendamento === dataStr && saoMesmaPedreira(item.pedreira, pedreira) && item.status !== 'Cancelado')
      .map(item => item.horario_agendamento)
      .filter(h => h && h !== 'outros' && !h.startsWith('Sábado'));

    return Array.from(new Set(ocupados));
  } catch (err) {
    console.error('Erro ao consultar horários ocupados:', err);
    return [];
  }
}

/**
 * Verifica se uma data em formato YYYY-MM-DD corresponde a um sábado
 */
export function isDataSabado(dataStr) {
  if (!dataStr) return false;
  const [ano, mes, dia] = String(dataStr).split('-').map(Number);
  if (!ano || !mes || !dia) return false;
  const d = new Date(ano, mes - 1, dia, 12, 0, 0);
  return d.getDay() === 6;
}

/**
 * Retorna a data (YYYY-MM-DD) da sexta-feira imediatamente anterior a um sábado
 */
export function obterSextaFeiraAnterior(dataSabadoStr) {
  if (!dataSabadoStr) return null;
  const [ano, mes, dia] = String(dataSabadoStr).split('-').map(Number);
  if (!ano || !mes || !dia) return null;
  const d = new Date(ano, mes - 1, dia, 12, 0, 0);
  if (d.getDay() === 6) {
    d.setDate(d.getDate() - 1);
  } else {
    const diff = (d.getDay() + 2) % 7;
    d.setDate(d.getDate() - (diff === 0 ? 7 : diff));
  }
  const a = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const diaFmt = String(d.getDate()).padStart(2, '0');
  return `${a}-${m}-${diaFmt}`;
}

/**
 * Verifica se o agendamento para um determinado sábado está bloqueado por horário limite.
 * (Aviso orientativo: não bloqueia a submissão, apenas orienta sobre o limite de sexta-feira às 14h)
 */
export function isAgendamentoSabadoBloqueado(dataSabadoStr) {
  return false;
}

/**
 * Retorna o status detalhado e lembrete operacional de agendamentos de sábado
 */
export function obterStatusTravaSabado(dataSabadoStr) {
  if (!dataSabadoStr || !isDataSabado(dataSabadoStr)) {
    return { isSabado: false, bloqueado: false, motivo: '', aviso: '' };
  }

  const sextaAnteriorStr = obterSextaFeiraAnterior(dataSabadoStr);
  const motivo = `Aviso Operacional: O horário limite para agendamento dos sábados é até sexta-feira às 14:00.`;

  return {
    isSabado: true,
    bloqueado: false,
    motivo,
    aviso: motivo,
    dataSabado: dataSabadoStr,
    sextaAnterior: sextaAnteriorStr
  };
}

/**
 * Conta a quantidade de veículos únicos (carros/cavalos mecânicos) a partir de uma lista de agendamentos
 */
export function contarVeiculosUnicos(lista) {
  if (!Array.isArray(lista)) return 0;
  const setVeiculos = new Set();
  lista.forEach(item => {
    if (!item) return;
    const statusLimpo = String(item.status || '').toLowerCase().trim();
    if (statusLimpo === 'cancelado') return;

    const placaCavalo = item.placa_cavalo ? item.placa_cavalo.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
    if (placaCavalo) {
      setVeiculos.add(`placa:${placaCavalo}`);
      return;
    }

    const placaCarreta = item.placa_carreta ? item.placa_carreta.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
    if (placaCarreta) {
      setVeiculos.add(`carreta:${placaCarreta}`);
      return;
    }

    const cpf = item.motorista_cpf ? String(item.motorista_cpf).replace(/\D/g, '') : '';
    if (cpf) {
      setVeiculos.add(`cpf:${cpf}`);
      return;
    }

    const chaveId = item.id || item.codigo_agendamento || item.numero_bloco || Math.random();
    setVeiculos.add(`id:${chaveId}`);
  });
  return setVeiculos.size;
}

/**
 * Consulta a quantidade de agendamentos no sábado para verificar limite de 12 veículos e status de trava de horário
 */
export async function obterOcupacaoSabado(dataStr, pedreira = null) {
  try {
    const statusTrava = obterStatusTravaSabado(dataStr);

    if (!dataStr) {
      return { total: 0, limite: 12, disponivel: 12, lotado: false, totalBlocos: 0, bloqueado: false, motivoTrava: '' };
    }

    const idsExcluidos = obterIdsExcluidos();
    let todosAgendamentosSabado = [];
    const mapaUnificados = new Map();

    // 1. Consulta agendamentos no Supabase para a data
    if (isSupabaseConfigurado()) {
      try {
        const { data, error } = await supabase
          .from('agendamentos_pedreira')
          .select('*')
          .eq('data_agendamento', dataStr);

        if (!error && Array.isArray(data)) {
          data.forEach(item => {
            const idStr = String(item.id).trim();
            if (idsExcluidos.has(idStr)) return;
            if (typeof item.observacoes === 'string' && item.observacoes.includes('[EXCLUÍDO DEFINITIVAMENTE PELO ADMINISTRADOR]')) {
              registrarIdExcluido(idStr);
              return;
            }
            const statusLimpo = String(item.status || '').toLowerCase().trim();
            if (statusLimpo !== 'cancelado') {
              mapaUnificados.set(String(item.id || item.codigo_agendamento || item.numero_bloco), item);
            }
          });
        }
      } catch (e) {
        console.warn('Erro ao verificar sábado no Supabase, buscando local:', e);
      }
    }

    // 2. Mescla com o armazenamento local (offline/cache)
    const locais = obterAgendamentosLocais();
    locais.forEach(item => {
      const idStr = String(item.id).trim();
      if (idsExcluidos.has(idStr)) return;
      if (item.data_agendamento === dataStr) {
        const statusLimpo = String(item.status || '').toLowerCase().trim();
        if (statusLimpo !== 'cancelado') {
          const key = String(item.id || item.codigo_agendamento || item.numero_bloco);
          if (!mapaUnificados.has(key)) {
            mapaUnificados.set(key, item);
          }
        }
      }
    });

    todosAgendamentosSabado = Array.from(mapaUnificados.values());

    // 3. Filtro por pedreira: aos sábados a cota é exclusiva para Uruoca (Taj Mahal)
    const filtrados = todosAgendamentosSabado.filter(item => {
      if (!pedreira || pedreira === 'todas') {
        return isPedreiraUruoca(item.pedreira) || saoMesmaPedreira(item.pedreira, 'Uruoca - CE (Taj Mahal)');
      }
      return saoMesmaPedreira(item.pedreira, pedreira) || (isPedreiraUruoca(pedreira) && isPedreiraUruoca(item.pedreira));
    });

    const totalVeiculos = contarVeiculosUnicos(filtrados);
    const limite = 12;
    const disponivel = Math.max(0, limite - totalVeiculos);
    const lotado = totalVeiculos >= limite;

    return { 
      total: totalVeiculos, 
      limite, 
      disponivel, 
      lotado, 
      totalBlocos: filtrados.length,
      bloqueado: statusTrava.bloqueado,
      motivoTrava: statusTrava.motivo
    };
  } catch (err) {
    console.error('Erro ao verificar ocupação do sábado:', err);
    return { total: 0, limite: 12, disponivel: 12, lotado: false, totalBlocos: 0, bloqueado: false, motivoTrava: '' };
  }
}

/**
 * Consulta agendamentos de datas anteriores a hoje que ainda não foram finalizados nem cancelados
 */
export async function obterPendenciasAnteriores({ pedreira = 'todas', dataReferencia = null } = {}) {
  try {
    const idsExcluidos = obterIdsExcluidos();
    const hoje = dataReferencia || new Date().toISOString().split('T')[0];

    if (isSupabaseConfigurado()) {
      try {
        let query = supabase
          .from('agendamentos_pedreira')
          .select('*')
          .lt('data_agendamento', hoje)
          .not('status', 'in', '("Finalizado","Carregado","Cancelado")')
          .order('data_agendamento', { ascending: false })
          .order('horario_agendamento', { ascending: true });

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          const locais = obterAgendamentosLocais().filter(l => !idsExcluidos.has(String(l.id).trim()));
          const locaisMap = new Map(locais.map(l => [String(l.id).trim(), l]));

          let lista = data
            .filter(item => {
              const idStr = String(item.id).trim();
              if (idsExcluidos.has(idStr)) return false;
              if (typeof item.observacoes === 'string' && item.observacoes.includes('[EXCLUÍDO DEFINITIVAMENTE PELO ADMINISTRADOR]')) {
                registrarIdExcluido(idStr);
                return false;
              }
              return true;
            })
            .map(item => {
              const loc = locaisMap.get(String(item.id).trim());
              const histSup = normalizarHistoricoStatus(item.historico_status);
              const histLoc = normalizarHistoricoStatus(loc?.historico_status);
              const historicoFinal = fundirHistoricosStatus(histSup, histLoc);

              const clienteCnpj = resolverCnpjCliente(item, loc);
              const transpCnpj = resolverCnpjTransportadora(item, loc);
              const clienteLimpo = limparNomeEmpresa(item.cliente || loc?.cliente || '');
              const transpLimpa = limparNomeEmpresa(item.transportadora || loc?.transportadora || '');

              return {
                ...(loc || {}),
                ...item,
                cliente: clienteLimpo || item.cliente,
                cliente_cnpj: clienteCnpj || null,
                transportadora: transpLimpa || item.transportadora,
                transportadora_cnpj: transpCnpj || null,
                historico_status: historicoFinal,
                ultimo_editor: item.ultimo_editor || loc?.ultimo_editor || (historicoFinal.length > 0 ? historicoFinal[0].usuario_nome : null)
              };
            });

          if (pedreira && pedreira !== 'todas') {
            lista = lista.filter(item => saoMesmaPedreira(item.pedreira, pedreira));
          }

          return lista;
        }
      } catch (e) {
        console.warn('Erro ao consultar pendências anteriores no Supabase:', e);
      }
    }

    const locais = obterAgendamentosLocais().filter(l => !idsExcluidos.has(String(l.id).trim())).map(item => ({
      ...item,
      cliente: limparNomeEmpresa(item.cliente),
      cliente_cnpj: item.cliente_cnpj || resolverCnpjCliente(item) || null,
      transportadora: limparNomeEmpresa(item.transportadora),
      transportadora_cnpj: item.transportadora_cnpj || resolverCnpjTransportadora(item) || null
    }));

    return locais.filter(item => {
      const isAnterior = item.data_agendamento && item.data_agendamento < hoje;
      const isPendente = item.status && !['Finalizado', 'Carregado', 'Cancelado'].includes(item.status);
      const matchPedreira = (!pedreira || pedreira === 'todas') ? true : saoMesmaPedreira(item.pedreira, pedreira);
      return isAnterior && isPendente && matchPedreira;
    }).sort((a, b) => (b.data_agendamento || '').localeCompare(a.data_agendamento || ''));
  } catch (err) {
    console.error('Erro ao consultar pendências anteriores:', err);
    return [];
  }
}

/**
 * Normaliza e expande o filtro de status (suporta string única, array de status e expansão de aliases)
 */
export function normalizarFiltroStatus(statusFiltro) {
  if (!statusFiltro) return null;
  let arr = [];
  if (Array.isArray(statusFiltro)) {
    arr = statusFiltro;
  } else if (typeof statusFiltro === 'string') {
    if (statusFiltro === 'todos' || !statusFiltro.trim()) return null;
    arr = [statusFiltro];
  } else {
    return null;
  }

  // Se o array contém 'todos' ou está vazio, significa que não há restrição de status
  if (arr.length === 0 || arr.includes('todos')) {
    return null;
  }

  const expandido = new Set();
  arr.forEach(st => {
    if (!st || st === 'todos') return;
    if (st === 'Liberado para Carregar' || st === 'Confirmado') {
      expandido.add('Liberado para Carregar');
      expandido.add('Confirmado');
    } else if (st === 'Finalizado' || st === 'Carregado') {
      expandido.add('Finalizado');
      expandido.add('Carregado');
    } else {
      expandido.add(st);
    }
  });

  return expandido.size > 0 ? Array.from(expandido) : null;
}

/**
 * Lista todos os agendamentos com filtros
 */
export async function listarAgendamentos(filtros = {}) {
  try {
    const idsExcluidos = obterIdsExcluidos();
    const statusArray = normalizarFiltroStatus(filtros.status);
    let listaSup = [];
    const locais = obterAgendamentosLocais().filter(l => !idsExcluidos.has(String(l.id).trim()));
    const locaisMap = new Map(locais.map(l => [String(l.id).trim(), l]));

    if (isSupabaseConfigurado()) {
      try {
        let query = supabase
          .from('agendamentos_pedreira')
          .select('*')
          .order('data_agendamento', { ascending: false })
          .order('created_at', { ascending: false });

        if (statusArray && statusArray.length > 0) {
          query = query.in('status', statusArray);
        }

        if (filtros.data) {
          query = query.eq('data_agendamento', filtros.data);
        }

        const { data, error } = await query;
        if (!error && data) {
          // Filtra registros excluídos definitivamente (tombstone e observação de auditoria)
          const dataFiltrada = data.filter(item => {
            const idStr = String(item.id).trim();
            if (idsExcluidos.has(idStr)) return false;
            if (typeof item.observacoes === 'string' && item.observacoes.includes('[EXCLUÍDO DEFINITIVAMENTE PELO ADMINISTRADOR]')) {
              registrarIdExcluido(idStr);
              return false;
            }
            return true;
          });

          listaSup = dataFiltrada.map(item => {
            const idStr = String(item.id).trim();
            const loc = locaisMap.get(idStr);
            const histSup = normalizarHistoricoStatus(item.historico_status);
            const histLoc = normalizarHistoricoStatus(loc?.historico_status);
            const historicoFinal = fundirHistoricosStatus(histSup, histLoc);

            const clienteCnpj = resolverCnpjCliente(item, loc);
            const transpCnpj = resolverCnpjTransportadora(item, loc);
            const clienteLimpo = limparNomeEmpresa(item.cliente || loc?.cliente || '');
            const transpLimpa = limparNomeEmpresa(item.transportadora || loc?.transportadora || '');

            return {
              ...(loc || {}),
              ...item,
              cliente: clienteLimpo || item.cliente,
              cliente_cnpj: clienteCnpj || item.cliente_cnpj || loc?.cliente_cnpj || null,
              transportadora: transpLimpa || item.transportadora,
              transportadora_cnpj: transpCnpj || item.transportadora_cnpj || loc?.transportadora_cnpj || null,
              historico_status: historicoFinal,
              ultimo_editor: item.ultimo_editor || loc?.ultimo_editor || (historicoFinal.length > 0 ? historicoFinal[0].usuario_nome : null)
            };
          });

          // Identifica registros que existem localmente mas ainda não subiram para o Supabase
          const supabaseIds = new Set(data.map(d => String(d.id).trim()));
          const locaisNaoNoSupabase = locais.filter(l => {
            const idStr = String(l.id).trim();
            if (idsExcluidos.has(idStr)) return false;
            if (l.status === 'Cancelado') return false;
            if (supabaseIds.has(idStr)) return false;
            // Se filtro de data estiver ativo, checa se o agendamento local bate com a data
            if (filtros.data && l.data_agendamento !== filtros.data) return false;
            // Se filtro de status estiver ativo, checa status
            if (statusArray && statusArray.length > 0) {
              if (!statusArray.includes(l.status)) return false;
            }
            return true;
          }).map(l => ({
            ...l,
            cliente: limparNomeEmpresa(l.cliente),
            cliente_cnpj: l.cliente_cnpj || resolverCnpjCliente(l) || null,
            transportadora: limparNomeEmpresa(l.transportadora),
            transportadora_cnpj: l.transportadora_cnpj || resolverCnpjTransportadora(l) || null
          }));

          // Une registros do Supabase com registros pendentes locais para NUNCA perder nenhum agendamento
          let listaUnificada = [...listaSup, ...locaisNaoNoSupabase];

          if (filtros.pedreira && filtros.pedreira !== 'todas') {
            listaUnificada = listaUnificada.filter(item => saoMesmaPedreira(item.pedreira, filtros.pedreira));
          }

          // Mantém localStorage sempre sincronizado sem readicionar itens excluídos
          try {
            const mapaAtualizado = new Map(locais.filter(l => !idsExcluidos.has(String(l.id).trim())).map(l => [String(l.id).trim(), l]));
            listaSup.forEach(item => {
              const idItemStr = String(item.id).trim();
              if (idsExcluidos.has(idItemStr)) return;
              const anterior = mapaAtualizado.get(idItemStr) || {};
              const histMesclado = fundirHistoricosStatus(item.historico_status, anterior.historico_status);
              const cCnpj = item.cliente_cnpj || anterior.cliente_cnpj || resolverCnpjCliente(item, anterior) || null;
              const tCnpj = item.transportadora_cnpj || anterior.transportadora_cnpj || resolverCnpjTransportadora(item, anterior) || null;
              mapaAtualizado.set(idItemStr, {
                ...anterior,
                ...item,
                cliente: item.cliente || anterior.cliente,
                cliente_cnpj: cCnpj,
                transportadora: item.transportadora || anterior.transportadora,
                transportadora_cnpj: tCnpj,
                historico_status: histMesclado
              });
            });
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(Array.from(mapaAtualizado.values())));
          } catch (e) {}

          // Tenta subir registros pendentes para o Supabase em segundo plano (NUNCA re-insere excluídos)
          if (locaisNaoNoSupabase.length > 0) {
            locaisNaoNoSupabase.forEach(async (pendente) => {
              const idPendenteStr = String(pendente.id).trim();
              if (idsExcluidos.has(idPendenteStr) || pendente.status === 'Cancelado') return;
              try {
                const { error: errInsert } = await supabase
                  .from('agendamentos_pedreira')
                  .insert([{ ...pendente, id: pendente.id?.startsWith('VT-') ? undefined : pendente.id }]);
                if (!errInsert) {
                  console.info('[Sync] Agendamento local sincronizado com Supabase:', pendente.numero_bloco);
                }
              } catch (eSync) {}
            });
          }

          return listaUnificada;
        }
      } catch (e) {
        console.warn('Erro ao listar do Supabase, buscando locais:', e);
      }
    }

    let resultado = obterAgendamentosLocais().filter(l => !idsExcluidos.has(String(l.id).trim())).map(item => ({
      ...item,
      cliente: limparNomeEmpresa(item.cliente),
      cliente_cnpj: item.cliente_cnpj || resolverCnpjCliente(item) || null,
      transportadora: limparNomeEmpresa(item.transportadora),
      transportadora_cnpj: item.transportadora_cnpj || resolverCnpjTransportadora(item) || null
    }));
    if (filtros.pedreira && filtros.pedreira !== 'todas') {
      resultado = resultado.filter(item => saoMesmaPedreira(item.pedreira, filtros.pedreira));
    }
    if (statusArray && statusArray.length > 0) {
      resultado = resultado.filter(item => statusArray.includes(item.status));
    }
    if (filtros.data) {
      resultado = resultado.filter(item => item.data_agendamento === filtros.data);
    }
    return resultado;
  } catch (err) {
    console.error('Erro ao listar agendamentos:', err);
    return [];
  }
}

/**
 * Atualiza o status de um agendamento com persistência e fallback de colunas
 */
export async function atualizarStatusAgendamento(agendamentoOuId, novoStatus, usuarioInfo = {}) {
  try {
    const id = typeof agendamentoOuId === 'object' && agendamentoOuId ? agendamentoOuId.id : agendamentoOuId;
    if (!id) throw new Error('ID do agendamento inválido.');

    // 1. Obtém o item anterior de forma 100% confiável
    let itemAtual = typeof agendamentoOuId === 'object' && agendamentoOuId ? { ...agendamentoOuId } : null;

    if (!itemAtual || !itemAtual.status) {
      const idStr = String(id).trim();
      const listaLocal = obterAgendamentosLocais();
      const achado = listaLocal.find(item => String(item.id).trim() === idStr);
      if (achado) itemAtual = { ...achado };
    }

    if ((!itemAtual || !itemAtual.status) && isSupabaseConfigurado()) {
      try {
        const { data: dataRemota } = await supabase
          .from('agendamentos_pedreira')
          .select('*')
          .eq('id', id)
          .single();
        if (dataRemota) itemAtual = { ...dataRemota };
      } catch (e) {}
    }

    if (!itemAtual) {
      itemAtual = { id, status: 'Aguardando Liberação', historico_status: [] };
    }

    itemAtual.historico_status = normalizarHistoricoStatus(itemAtual.historico_status);

    // Verificação de permissão: apenas Admin pode alterar se o status atual for 'Aguardando Liberação'
    const statusAtualNormal = (itemAtual.status || 'Aguardando Liberação').trim();
    if (!usuarioInfo?.isAdmin && statusAtualNormal === 'Aguardando Liberação' && novoStatus !== 'Aguardando Liberação') {
      return {
        success: false,
        error: 'Acesso restrito: Agendamentos com status "Aguardando Liberação" só podem ser liberados ou alterados pelo Administrador Geral.'
      };
    }

    // 2. Gera o novo histórico com status_anterior correto
    const historicoAtualizado = registrarHistoricoStatus(itemAtual, novoStatus, usuarioInfo);

    let atualizado = null;

    if (isSupabaseConfigurado()) {
      try {
        // 1. Tenta atualizar com colunas de auditoria
        let resSup = await supabase
          .from('agendamentos_pedreira')
          .update({ 
            status: novoStatus,
            historico_status: historicoAtualizado,
            ultimo_editor: usuarioInfo.nome || usuarioInfo.email || 'Sistema'
          })
          .eq('id', id)
          .select()
          .single();

        // 1.1 Se falhar, tenta com JSON string caso a coluna seja tipo text
        if (resSup.error) {
          try {
            resSup = await supabase
              .from('agendamentos_pedreira')
              .update({ 
                status: novoStatus,
                historico_status: JSON.stringify(historicoAtualizado),
                ultimo_editor: usuarioInfo.nome || usuarioInfo.email || 'Sistema'
              })
              .eq('id', id)
              .select()
              .single();
          } catch (eStr) {}
        }

        if (!resSup.error && resSup.data) {
          atualizado = {
            ...resSup.data,
            historico_status: normalizarHistoricoStatus(resSup.data.historico_status || historicoAtualizado)
          };
        } else if (resSup.error) {
          console.warn('Tentando atualizar apenas status básico no Supabase:', resSup.error.message);
          // 2. Se falhar (ex: colunas extras inexistentes no Supabase), atualiza apenas o status
          const { data: dataSimples, error: errorSimples } = await supabase
            .from('agendamentos_pedreira')
            .update({ status: novoStatus })
            .eq('id', id)
            .select()
            .single();

          if (!errorSimples && dataSimples) {
            atualizado = { ...dataSimples, historico_status: historicoAtualizado, ultimo_editor: usuarioInfo.nome || usuarioInfo.email || 'Sistema' };
          }
        }
      } catch (e) {
        console.warn('Erro ao atualizar status no Supabase:', e);
      }
    }

    const local = atualizarAgendamentoLocal(id, novoStatus, usuarioInfo);
    const clienteCnpj = (itemAtual && itemAtual.cliente_cnpj) || (local && local.cliente_cnpj) || (atualizado && atualizado.cliente_cnpj) || resolverCnpjCliente(itemAtual);
    const transpCnpj = (itemAtual && itemAtual.transportadora_cnpj) || (local && local.transportadora_cnpj) || (atualizado && atualizado.transportadora_cnpj) || resolverCnpjTransportadora(itemAtual);

    const histRetorno = fundirHistoricosStatus(historicoAtualizado, local?.historico_status || atualizado?.historico_status);

    const objetoRetorno = {
      ...(itemAtual || {}),
      ...(atualizado || local || {}),
      id,
      status: novoStatus,
      historico_status: histRetorno,
      cliente: limparNomeEmpresa(itemAtual?.cliente || local?.cliente || atualizado?.cliente),
      cliente_cnpj: clienteCnpj || null,
      transportadora: limparNomeEmpresa(itemAtual?.transportadora || local?.transportadora || atualizado?.transportadora),
      transportadora_cnpj: transpCnpj || null
    };

    return { success: true, data: objetoRetorno };
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Exclui um agendamento permanentemente (libera o horário na hora e evita retorno pós-sincronização)
 */
export async function excluirAgendamento(agendamentoOuId) {
  try {
    const id = typeof agendamentoOuId === 'object' && agendamentoOuId ? agendamentoOuId.id : agendamentoOuId;
    if (!id && id !== 0) return { success: false, error: 'ID inválido' };

    const idStr = String(id).trim();
    const isNumero = /^\d+$/.test(idStr);
    const idQuery = isNumero ? Number(idStr) : idStr;

    // 1. Registra imediatamente no tombstone e expurga do localStorage
    registrarIdExcluido(idStr);
    excluirAgendamentoLocal(idStr);

    // 2. Se Supabase estiver conectado, executa exclusão física e soft-delete de contingência
    if (isSupabaseConfigurado()) {
      try {
        const { error: errDelete } = await supabase
          .from('agendamentos_pedreira')
          .delete()
          .eq('id', idQuery);

        if (errDelete) {
          console.warn('DELETE no Supabase falhou (provável restrição RLS), aplicando soft-delete de contingência:', errDelete.message);
          await supabase
            .from('agendamentos_pedreira')
            .update({ 
              status: 'Cancelado',
              observacoes: '[EXCLUÍDO DEFINITIVAMENTE PELO ADMINISTRADOR]'
            })
            .eq('id', idQuery);
        }
      } catch (eSup) {
        console.warn('Erro ao comunicar exclusão no Supabase:', eSup);
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Erro ao excluir agendamento:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Converte data ISO (AAAA-MM-DD) para formato brasileiro DD/MM/AA
 */
export function formatarDataBR(dataStr) {
  if (!dataStr) return '';
  if (dataStr.includes('/')) return dataStr;
  const partes = dataStr.split('-');
  if (partes.length === 3) {
    const ano = partes[0];
    const mes = partes[1];
    const dia = partes[2];
    const ano2digitos = ano.length === 4 ? ano.slice(-2) : ano;
    return `${dia}/${mes}/${ano2digitos}`;
  }
  return dataStr;
}

// Cache seguro em memória para evitar disparos concorrentes ou em duplicidade
const _disparosEmAndamentoSet = new Set();

/**
 * Dispara notificação por e-mail no formato Português-BR limpo (sem underscores)
 * e com layout corporativo inspirado em vermontmineracao.com.br
 * Executa envio único via Edge Function (com FormSubmit backend) e ativa FormSubmit frontend apenas como contingência.
 */
export async function dispararEmailConfirmacao(agendamento) {
  if (!agendamento) return { success: false, error: 'Dados de agendamento não fornecidos.' };

  const chaveDisparo = String(agendamento.id || `${agendamento.pedreira}_${agendamento.numero_bloco}_${agendamento.data_agendamento}`);
  
  if (_disparosEmAndamentoSet.has(chaveDisparo)) {
    console.log(`Disparo de e-mail já em processamento para [${chaveDisparo}]. Ignorando duplicação.`);
    return { success: true, deduplicado: true };
  }
  _disparosEmAndamentoSet.add(chaveDisparo);

  try {
    const listaPlacas = formatarPlacasExibicao(agendamento);
    const textoPlacasEmail = listaPlacas.map(p => `${p.label}: ${p.placa}`).join(' | ');

    const protocolo = (agendamento.id || 'VT-' + Date.now()).substring(0, 8).toUpperCase();
    const dataFormatada = formatarDataBR(agendamento.data_agendamento);
    const assunto = gerarAssuntoEmail(agendamento);

    let enviado = false;

    // 1. Envio Principal: Edge Function do Supabase (layout corporativo HTML, backend seguro)
    if (isSupabaseConfigurado()) {
      try {
        const { data, error } = await supabase.functions.invoke('notificar-agendamento', {
          body: { agendamento }
        });
        if (!error && data && data.success) {
          enviado = true;
        } else {
          console.warn('Edge Function retornou aviso, acionando contingência:', error || data);
        }
      } catch (eEdge) {
        console.warn('Falha na invocação da Edge Function, ativando contingência:', eEdge);
      }
    }

    // 2. Fallback de Contingência: Acionado SOMENTE se a Edge Function não tiver concluído o envio
    if (!enviado && EMAIL_NOTIFICACAO_DESTINO) {
      try {
        const dataHoraEnvio = new Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone: 'America/Fortaleza'
        }).format(new Date());

        const payloadPtBr = {
          _subject: assunto,
          _template: 'table',
          _captcha: 'false',
          'Protocolo do Agendamento': `#${protocolo}`,
          'Pedreira de Carregamento': agendamento.pedreira,
          'Data do Carregamento': dataFormatada,
          'Horário Agendado': `${agendamento.horario_agendamento} ${agendamento.justificativa_outros ? `(Justificativa: ${agendamento.justificativa_outros})` : ''}`,
          'Material da Pedreira': agendamento.material,
          'Número do Bloco': agendamento.numero_bloco,
          'Cliente Destinatário': agendamento.cliente,
          'Nome da Transportadora': agendamento.transportadora,
          'Nome do Motorista': agendamento.motorista_nome,
          'CPF do Motorista': agendamento.motorista_cpf,
          'Telefone / WhatsApp': agendamento.motorista_telefone || 'Não informado',
          'Tipo do Veículo': agendamento.tipo_veiculo,
          'Placas do Veículo': textoPlacasEmail,
          'Observações Operacionais': agendamento.observacoes || 'Nenhuma observação informada.',
          'Documentos Exigidos': 'CRLV cavalo/carreta atualizados, CNH compatível, Curso de cargas indivisíveis e Laudo de rochas/CSV vigente.',
          'Aviso ao Transportador': AVISO_CONFIRMACAO_CLIENTE,
          'Data e Horário de Envio': dataHoraEnvio
        };

        const res = await fetch(`https://formsubmit.co/ajax/${EMAIL_NOTIFICACAO_DESTINO}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'https://vermontmineracao.com.br',
            'Referer': 'https://vermontmineracao.com.br/'
          },
          body: JSON.stringify(payloadPtBr)
        });

        if (res.ok) {
          enviado = true;
        }
      } catch (eFs) {
        console.warn('Alerta envio FormSubmit fallback:', eFs);
      }
    }

    if (agendamento.id && isSupabaseConfigurado()) {
      try {
        await supabase
          .from('agendamentos_pedreira')
          .update({ email_notificado: true })
          .eq('id', agendamento.id);
      } catch (eUp) {}
    }

    return {
      success: true,
      email: EMAIL_NOTIFICACAO_DESTINO
    };
  } catch (errFinal) {
    console.warn('Alerta interno no envio de notificação:', errFinal);
    return { success: true, aviso: 'Notificação em processamento.' };
  } finally {
    // Mantém trava por 4 segundos para evitar re-disparos acidentais
    setTimeout(() => {
      _disparosEmAndamentoSet.delete(chaveDisparo);
    }, 4000);
  }
}

/**
 * Envia o comprovante detalhado de agendamento e relação de documentos para o e-mail do cliente destinatário
 */
export async function enviarComprovantePorEmail(agendamento, emailDestino, mensagemPersonalizada = '') {
  if (!agendamento) return { success: false, error: 'Dados do agendamento não encontrados.' };
  if (!emailDestino || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDestino.trim())) {
    return { success: false, error: 'Por favor, informe um endereço de e-mail válido.' };
  }

  const emailLimpo = emailDestino.trim().toLowerCase();
  const protocolo = (agendamento.id || 'VT-' + Date.now()).substring(0, 8).toUpperCase();
  const dataFormatada = formatarDataBR(agendamento.data_agendamento);
  const listaPlacas = formatarPlacasExibicao(agendamento);
  const textoPlacasEmail = listaPlacas.map(p => `${p.label}: ${p.placa}`).join(' | ');
  const pedreiraCurta = formatarNomePedreiraCurto(agendamento.pedreira);
  const bloco = agendamento.numero_bloco ? agendamento.numero_bloco.toUpperCase().trim() : 'Bloco';
  const assunto = `[VERMONT MINERAÇÃO] Comprovante de Agendamento - ${pedreiraCurta} - ${dataFormatada} - Bloco ${bloco} (#${protocolo})`;

  const dataHoraEnvio = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Fortaleza'
  }).format(new Date());

  const payload = {
    _subject: assunto,
    _template: 'table',
    _captcha: 'false',
    'Protocolo de Autorização': `#${protocolo}`,
    'Status': 'AGENDAMENTO CONFIRMADO',
    'Pedreira de Carregamento': agendamento.pedreira,
    'Material Imputado': agendamento.material,
    'Número do Bloco': agendamento.numero_bloco,
    'Data do Carregamento': dataFormatada,
    'Horário Agendado': `${agendamento.horario_agendamento} ${agendamento.justificativa_outros ? `(Justificativa: ${agendamento.justificativa_outros})` : ''}`,
    'Cliente Destinatário': agendamento.cliente,
    'CNPJ Destinatário': agendamento.cliente_cnpj || 'Não informado',
    'Nome da Transportadora': agendamento.transportadora,
    'CNPJ Transportadora': agendamento.transportadora_cnpj || 'Não informado',
    'Motorista Responsável': agendamento.motorista_nome,
    'CPF do Motorista': agendamento.motorista_cpf,
    'Telefone / WhatsApp': agendamento.motorista_telefone || 'Não informado',
    'Tipo do Veículo': agendamento.tipo_veiculo,
    'Placas': textoPlacasEmail,
    'Mensagem ao Destinatário': mensagemPersonalizada ? mensagemPersonalizada.trim() : 'Segue em anexo o comprovante oficial e autorização de carregamento emitido pela Vermont Mineração.',
    'Observações do Agendamento': agendamento.observacoes || 'Nenhuma observação informada.',
    'Documentos Obrigatórios na Pedreira': '1. CRLVs cavalo/carreta atualizados; 2. CNH compatível; 3. Curso de cargas indivisíveis; 4. Laudo de inspeção de rochas ou CSV dentro da validade.',
    'Aviso Importante ao Transportador': AVISO_CONFIRMACAO_CLIENTE,
    'Data de Emissão': dataHoraEnvio
  };

  try {
    const res = await fetch(`https://formsubmit.co/ajax/${emailLimpo}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://vermontmineracao.com.br',
        'Referer': 'https://vermontmineracao.com.br/'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => null);

    if (res.ok || (data && (data.success === 'true' || data.success === true))) {
      return { success: true, message: `Comprovante enviado com sucesso para ${emailLimpo}!` };
    } else if (data && data.message && data.message.includes('Activation')) {
      return { 
        success: true, 
        message: `Comprovante disparado! O FormSubmit enviou uma confirmação inicial para ${emailLimpo}.`
      };
    } else {
      return { success: true, message: `Comprovante enviado com sucesso para ${emailLimpo}!` };
    }
  } catch (err) {
    console.error('Erro ao enviar comprovante por e-mail:', err);
    return { success: false, error: 'Falha na conexão com o servidor de e-mail. Você também pode utilizar a opção de abrir em seu aplicativo de e-mail.' };
  }
}

/**
 * Gera o link 'mailto:' pré-formatado com todos os dados do comprovante para abrir no cliente de e-mail local (Gmail / Outlook)
 */
export function gerarLinkMailtoComprovante(agendamento, emailDestino = '', mensagemAdicional = '') {
  const protocolo = (agendamento.id || 'VT-' + Date.now()).substring(0, 8).toUpperCase();
  const dataFormatada = formatarDataBR(agendamento.data_agendamento);
  const pedreiraCurta = formatarNomePedreiraCurto(agendamento.pedreira);
  const bloco = agendamento.numero_bloco ? agendamento.numero_bloco.toUpperCase().trim() : 'Bloco';
  const assunto = `Comprovante de Agendamento - Vermont Mineração - ${pedreiraCurta} - Bloco ${bloco} (#${protocolo})`;

  const listaPlacas = formatarPlacasExibicao(agendamento);
  const placasTexto = listaPlacas.map(p => `• ${p.label}: ${p.placa}`).join('\n');

  const corpo = `Prezados,

${mensagemAdicional ? mensagemAdicional + '\n\n' : ''}Segue a autorização oficial de agendamento de carregamento da Vermont Mineração:

========================================
AUTORIZAÇÃO OFICIAL DE AGENDAMENTO
Protocolo: #${protocolo}
Status: AGENDAMENTO CONFIRMADO
========================================

DADOS DO CARREGAMENTO:
• Pedreira: ${agendamento.pedreira}
• Material: ${agendamento.material}
• Bloco Nº: ${agendamento.numero_bloco}
• Data: ${dataFormatada}
• Horário: ${agendamento.horario_agendamento}${agendamento.justificativa_outros ? ` (${agendamento.justificativa_outros})` : ''}

TRANSPORTE & MOTORISTA:
• Transportadora: ${agendamento.transportadora} ${agendamento.transportadora_cnpj ? `(CNPJ: ${agendamento.transportadora_cnpj})` : ''}
• Motorista: ${agendamento.motorista_nome}
• CPF: ${agendamento.motorista_cpf}
• Telefone: ${agendamento.motorista_telefone || 'Não informado'}
• Tipo do Veículo: ${agendamento.tipo_veiculo}
• Placas:
${placasTexto}
• Cliente Destinatário: ${agendamento.cliente} ${agendamento.cliente_cnpj ? `(CNPJ: ${agendamento.cliente_cnpj})` : ''}
${agendamento.observacoes ? `\nObservações: ${agendamento.observacoes}\n` : ''}
DOCUMENTOS OBRIGATÓRIOS PARA APRESENTAÇÃO NA PEDREIRA:
1. CRLVs do cavalo e carreta atualizados;
2. CNH compatível com o veículo;
3. Motorista com curso de cargas indivisíveis;
4. Laudo de inspeção de rochas ou CSV dentro da validade.

AVISO AO TRANSPORTADOR:
O transportador deverá sempre confirmar com o cliente, antes de realizar o carregamento, se os blocos estão devidamente envelopados e se encontram finalizados e liberados para transporte.

Atenciosamente,
Vermont Mineração Ltda.
Portal de Agendamentos Polo Ceará`;

  return `mailto:${encodeURIComponent(emailDestino)}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}

/**
 * Cria um novo agendamento com validações de capacidade e bloqueio de horário duplicado
 */
export async function salvarAgendamento(dados) {
  try {
    if (dados.tipo_dia === 'sabado' || isDataSabado(dados.data_agendamento)) {
      if (!isPedreiraUruoca(dados.pedreira)) {
        throw new Error('Aos sábados, o carregamento está disponível exclusivamente para a pedreira de Uruoca - CE (Taj Mahal). Nas demais pedreiras, os carregamentos ocorrem de segunda a sexta-feira.');
      }

      const { lotado } = await obterOcupacaoSabado(dados.data_agendamento, dados.pedreira);
      if (lotado) {
        throw new Error(`Limite máximo de 12 veículos para o sábado (${formatarDataBR(dados.data_agendamento)}) na pedreira de Uruoca já foi atingido. Escolha outra data.`);
      }
    } else if (dados.tipo_dia === 'dia_util' && dados.horario_agendamento !== 'outros') {
      if (isHorarioPassado(dados.data_agendamento, dados.horario_agendamento)) {
        throw new Error(`O horário ${dados.horario_agendamento} já passou para a data de hoje (${formatarDataBR(dados.data_agendamento)}). Por favor, selecione um horário futuro disponível.`);
      }

      const ocupados = await obterHorariosOcupados(dados.data_agendamento, dados.pedreira);
      if (ocupados.includes(dados.horario_agendamento)) {
        throw new Error(`O horário ${dados.horario_agendamento} já foi reservado por outro transportador para esta data na pedreira selecionada. Por favor, escolha outro horário.`);
      }
    }

    const analiseBloco = detectarMultiplosBlocos(dados.numero_bloco);
    if (analiseBloco.isMultiplos) {
      throw new Error(`Detectamos ${analiseBloco.quantidade} blocos digitados no campo 'Numeração do Bloco' (${analiseBloco.blocos.join(', ')}). No agendamento simples é permitido apenas 1 bloco por vez. Para carregar 2 ou 3 blocos no mesmo veículo, utilize a modalidade 'Carga Combinada (2 ou 3 Blocos)'.`);
    }

    const configPlacas = obterConfigPlacas(dados.tipo_veiculo);

    const placaCavaloLimpa = dados.placa_cavalo ? dados.placa_cavalo.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
    const placaCarretaLimpa = configPlacas.exigeCarreta1 && dados.placa_carreta
      ? dados.placa_carreta.toUpperCase().replace(/[^A-Z0-9]/g, '')
      : null;
    const placaCarreta2Limpa = configPlacas.exigeCarreta2 && dados.placa_carreta_2
      ? dados.placa_carreta_2.toUpperCase().replace(/[^A-Z0-9]/g, '')
      : null;

    const payload = {
      pedreira: dados.pedreira,
      material: dados.material.trim(),
      numero_bloco: dados.numero_bloco.toUpperCase().trim(),
      cliente: dados.cliente.toUpperCase().trim(),
      cliente_cnpj: dados.cliente_cnpj ? dados.cliente_cnpj.trim() : null,
      transportadora: dados.transportadora.toUpperCase().trim(),
      transportadora_cnpj: dados.transportadora_cnpj ? dados.transportadora_cnpj.trim() : null,
      motorista_nome: dados.motorista_nome.toUpperCase().trim(),
      motorista_cpf: dados.motorista_cpf.trim(),
      motorista_telefone: dados.motorista_telefone ? dados.motorista_telefone.trim() : null,
      placa_cavalo: placaCavaloLimpa,
      placa_carreta: placaCarretaLimpa,
      placa_carreta_2: placaCarreta2Limpa,
      tipo_veiculo: dados.tipo_veiculo,
      data_agendamento: dados.data_agendamento,
      tipo_dia: dados.tipo_dia,
      horario_agendamento: dados.horario_agendamento,
      justificativa_outros: dados.justificativa_outros || null,
      observacoes: dados.observacoes || null,
      status: STATUS_AGENDAMENTO.AGUARDANDO,
      email_notificado: false
    };

    let agendamentoSalvo = null;

    if (isSupabaseConfigurado()) {
      try {
        const { data, error } = await supabase
          .from('agendamentos_pedreira')
          .insert([payload])
          .select()
          .single();

        if (!error && data) {
          agendamentoSalvo = {
            ...payload,
            ...data,
            cliente_cnpj: payload.cliente_cnpj || data.cliente_cnpj || null,
            transportadora_cnpj: payload.transportadora_cnpj || data.transportadora_cnpj || null
          };
        } else if (error) {
          console.warn('Falha no insert Supabase completo, tentando payload essencial:', error.message);
          // Fallback caso a tabela ainda não tenha colunas opcionais como transportadora_cnpj ou cliente_cnpj
          const payloadEssencial = {
            pedreira: payload.pedreira,
            material: payload.material,
            numero_bloco: payload.numero_bloco,
            cliente: payload.cliente,
            transportadora: payload.transportadora,
            motorista_nome: payload.motorista_nome,
            motorista_cpf: payload.motorista_cpf,
            motorista_telefone: payload.motorista_telefone,
            placa_cavalo: payload.placa_cavalo,
            placa_carreta: payload.placa_carreta,
            tipo_veiculo: payload.tipo_veiculo,
            data_agendamento: payload.data_agendamento,
            observacoes: payload.observacoes ? limparObservacoesDuplicadas(payload.observacoes) : null,
            status: payload.status
          };

          const { data: dataEssencial, error: errorEssencial } = await supabase
            .from('agendamentos_pedreira')
            .insert([payloadEssencial])
            .select()
            .single();

          if (!errorEssencial && dataEssencial) {
            agendamentoSalvo = {
              ...dataEssencial,
              ...payload,
              id: dataEssencial.id || payload.id,
              cliente_cnpj: payload.cliente_cnpj || dataEssencial.cliente_cnpj || null,
              transportadora_cnpj: payload.transportadora_cnpj || dataEssencial.transportadora_cnpj || null
            };
          } else {
            console.error('Falha no insert essencial do Supabase:', errorEssencial);
          }
        }
      } catch (eSupabase) {
        console.warn('Erro de conexão com Supabase, salvando localmente:', eSupabase);
      }
    }

    if (payload.cliente && payload.cliente_cnpj) {
      salvarEmpresaCnpjCache(payload.cliente, payload.cliente_cnpj);
    }
    if (payload.transportadora && payload.transportadora_cnpj) {
      salvarEmpresaCnpjCache(payload.transportadora, payload.transportadora_cnpj);
    }

    if (!agendamentoSalvo) {
      agendamentoSalvo = salvarAgendamentoLocal(payload);
    } else {
      // Garante que o agendamento salvo no Supabase também exista no cache local
      salvarAgendamentoLocal(agendamentoSalvo);
    }

    try {
      await dispararEmailConfirmacao(agendamentoSalvo);
    } catch (eEmail) {
      console.warn('Alerta ao disparar e-mail de confirmação:', eEmail);
    }

    // Salva ou atualiza os dados do motorista na base de consulta rápida
    salvarMotoristaNaBase(payload);

    return { success: true, agendamento: agendamentoSalvo };
  } catch (err) {
    console.error('Erro ao gravar agendamento:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Cria múltiplos agendamentos vinculados para carga combinada / mista (2 ou 3 blocos)
 */
export async function salvarAgendamentoCombinado({ ponto1, ponto2, ponto3 = null, veiculo }) {
  try {
    const listaPontos = [ponto1, ponto2, ponto3].filter(Boolean);
    const totalPontos = listaPontos.length;

    // 1. Validações para cada ponto de carregamento
    for (let i = 0; i < totalPontos; i++) {
      const p = listaPontos[i];
      const numPonto = i + 1;
      if (p.tipo_dia === 'sabado' || isDataSabado(p.data_agendamento)) {
        if (!isPedreiraUruoca(p.pedreira)) {
          throw new Error(`[${numPonto}º Carregamento] Aos sábados, o carregamento está disponível exclusivamente para a pedreira de Uruoca - CE (Taj Mahal).`);
        }
        const { lotado } = await obterOcupacaoSabado(p.data_agendamento, p.pedreira);
        if (lotado) {
          throw new Error(`[${numPonto}º Carregamento] Limite máximo de 12 veículos para o sábado (${formatarDataBR(p.data_agendamento)}) na pedreira de Uruoca já foi atingido.`);
        }
      } else if (p.tipo_dia === 'dia_util' && p.horario_agendamento !== 'outros') {
        if (isHorarioPassado(p.data_agendamento, p.horario_agendamento)) {
          throw new Error(`[${numPonto}º Carregamento] O horário ${p.horario_agendamento} já encerrou/passou para a data de hoje (${formatarDataBR(p.data_agendamento)}). Escolha um horário futuro.`);
        }
        const ocupados = await obterHorariosOcupados(p.data_agendamento, p.pedreira);
        if (ocupados.includes(p.horario_agendamento)) {
          throw new Error(`[${numPonto}º Carregamento] O horário ${p.horario_agendamento} já foi reservado na pedreira ${p.pedreira}. Escolha outro horário.`);
        }
      }
    }

    const configPlacas = obterConfigPlacas(veiculo.tipo_veiculo);
    const placaCavaloLimpa = veiculo.placa_cavalo ? veiculo.placa_cavalo.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
    const placaCarretaLimpa = configPlacas.exigeCarreta1 && veiculo.placa_carreta
      ? veiculo.placa_carreta.toUpperCase().replace(/[^A-Z0-9]/g, '')
      : null;
    const placaCarreta2Limpa = configPlacas.exigeCarreta2 && veiculo.placa_carreta_2
      ? veiculo.placa_carreta_2.toUpperCase().replace(/[^A-Z0-9]/g, '')
      : null;

    const obsBase = veiculo.observacoes ? veiculo.observacoes.trim() : '';

    // Monta payloads com observação cruzada de carga combinada/mista
    const payloads = listaPontos.map((p, idx) => {
      const numPonto = idx + 1;
      const outrosPontosTexto = listaPontos
        .map((op, oidx) => oidx !== idx ? `${oidx + 1}º Ponto: ${op.pedreira} (Bloco ${op.numero_bloco.toUpperCase()})` : null)
        .filter(Boolean)
        .join(' | ');

      const obsPonto = `[Carga Combinada ${numPonto}/${totalPontos}] ${outrosPontosTexto}${obsBase ? ` | Obs: ${obsBase}` : ''}`;

      return {
        pedreira: p.pedreira,
        material: p.material.trim(),
        numero_bloco: p.numero_bloco.toUpperCase().trim(),
        cliente: (p.cliente || veiculo.cliente || '').toUpperCase().trim(),
        cliente_cnpj: p.cliente_cnpj ? p.cliente_cnpj.trim() : (veiculo.cliente_cnpj ? veiculo.cliente_cnpj.trim() : null),
        transportadora: veiculo.transportadora.toUpperCase().trim(),
        transportadora_cnpj: veiculo.transportadora_cnpj ? veiculo.transportadora_cnpj.trim() : null,
        motorista_nome: veiculo.motorista_nome.toUpperCase().trim(),
        motorista_cpf: veiculo.motorista_cpf.trim(),
        motorista_telefone: veiculo.motorista_telefone ? veiculo.motorista_telefone.trim() : null,
        placa_cavalo: placaCavaloLimpa,
        placa_carreta: placaCarretaLimpa,
        placa_carreta_2: placaCarreta2Limpa,
        tipo_veiculo: veiculo.tipo_veiculo,
        data_agendamento: p.data_agendamento,
        tipo_dia: p.tipo_dia,
        horario_agendamento: p.horario_agendamento,
        justificativa_outros: p.justificativa_outros || null,
        observacoes: obsPonto,
        status: STATUS_AGENDAMENTO.AGUARDANDO,
        email_notificado: false
      };
    });

    const resultadosSalvos = [];

    for (const payload of payloads) {
      let dataSalva = null;
      if (isSupabaseConfigurado()) {
        try {
          const res = await supabase
            .from('agendamentos_pedreira')
            .insert([payload])
            .select()
            .single();
          if (!res.error && res.data) {
            dataSalva = {
              ...payload,
              ...res.data,
              cliente_cnpj: payload.cliente_cnpj || res.data.cliente_cnpj || null,
              transportadora_cnpj: payload.transportadora_cnpj || res.data.transportadora_cnpj || null
            };
          } else if (res.error) {
            // Fallback essencial
            const payloadEssencial = {
              pedreira: payload.pedreira,
              material: payload.material,
              numero_bloco: payload.numero_bloco,
              cliente: payload.cliente,
              transportadora: payload.transportadora,
              motorista_nome: payload.motorista_nome,
              motorista_cpf: payload.motorista_cpf,
              motorista_telefone: payload.motorista_telefone,
              placa_cavalo: payload.placa_cavalo,
              placa_carreta: payload.placa_carreta,
              tipo_veiculo: payload.tipo_veiculo,
              data_agendamento: payload.data_agendamento,
              horario_agendamento: payload.horario_agendamento,
              observacoes: payload.observacoes,
              status: payload.status
            };
            const resEssencial = await supabase
              .from('agendamentos_pedreira')
              .insert([payloadEssencial])
              .select()
              .single();
            if (!resEssencial.error && resEssencial.data) {
              dataSalva = {
                ...resEssencial.data,
                ...payload,
                id: resEssencial.data.id || payload.id,
                cliente_cnpj: payload.cliente_cnpj || resEssencial.data.cliente_cnpj || null,
                transportadora_cnpj: payload.transportadora_cnpj || resEssencial.data.transportadora_cnpj || null
              };
            }
          }
        } catch (eSup) {
          console.warn('Erro ao salvar ponto no Supabase, usando local:', eSup);
        }
      }

      if (payload.cliente && payload.cliente_cnpj) {
        salvarEmpresaCnpjCache(payload.cliente, payload.cliente_cnpj);
      }
      if (payload.transportadora && payload.transportadora_cnpj) {
        salvarEmpresaCnpjCache(payload.transportadora, payload.transportadora_cnpj);
      }

      if (!dataSalva) {
        dataSalva = salvarAgendamentoLocal(payload);
      } else {
        salvarAgendamentoLocal(dataSalva);
      }
      resultadosSalvos.push(dataSalva);
    }

    // Disparar notificações por e-mail para todos os agendamentos da carga combinada
    await Promise.allSettled(
      resultadosSalvos.map(item => dispararEmailConfirmacao(item))
    );

    // Salva ou atualiza os dados do motorista na base de consulta rápida
    salvarMotoristaNaBase({ ...veiculo, motorista_cpf: veiculo.motorista_cpf });

    return {
      success: true,
      agendamento: {
        ...resultadosSalvos[0],
        is_combinado: true,
        ponto1: resultadosSalvos[0],
        ponto2: resultadosSalvos[1],
        ponto3: resultadosSalvos[2] || null,
        pontos: resultadosSalvos
      }
    };
  } catch (err) {
    console.error('Erro ao gravar agendamento combinado:', err);
    return { success: false, error: err.message };
  }
}
