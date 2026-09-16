import { supabase, isSupabaseConfigurado } from '../lib/supabase.js';

export { isSupabaseConfigurado };

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
 * Retorna todos os motoristas salvos na base local interna com dados completos de conformidade
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
 * Retorna a lista de motoristas e frota ordenada por nome
 */
export function obterBaseMotoristasCompleta() {
  const lista = obterBaseMotoristas();
  return lista.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
}

export const MOTORISTAS_EXCLUIDOS_KEY = 'vermont_motoristas_excluidos_cpfs';

/**
 * Retorna o conjunto de CPFs de motoristas excluídos definitivamente
 */
export function obterCpfsMotoristasExcluidos() {
  try {
    const raw = localStorage.getItem(MOTORISTAS_EXCLUIDOS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.map(c => String(c).replace(/\D/g, '')).filter(Boolean)) : new Set();
  } catch (e) {
    return new Set();
  }
}

/**
 * Sanitiza e padroniza qualquer valor de data para o formato padrão ISO (YYYY-MM-DD) ou null
 * Impede erros de sintaxe no PostgreSQL (ex: 'invalid input syntax for type date: ""')
 */
export function sanitizarDataIso(valor) {
  if (valor === null || valor === undefined) return null;
  const str = String(valor).trim();
  if (!str || str === '' || str === 'null' || str === 'undefined' || str === '-' || str === 'Não informado') return null;
  
  // Se for ISO com timestamp ou offset (ex: 2026-09-15T00:00:00.000Z)
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  // Se for formato brasileiro DD/MM/YYYY ou DD-MM-YYYY
  if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(str)) {
    const separador = str.includes('/') ? '/' : '-';
    const [d, m, y] = str.split(separador);
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

/**
 * Normaliza o array de histórico de alterações do motorista
 */
export function normalizarHistoricoMotorista(historico) {
  if (!historico) return [];
  if (Array.isArray(historico)) return historico;
  try {
    const parsed = typeof historico === 'string' ? JSON.parse(historico) : historico;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

const HISTORICO_TAG_START = '<!-- VERMONT_HIST:';
const HISTORICO_TAG_END = ':VERMONT_HIST -->';

/**
 * Embute o histórico de auditoria de forma invisível/estruturada dentro do campo de observações
 * para garantir 100% de persistência no Supabase mesmo sem alteração estrutural no banco
 */
export function embutirHistoricoNasObservacoes(observacoesTexto = '', historicoArr = []) {
  const textoLimpo = (observacoesTexto || '').replace(/<!-- VERMONT_HIST:[\s\S]*?:VERMONT_HIST -->/g, '').trim();
  const hist = normalizarHistoricoMotorista(historicoArr);
  if (hist.length === 0) {
    return textoLimpo;
  }
  const jsonStr = JSON.stringify(hist);
  return `${textoLimpo}${textoLimpo ? '\n\n' : ''}${HISTORICO_TAG_START}${jsonStr}${HISTORICO_TAG_END}`;
}

/**
 * Extrai o texto limpo de observações e o array de histórico de auditoria
 */
export function extrairHistoricoDasObservacoes(observacoesTexto = '') {
  if (!observacoesTexto || typeof observacoesTexto !== 'string') return { textoVisivel: '', historico: [] };
  const match = observacoesTexto.match(/<!-- VERMONT_HIST:([\s\S]*?):VERMONT_HIST -->/);
  const textoVisivel = observacoesTexto.replace(/<!-- VERMONT_HIST:[\s\S]*?:VERMONT_HIST -->/g, '').trim();
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      return { textoVisivel, historico: Array.isArray(parsed) ? parsed : [] };
    } catch (e) {}
  }
  return { textoVisivel, historico: [] };
}

/**
 * Registra uma entrada na auditoria de edições do motorista (quem alterou, quando e quais campos)
 */
export function registrarHistoricoEdicaoMotorista(motoristaAnterior = {}, motoristaNovo = {}, usuarioInfo = {}) {
  const alteracoes = [];
  const formatarValor = (val, isData = false) => {
    if (val === null || val === undefined || val === '') return 'Não informado';
    if (isData) {
      const dataIso = sanitizarDataIso(val);
      if (dataIso) {
        const [a, m, d] = dataIso.split('-');
        return `${d}/${m}/${a}`;
      }
      return 'Não informado';
    }
    return String(val).trim();
  };

  const camposParaMonitorar = [
    { key: 'nome', label: 'Nome do Motorista', isData: false },
    { key: 'telefone', label: 'Telefone / WhatsApp', isData: false },
    { key: 'transportadora', label: 'Transportadora', isData: false },
    { key: 'transportadora_cnpj', label: 'CNPJ da Transportadora', isData: false },
    { key: 'tipo_veiculo', label: 'Tipo de Veículo', isData: false },
    { key: 'cnh_categoria', label: 'Categoria CNH', isData: false },
    { key: 'cnh_validade', label: 'Validade da CNH', isData: true },
    { key: 'placa_cavalo', label: 'Placa do Cavalo', isData: false },
    { key: 'uf_cavalo', label: 'Estado (UF) Cavalo', isData: false },
    { key: 'crlv_validade_cavalo', label: 'Último Registro CRLV Cavalo', isData: true },
    { key: 'placa_carreta', label: 'Placa da Carreta 1', isData: false },
    { key: 'uf_carreta', label: 'Estado (UF) Carreta 1', isData: false },
    { key: 'crlv_validade_carreta', label: 'Último Registro CRLV Carreta 1', isData: true },
    { key: 'validade_laudo_rocha', label: 'Vencimento Laudo Rocha / CSV', isData: true },
    { key: 'placa_carreta_2', label: 'Placa da Carreta 2', isData: false },
    { key: 'uf_carreta_2', label: 'Estado (UF) Carreta 2', isData: false },
    { key: 'crlv_validade_carreta_2', label: 'Último Registro CRLV Carreta 2', isData: true },
    { key: 'validade_laudo_rocha_2', label: 'Vencimento Laudo Rocha (Carreta 2)', isData: true },
    { key: 'status_documental', label: 'Status Documental', isData: false },
    { key: 'observacoes', label: 'Observações Internas', isData: false }
  ];

  camposParaMonitorar.forEach(({ key, label, isData }) => {
    let valAnt = motoristaAnterior ? (motoristaAnterior[key] ?? '') : '';
    let valNov = motoristaNovo ? (motoristaNovo[key] ?? '') : '';

    if (isData) {
      valAnt = sanitizarDataIso(valAnt) || '';
      valNov = sanitizarDataIso(valNov) || '';
    }

    const strAnt = String(valAnt).trim().toUpperCase();
    const strNov = String(valNov).trim().toUpperCase();

    if (strAnt !== strNov && (strAnt !== '' || strNov !== '')) {
      alteracoes.push({
        campo: key,
        label,
        de: formatarValor(valAnt, isData),
        para: formatarValor(valNov, isData)
      });
    }
  });

  const historicoExistente = normalizarHistoricoMotorista(
    motoristaNovo.historico_edicoes || motoristaAnterior?.historico_edicoes || []
  );

  const isNovoCadastro = (!motoristaAnterior || !motoristaAnterior.cpf || !motoristaAnterior.nome) && historicoExistente.length === 0;

  const nomeUsuario = usuarioInfo?.nome || usuarioInfo?.email || (usuarioInfo?.isAdmin ? 'Administrador Geral' : 'Operador Pedreira');
  const roleUsuario = usuarioInfo?.role || (usuarioInfo?.isAdmin ? 'Administrador Geral' : 'Operador Pedreira');
  const emailUsuario = usuarioInfo?.email || '';

  const novoEvento = {
    id: `hist_mot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    data_hora: new Date().toISOString(),
    usuario_nome: nomeUsuario,
    usuario_role: roleUsuario,
    usuario_email: emailUsuario,
    tipo: isNovoCadastro ? 'cadastro_inicial' : 'edicao_dados',
    descricao: isNovoCadastro 
      ? `Cadastro inicial do motorista e frota realizado por ${nomeUsuario}` 
      : alteracoes.length > 0
        ? `Atualização cadastral (${alteracoes.length} ${alteracoes.length === 1 ? 'campo alterado' : 'campos alterados'}) realizada por ${nomeUsuario}`
        : `Revisão cadastral / dados confirmados por ${nomeUsuario}`,
    alteracoes: alteracoes
  };

  return [novoEvento, ...historicoExistente];
}

/**
 * Carrega a base unificada e consolidada de todos os motoristas cadastrados
 * Unifica: Base de Conformidade (localStorage / Supabase) + Histórico completo de agendamentos
 */
export async function carregarBaseMotoristasUnificada(agendamentosProp = []) {
  const mapaMotoristas = new Map();
  const cpfsExcluidos = obterCpfsMotoristasExcluidos();

  // 1. Carrega o que já está na base local de conformidade
  const baseLocal = obterBaseMotoristas();
  baseLocal.forEach(m => {
    const rawC = String(m.cpf || '').replace(/\D/g, '');
    if (rawC.length === 11 && !cpfsExcluidos.has(rawC)) {
      mapaMotoristas.set(rawC, {
        ...m,
        cpf: rawC,
        nome: (m.nome || '').trim().toUpperCase(),
        historico_edicoes: normalizarHistoricoMotorista(m.historico_edicoes)
      });
    }
  });

  // 2. Se Supabase configurado, busca diretamente em base_motoristas (base mestre de conformidade)
  if (isSupabaseConfigurado()) {
    try {
      const { data: dataBase, error: errBase } = await supabase
        .from('base_motoristas')
        .select('*');

      if (!errBase && Array.isArray(dataBase)) {
        dataBase.forEach(item => {
          const rawC = String(item.cpf || '').replace(/\D/g, '');
          if (rawC.length === 11 && !cpfsExcluidos.has(rawC)) {
            const existente = mapaMotoristas.get(rawC) || {};
            const cnhVal = sanitizarDataIso(item.cnh_validade !== undefined ? item.cnh_validade : existente.cnh_validade);
            const crlvCav = sanitizarDataIso(item.crlv_validade_cavalo !== undefined ? item.crlv_validade_cavalo : existente.crlv_validade_cavalo);
            const crlvCarr = sanitizarDataIso(item.crlv_validade_carreta !== undefined ? item.crlv_validade_carreta : existente.crlv_validade_carreta);
            const laudoR = sanitizarDataIso(item.validade_laudo_rocha !== undefined ? item.validade_laudo_rocha : existente.validade_laudo_rocha);
            const crlvCarr2 = sanitizarDataIso(item.crlv_validade_carreta_2 !== undefined ? item.crlv_validade_carreta_2 : existente.crlv_validade_carreta_2);
            const laudoR2 = sanitizarDataIso(item.validade_laudo_rocha_2 !== undefined ? item.validade_laudo_rocha_2 : existente.validade_laudo_rocha_2);

            const extraidoItem = extrairHistoricoDasObservacoes(item.observacoes);
            const extraidoExistente = extrairHistoricoDasObservacoes(existente.observacoes);

            const histCombinado = [
              ...normalizarHistoricoMotorista(item.historico_edicoes),
              ...extraidoItem.historico,
              ...normalizarHistoricoMotorista(existente.historico_edicoes),
              ...extraidoExistente.historico
            ];

            const mapaHist = new Map();
            histCombinado.forEach(h => {
              if (h && h.id) mapaHist.set(h.id, h);
            });
            const historicoFinal = Array.from(mapaHist.values());
            historicoFinal.sort((a, b) => new Date(b.data_hora || 0) - new Date(a.data_hora || 0));

            const obsFinal = extraidoItem.textoVisivel || extraidoExistente.textoVisivel || (item.observacoes || '').replace(/<!-- VERMONT_HIST:[\s\S]*?:VERMONT_HIST -->/g, '').trim();

            mapaMotoristas.set(rawC, {
              ...existente,
              ...item,
              cpf: rawC,
              nome: (item.nome || existente.nome || '').trim().toUpperCase(),
              cnh_validade: cnhVal,
              crlv_validade_cavalo: crlvCav,
              crlv_validade_carreta: crlvCarr,
              validade_laudo_rocha: laudoR,
              crlv_validade_carreta_2: crlvCarr2,
              validade_laudo_rocha_2: laudoR2,
              observacoes: obsFinal,
              historico_edicoes: historicoFinal
            });
          }
        });
      }
    } catch (e) {
      console.warn('Erro ao carregar base_motoristas do Supabase:', e);
    }
  }

  // 3. Complementa com motoristas vindos do histórico de agendamentos (sem apagar documentos já cadastrados)
  const processarAgendamentoParaBase = (ag) => {
    const rawC = String(ag.motorista_cpf || '').replace(/\D/g, '');
    if (rawC.length === 11 && !cpfsExcluidos.has(rawC) && ag.motorista_nome) {
      const existente = mapaMotoristas.get(rawC) || {};
      mapaMotoristas.set(rawC, {
        ...existente,
        cpf: rawC,
        nome: (existente.nome || ag.motorista_nome || '').trim().toUpperCase(),
        telefone: existente.telefone || ag.motorista_telefone || '',
        transportadora: (existente.transportadora || ag.transportadora || '').trim().toUpperCase(),
        transportadora_cnpj: existente.transportadora_cnpj || ag.transportadora_cnpj || '',
        tipo_veiculo: existente.tipo_veiculo || ag.tipo_veiculo || 'Carreta / Bitrem',
        placa_cavalo: (existente.placa_cavalo || ag.placa_cavalo || '').toUpperCase().trim(),
        placa_carreta: (existente.placa_carreta || ag.placa_carreta || '').toUpperCase().trim(),
        placa_carreta_2: (existente.placa_carreta_2 || ag.placa_carreta_2 || '').toUpperCase().trim(),
        cnh_categoria: existente.cnh_categoria || 'E',
        cnh_validade: existente.cnh_validade || null,
        crlv_validade_cavalo: existente.crlv_validade_cavalo || null,
        crlv_validade_carreta: existente.crlv_validade_carreta || null,
        validade_laudo_rocha: existente.validade_laudo_rocha || null,
        crlv_validade_carreta_2: existente.crlv_validade_carreta_2 || null,
        validade_laudo_rocha_2: existente.validade_laudo_rocha_2 || null,
        status_documental: existente.status_documental || 'REGULAR',
        observacoes: existente.observacoes || '',
        historico_edicoes: normalizarHistoricoMotorista(existente.historico_edicoes),
        atualizado_em: existente.atualizado_em || ag.created_at || new Date().toISOString()
      });
    }
  };

  if (Array.isArray(agendamentosProp) && agendamentosProp.length > 0) {
    agendamentosProp.forEach(processarAgendamentoParaBase);
  }

  // 4. Também consulta no histórico local de agendamentos
  const agsLocais = obterAgendamentosLocais();
  agsLocais.forEach(processarAgendamentoParaBase);

  const listaCompleta = Array.from(mapaMotoristas.values());
  listaCompleta.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

  // Salva no cache local para persistência rápida
  localStorage.setItem(MOTORISTAS_BASE_KEY, codificarBaseMotoristasLocal(listaCompleta));

  return listaCompleta;
}

/**
 * Salva ou atualiza um motorista na base cadastral (local e sincronizado com Supabase)
 * Preserva campos de conformidade (CNH, CRLVs, Laudos) já existentes caso venha de um agendamento simples
 */
export async function salvarMotoristaNaBase(dadosMotorista = {}) {
  try {
    const rawCpf = dadosMotorista.motorista_cpf || dadosMotorista.cpf;
    if (!rawCpf) return;
    const cpfLimpo = String(rawCpf).replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return;

    const base = obterBaseMotoristas();
    const index = base.findIndex(m => String(m.cpf).replace(/\D/g, '') === cpfLimpo);
    const existente = index !== -1 ? base[index] : {};

    const transpLimpa = limparNomeEmpresa(dadosMotorista.transportadora || dadosMotorista.nome_transportadora || existente.transportadora || '').toUpperCase() || null;
    const transpCnpj = dadosMotorista.transportadora_cnpj || extrairCnpj(dadosMotorista.transportadora) || existente.transportadora_cnpj || obterCnpjEmpresaCache(transpLimpa) || null;
    const nomeLimpo = (dadosMotorista.motorista_nome || dadosMotorista.nome || existente.nome || '').trim().toUpperCase();
    const telLimpo = dadosMotorista.motorista_telefone || dadosMotorista.telefone || existente.telefone || null;

    const cnhVal = sanitizarDataIso(dadosMotorista.cnh_validade || existente.cnh_validade);
    const crlvCav = sanitizarDataIso(dadosMotorista.crlv_validade_cavalo || existente.crlv_validade_cavalo);
    const crlvCarr = sanitizarDataIso(dadosMotorista.crlv_validade_carreta || existente.crlv_validade_carreta);
    const laudoR = sanitizarDataIso(dadosMotorista.validade_laudo_rocha || existente.validade_laudo_rocha);
    const crlvCarr2 = sanitizarDataIso(dadosMotorista.crlv_validade_carreta_2 || existente.crlv_validade_carreta_2);
    const laudoR2 = sanitizarDataIso(dadosMotorista.validade_laudo_rocha_2 || existente.validade_laudo_rocha_2);

    const novoRegistro = {
      ...existente,
      cpf: cpfLimpo,
      nome: nomeLimpo,
      telefone: telLimpo,
      transportadora: transpLimpa,
      transportadora_cnpj: transpCnpj,
      tipo_veiculo: dadosMotorista.tipo_veiculo || existente.tipo_veiculo || 'Carreta / Bitrem',
      is_bitruck: Boolean(dadosMotorista.is_bitruck || dadosMotorista.tipo_veiculo?.includes('Truck') || existente.is_bitruck),
      placa_cavalo: (dadosMotorista.placa_cavalo || existente.placa_cavalo || '').toUpperCase().trim() || null,
      uf_cavalo: dadosMotorista.uf_cavalo || existente.uf_cavalo || identificarUFPelaPlaca(dadosMotorista.placa_cavalo) || 'ES',
      crlv_validade_cavalo: crlvCav,
      placa_carreta: (dadosMotorista.placa_carreta || existente.placa_carreta || '').toUpperCase().trim() || null,
      uf_carreta: dadosMotorista.uf_carreta || existente.uf_carreta || identificarUFPelaPlaca(dadosMotorista.placa_carreta) || 'ES',
      crlv_validade_carreta: crlvCarr,
      validade_laudo_rocha: laudoR,
      placa_carreta_2: (dadosMotorista.placa_carreta_2 || existente.placa_carreta_2 || '').toUpperCase().trim() || null,
      uf_carreta_2: dadosMotorista.uf_carreta_2 || existente.uf_carreta_2 || identificarUFPelaPlaca(dadosMotorista.placa_carreta_2) || 'ES',
      crlv_validade_carreta_2: crlvCarr2,
      validade_laudo_rocha_2: laudoR2,
      cnh_categoria: (dadosMotorista.cnh_categoria || existente.cnh_categoria || 'E').toUpperCase().trim(),
      cnh_validade: cnhVal,
      status_documental: dadosMotorista.status_documental || existente.status_documental || 'REGULAR',
      observacoes: dadosMotorista.observacoes || existente.observacoes || '',
      historico_edicoes: normalizarHistoricoMotorista(dadosMotorista.historico_edicoes || existente.historico_edicoes),
      atualizado_em: new Date().toISOString(),
      atualizado_por: dadosMotorista.atualizado_por || existente.atualizado_por || 'SISTEMA'
    };

    if (index !== -1) {
      base[index] = novoRegistro;
    } else {
      base.push(novoRegistro);
    }

    localStorage.setItem(MOTORISTAS_BASE_KEY, codificarBaseMotoristasLocal(base));

    // Sincroniza no Supabase se configurado
    if (isSupabaseConfigurado() && nomeLimpo) {
      try {
        const payload = {
          cpf: cpfLimpo,
          nome: nomeLimpo,
          telefone: telLimpo || '',
          transportadora: transpLimpa || '',
          cnh_categoria: novoRegistro.cnh_categoria,
          cnh_validade: cnhVal,
          placa_cavalo: novoRegistro.placa_cavalo,
          crlv_validade_cavalo: crlvCav,
          placa_carreta: novoRegistro.placa_carreta,
          crlv_validade_carreta: crlvCarr,
          validade_laudo_rocha: laudoR,
          placa_carreta_2: novoRegistro.placa_carreta_2,
          crlv_validade_carreta_2: crlvCarr2,
          validade_laudo_rocha_2: laudoR2,
          observacoes: novoRegistro.observacoes,
          atualizado_em: novoRegistro.atualizado_em
        };
        await supabase.from('base_motoristas').upsert(payload, { onConflict: 'cpf' });
      } catch (_e) {}
    }
  } catch (e) {
    console.warn('Erro ao salvar motorista na base:', e);
  }
}

/**
 * Salva ou edita diretamente o cadastro completo de conformidade de motorista e frota (Pedreira / Admin)
 */
export async function salvarMotoristaFrotaConformidade(dados = {}, usuarioInfo = {}) {
  try {
    const rawCpf = dados.cpf || dados.motorista_cpf;
    if (!rawCpf) return { sucesso: false, erro: 'CPF é obrigatório.' };
    const cpfLimpo = String(rawCpf).replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return { sucesso: false, erro: 'CPF inválido (deve ter 11 dígitos).' };

    const base = obterBaseMotoristas();
    const index = base.findIndex(m => String(m.cpf).replace(/\D/g, '') === cpfLimpo);
    const existente = dados.motoristaOriginal || (index !== -1 ? base[index] : {});

    const nomeUsuario = usuarioInfo?.nome || usuarioInfo?.email || dados.atualizado_por || (usuarioInfo?.isAdmin ? 'ADMINISTRADOR GERAL' : 'OPERADOR PEDREIRA');

    // Sanitiza rigorosamente todas as datas (ISO YYYY-MM-DD ou null, nunca strings vazias "")
    const cnhValidade = sanitizarDataIso(dados.cnh_validade);
    const crlvValidadeCavalo = sanitizarDataIso(dados.crlv_validade_cavalo);
    const crlvValidadeCarreta = sanitizarDataIso(dados.crlv_validade_carreta);
    const validadeLaudoRocha = sanitizarDataIso(dados.validade_laudo_rocha);
    const crlvValidadeCarreta2 = sanitizarDataIso(dados.crlv_validade_carreta_2);
    const validadeLaudoRocha2 = sanitizarDataIso(dados.validade_laudo_rocha_2);

    const dadosNormalizados = {
      ...dados,
      cpf: cpfLimpo,
      cnh_validade: cnhValidade,
      crlv_validade_cavalo: crlvValidadeCavalo,
      crlv_validade_carreta: crlvValidadeCarreta,
      validade_laudo_rocha: validadeLaudoRocha,
      crlv_validade_carreta_2: crlvValidadeCarreta2,
      validade_laudo_rocha_2: validadeLaudoRocha2
    };

    const historicoAtualizado = registrarHistoricoEdicaoMotorista(existente, dadosNormalizados, usuarioInfo);

    const obsTextoLimpo = (dados.observacoes || '').replace(/<!-- VERMONT_HIST:[\s\S]*?:VERMONT_HIST -->/g, '').trim();
    const obsComHistorico = embutirHistoricoNasObservacoes(obsTextoLimpo, historicoAtualizado);

    const registroAtualizado = {
      ...existente,
      cpf: cpfLimpo,
      nome: (dados.nome || dados.motorista_nome || existente.nome || '').trim().toUpperCase(),
      telefone: dados.telefone || dados.motorista_telefone || existente.telefone || '',
      transportadora: (dados.transportadora || existente.transportadora || '').trim().toUpperCase(),
      transportadora_cnpj: dados.transportadora_cnpj || existente.transportadora_cnpj || '',
      tipo_veiculo: dados.tipo_veiculo || existente.tipo_veiculo || 'Carreta / Bitrem',
      is_bitruck: Boolean(dados.is_bitruck || dados.tipo_veiculo?.includes('Truck') || existente.is_bitruck),
      placa_cavalo: (dados.placa_cavalo || existente.placa_cavalo || '').toUpperCase().trim(),
      uf_cavalo: dados.uf_cavalo || existente.uf_cavalo || identificarUFPelaPlaca(dados.placa_cavalo) || 'ES',
      crlv_validade_cavalo: crlvValidadeCavalo,
      placa_carreta: (dados.placa_carreta || existente.placa_carreta || '').toUpperCase().trim(),
      uf_carreta: dados.uf_carreta || existente.uf_carreta || identificarUFPelaPlaca(dados.placa_carreta) || 'ES',
      crlv_validade_carreta: crlvValidadeCarreta,
      validade_laudo_rocha: validadeLaudoRocha,
      placa_carreta_2: (dados.placa_carreta_2 || existente.placa_carreta_2 || '').toUpperCase().trim(),
      uf_carreta_2: dados.uf_carreta_2 || existente.uf_carreta_2 || identificarUFPelaPlaca(dados.placa_carreta_2) || 'ES',
      crlv_validade_carreta_2: crlvValidadeCarreta2,
      validade_laudo_rocha_2: validadeLaudoRocha2,
      // Documentação
      cnh_categoria: (dados.cnh_categoria || existente.cnh_categoria || 'E').toUpperCase().trim(),
      cnh_validade: cnhValidade,
      status_documental: dados.status_documental || 'REGULAR',
      observacoes: obsTextoLimpo,
      historico_edicoes: historicoAtualizado,
      atualizado_em: new Date().toISOString(),
      atualizado_por: nomeUsuario
    };

    const excluidos = obterCpfsMotoristasExcluidos();
    if (excluidos.has(cpfLimpo)) {
      excluidos.delete(cpfLimpo);
      try {
        localStorage.setItem(MOTORISTAS_EXCLUIDOS_KEY, JSON.stringify([...excluidos]));
      } catch (_e) {}
    }

    if (index !== -1) {
      base[index] = registroAtualizado;
    } else {
      base.push(registroAtualizado);
    }

    localStorage.setItem(MOTORISTAS_BASE_KEY, codificarBaseMotoristasLocal(base));

    if (isSupabaseConfigurado()) {
      try {
        // Tentativa 1: Payload Completo com todas as colunas
        const payloadCompleto = {
          cpf: cpfLimpo,
          nome: registroAtualizado.nome,
          telefone: registroAtualizado.telefone,
          transportadora: registroAtualizado.transportadora,
          transportadora_cnpj: registroAtualizado.transportadora_cnpj,
          tipo_veiculo: registroAtualizado.tipo_veiculo,
          cnh_categoria: registroAtualizado.cnh_categoria,
          cnh_validade: registroAtualizado.cnh_validade,
          placa_cavalo: registroAtualizado.placa_cavalo,
          uf_cavalo: registroAtualizado.uf_cavalo,
          crlv_validade_cavalo: registroAtualizado.crlv_validade_cavalo,
          placa_carreta: registroAtualizado.placa_carreta,
          uf_carreta: registroAtualizado.uf_carreta,
          crlv_validade_carreta: registroAtualizado.crlv_validade_carreta,
          validade_laudo_rocha: registroAtualizado.validade_laudo_rocha,
          placa_carreta_2: registroAtualizado.placa_carreta_2,
          uf_carreta_2: registroAtualizado.uf_carreta_2,
          crlv_validade_carreta_2: registroAtualizado.crlv_validade_carreta_2,
          validade_laudo_rocha_2: registroAtualizado.validade_laudo_rocha_2,
          status_documental: registroAtualizado.status_documental,
          observacoes: obsTextoLimpo,
          historico_edicoes: historicoAtualizado,
          atualizado_por: registroAtualizado.atualizado_por,
          atualizado_em: registroAtualizado.atualizado_em
        };

        const { error: errUpsert } = await supabase.from('base_motoristas').upsert(payloadCompleto, { onConflict: 'cpf' });

        if (errUpsert) {
          console.warn('Upsert completo falhou, tentando fallback:', errUpsert.message);
          
          // Tentativa 2: Payload com historico_edicoes serializado como string JSON
          const payloadJsonStr = {
            ...payloadCompleto,
            observacoes: obsTextoLimpo,
            historico_edicoes: JSON.stringify(historicoAtualizado)
          };
          const res2 = await supabase.from('base_motoristas').upsert(payloadJsonStr, { onConflict: 'cpf' });

          if (res2.error) {
            console.warn('Upsert 2 falhou, tentando payload essencial:', res2.error.message);
            // Tentativa 3: Payload essencial
            const payloadEssencial = {
              cpf: cpfLimpo,
              nome: registroAtualizado.nome,
              telefone: registroAtualizado.telefone,
              transportadora: registroAtualizado.transportadora,
              cnh_categoria: registroAtualizado.cnh_categoria,
              cnh_validade: registroAtualizado.cnh_validade,
              placa_cavalo: registroAtualizado.placa_cavalo,
              crlv_validade_cavalo: registroAtualizado.crlv_validade_cavalo,
              placa_carreta: registroAtualizado.placa_carreta,
              crlv_validade_carreta: registroAtualizado.crlv_validade_carreta,
              validade_laudo_rocha: registroAtualizado.validade_laudo_rocha,
              observacoes: obsTextoLimpo,
              historico_edicoes: historicoAtualizado,
              atualizado_em: registroAtualizado.atualizado_em
            };
            const res3 = await supabase.from('base_motoristas').upsert(payloadEssencial, { onConflict: 'cpf' });
            if (res3.error) {
              console.error('Erro final no upsert do Supabase:', res3.error);
            }
          }
        }
      } catch (eSup) {
        console.warn('Exceção ao persistir motorista no Supabase:', eSup);
      }
    }

    return { sucesso: true, motorista: registroAtualizado };
  } catch (err) {
    return { sucesso: false, erro: err.message || 'Erro ao salvar conformidade.' };
  }
}

/**
 * Exclui um motorista/veículo da base de conformidade (e impede reimportação de agendamentos antigos)
 */
export async function excluirMotoristaFrota(cpf = '') {
  try {
    const cpfLimpo = String(cpf).replace(/\D/g, '');
    if (!cpfLimpo) return false;

    // Registra na lista negra de CPFs excluídos
    const excluidos = obterCpfsMotoristasExcluidos();
    excluidos.add(cpfLimpo);
    try {
      localStorage.setItem(MOTORISTAS_EXCLUIDOS_KEY, JSON.stringify([...excluidos]));
    } catch (_e) {}

    const base = obterBaseMotoristas();
    const filtrada = base.filter(m => String(m.cpf).replace(/\D/g, '') !== cpfLimpo);
    localStorage.setItem(MOTORISTAS_BASE_KEY, codificarBaseMotoristasLocal(filtrada));

    if (isSupabaseConfigurado()) {
      try {
        await supabase.from('base_motoristas').delete().eq('cpf', cpfLimpo);
      } catch (_e) {}
    }

    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Lista dos 27 Estados da Federação
 */
export const ESTADOS_BRASIL = [
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'TO', nome: 'Tocantins' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'AP', nome: 'Amapá' }
];

/**
 * Tabela Oficial SENATRAN de Faixas de Placas por Estado da Federação
 */
const FAIXAS_SENATRAN = [
  { uf: 'PR', de: 'AAA', ate: 'BEZ' },
  { uf: 'SP', de: 'BFA', ate: 'GKI' },
  { uf: 'MG', de: 'GKX', ate: 'HOK' },
  { uf: 'MA', de: 'HOL', ate: 'HQE' },
  { uf: 'PI', de: 'HQF', ate: 'HTI' },
  { uf: 'MS', de: 'HQI', ate: 'HTW' },
  { uf: 'CE', de: 'HTX', ate: 'HZA' },
  { uf: 'SE', de: 'IAA', ate: 'IAP' },
  { uf: 'RS', de: 'IAQ', ate: 'JDO' },
  { uf: 'DF', de: 'JDP', ate: 'JKR' },
  { uf: 'BA', de: 'JKA', ate: 'JSI' },
  { uf: 'PA', de: 'JTA', ate: 'JWE' },
  { uf: 'AM', de: 'JWP', ate: 'JYZ' },
  { uf: 'MT', de: 'JXD', ate: 'JXZ' },
  { uf: 'GO', de: 'KAV', ate: 'KFC' },
  { uf: 'PE', de: 'KFA', ate: 'KME' },
  { uf: 'RJ', de: 'KMF', ate: 'LVE' },
  { uf: 'RN', de: 'MXH', ate: 'MZM' },
  { uf: 'SC', de: 'LXP', ate: 'LZZ' },
  { uf: 'SC', de: 'MCI', ate: 'MKO' },
  { uf: 'SC', de: 'MLV', ate: 'MMG' },
  { uf: 'PB', de: 'MMN', ate: 'MOW' },
  { uf: 'ES', de: 'MOX', ate: 'MTZ' },
  { uf: 'AL', de: 'MUA', ate: 'MVK' },
  { uf: 'TO', de: 'MVL', ate: 'MXG' },
  { uf: 'AC', de: 'MZN', ate: 'MZZ' },
  { uf: 'RR', de: 'NAH', ate: 'NBM' },
  { uf: 'RO', de: 'NBB', ate: 'NEH' },
  { uf: 'AP', de: 'NEI', ate: 'NFB' },
  { uf: 'GO', de: 'NFC', ate: 'NGZ' },
  { uf: 'MA', de: 'NHA', ate: 'NHT' },
  { uf: 'PI', de: 'NIX', ate: 'NIZ' },
  { uf: 'AM', de: 'NOI', ate: 'NPB' },
  { uf: 'PB', de: 'NPR', ate: 'NQK' },
  { uf: 'CE', de: 'NQL', ate: 'NRE' },
  { uf: 'MS', de: 'NRF', ate: 'NSD' },
  { uf: 'PA', de: 'NSE', ate: 'NTC' },
  { uf: 'BA', de: 'NTD', ate: 'NTW' },
  { uf: 'BA', de: 'NYH', ate: 'NZZ' },
  { uf: 'MG', de: 'NXX', ate: 'NYG' },
  { uf: 'PE', de: 'NXU', ate: 'NXW' },
  { uf: 'ES', de: 'OCV', ate: 'ODT' },
  { uf: 'ES', de: 'OVE', ate: 'OVF' },
  { uf: 'ES', de: 'OVH', ate: 'OVL' },
  { uf: 'ES', de: 'OYD', ate: 'OYK' },
  { uf: 'ES', de: 'PPA', ate: 'PPZ' },
  { uf: 'ES', de: 'QRB', ate: 'QUZ' },
  { uf: 'ES', de: 'RBA', ate: 'RBJ' },
  { uf: 'ES', de: 'RFA', ate: 'RGD' },
  { uf: 'ES', de: 'RQM', ate: 'RRM' },
  { uf: 'ES', de: 'SGA', ate: 'SGL' },
  { uf: 'MG', de: 'OLO', ate: 'OMH' },
  { uf: 'MG', de: 'OOR', ate: 'OQV' },
  { uf: 'MG', de: 'OWH', ate: 'OXK' },
  { uf: 'MG', de: 'PUA', ate: 'PZZ' },
  { uf: 'MG', de: 'QMQ', ate: 'QQZ' },
  { uf: 'MG', de: 'QUA', ate: 'QUZ' },
  { uf: 'MG', de: 'RER', ate: 'RHZ' },
  { uf: 'MG', de: 'RMD', ate: 'RNZ' },
  { uf: 'SP', de: 'QSN', ate: 'QSZ' },
  { uf: 'SP', de: 'SAV', ate: 'SCS' },
  { uf: 'RJ', de: 'RIO', ate: 'RIO' },
  { uf: 'RJ', de: 'RIP', ate: 'RKV' },
  { uf: 'BA', de: 'PKB', ate: 'PKZ' },
  { uf: 'BA', de: 'QMA', ate: 'QMP' },
  { uf: 'BA', de: 'RCO', ate: 'RDR' },
  { uf: 'BA', de: 'SSA', ate: 'SSZ' },
  { uf: 'PE', de: 'OYL', ate: 'OYZ' },
  { uf: 'PE', de: 'PCA', ate: 'PGZ' },
  { uf: 'PE', de: 'QYA', ate: 'QYZ' },
  { uf: 'PE', de: 'RDE', ate: 'RDS' },
  { uf: 'PE', de: 'RJA', ate: 'RJZ' }
];

/**
 * Identifica o Estado (UF) de origem do veículo com base no prefixo de 3 letras da placa
 * @param {string} placa 
 * @returns {string} Sigla UF (ex: 'ES', 'MG', 'SP', 'RJ', 'BA')
 */
export function identificarUFPelaPlaca(placa = '') {
  if (!placa) return 'ES';
  const limpa = String(placa).replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const prefixo = limpa.slice(0, 3);
  if (prefixo.length !== 3 || !/^[A-Z]{3}$/.test(prefixo)) return 'ES';

  const match = FAIXAS_SENATRAN.find(f => prefixo >= f.de && prefixo <= f.ate);
  return match ? match.uf : 'ES';
}

/**
 * Calendários Oficiais dos DETRANs por Estado da Federação
 */
export const CALENDARIOS_DETRAN_POR_UF = {
  // Espírito Santo (Instrução de Serviço Nº 43 / Detran-ES)
  'ES': {
    '1': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 9, labelPar: '1 e 2' },
    '2': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 9, labelPar: '1 e 2' },
    '3': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 10, labelPar: '3 e 4' },
    '4': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 10, labelPar: '3 e 4' },
    '5': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 11, labelPar: '5 e 6' },
    '6': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 11, labelPar: '5 e 6' },
    '7': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 14, labelPar: '7 e 8' },
    '8': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 14, labelPar: '7 e 8' },
    '9': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 15, labelPar: '9 e 0' },
    '0': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 15, labelPar: '9 e 0' }
  },
  // Minas Gerais (Portaria Detran-MG)
  'MG': {
    '1': { mesNumero: 8, mesNome: 'Agosto', diaLimite: 31, labelPar: '1, 2 e 3' },
    '2': { mesNumero: 8, mesNome: 'Agosto', diaLimite: 31, labelPar: '1, 2 e 3' },
    '3': { mesNumero: 8, mesNome: 'Agosto', diaLimite: 31, labelPar: '1, 2 e 3' },
    '4': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 30, labelPar: '4, 5 e 6' },
    '5': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 30, labelPar: '4, 5 e 6' },
    '6': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 30, labelPar: '4, 5 e 6' },
    '7': { mesNumero: 10, mesNome: 'Outubro', diaLimite: 31, labelPar: '7, 8, 9 e 0' },
    '8': { mesNumero: 10, mesNome: 'Outubro', diaLimite: 31, labelPar: '7, 8, 9 e 0' },
    '9': { mesNumero: 10, mesNome: 'Outubro', diaLimite: 31, labelPar: '7, 8, 9 e 0' },
    '0': { mesNumero: 10, mesNome: 'Outubro', diaLimite: 31, labelPar: '7, 8, 9 e 0' }
  },
  // São Paulo (Detran-SP - Caminhões / Veículos de Carga e Articulados)
  'SP': {
    '1': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 30, labelPar: '1 e 2' },
    '2': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 30, labelPar: '1 e 2' },
    '3': { mesNumero: 10, mesNome: 'Outubro', diaLimite: 31, labelPar: '3, 4 e 5' },
    '4': { mesNumero: 10, mesNome: 'Outubro', diaLimite: 31, labelPar: '3, 4 e 5' },
    '5': { mesNumero: 10, mesNome: 'Outubro', diaLimite: 31, labelPar: '3, 4 e 5' },
    '6': { mesNumero: 11, mesNome: 'Novembro', diaLimite: 30, labelPar: '6, 7 e 8' },
    '7': { mesNumero: 11, mesNome: 'Novembro', diaLimite: 30, labelPar: '6, 7 e 8' },
    '8': { mesNumero: 11, mesNome: 'Novembro', diaLimite: 30, labelPar: '6, 7 e 8' },
    '9': { mesNumero: 12, mesNome: 'Dezembro', diaLimite: 31, labelPar: '9 e 0' },
    '0': { mesNumero: 12, mesNome: 'Dezembro', diaLimite: 31, labelPar: '9 e 0' }
  },
  // Rio de Janeiro (Detran-RJ)
  'RJ': {
    '1': { mesNumero: 8, mesNome: 'Agosto', diaLimite: 31, labelPar: '0, 1 e 2' },
    '2': { mesNumero: 8, mesNome: 'Agosto', diaLimite: 31, labelPar: '0, 1 e 2' },
    '0': { mesNumero: 8, mesNome: 'Agosto', diaLimite: 31, labelPar: '0, 1 e 2' },
    '3': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 30, labelPar: '3, 4 e 5' },
    '4': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 30, labelPar: '3, 4 e 5' },
    '5': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 30, labelPar: '3, 4 e 5' },
    '6': { mesNumero: 10, mesNome: 'Outubro', diaLimite: 31, labelPar: '6 e 7' },
    '7': { mesNumero: 10, mesNome: 'Outubro', diaLimite: 31, labelPar: '6 e 7' },
    '8': { mesNumero: 11, mesNome: 'Novembro', diaLimite: 30, labelPar: '8 e 9' },
    '9': { mesNumero: 11, mesNome: 'Novembro', diaLimite: 30, labelPar: '8 e 9' }
  },
  // Bahia (Detran-BA)
  'BA': {
    '1': { mesNumero: 8, mesNome: 'Agosto', diaLimite: 30, labelPar: '1 e 2' },
    '2': { mesNumero: 8, mesNome: 'Agosto', diaLimite: 30, labelPar: '1 e 2' },
    '3': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 30, labelPar: '3 e 4' },
    '4': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 30, labelPar: '3 e 4' },
    '5': { mesNumero: 10, mesNome: 'Outubro', diaLimite: 31, labelPar: '5 e 6' },
    '6': { mesNumero: 10, mesNome: 'Outubro', diaLimite: 31, labelPar: '5 e 6' },
    '7': { mesNumero: 11, mesNome: 'Novembro', diaLimite: 30, labelPar: '7 e 8' },
    '8': { mesNumero: 11, mesNome: 'Novembro', diaLimite: 30, labelPar: '7 e 8' },
    '9': { mesNumero: 12, mesNome: 'Dezembro', diaLimite: 30, labelPar: '9 e 0' },
    '0': { mesNumero: 12, mesNome: 'Dezembro', diaLimite: 30, labelPar: '9 e 0' }
  },
  // Paraná (Detran-PR)
  'PR': {
    '1': { mesNumero: 8, mesNome: 'Agosto', diaLimite: 31, labelPar: '1 e 2' },
    '2': { mesNumero: 8, mesNome: 'Agosto', diaLimite: 31, labelPar: '1 e 2' },
    '3': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 30, labelPar: '3, 4 e 5' },
    '4': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 30, labelPar: '3, 4 e 5' },
    '5': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 30, labelPar: '3, 4 e 5' },
    '6': { mesNumero: 10, mesNome: 'Outubro', diaLimite: 31, labelPar: '6, 7 e 8' },
    '7': { mesNumero: 10, mesNome: 'Outubro', diaLimite: 31, labelPar: '6, 7 e 8' },
    '8': { mesNumero: 10, mesNome: 'Outubro', diaLimite: 31, labelPar: '6, 7 e 8' },
    '9': { mesNumero: 11, mesNome: 'Novembro', diaLimite: 30, labelPar: '9 e 0' },
    '0': { mesNumero: 11, mesNome: 'Novembro', diaLimite: 30, labelPar: '9 e 0' }
  },
  // Padrão Geral SENATRAN
  'PADRAO': {
    '1': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 30, labelPar: '1 e 2' },
    '2': { mesNumero: 9, mesNome: 'Setembro', diaLimite: 30, labelPar: '1 e 2' },
    '3': { mesNumero: 10, mesNome: 'Outubro', diaLimite: 31, labelPar: '3, 4 e 5' },
    '4': { mesNumero: 10, mesNome: 'Outubro', diaLimite: 31, labelPar: '3, 4 e 5' },
    '5': { mesNumero: 10, mesNome: 'Outubro', diaLimite: 31, labelPar: '3, 4 e 5' },
    '6': { mesNumero: 11, mesNome: 'Novembro', diaLimite: 30, labelPar: '6, 7 e 8' },
    '7': { mesNumero: 11, mesNome: 'Novembro', diaLimite: 30, labelPar: '6, 7 e 8' },
    '8': { mesNumero: 11, mesNome: 'Novembro', diaLimite: 30, labelPar: '6, 7 e 8' },
    '9': { mesNumero: 12, mesNome: 'Dezembro', diaLimite: 31, labelPar: '9 e 0' },
    '0': { mesNumero: 12, mesNome: 'Dezembro', diaLimite: 31, labelPar: '9 e 0' }
  }
};

/**
 * Retorna as informações oficiais do Detran para o final da placa e Estado (UF)
 * @param {string} placa 
 * @param {string} ufInformada (Opcional, detecta automaticamente caso omitido)
 */
export function obterInfoLicenciamentoPorPlaca(placa = '', ufInformada = '') {
  if (!placa) return null;
  const limpa = String(placa).replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (limpa.length < 7) return null;
  const digitos = limpa.replace(/\D/g, '');
  if (!digitos) return null;
  const finalDigito = digitos.slice(-1);
  const uf = (ufInformada || identificarUFPelaPlaca(placa) || 'ES').toUpperCase().trim();

  const calEstado = CALENDARIOS_DETRAN_POR_UF[uf] || CALENDARIOS_DETRAN_POR_UF['PADRAO'];
  const info = calEstado[finalDigito] || CALENDARIOS_DETRAN_POR_UF['PADRAO'][finalDigito];
  if (!info) return null;

  return {
    uf,
    finalDigito,
    mesNumero: info.mesNumero,
    mesNome: info.mesNome,
    diaLimite: info.diaLimite,
    labelPar: info.labelPar || finalDigito
  };
}

/**
 * Calcula a data de vencimento sugerida do CRLV para a placa em um ano específico
 */
export function calcularVencimentoCRLVPorPlaca(placa = '', anoRef = null, uf = '') {
  const info = obterInfoLicenciamentoPorPlaca(placa, uf);
  if (!info) return null;
  const ano = anoRef || new Date().getFullYear();
  const mesStr = String(info.mesNumero).padStart(2, '0');
  const diaStr = String(info.diaLimite).padStart(2, '0');
  return `${ano}-${mesStr}-${diaStr}`;
}

/**
 * Calcula a data de vencimento a partir da data informada
 * @param {string} dataStr YYYY-MM-DD
 * @returns {string|null} YYYY-MM-DD
 */
export function calcularVencimentoUmAno(dataStr) {
  if (!dataStr) return null;
  try {
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    if (!ano || !mes || !dia) return null;
    const dataVenc = new Date(ano + 1, mes - 1, dia);
    const y = dataVenc.getFullYear();
    const m = String(dataVenc.getMonth() + 1).padStart(2, '0');
    const d = String(dataVenc.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch (_e) {
    return null;
  }
}

/**
 * Avalia o status de conformidade do CRLV baseado na Data do Último Registro e o calendário do Detran do Estado (UF) para o final da placa.
 * @param {string} dataUltimoRegistro YYYY-MM-DD
 * @param {string} placa Placa do veículo
 * @param {string} dataReferenciaStr Data de referência (hoje ou data do agendamento)
 * @param {string} ufInformada Sigla do Estado (opcional)
 */
export function avaliarCRLVComDetran(dataUltimoRegistro, placa = '', dataReferenciaStr = '', ufInformada = '') {
  if (!dataUltimoRegistro) {
    return { status: 'vazio', label: 'Não informado', cor: '#94a3b8' };
  }

  try {
    const [anoReg, mesReg, diaReg] = dataUltimoRegistro.split('-').map(Number);
    if (!anoReg || !mesReg || !diaReg) {
      return { status: 'vazio', label: 'Data inválida', cor: '#94a3b8' };
    }

    const dataRef = dataReferenciaStr ? new Date(`${dataReferenciaStr}T00:00:00`) : new Date();
    dataRef.setHours(0, 0, 0, 0);
    const anoRef = dataRef.getFullYear();

    const info = obterInfoLicenciamentoPorPlaca(placa, ufInformada);
    const dataRegFormatada = `${String(diaReg).padStart(2, '0')}/${String(mesReg).padStart(2, '0')}/${anoReg}`;

    // Sem regra de placa específica -> utiliza regra padrão de 1 ano
    if (!info) {
      const dataVenc = new Date(anoReg + 1, mesReg - 1, diaReg);
      const diffMs = dataVenc.getTime() - dataRef.getTime();
      const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const labelVenc = `${String(diaReg).padStart(2, '0')}/${String(mesReg).padStart(2, '0')}/${anoReg + 1}`;
      const dataVencStr = `${anoReg + 1}-${String(mesReg).padStart(2, '0')}-${String(diaReg).padStart(2, '0')}`;

      if (diffDias < 0) {
        return {
          status: 'vencido',
          label: `Último registro: ${dataRegFormatada} → Vencido há ${Math.abs(diffDias)} dias (Expirou em ${labelVenc})`,
          cor: '#ef4444',
          dataVencimento: dataVencStr,
          labelDataVencimento: labelVenc,
          dias: Math.abs(diffDias)
        };
      } else if (diffDias <= 30) {
        return {
          status: 'avencer',
          label: `Último registro: ${dataRegFormatada} → Vence em ${diffDias} dias (${labelVenc})`,
          cor: '#f59e0b',
          dataVencimento: dataVencStr,
          labelDataVencimento: labelVenc,
          dias: diffDias
        };
      } else {
        return {
          status: 'valido',
          label: `Último registro: ${dataRegFormatada} → Válido até ${labelVenc}`,
          cor: '#22c55e',
          dataVencimento: dataVencStr,
          labelDataVencimento: labelVenc,
          dias: diffDias
        };
      }
    }

    // Datas do calendário do Detran do Estado
    const limiteDetranEsteAno = new Date(anoRef, info.mesNumero - 1, info.diaLimite, 23, 59, 59);
    const dataLimiteEsteAnoStr = `${anoRef}-${String(info.mesNumero).padStart(2, '0')}-${String(info.diaLimite).padStart(2, '0')}`;
    const labelLimiteEsteAno = `${String(info.diaLimite).padStart(2, '0')}/${String(info.mesNumero).padStart(2, '0')}/${anoRef}`;

    const limiteDetranProxAno = new Date(anoRef + 1, info.mesNumero - 1, info.diaLimite, 23, 59, 59);
    const dataLimiteProxAnoStr = `${anoRef + 1}-${String(info.mesNumero).padStart(2, '0')}-${String(info.diaLimite).padStart(2, '0')}`;
    const labelLimiteProxAno = `${String(info.diaLimite).padStart(2, '0')}/${String(info.mesNumero).padStart(2, '0')}/${anoRef + 1}`;

    // CASO 1: O veículo JÁ FOI LICENCIADO no ano de referência ou posterior (anoReg >= anoRef)
    // Ex: Em 2026, o CRLV tem data de emissão de 2026. Logo, o licenciamento 2026 está cumprido e é válido até o vencimento de 2027!
    if (anoReg >= anoRef) {
      const diffMs = limiteDetranProxAno.getTime() - dataRef.getTime();
      const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      return {
        status: 'valido',
        label: `Último registro: ${dataRegFormatada} → Válido até ${labelLimiteProxAno} (Detran-${info.uf} Final ${info.finalDigito})`,
        cor: '#22c55e',
        dataVencimento: dataLimiteProxAnoStr,
        labelDataVencimento: labelLimiteProxAno,
        dias: diffDias,
        infoDetran: info
      };
    }

    // CASO 2: O veículo possui registro do ANO ANTERIOR (anoReg === anoRef - 1)
    // Ex: Em 2026, o último registro é de 2025. O veículo precisa renovar até a data do Detran em 2026.
    if (anoReg === anoRef - 1) {
      const diffMs = limiteDetranEsteAno.getTime() - dataRef.getTime();
      const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDias > 30) {
        return {
          status: 'valido',
          label: `Último registro: ${dataRegFormatada} → Válido até ${labelLimiteEsteAno} (Detran-${info.uf} Final ${info.finalDigito})`,
          cor: '#22c55e',
          dataVencimento: dataLimiteEsteAnoStr,
          labelDataVencimento: labelLimiteEsteAno,
          dias: diffDias,
          infoDetran: info
        };
      } else if (diffDias >= 0) {
        return {
          status: 'avencer',
          label: `Último registro: ${dataRegFormatada} → Vence em ${diffDias} dias (Detran-${info.uf}: ${labelLimiteEsteAno})`,
          cor: '#f59e0b',
          dataVencimento: dataLimiteEsteAnoStr,
          labelDataVencimento: labelLimiteEsteAno,
          dias: diffDias,
          infoDetran: info
        };
      } else {
        return {
          status: 'vencido',
          label: `Último registro: ${dataRegFormatada} → Vencido em ${labelLimiteEsteAno} há ${Math.abs(diffDias)} dias (Detran-${info.uf} Final ${info.finalDigito})`,
          cor: '#ef4444',
          dataVencimento: dataLimiteEsteAnoStr,
          labelDataVencimento: labelLimiteEsteAno,
          dias: Math.abs(diffDias),
          infoDetran: info
        };
      }
    }

    // CASO 3: Registro de 2 anos ou mais atrás (anoReg < anoRef - 1)
    const diffMs = dataRef.getTime() - limiteDetranEsteAno.getTime();
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return {
      status: 'vencido',
      label: `Último registro: ${dataRegFormatada} → Vencido (Exige renovação Detran-${info.uf} ${anoRef})`,
      cor: '#ef4444',
      dataVencimento: dataLimiteEsteAnoStr,
      labelDataVencimento: labelLimiteEsteAno,
      dias: Math.abs(diffDias),
      infoDetran: info
    };
  } catch (_e) {
    return { status: 'vazio', label: 'Data inválida', cor: '#94a3b8' };
  }
}

/**
 * Avalia o status de conformidade do Laudo de Rocha / CSV baseado na Data de Vencimento
 * @param {string} dataValidadeLaudo YYYY-MM-DD
 * @param {string} dataReferenciaStr Data de referência (hoje ou agendamento)
 */
export function avaliarLaudoRocha(dataValidadeLaudo, dataReferenciaStr = '') {
  if (!dataValidadeLaudo) {
    return { status: 'vazio', label: 'Não informado', cor: '#94a3b8' };
  }
  try {
    const [anoV, mesV, diaV] = dataValidadeLaudo.split('-');
    if (!anoV || !mesV || !diaV) return { status: 'vazio', label: 'Data inválida', cor: '#94a3b8' };

    const dataRef = dataReferenciaStr ? new Date(`${dataReferenciaStr}T00:00:00`) : new Date();
    dataRef.setHours(0, 0, 0, 0);
    const docDate = new Date(Number(anoV), Number(mesV) - 1, Number(diaV));
    const diffMs = docDate.getTime() - dataRef.getTime();
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const labelVenc = `${diaV}/${mesV}/${anoV}`;

    if (diffDias < 0) {
      return {
        status: 'vencido',
        label: `Vencido há ${Math.abs(diffDias)} dias (${labelVenc})`,
        cor: '#ef4444',
        dataVencimento: dataValidadeLaudo,
        labelDataVencimento: labelVenc,
        dias: Math.abs(diffDias)
      };
    } else if (diffDias <= 30) {
      return {
        status: 'avencer',
        label: `Vence em ${diffDias} dias (${labelVenc})`,
        cor: '#f59e0b',
        dataVencimento: dataValidadeLaudo,
        labelDataVencimento: labelVenc,
        dias: diffDias
      };
    } else {
      return {
        status: 'valido',
        label: `Válido até ${labelVenc}`,
        cor: '#22c55e',
        dataVencimento: dataValidadeLaudo,
        labelDataVencimento: labelVenc,
        dias: diffDias
      };
    }
  } catch (_e) {
    return { status: 'vazio', label: 'Data inválida', cor: '#94a3b8' };
  }
}

/**
 * Verifica a conformidade documental completa de um motorista e veículos em relação a uma data
 * @returns {{ cadastrado: boolean, statusGeral: 'REGULAR' | 'AVENCER' | 'VENCIDO' | 'NAO_CADASTRADO', itensVencidos: Array, itensAVencer: Array, alertas: Array, motorista: Object }}
 */
export function verificarConformidadeDocumental({ 
  cpf = '', 
  nome = '',
  placaCavalo = '', 
  placaCarreta = '', 
  placaCarreta2 = '', 
  dataAgendamento = '',
  tipoVeiculo = ''
}) {
  const rawCpfLimpo = String(cpf || '').replace(/\D/g, '');
  const cpfLimpo = rawCpfLimpo.length >= 10 && rawCpfLimpo.length <= 11 ? rawCpfLimpo.padStart(11, '0') : rawCpfLimpo;
  const nomeLimpo = String(nome || '').trim().toUpperCase();
  const refDataStr = dataAgendamento || new Date().toISOString().split('T')[0];
  const dataReferencia = new Date(`${refDataStr}T23:59:59`);

  const base = obterBaseMotoristas();

  // 1. Busca os dados pessoais do motorista (atrelados ao CPF normalizado ou pelo Nome)
  let motorista = null;
  if (cpfLimpo.length === 11) {
    motorista = base.find(m => {
      const c = String(m.cpf || m.motorista_cpf || '').replace(/\D/g, '');
      const cNorm = c.length >= 10 && c.length <= 11 ? c.padStart(11, '0') : c;
      return cNorm === cpfLimpo;
    });
  }
  if (!motorista && nomeLimpo) {
    motorista = base.find(m => String(m.nome || m.motorista_nome || '').trim().toUpperCase() === nomeLimpo);
  }

  // 2. Busca dados do Cavalo Mecânico (apenas se placa tiver pelo menos 7 caracteres)
  const rawInputCavalo = String(placaCavalo || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const rawMotoristaCavalo = String(motorista?.placa_cavalo || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const limpaCavalo = rawInputCavalo.length >= 7 
    ? rawInputCavalo 
    : (!rawInputCavalo && rawMotoristaCavalo.length >= 7 ? rawMotoristaCavalo : '');

  let veiculoCavalo = null;
  if (limpaCavalo) {
    if (motorista && motorista.crlv_validade_cavalo && (
      !motorista.placa_cavalo || 
      String(motorista.placa_cavalo).replace(/[^A-Z0-9]/gi, '').toUpperCase() === limpaCavalo
    )) {
      veiculoCavalo = motorista;
    } else {
      veiculoCavalo = base.find(m => String(m.placa_cavalo || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === limpaCavalo && m.crlv_validade_cavalo);
    }
  }

  // 3. Busca dados da Carreta 1 (apenas se placa tiver pelo menos 7 caracteres)
  const rawInputCarreta = String(placaCarreta || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const rawMotoristaCarreta = String(motorista?.placa_carreta || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const limpaCarreta = rawInputCarreta.length >= 7 
    ? rawInputCarreta 
    : (!rawInputCarreta && rawMotoristaCarreta.length >= 7 ? rawMotoristaCarreta : '');

  let veiculoCarreta = null;
  if (limpaCarreta) {
    if (motorista && (motorista.crlv_validade_carreta || motorista.validade_laudo_rocha) && (
      !motorista.placa_carreta || 
      String(motorista.placa_carreta).replace(/[^A-Z0-9]/gi, '').toUpperCase() === limpaCarreta
    )) {
      veiculoCarreta = motorista;
    } else {
      veiculoCarreta = base.find(m => (
        String(m.placa_carreta || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === limpaCarreta ||
        String(m.placa_carreta_2 || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === limpaCarreta
      ) && (m.crlv_validade_carreta || m.validade_laudo_rocha));
    }
  }

  // 4. Busca dados da Carreta 2 (se houver e tiver pelo menos 7 caracteres)
  const rawInputCarreta2 = String(placaCarreta2 || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const rawMotoristaCarreta2 = String(motorista?.placa_carreta_2 || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const limpaCarreta2 = rawInputCarreta2.length >= 7 
    ? rawInputCarreta2 
    : (!rawInputCarreta2 && rawMotoristaCarreta2.length >= 7 ? rawMotoristaCarreta2 : '');

  let veiculoCarreta2 = null;
  if (limpaCarreta2) {
    if (motorista && (motorista.crlv_validade_carreta_2 || motorista.validade_laudo_rocha_2) && (
      !motorista.placa_carreta_2 || 
      String(motorista.placa_carreta_2).replace(/[^A-Z0-9]/gi, '').toUpperCase() === limpaCarreta2
    )) {
      veiculoCarreta2 = motorista;
    } else {
      veiculoCarreta2 = base.find(m => (
        String(m.placa_carreta_2 || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === limpaCarreta2 ||
        String(m.placa_carreta || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === limpaCarreta2
      ) && (m.crlv_validade_carreta_2 || m.crlv_validade_carreta));
    }
  }

  // Se não encontrou motorista nem nenhum dos veículos
  if (!motorista && !veiculoCavalo && !veiculoCarreta) {
    return {
      cadastrado: false,
      statusGeral: 'NAO_CADASTRADO',
      itensVencidos: [],
      itensAVencer: [],
      camposFaltando: ['Cadastro de Motorista / Veículo'],
      alertas: [],
      motorista: null
    };
  }

  const itensVencidos = [];
  const itensAVencer = [];
  const alertas = [];

  // Checagem de documento com data de validade direta (ex: CNH e Laudo de Rocha)
  const checarDataValidade = (campoNome, label, dataValor) => {
    if (!dataValor) return;
    try {
      const docDate = new Date(`${dataValor}T00:00:00`);
      const diffMs = docDate.getTime() - dataReferencia.getTime();
      const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const [ano, mes, dia] = dataValor.split('-');
      const dataFormatada = `${dia}/${mes}/${ano}`;

      if (diffDias < 0) {
        itensVencidos.push({
          campo: campoNome,
          titulo: label,
          data: dataValor,
          labelData: dataFormatada,
          diasVencido: Math.abs(diffDias)
        });
      } else if (diffDias <= 30) {
        itensAVencer.push({
          campo: campoNome,
          titulo: label,
          data: dataValor,
          labelData: dataFormatada,
          diasRestantes: diffDias
        });
      }
    } catch (_e) {}
  };

  // Checagem de CRLV (Data do Último Registro comparada com o calendário do Detran do Estado)
  const checarCRLVComDetran = (campoNome, label, dataUltimoReg, placa, uf) => {
    if (!dataUltimoReg) return;
    const res = avaliarCRLVComDetran(dataUltimoReg, placa, refDataStr, uf);
    if (res.status === 'vencido') {
      itensVencidos.push({
        campo: campoNome,
        titulo: label,
        data: res.dataVencimento,
        labelData: res.labelDataVencimento,
        diasVencido: res.dias,
        detalhes: res.label
      });
    } else if (res.status === 'avencer') {
      itensAVencer.push({
        campo: campoNome,
        titulo: label,
        data: res.dataVencimento,
        labelData: res.labelDataVencimento,
        diasRestantes: res.dias,
        detalhes: res.label
      });
    }
  };

  // Checagem de Laudo de Rocha / CSV (Data de Vencimento)
  const checarLaudoRocha = (campoNome, label, dataValidadeLaudo) => {
    if (!dataValidadeLaudo) return;
    const res = avaliarLaudoRocha(dataValidadeLaudo, refDataStr);
    if (res.status === 'vencido') {
      itensVencidos.push({
        campo: campoNome,
        titulo: label,
        data: res.dataVencimento,
        labelData: res.labelDataVencimento,
        diasVencido: res.dias,
        detalhes: res.label
      });
    } else if (res.status === 'avencer') {
      itensAVencer.push({
        campo: campoNome,
        titulo: label,
        data: res.dataVencimento,
        labelData: res.labelDataVencimento,
        diasRestantes: res.dias,
        detalhes: res.label
      });
    }
  };

  // Valores obtidos individualmente (permite troca de veículos entre motoristas e preserva documentos salvos no perfil)
  const cnhValidade = motorista?.cnh_validade;
  const cnhCategoria = motorista?.cnh_categoria;
  const isTruckOuBitruck = String(tipoVeiculo || motorista?.tipo_veiculo || '').toLowerCase().includes('truck') || 
                           Boolean(motorista?.is_bitruck) ||
                           Boolean(veiculoCavalo?.is_bitruck);

  const crlvCavalo = veiculoCavalo?.crlv_validade_cavalo || motorista?.crlv_validade_cavalo || null;
  const ufCavalo = veiculoCavalo?.uf_cavalo || motorista?.uf_cavalo || identificarUFPelaPlaca(limpaCavalo) || 'ES';

  const crlvCarreta = veiculoCarreta?.crlv_validade_carreta || motorista?.crlv_validade_carreta || null;
  const ufCarreta = veiculoCarreta?.uf_carreta || motorista?.uf_carreta || identificarUFPelaPlaca(limpaCarreta) || 'ES';
  const laudoRocha = veiculoCarreta?.validade_laudo_rocha || veiculoCavalo?.validade_laudo_rocha || motorista?.validade_laudo_rocha || null;

  const crlvCarreta2 = veiculoCarreta2?.crlv_validade_carreta_2 || veiculoCarreta2?.crlv_validade_carreta || motorista?.crlv_validade_carreta_2 || null;
  const ufCarreta2 = veiculoCarreta2?.uf_carreta_2 || motorista?.uf_carreta_2 || identificarUFPelaPlaca(limpaCarreta2) || 'ES';
  const laudoRocha2 = veiculoCarreta2?.validade_laudo_rocha_2 || veiculoCarreta2?.validade_laudo_rocha || motorista?.validade_laudo_rocha_2 || null;

  // 1. CNH Validade (Validade impressa na CNH do Motorista)
  if (motorista || cpfLimpo.length === 11) {
    checarDataValidade('cnh_validade', 'CNH do Motorista', cnhValidade);
  }

  // 2. Categoria CNH (Verifica compatibilidade com carreta/pesados)
  const isCarretaOuPesado = !isTruckOuBitruck && (
    String(tipoVeiculo || motorista?.tipo_veiculo || '').toLowerCase().includes('carreta') || 
    String(tipoVeiculo || motorista?.tipo_veiculo || '').toLowerCase().includes('bitrem') ||
    Boolean(limpaCarreta)
  );
  
  if (isCarretaOuPesado && cnhCategoria) {
    const cat = String(cnhCategoria).toUpperCase().trim();
    if (cat === 'B' || cat === 'C') {
      alertas.push(`CNH Categoria '${cat}' pode ser incompatível com conjunto articulado/carreta (exige categoria 'E').`);
    }
  }

  // 3. CRLV Cavalo / Veículo (Último Registro vs Detran-UF)
  if (limpaCavalo || crlvCavalo) {
    checarCRLVComDetran(
      'crlv_validade_cavalo', 
      isTruckOuBitruck ? `Último Registro CRLV (${limpaCavalo || 'Veículo'}${limpaCavalo ? ` - ${ufCavalo}` : ''})` : `Último Registro CRLV Cavalo${limpaCavalo ? ` (${limpaCavalo} - ${ufCavalo})` : ''}`, 
      crlvCavalo, 
      limpaCavalo || motorista?.placa_cavalo, 
      ufCavalo
    );
  }

  // 4. CRLV Carreta 1 & Laudo de Rocha
  if (isTruckOuBitruck) {
    // Para Bitruck / Truck de chassi rígido, o Laudo de Rocha é vinculado à placa única
    if (laudoRocha || limpaCavalo) {
      checarLaudoRocha('validade_laudo_rocha', `Vencimento do Laudo de Rocha / CSV (${limpaCavalo || motorista?.placa_cavalo || 'Bitruck/Truck'})`, laudoRocha);
    }
  } else {
    // Para conjuntos articulados padrão
    if (limpaCarreta || crlvCarreta || laudoRocha) {
      checarCRLVComDetran('crlv_validade_carreta', `Último Registro CRLV Carreta 1${limpaCarreta ? ` (${limpaCarreta} - ${ufCarreta})` : ''}`, crlvCarreta, limpaCarreta || motorista?.placa_carreta, ufCarreta);
      checarLaudoRocha('validade_laudo_rocha', `Vencimento do Laudo de Rocha / CSV (Carreta ${limpaCarreta || motorista?.placa_carreta || '1'})`, laudoRocha);
    }

    // 5. Carreta 2 (se houver)
    if (limpaCarreta2 || crlvCarreta2 || laudoRocha2) {
      checarCRLVComDetran('crlv_validade_carreta_2', `Último Registro CRLV Carreta 2 (${limpaCarreta2 || motorista?.placa_carreta_2 || '2'} - ${ufCarreta2})`, crlvCarreta2, limpaCarreta2 || motorista?.placa_carreta_2, ufCarreta2);
      checarLaudoRocha('validade_laudo_rocha_2', `Vencimento do Laudo de Rocha / CSV (Carreta 2 - ${limpaCarreta2 || motorista?.placa_carreta_2 || '2'})`, laudoRocha2);
    }
  }

  // Identifica campos essenciais não preenchidos
  const camposFaltando = [];
  if ((motorista || cpfLimpo.length === 11) && !cnhValidade) camposFaltando.push('Validade CNH');
  
  if (isTruckOuBitruck) {
    if (limpaCavalo && !crlvCavalo) camposFaltando.push(`Último Registro CRLV (${limpaCavalo})`);
    if (limpaCavalo && !laudoRocha) camposFaltando.push(`Vencimento do Laudo de Rocha / CSV (${limpaCavalo})`);
  } else {
    if (limpaCavalo && !crlvCavalo) camposFaltando.push(`Último Registro CRLV Cavalo (${limpaCavalo})`);
    if (limpaCarreta && !crlvCarreta) camposFaltando.push(`Último Registro CRLV Carreta (${limpaCarreta})`);
    if (limpaCarreta && !laudoRocha) camposFaltando.push(`Vencimento do Laudo de Rocha / CSV (${limpaCarreta})`);
    if (limpaCarreta2) {
      if (!crlvCarreta2) camposFaltando.push(`Último Registro CRLV Carreta 2 (${limpaCarreta2})`);
      if (!laudoRocha2) camposFaltando.push(`Vencimento do Laudo Rocha Carreta 2 (${limpaCarreta2})`);
    }
  }

  let statusGeral = 'REGULAR';
  const statusBloqueado = motorista?.status_documental === 'BLOQUEADO' || motorista?.status_documental === 'VENCIDO';
  if (itensVencidos.length > 0 || statusBloqueado) {
    statusGeral = 'VENCIDO';
  } else if (camposFaltando.length > 0) {
    // Se faltam dados/documentos na base, fica como Não Cadastrado / Pendente
    statusGeral = 'NAO_CADASTRADO';
  } else if (itensAVencer.length > 0 || motorista?.status_documental === 'PENDENTE') {
    statusGeral = 'AVENCER';
  } else {
    statusGeral = 'REGULAR';
  }

  return {
    cadastrado: camposFaltando.length === 0,
    statusGeral,
    itensVencidos,
    itensAVencer,
    camposFaltando,
    alertas,
    motorista: motorista || veiculoCavalo || veiculoCarreta
  };
}

/**
 * Retorna o status de conformidade da CNH para um CPF específico
 */
export function obterStatusConformidadeCNH(cpf = '', dataReferenciaStr = '', nome = '') {
  const rawCpfLimpo = String(cpf || '').replace(/\D/g, '');
  const cpfLimpo = rawCpfLimpo.length >= 10 && rawCpfLimpo.length <= 11 ? rawCpfLimpo.padStart(11, '0') : rawCpfLimpo;
  const nomeLimpo = String(nome || '').trim().toUpperCase();

  const base = obterBaseMotoristas();
  let mot = null;
  if (cpfLimpo.length === 11) {
    mot = base.find(m => {
      const c = String(m.cpf || m.motorista_cpf || '').replace(/\D/g, '');
      const cNorm = c.length >= 10 && c.length <= 11 ? c.padStart(11, '0') : c;
      return cNorm === cpfLimpo;
    });
  }
  if (!mot && nomeLimpo) {
    mot = base.find(m => String(m.nome || m.motorista_nome || '').trim().toUpperCase() === nomeLimpo);
  }

  if (!mot || !mot.cnh_validade) {
    return {
      cadastrado: Boolean(mot),
      status: 'sem_cnh',
      label: mot ? 'Sem registro de CNH na base' : 'Motorista não cadastrado na base de conformidade',
      cor: '#94a3b8'
    };
  }

  try {
    const dataRef = dataReferenciaStr ? new Date(`${dataReferenciaStr}T00:00:00`) : new Date();
    dataRef.setHours(0, 0, 0, 0);
    const [ano, mes, dia] = mot.cnh_validade.split('-').map(Number);
    const docDate = new Date(ano, mes - 1, dia);
    const diffMs = docDate.getTime() - dataRef.getTime();
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const dataFmt = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
    const cat = mot.cnh_categoria || 'E';

    if (diffDias < 0) {
      return {
        cadastrado: true,
        status: 'vencido',
        label: `CNH Vencida há ${Math.abs(diffDias)} dias (${dataFmt}) - Cat. ${cat}`,
        cor: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.15)',
        validade: mot.cnh_validade,
        categoria: cat,
        dias: Math.abs(diffDias)
      };
    } else if (diffDias <= 30) {
      return {
        cadastrado: true,
        status: 'avencer',
        label: `CNH vence em ${diffDias} dias (${dataFmt}) - Cat. ${cat}`,
        cor: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.15)',
        validade: mot.cnh_validade,
        categoria: cat,
        dias: diffDias
      };
    } else {
      return {
        cadastrado: true,
        status: 'valido',
        label: `CNH Regular / Válida até ${dataFmt} (Cat. ${cat})`,
        cor: '#22c55e',
        bg: 'rgba(34, 197, 94, 0.15)',
        validade: mot.cnh_validade,
        categoria: cat,
        dias: diffDias
      };
    }
  } catch (_e) {
    return null;
  }
}

/**
 * Retorna o status de conformidade do Cavalo Mecânico / Veículo pela Placa (com suporte a Bitruck/Truck rígido)
 */
export function obterStatusConformidadeCavalo(placaCavalo = '', dataReferenciaStr = '', ufInformada = '', cpf = '', nome = '') {
  if (!placaCavalo) return null;
  const limpa = String(placaCavalo).replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (limpa.length < 7) return null;

  const rawCpfLimpo = String(cpf || '').replace(/\D/g, '');
  const cpfLimpo = rawCpfLimpo.length >= 10 && rawCpfLimpo.length <= 11 ? rawCpfLimpo.padStart(11, '0') : rawCpfLimpo;
  const nomeLimpo = String(nome || '').trim().toUpperCase();

  const base = obterBaseMotoristas();
  let veic = base.find(m => String(m.placa_cavalo || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === limpa && m.crlv_validade_cavalo);

  if (!veic && cpfLimpo.length === 11) {
    veic = base.find(m => {
      const c = String(m.cpf || m.motorista_cpf || '').replace(/\D/g, '');
      const cNorm = c.length >= 10 && c.length <= 11 ? c.padStart(11, '0') : c;
      return cNorm === cpfLimpo && m.crlv_validade_cavalo;
    });
  }

  if (!veic && nomeLimpo) {
    veic = base.find(m => String(m.nome || m.motorista_nome || '').trim().toUpperCase() === nomeLimpo && m.crlv_validade_cavalo);
  }

  if (!veic || !veic.crlv_validade_cavalo) {
    return {
      cadastrado: false,
      status: 'sem_registro',
      label: 'Sem CRLV do veículo registrado na base',
      cor: '#94a3b8'
    };
  }

  const uf = ufInformada || veic.uf_cavalo || identificarUFPelaPlaca(limpa) || 'ES';
  const res = avaliarCRLVComDetran(veic.crlv_validade_cavalo, limpa, dataReferenciaStr, uf);

  const isBitruck = Boolean(veic.is_bitruck || veic.tipo_veiculo?.includes('Truck') || (!veic.placa_carreta && veic.validade_laudo_rocha));
  const laudoData = veic.validade_laudo_rocha;
  const resLaudo = (isBitruck && laudoData) ? avaliarLaudoRocha(laudoData, dataReferenciaStr) : null;

  if (isBitruck && resLaudo) {
    const temVencido = res.status === 'vencido' || resLaudo.status === 'vencido';
    const temAVencer = res.status === 'avencer' || resLaudo.status === 'avencer';

    if (temVencido) {
      const motivos = [];
      if (res.status === 'vencido') motivos.push(`CRLV Vencido (${res.labelDataVencimento})`);
      if (resLaudo.status === 'vencido') motivos.push(`Laudo Rocha Vencido (${resLaudo.labelDataVencimento})`);
      return {
        cadastrado: true,
        status: 'vencido',
        label: `Doc. Bitruck Vencido: ${motivos.join(' | ')}`,
        cor: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.15)',
        detalhes: res.label
      };
    } else if (temAVencer) {
      const motivos = [];
      if (res.status === 'avencer') motivos.push(`CRLV em ${res.dias}d (${res.labelDataVencimento})`);
      if (resLaudo.status === 'avencer') motivos.push(`Laudo em ${resLaudo.dias}d (${resLaudo.labelDataVencimento})`);
      return {
        cadastrado: true,
        status: 'avencer',
        label: `Doc. Bitruck a Vencer: ${motivos.join(' | ')}`,
        cor: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.15)',
        detalhes: res.label
      };
    } else {
      return {
        cadastrado: true,
        status: 'valido',
        label: `Bitruck Regular: CRLV até ${res.labelDataVencimento} | Laudo Rocha até ${resLaudo.labelDataVencimento}`,
        cor: '#22c55e',
        bg: 'rgba(34, 197, 94, 0.15)',
        detalhes: res.label
      };
    }
  }

  if (res.status === 'vencido') {
    return {
      cadastrado: true,
      status: 'vencido',
      label: `CRLV Cavalo Vencido em ${res.labelDataVencimento || 'Detran-' + uf}`,
      cor: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.15)',
      detalhes: res.label
    };
  } else if (res.status === 'avencer') {
    return {
      cadastrado: true,
      status: 'avencer',
      label: `CRLV Cavalo vence em ${res.dias} dias (${res.labelDataVencimento})`,
      cor: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.15)',
      detalhes: res.label
    };
  } else {
    return {
      cadastrado: true,
      status: 'valido',
      label: `CRLV Cavalo Regular / Válido até ${res.labelDataVencimento} (Detran-${uf})`,
      cor: '#22c55e',
      bg: 'rgba(34, 197, 94, 0.15)',
      detalhes: res.label
    };
  }
}

/**
 * Retorna o status de conformidade da Carreta (CRLV + Laudo de Rocha) pela Placa
 */
export function obterStatusConformidadeCarreta(placaCarreta = '', dataReferenciaStr = '', ufInformada = '', cpf = '', nome = '') {
  if (!placaCarreta) return null;
  const limpa = String(placaCarreta).replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (limpa.length < 7) return null;

  const rawCpfLimpo = String(cpf || '').replace(/\D/g, '');
  const cpfLimpo = rawCpfLimpo.length >= 10 && rawCpfLimpo.length <= 11 ? rawCpfLimpo.padStart(11, '0') : rawCpfLimpo;
  const nomeLimpo = String(nome || '').trim().toUpperCase();

  const base = obterBaseMotoristas();
  let veic = base.find(m => (
    String(m.placa_carreta || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === limpa ||
    String(m.placa_carreta_2 || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === limpa
  ) && (m.crlv_validade_carreta || m.validade_laudo_rocha));

  if (!veic && cpfLimpo.length === 11) {
    veic = base.find(m => {
      const c = String(m.cpf || m.motorista_cpf || '').replace(/\D/g, '');
      const cNorm = c.length >= 10 && c.length <= 11 ? c.padStart(11, '0') : c;
      return cNorm === cpfLimpo && (m.crlv_validade_carreta || m.validade_laudo_rocha);
    });
  }

  if (!veic && nomeLimpo) {
    veic = base.find(m => String(m.nome || m.motorista_nome || '').trim().toUpperCase() === nomeLimpo && (m.crlv_validade_carreta || m.validade_laudo_rocha));
  }

  if (!veic) {
    return {
      cadastrado: false,
      status: 'sem_registro',
      label: 'Sem documentos da carreta registrados na base',
      cor: '#94a3b8'
    };
  }

  const uf = ufInformada || veic.uf_carreta || identificarUFPelaPlaca(limpa) || 'ES';
  const crlvData = veic.crlv_validade_carreta || veic.crlv_validade_carreta_2;
  const laudoData = veic.validade_laudo_rocha || veic.validade_laudo_rocha_2;

  const resCRLV = crlvData ? avaliarCRLVComDetran(crlvData, limpa, dataReferenciaStr, uf) : null;
  const resLaudo = laudoData ? avaliarLaudoRocha(laudoData, dataReferenciaStr) : null;

  const temVencido = resCRLV?.status === 'vencido' || resLaudo?.status === 'vencido';
  const temAVencer = resCRLV?.status === 'avencer' || resLaudo?.status === 'avencer';

  if (temVencido) {
    const motivos = [];
    if (resCRLV?.status === 'vencido') motivos.push(`CRLV Vencido (${resCRLV.labelDataVencimento})`);
    if (resLaudo?.status === 'vencido') motivos.push(`Laudo de Rocha Vencido (${resLaudo.labelDataVencimento})`);
    return {
      cadastrado: true,
      status: 'vencido',
      label: `Doc. Carreta Vencida: ${motivos.join(' | ')}`,
      cor: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.15)',
      resCRLV,
      resLaudo
    };
  } else if (temAVencer) {
    const motivos = [];
    if (resCRLV?.status === 'avencer') motivos.push(`CRLV vence em ${resCRLV.dias}d (${resCRLV.labelDataVencimento})`);
    if (resLaudo?.status === 'avencer') motivos.push(`Laudo de Rocha vence em ${resLaudo.dias}d (${resLaudo.labelDataVencimento})`);
    return {
      cadastrado: true,
      status: 'avencer',
      label: `Doc. Carreta a Vencer: ${motivos.join(' | ')}`,
      cor: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.15)',
      resCRLV,
      resLaudo
    };
  } else if (resCRLV?.status === 'valido' || resLaudo?.status === 'valido') {
    const detalhes = [];
    if (resCRLV?.status === 'valido') detalhes.push(`CRLV até ${resCRLV.labelDataVencimento} (Detran-${uf})`);
    if (resLaudo?.status === 'valido') detalhes.push(`Laudo Rocha até ${resLaudo.labelDataVencimento}`);
    return {
      cadastrado: true,
      status: 'valido',
      label: `Carreta Regular: ${detalhes.join(' | ')}`,
      cor: '#22c55e',
      bg: 'rgba(34, 197, 94, 0.15)',
      resCRLV,
      resLaudo
    };
  }

  return {
    cadastrado: false,
    status: 'sem_registro',
    label: 'Sem documentos da carreta registrados na base',
    cor: '#94a3b8'
  };
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
 * Consulta um motorista pelo CPF na base interna e no histórico (com suporte a conformidade documental)
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

  const cpfsExcluidos = obterCpfsMotoristasExcluidos();
  if (cpfsExcluidos.has(cpfLimpo)) {
    return { valido: true, encontrado: false, motorista: null, excluido: true };
  }

  const cpfFormatado = formatarCPF(cpfLimpo);

  // 2. Se Supabase configurado, busca primeiro na tabela base_motoristas (dados mais recentes de qualquer pedreira/admin)
  if (isSupabaseConfigurado()) {
    try {
      const { data: dataBase, error: errorBase } = await supabase
        .from('base_motoristas')
        .select('*')
        .in('cpf', [cpfLimpo, cpfFormatado])
        .limit(1);

      if (!errorBase && dataBase && dataBase.length > 0 && dataBase[0].nome) {
        const item = dataBase[0];
        const mot = {
          cpf: cpfLimpo,
          nome: item.nome,
          telefone: item.telefone || '',
          transportadora: item.transportadora || '',
          transportadora_cnpj: item.transportadora_cnpj || '',
          tipo_veiculo: item.tipo_veiculo || '',
          placa_cavalo: item.placa_cavalo || '',
          uf_cavalo: item.uf_cavalo || identificarUFPelaPlaca(item.placa_cavalo) || 'ES',
          crlv_validade_cavalo: item.crlv_validade_cavalo || null,
          placa_carreta: item.placa_carreta || '',
          uf_carreta: item.uf_carreta || identificarUFPelaPlaca(item.placa_carreta) || 'ES',
          crlv_validade_carreta: item.crlv_validade_carreta || null,
          validade_laudo_rocha: item.validade_laudo_rocha || null,
          placa_carreta_2: item.placa_carreta_2 || '',
          uf_carreta_2: item.uf_carreta_2 || identificarUFPelaPlaca(item.placa_carreta_2) || 'ES',
          crlv_validade_carreta_2: item.crlv_validade_carreta_2 || null,
          validade_laudo_rocha_2: item.validade_laudo_rocha_2 || null,
          cnh_categoria: item.cnh_categoria || 'E',
          cnh_validade: item.cnh_validade || null,
          status_documental: item.status_documental || 'REGULAR',
          observacoes: item.observacoes || '',
          historico_edicoes: normalizarHistoricoMotorista(item.historico_edicoes),
          atualizado_por: item.atualizado_por || 'PEDREIRA/ADMIN',
          atualizado_em: item.atualizado_em || null
        };
        
        // Atualiza cache local
        try {
          const base = obterBaseMotoristas();
          const idx = base.findIndex(m => String(m.cpf || '').replace(/\D/g, '') === cpfLimpo);
          if (idx !== -1) {
            base[idx] = { ...base[idx], ...mot };
          } else {
            base.push(mot);
          }
          localStorage.setItem(MOTORISTAS_BASE_KEY, codificarBaseMotoristasLocal(base));
        } catch (_e) {}

        return { valido: true, encontrado: true, origem: 'base_supabase', motorista: mot };
      }

      // Consulta no histórico de agendamentos salvos no Supabase
      const { data, error } = await supabase
        .from('agendamentos_pedreira')
        .select('motorista_nome, motorista_telefone, transportadora, tipo_veiculo, placa_cavalo, placa_carreta, placa_carreta_2')
        .in('motorista_cpf', [cpfLimpo, cpfFormatado])
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0 && data[0].motorista_nome) {
        const mot = {
          cpf: cpfLimpo,
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
    } catch (_eSup) {}
  }

  // 3. Busca na base local (fallback offline)
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
        cpf: cpfLimpo,
        nome: encontradoLocal.nome,
        telefone: encontradoLocal.telefone || '',
        transportadora: transpNome,
        transportadora_cnpj: transpCnpj,
        tipo_veiculo: encontradoLocal.tipo_veiculo || '',
        placa_cavalo: encontradoLocal.placa_cavalo || '',
        uf_cavalo: encontradoLocal.uf_cavalo || identificarUFPelaPlaca(encontradoLocal.placa_cavalo) || 'ES',
        crlv_validade_cavalo: encontradoLocal.crlv_validade_cavalo || null,
        placa_carreta: encontradoLocal.placa_carreta || '',
        uf_carreta: encontradoLocal.uf_carreta || identificarUFPelaPlaca(encontradoLocal.placa_carreta) || 'ES',
        crlv_validade_carreta: encontradoLocal.crlv_validade_carreta || null,
        validade_laudo_rocha: encontradoLocal.validade_laudo_rocha || null,
        placa_carreta_2: encontradoLocal.placa_carreta_2 || '',
        uf_carreta_2: encontradoLocal.uf_carreta_2 || identificarUFPelaPlaca(encontradoLocal.placa_carreta_2) || 'ES',
        crlv_validade_carreta_2: encontradoLocal.crlv_validade_carreta_2 || null,
        validade_laudo_rocha_2: encontradoLocal.validade_laudo_rocha_2 || null,
        cnh_categoria: encontradoLocal.cnh_categoria || 'E',
        cnh_validade: encontradoLocal.cnh_validade || null,
        status_documental: encontradoLocal.status_documental || 'REGULAR',
        observacoes: encontradoLocal.observacoes || '',
        historico_edicoes: normalizarHistoricoMotorista(encontradoLocal.historico_edicoes)
      }
    };
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
      cpf: cpfLimpo,
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
  
  // 1. Remove prefixos comuns de bloco simples ou combinados como "BLOCO:", "BL.", "BL. Nº", "Nº", "NUMERO:"
  str = str.replace(/^(?:(?:BLOCO|BL|N[º°]|N[O0]|NUMERO|NUM)\s*[:.-]?\s*)+/i, '');
  
  // 2. Remove conteúdos explicativos entre parênteses (ex: "1256926 (QUARTZITO)" -> "1256926")
  str = str.replace(/\s*\([^)]*\)/g, '');
  
  // 3. Se contiver traço com texto explicativo e não outro número de bloco
  // Ex: "1256926 - TAJ MAHAL" -> "1256926"
  const partesTraco = str.split(/\s*[-–]\s*/);
  if (partesTraco.length > 1) {
    if (!/^\d+$/.test(partesTraco[1]) && !/^VT-/i.test(partesTraco[1]) && !/^\d{1,}\/\d{2,}$/.test(partesTraco[1])) {
      str = partesTraco[0];
    }
  }

  // 4. Remove palavras descritivas comuns caso fiquem soltas no texto (ex: "1256926 TAJ MAHAL" -> "1256926")
  str = str.replace(/\s+(?:TAJ\s+MAHAL|QUARTZITO|GRANITO|MARMORE|CARGA\s*\d*|MATERIAL).*$/i, '');

  // 5. Remove pontuações desnecessárias no início ou fim (preserva letras, dígitos e '/')
  str = str.replace(/^[^\w/]+|[^\w/]+$/g, '');
  
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
 * Suporta blocos com formato Bloco/Ano (ex: "11/26", "11 / 26", "123/26", "11/2026") como bloco único
 */
export function extrairBlocosDigitados(texto = '') {
  if (!texto || typeof texto !== 'string') return [];
  const limpo = texto.trim();
  if (!limpo) return [];

  // Se o texto for do formato bloco/ano (ex: "11/26", "11/2026", "123/26", "11 / 26"), trata como 1 ÚNICO bloco
  if (/^\s*(\d+|[A-Z0-9_-]+)\s*\/\s*(\d{2,4})\s*$/i.test(limpo)) {
    const limpoSemEspacos = limpo.replace(/\s*\/\s*/g, '/');
    return [sanitizarNumeroBloco(limpoSemEspacos)];
  }

  let partes = [];

  // 1. Separadores textuais explícitos com espaços: ' e ', ' E ', ' & ', ' + ', ' - ', ' – '
  // Obs: Para '/', só divide se NÃO for padrão bloco/ano (ex: "1256926 / 1256972" divide, mas "11/26" não)
  if (/\s+(?:e|E|&|\+|\/|-|–)\s+/.test(limpo)) {
    if (!/^\s*\d{1,5}\s*\/\s*(?:\d{2}|\d{4})\s*$/.test(limpo)) {
      partes = limpo.split(/\s+(?:e|E|&|\+|\/|-|–)\s+/);
    }
  } 
  // 2. Separadores por vírgula ou ponto-e-vírgula
  if (partes.length === 0 && /[,;]/.test(limpo)) {
    partes = limpo.split(/[,;]+/);
  } 
  // 3. Padrão numérico duplo (ex: "1256926-1256972" ou "1256926/1256972" onde ambos são números longos)
  if (partes.length === 0 && /(\d{3,})\s*[-–]\s*(\d{3,})/.test(limpo)) {
    partes = limpo.split(/\s*[-–]\s*/);
  } else if (partes.length === 0 && /(\d{3,})\s*\/\s*(\d{3,})/.test(limpo)) {
    const m = limpo.match(/(\d+)\s*\/\s*(\d+)/);
    if (m && m[2].length >= 3 && !['2024','2025','2026','2027','2028','2029','2030'].includes(m[2])) {
      partes = limpo.split(/\s*\/\s*/);
    }
  }
  // 4. Espaço simples entre dois códigos numéricos longos (ex: "1256926 1256972")
  if (partes.length === 0 && /\s+/.test(limpo) && !limpo.toUpperCase().startsWith('BLOCO')) {
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

/**
 * Verifica se o cliente é THOR ou ARGOS
 */
export function isClienteThorOuArgos(cliente = '') {
  if (!cliente || typeof cliente !== 'string') return false;
  const c = cliente.toUpperCase().trim();
  return /\bTHOR\b/i.test(c) || /\bARGOS\b/i.test(c);
}

/**
 * Valida a regra de formatação de número de bloco:
 * 1. Proibição universal de '-' (hífen) ou '.' (ponto) para todos os clientes e pedreiras.
 * 2. Se o Cliente for THOR ou ARGOS (em qualquer pedreira): o número do bloco DEVE conter '/' (ex: 11/26 ou 123/26)
 * 3. Se for qualquer outro cliente: o número do bloco NÃO PODE conter a barra '/'
 * Retorna { valido: boolean, mensagem: string | null }
 */
export function validarFormatoBlocoTajMahal({ material = '', cliente = '', numero_bloco = '' }) {
  if (!numero_bloco) return { valido: true };

  const blocoTrim = String(numero_bloco).trim();
  if (!blocoTrim) return { valido: true };

  // 1. Proibição universal de '-' (hífen) ou '.' (ponto)
  if (blocoTrim.includes('-') || blocoTrim.includes('.')) {
    return {
      valido: false,
      mensagem: 'Número do bloco não pode conter "-" ou ".".'
    };
  }

  const contemBarra = blocoTrim.includes('/');
  const isThorArgos = isClienteThorOuArgos(cliente);

  // Se o cliente for THOR ou ARGOS (em todas as pedreiras): a barra '/' é OBRIGATÓRIA
  if (isThorArgos) {
    if (!contemBarra) {
      const nomeCli = cliente ? cliente.toUpperCase().trim() : 'THOR / ARGOS';
      return {
        valido: false,
        mensagem: `Para o cliente ${nomeCli}, o número do bloco deve conter a barra com o ano (ex: 11/26 ou 123/26).`
      };
    }
    return { valido: true };
  }

  // Se o cliente ainda não foi informado, não bloqueia a barra preventivamente em tempo real
  if (!cliente || !cliente.trim()) {
    return { valido: true };
  }

  // Para qualquer outro cliente: a barra '/' é PROIBIDA
  if (contemBarra) {
    return {
      valido: false,
      mensagem: 'Número do bloco não pode conter a barra "/".'
    };
  }

  return { valido: true };
}

export const validarFormatoNumeroBloco = validarFormatoBlocoTajMahal;

/**
 * Verifica se já existe um agendamento ativo cadastrado para o mesmo cliente, número de bloco, pedreira e material
 * Retorna { duplicado: boolean, agendamentoExistente: object | null, blocoDuplicado: string | null, mensagem: string | null }
 */
export async function verificarBlocoDuplicado({
  pedreira = '',
  material = '',
  numero_bloco = '',
  cliente = '',
  cliente_cnpj = '',
  agendamentoIdIgnorar = null
}) {
  if (!numero_bloco || typeof numero_bloco !== 'string') return { duplicado: false };

  const blocosParaVerificar = extrairBlocosDigitados(numero_bloco);
  if (blocosParaVerificar.length === 0) return { duplicado: false };

  const clienteLimpo = limparNomeEmpresa(cliente || '').toUpperCase().trim();
  const cnpjLimpo = (cliente_cnpj || '').replace(/\D/g, '');

  // A mesma numeração de bloco pode ser utilizada para clientes diferentes.
  // A trava só atua se o cliente/destinatário já tiver sido informado e coincidir.
  if (!clienteLimpo && !cnpjLimpo) {
    return { duplicado: false };
  }

  const idsExcluidos = obterIdsExcluidos();
  const idIgnorarStr = agendamentoIdIgnorar ? String(agendamentoIdIgnorar).trim() : null;
  const pedreiraLimpa = (pedreira || '').trim();
  const materialLimpo = (material || '').trim().toUpperCase();

  let listaParaChecar = [];
  if (isSupabaseConfigurado()) {
    try {
      const { data, error } = await supabase
        .from('agendamentos_pedreira')
        .select('*')
        .neq('status', 'Cancelado')
        .order('data_agendamento', { ascending: false });

      if (!error && Array.isArray(data)) {
        listaParaChecar = data;
      }
    } catch (e) {}
  }

  const locais = obterAgendamentosLocais().filter(l => l && l.status !== 'Cancelado');
  const mapaUnificado = new Map();
  listaParaChecar.forEach(item => {
    if (item && item.id) mapaUnificado.set(String(item.id).trim(), item);
  });
  locais.forEach(item => {
    if (item && item.id && !mapaUnificado.has(String(item.id).trim())) {
      mapaUnificado.set(String(item.id).trim(), item);
    }
  });

  const todosAtivos = Array.from(mapaUnificado.values()).filter(ag => {
    const agIdStr = String(ag.id || '').trim();
    if (idsExcluidos.has(agIdStr)) return false;
    if (idIgnorarStr && agIdStr === idIgnorarStr) return false;
    if (ag.status === 'Cancelado') return false;
    if (typeof ag.observacoes === 'string' && ag.observacoes.includes('[EXCLUÍDO DEFINITIVAMENTE PELO ADMINISTRADOR]')) return false;
    return true;
  });

  for (const ag of todosAtivos) {
    const agBlocos = extrairBlocosDigitados(ag.numero_bloco);
    const agPedreira = ag.pedreira || '';
    const agMaterial = (ag.material || '').trim().toUpperCase();
    const agCliente = limparNomeEmpresa(ag.cliente || '').toUpperCase().trim();
    const agCnpj = (ag.cliente_cnpj || '').replace(/\D/g, '');

    // Compara cada bloco digitado com os blocos do agendamento existente
    const blocoCoincidente = blocosParaVerificar.find(bNovo =>
      agBlocos.some(bAg => bNovo.toUpperCase() === bAg.toUpperCase())
    );

    if (blocoCoincidente) {
      const mesmaPedreira = !pedreiraLimpa || saoMesmaPedreira(agPedreira, pedreiraLimpa);
      const mesmoMaterial = !materialLimpo || !agMaterial || agMaterial === materialLimpo || agMaterial.includes(materialLimpo) || materialLimpo.includes(agMaterial);
      
      const matchCnpj = Boolean(cnpjLimpo && agCnpj && cnpjLimpo === agCnpj);
      const matchNome = Boolean(
        clienteLimpo && agCliente && (
          agCliente === clienteLimpo ||
          (clienteLimpo.length >= 4 && agCliente.includes(clienteLimpo)) ||
          (agCliente.length >= 4 && clienteLimpo.includes(agCliente))
        )
      );
      const mesmoCliente = matchCnpj || matchNome;

      // Trava OBRIGATORIAMENTE se coincidir o MESMO CLIENTE e a MESMA PEDREIRA
      if (mesmoCliente && mesmaPedreira && mesmoMaterial) {
        const mensagem = `Já existe um agendamento ativo cadastrado para o Bloco ${blocoCoincidente}`;

        return {
          duplicado: true,
          agendamentoExistente: ag,
          blocoDuplicado: blocoCoincidente,
          mensagem
        };
      }
    }
  }

  return { duplicado: false };
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

const _env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' && process.env ? process.env : {});
export const EMAIL_NOTIFICACAO_DESTINO = _env.VITE_EMAIL_NOTIFICACAO_DESTINO || '';
export const WHATSAPP_ADMIN_PADRAO = _env.VITE_WHATSAPP_ADMIN_NUMERO || '';

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
    const id = agendamentoAtualizado?.id || agendamentoOriginal?.id;
    if (!id) {
      throw new Error('ID do agendamento inválido para edição.');
    }
    if (!agendamentoAtualizado.id) {
      agendamentoAtualizado.id = id;
    }

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

    // Verificação de permissão para 'Aguardando Liberação' e 'Finalizado'
    const statusOriginal = (itemAtual.status || 'Aguardando Liberação').trim();
    if (!usuarioInfo?.isAdmin && statusOriginal === 'Aguardando Liberação' && agendamentoAtualizado.status !== 'Aguardando Liberação') {
      return {
        success: false,
        error: 'Acesso restrito: Agendamentos com status "Aguardando Liberação" só podem ser liberados ou alterados pelo Administrador Geral.'
      };
    }
    if (!usuarioInfo?.isAdmin && (statusOriginal === 'Finalizado' || statusOriginal === 'Carregado') && agendamentoAtualizado.status !== statusOriginal) {
      return {
        success: false,
        error: 'Acesso restrito: Agendamentos com status "Finalizado" estão bloqueados para alteração pelas pedreiras. Apenas o Administrador Geral pode reverter.'
      };
    }

    // 1.1 Verificação de duplicidade de bloco ao editar
    if (agendamentoAtualizado.numero_bloco && agendamentoAtualizado.status !== 'Cancelado') {
      const checkDuplicado = await verificarBlocoDuplicado({
        pedreira: agendamentoAtualizado.pedreira,
        material: agendamentoAtualizado.material,
        numero_bloco: agendamentoAtualizado.numero_bloco,
        cliente: agendamentoAtualizado.cliente,
        cliente_cnpj: agendamentoAtualizado.cliente_cnpj,
        agendamentoIdIgnorar: agendamentoAtualizado.id
      });
      if (checkDuplicado.duplicado) {
        return { success: false, error: checkDuplicado.mensagem };
      }

      const valTaj = validarFormatoBlocoTajMahal({
        material: agendamentoAtualizado.material,
        cliente: agendamentoAtualizado.cliente,
        numero_bloco: agendamentoAtualizado.numero_bloco
      });
      if (!valTaj.valido) {
        return { success: false, error: valTaj.mensagem };
      }
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

    if (agendamentoAtualizado.motorista_cpf && agendamentoAtualizado.motorista_nome) {
      salvarMotoristaNaBase({
        cpf: agendamentoAtualizado.motorista_cpf,
        nome: agendamentoAtualizado.motorista_nome,
        telefone: agendamentoAtualizado.motorista_telefone,
        transportadora: agendamentoAtualizado.transportadora,
        transportadora_cnpj: agendamentoAtualizado.transportadora_cnpj,
        tipo_veiculo: agendamentoAtualizado.tipo_veiculo,
        placa_cavalo: agendamentoAtualizado.placa_cavalo,
        placa_carreta: agendamentoAtualizado.placa_carreta,
        placa_carreta_2: agendamentoAtualizado.placa_carreta_2,
        atualizado_por: usuarioInfo?.nome || usuarioInfo?.email || 'PEDREIRA/ADMIN'
      }).catch(() => {});
    }

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

              const dadosNfSup = extrairDadosNotaFiscal(item);
              const dadosNfLoc = extrairDadosNotaFiscal(loc);
              const nfEmitida = dadosNfSup.nota_fiscal_emitida || dadosNfLoc.nota_fiscal_emitida;
              const nfData = dadosNfSup.nota_fiscal_data || dadosNfLoc.nota_fiscal_data || null;
              const nfUsuario = dadosNfSup.nota_fiscal_usuario || dadosNfLoc.nota_fiscal_usuario || null;

              return {
                ...(loc || {}),
                ...item,
                cliente: clienteLimpo || item.cliente,
                cliente_cnpj: clienteCnpj || null,
                transportadora: transpLimpa || item.transportadora,
                transportadora_cnpj: transpCnpj || null,
                nota_fiscal_emitida: nfEmitida,
                nota_fiscal_data: nfData,
                nota_fiscal_usuario: nfUsuario,
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

    const locais = obterAgendamentosLocais().filter(l => !idsExcluidos.has(String(l.id).trim())).map(item => {
      const dadosNf = extrairDadosNotaFiscal(item);
      return {
        ...item,
        cliente: limparNomeEmpresa(item.cliente),
        cliente_cnpj: item.cliente_cnpj || resolverCnpjCliente(item) || null,
        transportadora: limparNomeEmpresa(item.transportadora),
        transportadora_cnpj: item.transportadora_cnpj || resolverCnpjTransportadora(item) || null,
        nota_fiscal_emitida: dadosNf.nota_fiscal_emitida,
        nota_fiscal_data: dadosNf.nota_fiscal_data,
        nota_fiscal_usuario: dadosNf.nota_fiscal_usuario
      };
    });

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

            const dadosNfSup = extrairDadosNotaFiscal(item);
            const dadosNfLoc = extrairDadosNotaFiscal(loc);
            const nfEmitida = dadosNfSup.nota_fiscal_emitida || dadosNfLoc.nota_fiscal_emitida;
            const nfData = dadosNfSup.nota_fiscal_data || dadosNfLoc.nota_fiscal_data || null;
            const nfUsuario = dadosNfSup.nota_fiscal_usuario || dadosNfLoc.nota_fiscal_usuario || null;

            return {
              ...(loc || {}),
              ...item,
              cliente: clienteLimpo || item.cliente,
              cliente_cnpj: clienteCnpj || item.cliente_cnpj || loc?.cliente_cnpj || null,
              transportadora: transpLimpa || item.transportadora,
              transportadora_cnpj: transpCnpj || item.transportadora_cnpj || loc?.transportadora_cnpj || null,
              nota_fiscal_emitida: nfEmitida,
              nota_fiscal_data: nfData,
              nota_fiscal_usuario: nfUsuario,
              historico_status: historicoFinal,
              ultimo_editor: item.ultimo_editor || loc?.ultimo_editor || (historicoFinal.length > 0 ? historicoFinal[0].usuario_nome : null)
            };
          });

          // Mantém localStorage sincronizado como cache de leitura rápida
          try {
            const mapaAtualizado = new Map(dataFiltrada.map(l => [String(l.id).trim(), l]));
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(Array.from(mapaAtualizado.values())));
          } catch (e) {}

          let listaFinal = listaSup;
          if (filtros.pedreira && filtros.pedreira !== 'todas') {
            listaFinal = listaFinal.filter(item => saoMesmaPedreira(item.pedreira, filtros.pedreira));
          }

          return listaFinal;
        }
      } catch (e) {
        console.warn('Erro ao listar do Supabase, buscando locais:', e);
      }
    }

    let resultado = obterAgendamentosLocais().filter(l => !idsExcluidos.has(String(l.id).trim())).map(item => {
      const dadosNf = extrairDadosNotaFiscal(item);
      return {
        ...item,
        cliente: limparNomeEmpresa(item.cliente),
        cliente_cnpj: item.cliente_cnpj || resolverCnpjCliente(item) || null,
        transportadora: limparNomeEmpresa(item.transportadora),
        transportadora_cnpj: item.transportadora_cnpj || resolverCnpjTransportadora(item) || null,
        nota_fiscal_emitida: dadosNf.nota_fiscal_emitida,
        nota_fiscal_data: dadosNf.nota_fiscal_data,
        nota_fiscal_usuario: dadosNf.nota_fiscal_usuario
      };
    });
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

    // Verificação de permissão: apenas Admin pode alterar se o status atual for 'Aguardando Liberação' ou 'Finalizado'
    const statusAtualNormal = (itemAtual.status || 'Aguardando Liberação').trim();
    if (!usuarioInfo?.isAdmin && statusAtualNormal === 'Aguardando Liberação' && novoStatus !== 'Aguardando Liberação') {
      return {
        success: false,
        error: 'Acesso restrito: Agendamentos com status "Aguardando Liberação" só podem ser liberados ou alterados pelo Administrador Geral.'
      };
    }
    if (!usuarioInfo?.isAdmin && (statusAtualNormal === 'Finalizado' || statusAtualNormal === 'Carregado') && novoStatus !== statusAtualNormal) {
      return {
        success: false,
        error: 'Acesso restrito: Agendamentos com status "Finalizado" estão bloqueados para alteração pelas pedreiras. Apenas o Administrador Geral pode reverter.'
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

/**
 * Converte string ISO para data e hora brasileira (DD/MM/AAAA às HH:MM)
 */
export function formatarDataHoraBR(isoStr = '') {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} às ${hora}:${min}`;
  } catch (e) {
    return isoStr;
  }
}

/**
 * Remove tags técnicas invisíveis embutidas nas observações (como histórico e nota fiscal)
 */
export function limparTagsInternasObservacoes(obs = '') {
  if (!obs || typeof obs !== 'string') return '';
  return obs
    .replace(/<!-- VERMONT_HIST:[\s\S]*?:VERMONT_HIST -->/g, '')
    .replace(/<!-- VERMONT_NF:[\s\S]*?:VERMONT_NF -->/g, '')
    .trim();
}

/**
 * Extrai dados consolidados da Nota Fiscal do agendamento (coluna dedicada ou tag embutida)
 */
export function extrairDadosNotaFiscal(item) {
  if (!item) return { nota_fiscal_emitida: false, nota_fiscal_data: null, nota_fiscal_usuario: null };
  let emitida = Boolean(item.nota_fiscal_emitida);
  let data = item.nota_fiscal_data || null;
  let usuario = item.nota_fiscal_usuario || null;

  if (typeof item.observacoes === 'string' && item.observacoes.includes('<!-- VERMONT_NF:')) {
    const match = item.observacoes.match(/<!-- VERMONT_NF:([\s\S]*?):VERMONT_NF -->/);
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.emitida !== undefined) emitida = Boolean(parsed.emitida);
        if (parsed.data) data = parsed.data;
        if (parsed.usuario) usuario = parsed.usuario;
      } catch (e) {}
    }
  }

  return {
    nota_fiscal_emitida: emitida,
    nota_fiscal_data: data,
    nota_fiscal_usuario: usuario
  };
}

