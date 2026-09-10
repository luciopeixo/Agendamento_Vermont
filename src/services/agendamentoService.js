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
 * Retorna todos os motoristas salvos na base local interna
 */
export function obterBaseMotoristas() {
  try {
    const raw = localStorage.getItem(MOTORISTAS_BASE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Salva ou atualiza um motorista na base cadastral
 */
export function salvarMotoristaNaBase(dadosMotorista = {}) {
  try {
    const rawCpf = dadosMotorista.motorista_cpf || dadosMotorista.cpf;
    if (!rawCpf) return;
    const cpfLimpo = String(rawCpf).replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return;

    const base = obterBaseMotoristas();
    const index = base.findIndex(m => String(m.cpf).replace(/\D/g, '') === cpfLimpo);

    const novoRegistro = {
      cpf: cpfLimpo,
      nome: (dadosMotorista.motorista_nome || dadosMotorista.nome || '').trim().toUpperCase(),
      telefone: dadosMotorista.motorista_telefone || dadosMotorista.telefone || null,
      transportadora: (dadosMotorista.transportadora || '').trim().toUpperCase() || null,
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

    localStorage.setItem(MOTORISTAS_BASE_KEY, JSON.stringify(base));
  } catch (e) {
    console.warn('Erro ao salvar motorista na base:', e);
  }
}

/**
 * Consulta um motorista pelo CPF na base interna e no histórico
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

  // 2. Busca na base local (cadastros e sementes)
  const baseLocal = obterBaseMotoristas();
  const encontradoLocal = baseLocal.find(m => String(m.cpf).replace(/\D/g, '') === cpfLimpo);

  if (encontradoLocal && encontradoLocal.nome) {
    return {
      valido: true,
      encontrado: true,
      origem: 'base_local',
      motorista: {
        nome: encontradoLocal.nome,
        telefone: encontradoLocal.telefone || '',
        transportadora: encontradoLocal.transportadora || '',
        tipo_veiculo: encontradoLocal.tipo_veiculo || '',
        placa_cavalo: encontradoLocal.placa_cavalo || '',
        placa_carreta: encontradoLocal.placa_carreta || '',
        placa_carreta_2: encontradoLocal.placa_carreta_2 || ''
      }
    };
  }

  // 3. Busca no histórico de agendamentos locais
  const agendamentosLocais = obterAgendamentosLocais();
  const agLocal = agendamentosLocais.find(a => a.motorista_cpf && a.motorista_cpf.replace(/\D/g, '') === cpfLimpo && a.motorista_nome);
  if (agLocal) {
    const mot = {
      nome: agLocal.motorista_nome,
      telefone: agLocal.motorista_telefone || '',
      transportadora: agLocal.transportadora || '',
      tipo_veiculo: agLocal.tipo_veiculo || '',
      placa_cavalo: agLocal.placa_cavalo || '',
      placa_carreta: agLocal.placa_carreta || '',
      placa_carreta_2: agLocal.placa_carreta_2 || ''
    };
    salvarMotoristaNaBase({ ...mot, motorista_cpf: cpfLimpo });
    return { valido: true, encontrado: true, origem: 'historico_local', motorista: mot };
  }

  // 4. Se Supabase configurado, busca na base de motoristas e no histórico do Supabase
  if (isSupabaseConfigurado()) {
    try {
      // 4.1 Consulta direta na tabela base_motoristas (mais direta e rápida)
      const { data: dataBase, error: errorBase } = await supabase
        .from('base_motoristas')
        .select('nome, telefone, transportadora')
        .eq('cpf', cpfLimpo)
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

      // 4.2 Consulta via RPC segura (função SQL)
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
        return { valido: true, encontrado: true, origem: 'base_supabase', motorista: mot };
      }

      // 4.3 Consulta no histórico de agendamentos salvos no Supabase
      const { data, error } = await supabase
        .from('agendamentos_pedreira')
        .select('motorista_nome, motorista_telefone, transportadora, tipo_veiculo, placa_cavalo, placa_carreta, placa_carreta_2')
        .eq('motorista_cpf', cpfLimpo)
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
  } else {
    console.warn('[Supabase Motorista] Supabase não configurado ou variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes.');
  }

  return { valido: true, encontrado: false, motorista: null };
}

// ==========================================
// VALIDAÇÃO & CONSULTA DE CNPJ NA RECEITA FEDERAL
// ==========================================

export const TRANSPORTADORAS_BASE_KEY = 'vermont_base_transportadoras';

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
    .map(b => b.trim().replace(/^BLOCO\s+/i, ''))
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

export const EMAIL_NOTIFICACAO_DESTINO = import.meta.env.VITE_EMAIL_NOTIFICACAO_DESTINO || 'faturamento@vermontmineracao.com.br';
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
🏢 *Transportadora:* ${agendamento.transportadora}
🛣️ *Tipo Veículo:* ${agendamento.tipo_veiculo}
⚖️ *Placas:*
${placas}
💼 *Cliente Destino:* *${agendamento.cliente}*
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

export function obterAgendamentosLocais() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const lista = raw ? JSON.parse(raw) : [];
    if (Array.isArray(lista)) {
      return lista.map(item => ({
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
    const novo = {
      ...registro,
      id: registro.id || `VT-${protocoloNumero}`,
      historico_status: normalizarHistoricoStatus(registro.historico_status),
      created_at: new Date().toISOString()
    };
    lista.unshift(novo);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lista));
    return novo;
  } catch (e) {
    return {
      ...registro,
      id: registro.id || `VT-${Math.floor(100000 + Math.random() * 900000)}`,
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
  transportadora: 'Transportadora',
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

  let historicoBase = histItemAtualizado.length > 0
    ? [...histItemAtualizado]
    : (histItemAtual.length > 0 ? [...histItemAtual] : []);

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
    const lista = obterAgendamentosLocais();
    const index = lista.findIndex(item => item.id === id);
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
    const lista = obterAgendamentosLocais();
    const index = lista.findIndex(item => item.id === agendamentoAtualizado.id);
    if (index !== -1) {
      const itemAtual = lista[index];
      const historico = normalizarHistoricoStatus(agendamentoAtualizado.historico_status).length > 0 
        ? normalizarHistoricoStatus(agendamentoAtualizado.historico_status) 
        : registrarHistoricoEdicao(itemAtual, agendamentoAtualizado, usuarioInfo);
      lista[index] = { 
        ...lista[index], 
        ...agendamentoAtualizado, 
        historico_status: historico,
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

    // 1. Obtém o item anterior de forma 100% confiável
    let itemAtual = agendamentoOriginal && agendamentoOriginal.id === id ? { ...agendamentoOriginal } : null;

    if (!itemAtual) {
      const listaLocal = obterAgendamentosLocais();
      const achado = listaLocal.find(item => item.id === id);
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

    // 2. Registra o histórico comparando o item anterior com os novos valores
    const historicoAtualizado = registrarHistoricoEdicao(itemAtual, agendamentoAtualizado, usuarioInfo);
    agendamentoAtualizado.historico_status = historicoAtualizado;

    const payloadBase = {
      pedreira: agendamentoAtualizado.pedreira,
      material: agendamentoAtualizado.material,
      numero_bloco: agendamentoAtualizado.numero_bloco ? String(agendamentoAtualizado.numero_bloco).toUpperCase().trim() : '',
      cliente: agendamentoAtualizado.cliente ? String(agendamentoAtualizado.cliente).toUpperCase().trim() : '',
      transportadora: agendamentoAtualizado.transportadora ? String(agendamentoAtualizado.transportadora).toUpperCase().trim() : '',
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
        const { data, error } = await supabase
          .from('agendamentos_pedreira')
          .update({
            ...payloadBase,
            historico_status: historicoAtualizado,
            ultimo_editor: usuarioInfo.nome || usuarioInfo.email || 'Sistema'
          })
          .eq('id', agendamentoAtualizado.id)
          .select()
          .single();

        if (!error && data) {
          resultado = data;
        } else if (error) {
          console.warn('Erro ao atualizar com campos de auditoria no Supabase. Tentando campos padrão:', error.message);
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
            console.error('Erro definitivo ao atualizar agendamento no Supabase:', errorPadrao);
          }
        }
      } catch (eSup) {
        console.warn('Erro de conexão ao atualizar agendamento no Supabase:', eSup);
      }
    }

    const localAtualizado = atualizarAgendamentoLocalCompleto(agendamentoAtualizado, usuarioInfo);
    return { success: true, data: resultado || localAtualizado || agendamentoAtualizado };
  } catch (err) {
    console.error('Erro ao salvar edição de agendamento:', err);
    return { success: false, error: err.message };
  }
}

export function excluirAgendamentoLocal(id) {
  try {
    const lista = obterAgendamentosLocais();
    const filtrados = lista.filter(item => item.id !== id);
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
 * Consulta horários que já foram agendados para a pedreira e data selecionadas
 */
export async function obterHorariosOcupados(dataStr, pedreira) {
  try {
    if (!dataStr || !pedreira) return [];

    let ocupados = [];
    if (isSupabaseConfigurado()) {
      try {
        const { data, error } = await supabase
          .from('agendamentos_pedreira')
          .select('horario_agendamento, pedreira, status')
          .eq('data_agendamento', dataStr)
          .neq('status', 'Cancelado');

        if (!error && data) {
          ocupados = data
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
 * Consulta a quantidade de agendamentos no sábado para verificar limite de 12 veículos
 */
export async function obterOcupacaoSabado(dataStr, pedreira = null) {
  try {
    const extrairChaveVeiculo = (item) => {
      const placa = item.placa_cavalo ? item.placa_cavalo.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
      if (placa) return `placa:${placa}`;
      return `id:${item.id || item.codigo_agendamento || Math.random()}`;
    };

    if (isSupabaseConfigurado()) {
      try {
        let query = supabase
          .from('agendamentos_pedreira')
          .select('id, pedreira, status, placa_cavalo, codigo_agendamento')
          .eq('data_agendamento', dataStr)
          .neq('status', 'Cancelado');

        const { data, error } = await query;
        if (!error && data) {
          const filtrados = pedreira ? data.filter(item => saoMesmaPedreira(item.pedreira, pedreira)) : data;
          const totalVeiculos = new Set(filtrados.map(extrairChaveVeiculo)).size;
          const limite = 12;
          const disponivel = Math.max(0, limite - totalVeiculos);
          const lotado = totalVeiculos >= limite;
          return { total: totalVeiculos, limite, disponivel, lotado };
        }
      } catch (e) {
        console.warn('Erro ao verificar sábado no Supabase, buscando local:', e);
      }
    }

    const locais = obterAgendamentosLocais();
    const filtrados = locais.filter(item => {
      const matchData = item.data_agendamento === dataStr;
      const matchPedreira = pedreira ? saoMesmaPedreira(item.pedreira, pedreira) : true;
      const matchStatus = item.status !== 'Cancelado';
      return matchData && matchPedreira && matchStatus;
    });
    const total = new Set(filtrados.map(extrairChaveVeiculo)).size;

    const limite = 12;
    const disponivel = Math.max(0, limite - total);
    const lotado = total >= limite;
    return { total, limite, disponivel, lotado };
  } catch (err) {
    console.error('Erro ao verificar ocupação do sábado:', err);
    return { total: 0, limite: 12, disponivel: 12, lotado: false };
  }
}

/**
 * Consulta agendamentos de datas anteriores a hoje que ainda não foram finalizados nem cancelados
 */
export async function obterPendenciasAnteriores({ pedreira = 'todas', dataReferencia = null } = {}) {
  try {
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
          const locais = obterAgendamentosLocais();
          const locaisMap = new Map(locais.map(l => [l.id, l]));

          let lista = data.map(item => {
            const loc = locaisMap.get(item.id);
            const histSup = normalizarHistoricoStatus(item.historico_status);
            const histLoc = normalizarHistoricoStatus(loc?.historico_status);
            const historicoFinal = histSup.length > 0 ? histSup : histLoc;

            return {
              ...item,
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

    const locais = obterAgendamentosLocais();
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
 * Lista todos os agendamentos com filtros
 */
export async function listarAgendamentos(filtros = {}) {
  try {
    let resultado = [];

    if (isSupabaseConfigurado()) {
      try {
        let query = supabase
          .from('agendamentos_pedreira')
          .select('*')
          .order('data_agendamento', { ascending: false })
          .order('created_at', { ascending: false });

        if (filtros.status && filtros.status !== 'todos') {
          if (filtros.status === 'Liberado para Carregar') {
            query = query.in('status', ['Liberado para Carregar', 'Confirmado']);
          } else if (filtros.status === 'Finalizado' || filtros.status === 'Carregado') {
            query = query.in('status', ['Finalizado', 'Carregado']);
          } else {
            query = query.eq('status', filtros.status);
          }
        }

        if (filtros.data) {
          query = query.eq('data_agendamento', filtros.data);
        }

        const { data, error } = await query;
        if (!error && data) {
          const locais = obterAgendamentosLocais();
          const locaisMap = new Map(locais.map(l => [l.id, l]));

          let listaSup = data.map(item => {
            const loc = locaisMap.get(item.id);
            const histSup = normalizarHistoricoStatus(item.historico_status);
            const histLoc = normalizarHistoricoStatus(loc?.historico_status);
            const historicoFinal = histSup.length > 0 ? histSup : histLoc;

            return {
              ...item,
              historico_status: historicoFinal,
              ultimo_editor: item.ultimo_editor || loc?.ultimo_editor || (historicoFinal.length > 0 ? historicoFinal[0].usuario_nome : null)
            };
          });

          if (filtros.pedreira && filtros.pedreira !== 'todas') {
            listaSup = listaSup.filter(item => saoMesmaPedreira(item.pedreira, filtros.pedreira));
          }

          // Mantém localStorage sempre sincronizado com os dados reais do Supabase sem apagar agendamentos de outras datas
          try {
            const mapaAtualizado = new Map(locais.map(l => [l.id, l]));
            listaSup.forEach(item => mapaAtualizado.set(item.id, item));
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(Array.from(mapaAtualizado.values())));
          } catch (e) {}

          return listaSup;
        }
      } catch (e) {
        console.warn('Erro ao listar do Supabase, buscando locais:', e);
      }
    }

    resultado = obterAgendamentosLocais();
    if (filtros.pedreira && filtros.pedreira !== 'todas') {
      resultado = resultado.filter(item => saoMesmaPedreira(item.pedreira, filtros.pedreira));
    }
    if (filtros.status && filtros.status !== 'todos') {
      if (filtros.status === 'Liberado para Carregar') {
        resultado = resultado.filter(item => item.status === 'Liberado para Carregar' || item.status === 'Confirmado');
      } else if (filtros.status === 'Finalizado' || filtros.status === 'Carregado') {
        resultado = resultado.filter(item => item.status === 'Finalizado' || item.status === 'Carregado');
      } else {
        resultado = resultado.filter(item => item.status === filtros.status);
      }
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
      const listaLocal = obterAgendamentosLocais();
      const achado = listaLocal.find(item => item.id === id);
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

    // 2. Gera o novo histórico com status_anterior correto
    const historicoAtualizado = registrarHistoricoStatus(itemAtual, novoStatus, usuarioInfo);

    let atualizado = null;

    if (isSupabaseConfigurado()) {
      try {
        // 1. Tenta atualizar com colunas de auditoria
        const { data, error } = await supabase
          .from('agendamentos_pedreira')
          .update({ 
            status: novoStatus,
            historico_status: historicoAtualizado,
            ultimo_editor: usuarioInfo.nome || usuarioInfo.email || 'Sistema'
          })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          atualizado = {
            ...data,
            historico_status: normalizarHistoricoStatus(data.historico_status || historicoAtualizado)
          };
        } else if (error) {
          console.warn('Tentando atualizar apenas status básico no Supabase:', error.message);
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
    return { success: true, data: atualizado || local || { id, status: novoStatus, historico_status: historicoAtualizado } };
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Exclui um agendamento permanentemente (libera o horário na hora)
 */
export async function excluirAgendamento(id) {
  try {
    if (isSupabaseConfigurado()) {
      try {
        await supabase
          .from('agendamentos_pedreira')
          .delete()
          .eq('id', id);
      } catch (e) {}
    }
    excluirAgendamentoLocal(id);
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
 * Cria um novo agendamento com validações de capacidade e bloqueio de horário duplicado
 */
export async function salvarAgendamento(dados) {
  try {
    if (dados.tipo_dia === 'sabado') {
      if (!isPedreiraUruoca(dados.pedreira)) {
        throw new Error('Aos sábados, o carregamento está disponível exclusivamente para a pedreira de Uruoca - CE (Taj Mahal). Nas demais pedreiras, os carregamentos ocorrem de segunda a sexta-feira.');
      }

      const { lotado } = await obterOcupacaoSabado(dados.data_agendamento, dados.pedreira);
      if (lotado) {
        throw new Error(`Limite máximo de 12 veículos para o sábado (${dados.data_agendamento}) na pedreira de Uruoca já foi atingido. Escolha outra data.`);
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
          agendamentoSalvo = data;
        } else if (error) {
          console.warn('Falha no insert Supabase, usando armazenamento local:', error);
        }
      } catch (eSupabase) {
        console.warn('Erro de conexão com Supabase, salvando localmente:', eSupabase);
      }
    }

    if (!agendamentoSalvo) {
      agendamentoSalvo = salvarAgendamentoLocal(payload);
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
      if (p.tipo_dia === 'sabado') {
        if (!isPedreiraUruoca(p.pedreira)) {
          throw new Error(`[${numPonto}º Carregamento] Aos sábados, o carregamento está disponível exclusivamente para a pedreira de Uruoca - CE (Taj Mahal).`);
        }
        const { lotado } = await obterOcupacaoSabado(p.data_agendamento, p.pedreira);
        if (lotado) {
          throw new Error(`[${numPonto}º Carregamento] Limite máximo de 12 veículos para o sábado (${p.data_agendamento}) na pedreira de Uruoca já foi atingido.`);
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
          if (!res.error && res.data) dataSalva = res.data;
        } catch (eSup) {
          console.warn('Erro ao salvar ponto no Supabase, usando local:', eSup);
        }
      }

      if (!dataSalva) {
        dataSalva = salvarAgendamentoLocal(payload);
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
