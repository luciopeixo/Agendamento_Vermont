import { supabase } from '../lib/supabase.js';

// Nomenclatura exata conforme solicitado
export const PEDREIRAS_CEARA = [
  {
    id: 'uruoca',
    nome: 'URUOCA - CE (TAJ MAHAL)',
    cidade: 'Uruoca - CE'
  },
  {
    id: 'massape_negresco',
    nome: 'MASSAPÊ - CE (NEGRESCO)',
    cidade: 'Massapê - CE'
  },
  {
    id: 'massape_delmare',
    nome: 'MASSAPÊ - CE (DEL MARE)',
    cidade: 'Massapê - CE'
  },
  {
    id: 'sobral_jaibaras',
    nome: 'SOBRAL - CE (JAIBARAS)',
    cidade: 'Sobral - CE'
  },
  {
    id: 'serrote',
    nome: 'SÃO GONÇALO DO AMARANTE - CE (SERROTE)',
    cidade: 'São Gonçalo do Amarante - CE'
  }
];

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

export const EMAIL_NOTIFICACAO_DESTINO = 'faturamento@vermontmineracao.com.br';

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

  if (isSabado) {
    return `Agendamento - ${pedreiraCurta} - Sábado - ${dataFormatada} - ${bloco}`;
  }
  return `Agendamento - ${pedreiraCurta} - ${dataFormatada} - ${bloco}`;
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

/**
 * Consulta horários que já foram agendados para a pedreira e data selecionadas
 */