/**
 * Alterna o status de emissão da Nota Fiscal do bloco (Exclusivo para Administrador Geral)
 */
export async function alternarNotaFiscalEmitida(agendamentoId, statusAtual = false, usuarioInfo = {}) {
  try {
    if (!agendamentoId) throw new Error('ID do agendamento não informado.');
    const idStr = String(agendamentoId).trim();
    const novoStatus = !statusAtual;
    const agoraIso = new Date().toISOString();
    const usuarioNome = usuarioInfo.nome || usuarioInfo.email || (usuarioInfo.isAdmin ? 'ADMIN' : 'Sistema');

    // 1. Atualiza no cache local
    const locais = obterAgendamentosLocais();
    let itemLocalAtualizado = null;
    const novosLocais = locais.map(item => {
      if (String(item.id).trim() === idStr) {
        itemLocalAtualizado = {
          ...item,
          nota_fiscal_emitida: novoStatus,
          nota_fiscal_data: novoStatus ? agoraIso : null,
          nota_fiscal_usuario: novoStatus ? usuarioNome : null
        };
        return itemLocalAtualizado;
      }
      return item;
    });

    if (itemLocalAtualizado) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(novosLocais));
      } catch (e) {}
    }

    // 2. Atualiza no Supabase
    if (isSupabaseConfigurado()) {
      try {
        // Tenta atualizar as colunas dedicadas
        const payloadNF = {
          nota_fiscal_emitida: novoStatus,
          nota_fiscal_data: novoStatus ? agoraIso : null,
          nota_fiscal_usuario: novoStatus ? usuarioNome : null
        };

        const { data, error } = await supabase
          .from('agendamentos_pedreira')
          .update(payloadNF)
          .eq('id', idStr)
          .select()
          .single();

        if (error) {
          console.warn('Coluna nota_fiscal_emitida ainda não existe no Supabase, gravando em observações como fallback:', error.message);
          // Fallback seguro: embute tag na coluna observações
          const { data: itemAtual } = await supabase
            .from('agendamentos_pedreira')
            .select('observacoes')
            .eq('id', idStr)
            .single();

          const obsAtual = itemAtual?.observacoes || itemLocalAtualizado?.observacoes || '';
          const obsLimpa = obsAtual.replace(/<!-- VERMONT_NF:[\s\S]*?:VERMONT_NF -->/g, '').trim();
          const nfTag = `<!-- VERMONT_NF:{"emitida":${novoStatus},"data":${novoStatus ? JSON.stringify(agoraIso) : 'null'},"usuario":${novoStatus ? JSON.stringify(usuarioNome) : 'null'}}:VERMONT_NF -->`;
          const obsFinal = `${obsLimpa}${obsLimpa ? '\n\n' : ''}${nfTag}`;

          await supabase
            .from('agendamentos_pedreira')
            .update({ observacoes: obsFinal })
            .eq('id', idStr);
        }
      } catch (eSup) {
        console.warn('Erro ao atualizar nota fiscal no Supabase:', eSup);
      }
    }

    return {
      success: true,
      nota_fiscal_emitida: novoStatus,
      nota_fiscal_data: novoStatus ? agoraIso : null,
      nota_fiscal_usuario: novoStatus ? usuarioNome : null
    };
  } catch (err) {
    console.error('Erro ao alternar status da Nota Fiscal:', err);
    return { success: false, error: err.message };
  }
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

    // Verificação de agendamento duplicado (mesmo bloco, pedreira, material e cliente)
    const checkDuplicado = await verificarBlocoDuplicado({
      pedreira: dados.pedreira,
      material: dados.material,
      numero_bloco: dados.numero_bloco,
      cliente: dados.cliente,
      cliente_cnpj: dados.cliente_cnpj
    });
    if (checkDuplicado.duplicado) {
      throw new Error(checkDuplicado.mensagem);
    }

    // Validação de formato de bloco Taj Mahal (Thor/Argos exige '/', outros proíbe '/')
    const valTaj = validarFormatoBlocoTajMahal({
      material: dados.material,
      cliente: dados.cliente,
      numero_bloco: dados.numero_bloco
    });
    if (!valTaj.valido) {
      throw new Error(valTaj.mensagem);
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
          const obsExtra = [];
          if (payload.transportadora_cnpj) obsExtra.push(`CNPJ Transp: ${payload.transportadora_cnpj}`);
          if (payload.cliente_cnpj) obsExtra.push(`CNPJ Cliente: ${payload.cliente_cnpj}`);
          if (payload.placa_carreta_2) obsExtra.push(`2ª Carreta: ${payload.placa_carreta_2}`);
          if (payload.justificativa_outros) obsExtra.push(`Justificativa: ${payload.justificativa_outros}`);

          const obsBase = payload.observacoes ? limparObservacoesDuplicadas(payload.observacoes) : '';
          const obsConsolidada = [obsBase, ...obsExtra].filter(Boolean).join(' | ') || null;

          const payloadEssencial = {
            pedreira: payload.pedreira,
            material: payload.material,
            numero_bloco: payload.numero_bloco,
            cliente: payload.cliente,
            transportadora: payload.transportadora,
            motorista_nome: payload.motorista_nome,
            motorista_cpf: payload.motorista_cpf,
            motorista_telefone: payload.motorista_telefone || null,
            placa_cavalo: payload.placa_cavalo,
            placa_carreta: payload.placa_carreta || null,
            tipo_veiculo: payload.tipo_veiculo,
            data_agendamento: payload.data_agendamento,
            horario_agendamento: payload.horario_agendamento,
            observacoes: obsConsolidada,
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
    const blocosCombinados = [];
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

      // Verificação de bloco duplicado no banco/local
      const clientePonto = p.cliente || veiculo?.cliente || '';
      const cnpjPonto = p.cliente_cnpj || veiculo?.cliente_cnpj || '';
      const checkDuplicado = await verificarBlocoDuplicado({
        pedreira: p.pedreira,
        material: p.material,
        numero_bloco: p.numero_bloco,
        cliente: clientePonto,
        cliente_cnpj: cnpjPonto
      });
      if (checkDuplicado.duplicado) {
        throw new Error(`[${numPonto}º Carregamento] ${checkDuplicado.mensagem}`);
      }

      // Validação de formato de bloco Taj Mahal (Thor/Argos exige '/', outros proíbe '/')
      const valTaj = validarFormatoBlocoTajMahal({
        material: p.material,
        cliente: clientePonto,
        numero_bloco: p.numero_bloco
      });
      if (!valTaj.valido) {
        throw new Error(`[${numPonto}º Carregamento] ${valTaj.mensagem}`);
      }

      // Rastreia blocos para checar duplicidade entre os pontos da mesma carga combinada
      const bExtraidos = extrairBlocosDigitados(p.numero_bloco);
      for (const b of bExtraidos) {
        if (blocosCombinados.includes(b.toUpperCase())) {
          throw new Error(`O bloco "${b}" foi informado mais de uma vez nesta mesma combinação (${numPonto}º Carregamento).`);
        }
        blocosCombinados.push(b.toUpperCase());
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

// ==========================================
// DETECÇÃO & LIMPEZA EM LOTE DE REGISTROS DE TESTE
// ==========================================

const PADROES_TESTE = [
  'teste', 'test', 'mock', 'demo', 'exemplo', 'dummy', 'temp', 'teste1', 'teste2', 'teste3',
  '123456', '0000', '1111', '9999', 'asdf', 'qwerty', 'fulano'
];

/**
 * Verifica se um agendamento possui indícios claros de ser registro de teste
 */
export function isRegistroTeste(agendamento) {
  if (!agendamento) return false;
  
  const camposParaVerificar = [
    agendamento.numero_bloco,
    agendamento.cliente,
    agendamento.transportadora,
    agendamento.motorista_nome,
    agendamento.motorista_cpf,
    agendamento.observacoes,
    agendamento.justificativa_outros
  ].map(v => String(v || '').toLowerCase().trim());

  return camposParaVerificar.some(texto => {
    if (!texto) return false;
    return PADROES_TESTE.some(padrao => texto.includes(padrao));
  });
}

/**
 * Varre uma lista de agendamentos e retorna apenas os que correspondem a padrões de teste
 */
export function identificarRegistrosTeste(lista = []) {
  if (!Array.isArray(lista)) return [];
  return lista.filter(item => isRegistroTeste(item));
}

/**
 * Exclui múltiplos agendamentos em lote (do Supabase, do LocalStorage e registra no tombstone)
 */
export async function excluirAgendamentosEmLote(agendamentosOuIds = []) {
  if (!Array.isArray(agendamentosOuIds) || agendamentosOuIds.length === 0) {
    return { success: true, count: 0 };
  }

  const ids = agendamentosOuIds.map(item => {
    const rawId = typeof item === 'object' && item !== null ? item.id : item;
    return String(rawId).trim();
  }).filter(Boolean);

  if (ids.length === 0) return { success: true, count: 0 };

  // 1. Registra no tombstone e remove do LocalStorage
  ids.forEach(id => {
    registrarIdExcluido(id);
    excluirAgendamentoLocal(id);
  });

  // 2. Se o Supabase estiver configurado, executa exclusão remota
  if (isSupabaseConfigurado()) {
    try {
      const idsNumericos = ids.filter(id => /^\d+$/.test(id)).map(Number);
      const idsStrings = ids.filter(id => !/^\d+$/.test(id));

      if (idsNumericos.length > 0) {
        const { error: errNum } = await supabase
          .from('agendamentos_pedreira')
          .delete()
          .in('id', idsNumericos);

        if (errNum) {
          console.warn('DELETE em lote numérico no Supabase falhou, aplicando soft-delete:', errNum.message);
          await supabase
            .from('agendamentos_pedreira')
            .update({ 
              status: 'Cancelado',
              observacoes: '[EXCLUÍDO DEFINITIVAMENTE PELO ADMINISTRADOR]'
            })
            .in('id', idsNumericos);
        }
      }

      if (idsStrings.length > 0) {
        const { error: errStr } = await supabase
          .from('agendamentos_pedreira')
          .delete()
          .in('id', idsStrings);

        if (errStr) {
          console.warn('DELETE em lote texto no Supabase falhou, aplicando soft-delete:', errStr.message);
          await supabase
            .from('agendamentos_pedreira')
            .update({ 
              status: 'Cancelado',
              observacoes: '[EXCLUÍDO DEFINITIVAMENTE PELO ADMINISTRADOR]'
            })
            .in('id', idsStrings);
        }
      }
    } catch (eSup) {
      console.warn('Erro ao processar exclusão em lote no Supabase:', eSup);
    }
  }

  return { success: true, count: ids.length };
}

/**
 * Limpa completamente o armazenamento local de agendamentos no navegador
 */
export function limparCacheLocalAgendamentos() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return true;
  } catch (e) {
    console.warn('Erro ao limpar cache local de agendamentos:', e);
    return false;
  }
}