export async function obterHorariosOcupados(dataStr, pedreira) {
  try {
    if (!dataStr || !pedreira) return [];

    const { data, error } = await supabase
      .from('agendamentos_pedreira')
      .select('horario_agendamento')
      .eq('data_agendamento', dataStr)
      .eq('pedreira', pedreira)
      .neq('status', 'Cancelado');

    if (error) throw error;

    const ocupados = (data || [])
      .map(item => item.horario_agendamento)
      .filter(h => h && h !== 'outros' && !h.startsWith('Sábado'));

    return ocupados;
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
    let query = supabase
      .from('agendamentos_pedreira')
      .select('id, pedreira, status', { count: 'exact' })
      .eq('data_agendamento', dataStr)
      .neq('status', 'Cancelado');

    if (pedreira) {
      query = query.eq('pedreira', pedreira);
    }

    const { count, error } = await query;
    if (error) throw error;

    const total = count || 0;
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
 * Lista todos os agendamentos com filtros
 */
export async function listarAgendamentos(filtros = {}) {
  try {
    let query = supabase
      .from('agendamentos_pedreira')
      .select('*')
      .order('data_agendamento', { ascending: false })
      .order('created_at', { ascending: false });

    if (filtros.pedreira && filtros.pedreira !== 'todas') {
      query = query.eq('pedreira', filtros.pedreira);
    }

    if (filtros.status && filtros.status !== 'todos') {
      query = query.eq('status', filtros.status);
    }

    if (filtros.data) {
      query = query.eq('data_agendamento', filtros.data);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Erro ao listar agendamentos:', err);
    return [];
  }
}

/**
 * Atualiza o status de um agendamento
 */
export async function atualizarStatusAgendamento(id, novoStatus) {
  try {
    const { data, error } = await supabase
      .from('agendamentos_pedreira')
      .update({ status: novoStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
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
    const { error } = await supabase
      .from('agendamentos_pedreira')
      .delete()
      .eq('id', id);

    if (error) throw error;
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
 * Dispara notificação por e-mail no formato Português-BR limpo (sem underscores)
 * e com layout corporativo inspirado em vermontmineracao.com.br
 */
export async function dispararEmailConfirmacao(agendamento) {
  const listaPlacas = formatarPlacasExibicao(agendamento);
  const textoPlacasEmail = listaPlacas.map(p => `${p.label}: ${p.placa}`).join(' | ');

  const protocolo = (agendamento.id || 'VT-' + Date.now()).substring(0, 8).toUpperCase();
  const dataFormatada = formatarDataBR(agendamento.data_agendamento);
  const assunto = gerarAssuntoEmail(agendamento);

  // 1. Envio Direto via FormSubmit com campos em Português-BR limpos e elegantes
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
      'Data e Horário de Envio': dataHoraEnvio
    };

    await fetch(`https://formsubmit.co/ajax/${EMAIL_NOTIFICACAO_DESTINO}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://vermontmineracao.com.br',
        'Referer': 'https://vermontmineracao.com.br/'
      },
      body: JSON.stringify(payloadPtBr)
    }).catch(e => console.warn('FormSubmit envio:', e));
  } catch (eFs) {
    console.warn('Alerta envio FormSubmit:', eFs);
  }

  // 2. Envio via Edge Function do Supabase (com layout HTML de alto padrão)
  try {
    await supabase.functions.invoke('notificar-agendamento', {
      body: { agendamento }
    }).catch(e => console.warn('Alerta Edge Function:', e));
  } catch (eEdge) {
    console.warn('Erro Edge Function:', eEdge);
  }

  if (agendamento.id) {
    await supabase
      .from('agendamentos_pedreira')
      .update({ email_notificado: true })
      .eq('id', agendamento.id);
  }

  return {
    success: true,
    email: EMAIL_NOTIFICACAO_DESTINO
  };
}

/**
 * Cria um novo agendamento com validações de capacidade e bloqueio de horário duplicado
 */
export async function salvarAgendamento(dados) {
  try {
    if (dados.tipo_dia === 'sabado') {
      if (!isPedreiraUruoca(dados.pedreira)) {
        throw new Error('Aos sábados, o carregamento está disponível exclusivamente para a pedreira de URUOCA - CE (TAJ MAHAL). Nas demais pedreiras, os carregamentos ocorrem de segunda a sexta-feira.');
      }

      const { lotado } = await obterOcupacaoSabado(dados.data_agendamento, dados.pedreira);
      if (lotado) {
        throw new Error(`Limite máximo de 12 veículos para o sábado (${dados.data_agendamento}) na pedreira de Uruoca já foi atingido. Escolha outra data.`);
      }
    } else if (dados.tipo_dia === 'dia_util' && dados.horario_agendamento !== 'outros') {
      const ocupados = await obterHorariosOcupados(dados.data_agendamento, dados.pedreira);
      if (ocupados.includes(dados.horario_agendamento)) {
        throw new Error(`O horário ${dados.horario_agendamento} já foi reservado por outro transportador para esta data na pedreira selecionada. Por favor, escolha outro horário.`);
      }
    }

    const configPlacas = obterConfigPlacas(dados.tipo_veiculo);

    const placaCavaloLimpa = dados.placa_cavalo ? dados.placa_cavalo.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
    const placaCarretaLimpa = configPlacas.exigeCarreta1 && dados.placa_carreta
      ? dados.placa_carreta.toUpperCase().replace(/[^A-Z0-9]/g, '')
      : null;
    const placaCarreta2Limpa = configPlacas.exigeCarreta2 && dados.placa_carreta_2
      ? dados.placa_carreta_2.toUpperCase().replace(/[^A-Z0-9]/g, '')
      : null;

    const { data, error } = await supabase
      .from('agendamentos_pedreira')
      .insert([{
        pedreira: dados.pedreira,
        material: dados.material.trim(),
        numero_bloco: dados.numero_bloco.toUpperCase().trim(),
        cliente: dados.cliente.toUpperCase().trim(),
        transportadora: dados.transportadora.toUpperCase().trim(),
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
        status: 'Confirmado',
        email_notificado: false
      }])
      .select()
      .single();

    if (error) throw error;

    await dispararEmailConfirmacao(data);

    return { success: true, agendamento: data };
  } catch (err) {
    console.error('Erro ao gravar agendamento:', err);
    return { success: false, error: err.message };
  }
}
