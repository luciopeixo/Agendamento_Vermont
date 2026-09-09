import React, { useState, useEffect } from 'react';
import { 
  Truck, Calendar, Clock, MapPin, AlertTriangle, Send, Info, Mail, FileCheck, Layers, ArrowRight
} from 'lucide-react';
import { 
  PEDREIRAS_CEARA, 
  HORARIOS_SEMANA, 
  TIPOS_VEICULO, 
  obterConfigPlacas,
  obterOcupacaoSabado, 
  obterHorariosOcupados,
  salvarAgendamento,
  salvarAgendamentoCombinado,
  isPedreiraUruoca,
  DOCUMENTOS_OBRIGATORIOS_PEDREIRA,
  AVISO_CONFIRMACAO_CLIENTE,
  EMAIL_NOTIFICACAO_DESTINO,
  obterMateriaisPorPedreira
} from '../services/agendamentoService';

export function AgendamentoForm({ onAgendamentoSucesso }) {
  const hoje = new Date().toISOString().split('T')[0];

  // Modo: 'simples' (1 Bloco) ou 'combinado' (2 Blocos em pedreiras diferentes)
  const [tipoCarregamento, setTipoCarregamento] = useState('simples');

  // Ponto 1 (ou Agendamento Simples)
  const materiaisIniciaisPonto1 = obterMateriaisPorPedreira(PEDREIRAS_CEARA[0].nome);
  const [formData, setFormData] = useState({
    pedreira: PEDREIRAS_CEARA[0].nome,
    material: materiaisIniciaisPonto1[0] || '',
    numero_bloco: '',
    cliente: '',
    transportadora: '',
    motorista_nome: '',
    motorista_cpf: '',
    motorista_telefone: '',
    placa_cavalo: '',
    placa_carreta: '',
    placa_carreta_2: '',
    tipo_veiculo: TIPOS_VEICULO[0],
    data_agendamento: hoje,
    horario_agendamento: '07:40',
    justificativa_outros: '',
    observacoes: ''
  });

  const [tipoDia, setTipoDia] = useState('dia_util');
  const [ocupacaoSabado, setOcupacaoSabado] = useState({ total: 0, limite: 12, disponivel: 12, lotado: false });
  const [horariosOcupados, setHorariosOcupados] = useState([]);

  // Ponto 2 (para Carregamento Combinado)
  const pedreira2Inicial = PEDREIRAS_CEARA[1]?.nome || PEDREIRAS_CEARA[0].nome;
  const materiaisIniciaisPonto2 = obterMateriaisPorPedreira(pedreira2Inicial);
  const [ponto2, setPonto2] = useState({
    pedreira: pedreira2Inicial,
    material: materiaisIniciaisPonto2[0] || '',
    numero_bloco: '',
    data_agendamento: hoje,
    horario_agendamento: '13:30',
    justificativa_outros: ''
  });

  const [tipoDia2, setTipoDia2] = useState('dia_util');
  const [ocupacaoSabado2, setOcupacaoSabado2] = useState({ total: 0, limite: 12, disponivel: 12, lotado: false });
  const [horariosOcupados2, setHorariosOcupados2] = useState([]);

  // Quantidade de blocos no carregamento combinado: 2 ou 3
  const [qtdBlocosCombinados, setQtdBlocosCombinados] = useState(2);

  // Ponto 3 (para Carregamento Combinado com 3 Blocos)
  const pedreira3Inicial = PEDREIRAS_CEARA[2]?.nome || PEDREIRAS_CEARA[0].nome;
  const materiaisIniciaisPonto3 = obterMateriaisPorPedreira(pedreira3Inicial);
  const [ponto3, setPonto3] = useState({
    pedreira: pedreira3Inicial,
    material: materiaisIniciaisPonto3[0] || '',
    numero_bloco: '',
    data_agendamento: hoje,
    horario_agendamento: '15:10',
    justificativa_outros: ''
  });

  const [tipoDia3, setTipoDia3] = useState('dia_util');
  const [ocupacaoSabado3, setOcupacaoSabado3] = useState({ total: 0, limite: 12, disponivel: 12, lotado: false });
  const [horariosOcupados3, setHorariosOcupados3] = useState([]);

  const [carregandoOcupacao, setCarregandoOcupacao] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');

  // Configuração dinâmica de placas baseada no tipo de veículo selecionado
  const configPlacas = obterConfigPlacas(formData.tipo_veiculo);

  // Máscaras de formatação
  const formatarCPF = (valor) => {
    const nums = valor.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 3) return nums;
    if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
    if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
    return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
  };

  const formatarTelefone = (valor) => {
    const nums = valor.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 2) return nums;
    if (nums.length <= 6) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    if (nums.length <= 10) return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
  };

  const formatarPlaca = (valor) => {
    const clean = valor.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
    if (clean.length > 3) {
      return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    }
    return clean;
  };

  // Avalia o tipo de dia e carrega vagas de sábado ou horários ocupados para o PONTO 1
  useEffect(() => {
    if (!formData.data_agendamento) return;

    const [ano, mes, dia] = formData.data_agendamento.split('-').map(Number);
    const dataObj = new Date(ano, mes - 1, dia);
    const diaSemana = dataObj.getDay();

    if (diaSemana === 0) {
      setTipoDia('domingo');
      setHorariosOcupados([]);
    } else if (diaSemana === 6) {
      setTipoDia('sabado');
      verificarVagasSabado(formData.data_agendamento, formData.pedreira);
      setHorariosOcupados([]);
    } else {
      setTipoDia('dia_util');
      carregarHorariosOcupados(formData.data_agendamento, formData.pedreira);
    }
  }, [formData.data_agendamento, formData.pedreira]);

  const verificarVagasSabado = async (dataStr, pedreiraNome) => {
    setCarregandoOcupacao(true);
    const dadosOcupacao = await obterOcupacaoSabado(dataStr, pedreiraNome);
    setOcupacaoSabado(dadosOcupacao);
    setCarregandoOcupacao(false);
  };

  const carregarHorariosOcupados = async (dataStr, pedreiraNome) => {
    setCarregandoOcupacao(true);
    const ocupados = await obterHorariosOcupados(dataStr, pedreiraNome);
    setHorariosOcupados(ocupados);
    setCarregandoOcupacao(false);

    if (ocupados.includes(formData.horario_agendamento)) {
      const primeiroLivre = HORARIOS_SEMANA.find(h => h.id !== 'outros' && !ocupados.includes(h.id));
      if (primeiroLivre) {
        setFormData(prev => ({ ...prev, horario_agendamento: primeiroLivre.id }));
      }
    }
  };

  // Avalia o tipo de dia e carrega vagas de sábado ou horários ocupados para o PONTO 2 (se combinado)
  useEffect(() => {
    if (tipoCarregamento !== 'combinado' || !ponto2.data_agendamento) return;

    const [ano, mes, dia] = ponto2.data_agendamento.split('-').map(Number);
    const dataObj = new Date(ano, mes - 1, dia);
    const diaSemana = dataObj.getDay();

    if (diaSemana === 0) {
      setTipoDia2('domingo');
      setHorariosOcupados2([]);
    } else if (diaSemana === 6) {
      setTipoDia2('sabado');
      obterOcupacaoSabado(ponto2.data_agendamento, ponto2.pedreira).then(setOcupacaoSabado2);
      setHorariosOcupados2([]);
    } else {
      setTipoDia2('dia_util');
      obterHorariosOcupados(ponto2.data_agendamento, ponto2.pedreira).then(ocupados => {
        setHorariosOcupados2(ocupados);
        if (ocupados.includes(ponto2.horario_agendamento)) {
          const primeiroLivre = HORARIOS_SEMANA.find(h => h.id !== 'outros' && !ocupados.includes(h.id));
          if (primeiroLivre) {
            setPonto2(prev => ({ ...prev, horario_agendamento: primeiroLivre.id }));
          }
        }
      });
    }
  }, [tipoCarregamento, ponto2.data_agendamento, ponto2.pedreira]);

  // Avalia o tipo de dia e carrega vagas de sábado ou horários ocupados para o PONTO 3 (se combinado com 3 blocos)
  useEffect(() => {
    if (tipoCarregamento !== 'combinado' || qtdBlocosCombinados !== 3 || !ponto3.data_agendamento) return;

    const [ano, mes, dia] = ponto3.data_agendamento.split('-').map(Number);
    const dataObj = new Date(ano, mes - 1, dia);
    const diaSemana = dataObj.getDay();

    if (diaSemana === 0) {
      setTipoDia3('domingo');
      setHorariosOcupados3([]);
    } else if (diaSemana === 6) {
      setTipoDia3('sabado');
      obterOcupacaoSabado(ponto3.data_agendamento, ponto3.pedreira).then(setOcupacaoSabado3);
      setHorariosOcupados3([]);
    } else {
      setTipoDia3('dia_util');
      obterHorariosOcupados(ponto3.data_agendamento, ponto3.pedreira).then(ocupados => {
        setHorariosOcupados3(ocupados);
        if (ocupados.includes(ponto3.horario_agendamento)) {
          const primeiroLivre = HORARIOS_SEMANA.find(h => h.id !== 'outros' && !ocupados.includes(h.id));
          if (primeiroLivre) {
            setPonto3(prev => ({ ...prev, horario_agendamento: primeiroLivre.id }));
          }
        }
      });
    }
  }, [tipoCarregamento, qtdBlocosCombinados, ponto3.data_agendamento, ponto3.pedreira]);

  const handleChange = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
    if (mensagemErro) setMensagemErro('');
  };

  const handlePedreiraChange = (novaPedreira) => {
    const novosMateriais = obterMateriaisPorPedreira(novaPedreira);
    const materialValido = novosMateriais.includes(formData.material);
    setFormData(prev => ({
      ...prev,
      pedreira: novaPedreira,
      material: materialValido ? prev.material : (novosMateriais[0] || '')
    }));
    if (mensagemErro) setMensagemErro('');
  };

  const handlePonto2Change = (campo, valor) => {
    setPonto2(prev => ({ ...prev, [campo]: valor }));
    if (mensagemErro) setMensagemErro('');
  };

  const handlePedreira2Change = (novaPedreira) => {
    const novosMateriais = obterMateriaisPorPedreira(novaPedreira);
    const materialValido = novosMateriais.includes(ponto2.material);
    setPonto2(prev => ({
      ...prev,
      pedreira: novaPedreira,
      material: materialValido ? prev.material : (novosMateriais[0] || '')
    }));
    if (mensagemErro) setMensagemErro('');
  };

  const handlePonto3Change = (campo, valor) => {
    setPonto3(prev => ({ ...prev, [campo]: valor }));
    if (mensagemErro) setMensagemErro('');
  };

  const handlePedreira3Change = (novaPedreira) => {
    const novosMateriais = obterMateriaisPorPedreira(novaPedreira);
    const materialValido = novosMateriais.includes(ponto3.material);
    setPonto3(prev => ({
      ...prev,
      pedreira: novaPedreira,
      material: materialValido ? prev.material : (novosMateriais[0] || '')
    }));
    if (mensagemErro) setMensagemErro('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagemErro('');

    // Validações do 1º Ponto
    if (tipoDia === 'domingo') {
      setMensagemErro('As pedreiras não realizam carregamentos aos domingos. Por favor, selecione outra data para o 1º carregamento.');
      return;
    }

    if (tipoDia === 'sabado' && !isPedreiraUruoca(formData.pedreira)) {
      setMensagemErro('Aos sábados, o carregamento opera exclusivamente na pedreira de Uruoca - CE (Taj Mahal). Por favor, selecione uma data entre segunda e sexta-feira ou altere para a pedreira de Uruoca no 1º carregamento.');
      return;
    }

    if (tipoDia === 'sabado' && ocupacaoSabado.lotado) {
      setMensagemErro('O limite máximo de 12 veículos para este sábado na pedreira de Uruoca foi atingido (1º carregamento). Escolha outra data.');
      return;
    }

    if (tipoDia === 'dia_util' && formData.horario_agendamento !== 'outros' && horariosOcupados.includes(formData.horario_agendamento)) {
      setMensagemErro(`O horário ${formData.horario_agendamento} já foi reservado nesta pedreira (1º carregamento). Por favor, selecione outro horário disponível.`);
      return;
    }

    if (!formData.material || !formData.material.trim()) {
      setMensagemErro('Selecione o material correspondente à pedreira (1º carregamento).');
      return;
    }

    if (!formData.numero_bloco.trim()) {
      setMensagemErro('Informe a numeração do bloco (1º carregamento).');
      return;
    }

    // Validações do 2º Ponto (se for carga combinada)
    if (tipoCarregamento === 'combinado') {
      if (tipoDia2 === 'domingo') {
        setMensagemErro('As pedreiras não realizam carregamentos aos domingos. Por favor, selecione outra data para o 2º carregamento.');
        return;
      }

      if (tipoDia2 === 'sabado' && !isPedreiraUruoca(ponto2.pedreira)) {
        setMensagemErro('Aos sábados, o carregamento opera exclusivamente na pedreira de Uruoca - CE (Taj Mahal). Por favor, selecione uma data entre segunda e sexta-feira para o 2º carregamento.');
        return;
      }

      if (tipoDia2 === 'sabado' && ocupacaoSabado2.lotado) {
        setMensagemErro('O limite máximo de 12 veículos para este sábado na pedreira de Uruoca foi atingido (2º carregamento). Escolha outra data.');
        return;
      }

      if (tipoDia2 === 'dia_util' && ponto2.horario_agendamento !== 'outros' && horariosOcupados2.includes(ponto2.horario_agendamento)) {
        setMensagemErro(`O horário ${ponto2.horario_agendamento} já foi reservado nesta pedreira (2º carregamento). Por favor, selecione outro horário disponível.`);
        return;
      }

      if (!ponto2.material || !ponto2.material.trim()) {
        setMensagemErro('Selecione o material do 2º carregamento.');
        return;
      }

      if (!ponto2.numero_bloco.trim()) {
        setMensagemErro('Informe a numeração do bloco do 2º carregamento.');
        return;
      }

      if (
        formData.pedreira === ponto2.pedreira &&
        formData.data_agendamento === ponto2.data_agendamento &&
        formData.horario_agendamento === ponto2.horario_agendamento &&
        formData.horario_agendamento !== 'outros'
      ) {
        setMensagemErro('Para a mesma pedreira e mesma data, selecione horários distintos para o 1º e 2º blocos.');
        return;
      }

      // Validações do 3º Ponto (se for carga combinada de 3 blocos)
      if (qtdBlocosCombinados === 3) {
        if (tipoDia3 === 'domingo') {
          setMensagemErro('As pedreiras não realizam carregamentos aos domingos. Por favor, selecione outra data para o 3º carregamento.');
          return;
        }

        if (tipoDia3 === 'sabado' && !isPedreiraUruoca(ponto3.pedreira)) {
          setMensagemErro('Aos sábados, o carregamento opera exclusivamente na pedreira de Uruoca - CE (Taj Mahal). Por favor, selecione uma data entre segunda e sexta-feira para o 3º carregamento.');
          return;
        }

        if (tipoDia3 === 'sabado' && ocupacaoSabado3.lotado) {
          setMensagemErro('O limite máximo de 12 veículos para este sábado na pedreira de Uruoca foi atingido (3º carregamento). Escolha outra data.');
          return;
        }

        if (tipoDia3 === 'dia_util' && ponto3.horario_agendamento !== 'outros' && horariosOcupados3.includes(ponto3.horario_agendamento)) {
          setMensagemErro(`O horário ${ponto3.horario_agendamento} já foi reservado nesta pedreira (3º carregamento). Por favor, selecione outro horário disponível.`);
          return;
        }

        if (!ponto3.material || !ponto3.material.trim()) {
          setMensagemErro('Selecione o material do 3º carregamento.');
          return;
        }

        if (!ponto3.numero_bloco.trim()) {
          setMensagemErro('Informe a numeração do bloco do 3º carregamento.');
          return;
        }

        // Colisões entre 3º ponto e 1º ou 2º ponto
        if (
          formData.pedreira === ponto3.pedreira &&
          formData.data_agendamento === ponto3.data_agendamento &&
          formData.horario_agendamento === ponto3.horario_agendamento &&
          formData.horario_agendamento !== 'outros'
        ) {
          setMensagemErro('Para a mesma pedreira e mesma data, selecione horários distintos para o 1º e 3º blocos.');
          return;
        }

        if (
          ponto2.pedreira === ponto3.pedreira &&
          ponto2.data_agendamento === ponto3.data_agendamento &&
          ponto2.horario_agendamento === ponto3.horario_agendamento &&
          ponto2.horario_agendamento !== 'outros'
        ) {
          setMensagemErro('Para a mesma pedreira e mesma data, selecione horários distintos para o 2º e 3º blocos.');
          return;
        }
      }
    }

    // Validações comuns de Transporte & Motorista
    if (!formData.cliente.trim()) {
      setMensagemErro('Informe o nome do cliente destinatário.');
      return;
    }

    if (!formData.transportadora.trim()) {
      setMensagemErro('Informe o nome da transportadora.');
      return;
    }

    if (!formData.motorista_nome.trim() || !formData.motorista_cpf.trim()) {
      setMensagemErro('Informe o nome completo e o CPF do motorista.');
      return;
    }

    if (formData.motorista_cpf.replace(/\D/g, '').length !== 11) {
      setMensagemErro('CPF do motorista incompleto. Digite os 11 dígitos.');
      return;
    }

    if (!formData.placa_cavalo.trim()) {
      setMensagemErro(`Informe a ${configPlacas.labelCavalo}.`);
      return;
    }

    if (configPlacas.exigeCarreta1 && !formData.placa_carreta.trim()) {
      setMensagemErro(`Informe a ${configPlacas.labelCarreta1}.`);
      return;
    }

    if (configPlacas.exigeCarreta2 && !formData.placa_carreta_2.trim()) {
      setMensagemErro(`Para veículos do tipo ${formData.tipo_veiculo}, são necessárias 3 placas. Informe a ${configPlacas.labelCarreta2}.`);
      return;
    }

    if (tipoDia === 'dia_util' && formData.horario_agendamento === 'outros' && !formData.justificativa_outros.trim()) {
      setMensagemErro('Por favor, especifique o horário solicitado ou a justificativa na opção "Outros" do 1º carregamento.');
      return;
    }

    if (tipoCarregamento === 'combinado' && tipoDia2 === 'dia_util' && ponto2.horario_agendamento === 'outros' && !ponto2.justificativa_outros.trim()) {
      setMensagemErro('Por favor, especifique o horário solicitado ou a justificativa na opção "Outros" do 2º carregamento.');
      return;
    }

    if (tipoCarregamento === 'combinado' && qtdBlocosCombinados === 3 && tipoDia3 === 'dia_util' && ponto3.horario_agendamento === 'outros' && !ponto3.justificativa_outros.trim()) {
      setMensagemErro('Por favor, especifique o horário solicitado ou a justificativa na opção "Outros" do 3º carregamento.');
      return;
    }

    setEnviando(true);

    let resultado;

    if (tipoCarregamento === 'combinado') {
      resultado = await salvarAgendamentoCombinado({
        ponto1: {
          pedreira: formData.pedreira,
          material: formData.material,
          numero_bloco: formData.numero_bloco,
          data_agendamento: formData.data_agendamento,
          tipo_dia: tipoDia,
          horario_agendamento: tipoDia === 'sabado' ? 'Sábado - Cota do Dia (Até 12 Veículos)' : formData.horario_agendamento,
          justificativa_outros: formData.justificativa_outros
        },
        ponto2: {
          pedreira: ponto2.pedreira,
          material: ponto2.material,
          numero_bloco: ponto2.numero_bloco,
          data_agendamento: ponto2.data_agendamento,
          tipo_dia: tipoDia2,
          horario_agendamento: tipoDia2 === 'sabado' ? 'Sábado - Cota do Dia (Até 12 Veículos)' : ponto2.horario_agendamento,
          justificativa_outros: ponto2.justificativa_outros
        },
        ponto3: qtdBlocosCombinados === 3 ? {
          pedreira: ponto3.pedreira,
          material: ponto3.material,
          numero_bloco: ponto3.numero_bloco,
          data_agendamento: ponto3.data_agendamento,
          tipo_dia: tipoDia3,
          horario_agendamento: tipoDia3 === 'sabado' ? 'Sábado - Cota do Dia (Até 12 Veículos)' : ponto3.horario_agendamento,
          justificativa_outros: ponto3.justificativa_outros
        } : null,
        veiculo: {
          cliente: formData.cliente,
          transportadora: formData.transportadora,
          motorista_nome: formData.motorista_nome,
          motorista_cpf: formData.motorista_cpf,
          motorista_telefone: formData.motorista_telefone,
          placa_cavalo: formData.placa_cavalo,
          placa_carreta: formData.placa_carreta,
          placa_carreta_2: formData.placa_carreta_2,
          tipo_veiculo: formData.tipo_veiculo,
          observacoes: formData.observacoes
        }
      });
    } else {
      const dadosParaSalvar = {
        ...formData,
        tipo_dia: tipoDia,
        horario_agendamento: tipoDia === 'sabado' ? 'Sábado - Cota do Dia (Até 12 Veículos)' : formData.horario_agendamento
      };
      resultado = await salvarAgendamento(dadosParaSalvar);
    }

    setEnviando(false);

    if (resultado.success) {
      onAgendamentoSucesso(resultado.agendamento);
    } else {
      setMensagemErro(resultado.error || 'Ocorreu um erro ao salvar o agendamento. Tente novamente.');
    }
  };

  return (
    <div style={{ maxWidth: 940, margin: '0 auto', padding: '10px 0 40px 0' }}>
      
      {/* Topo do Formulário */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'var(--vermont-green-subtle)',
            border: '1px solid var(--vermont-green-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4ade80'
          }}>
            <Truck size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', margin: 0, color: '#fff' }}>
              Portal de Agendamento de Carregamento
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--slate-400)' }}>
              Grupo Vermont Mineração • Pedreiras Polo Ceará
            </p>
          </div>
        </div>

        <div>
          <span className="badge badge-vermont" style={{ fontSize: '0.75rem', padding: '5px 12px' }}>
            ATENDIMENTO OFICIAL
          </span>
        </div>
      </div>

      {/* SELETOR: Modo de Carregamento (Simples vs Carga Combinada) */}
      <div style={{
        display: 'flex',
        gap: 10,
        marginBottom: tipoCarregamento === 'combinado' ? 12 : 20,
        background: 'rgba(20, 28, 24, 0.7)',
        padding: 6,
        borderRadius: 14,
        border: '1px solid var(--vermont-green-border)'
      }}>
        <button
          type="button"
          onClick={() => {
            setTipoCarregamento('simples');
            setMensagemErro('');
          }}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 10,
            border: 'none',
            background: tipoCarregamento === 'simples' ? 'var(--vermont-green-light)' : 'transparent',
            color: tipoCarregamento === 'simples' ? '#000' : 'var(--slate-300)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: '0.94rem',
            transition: 'all 0.2s',
            boxShadow: tipoCarregamento === 'simples' ? '0 4px 14px rgba(74, 222, 128, 0.3)' : 'none'
          }}
        >
          <Truck size={19} />
          Carregamento Simples (1 Bloco)
        </button>

        <button
          type="button"
          onClick={() => {
            setTipoCarregamento('combinado');
            setMensagemErro('');
          }}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 10,
            border: 'none',
            background: tipoCarregamento === 'combinado' ? 'var(--vermont-green-light)' : 'transparent',
            color: tipoCarregamento === 'combinado' ? '#000' : 'var(--slate-300)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: '0.94rem',
            transition: 'all 0.2s',
            boxShadow: tipoCarregamento === 'combinado' ? '0 4px 14px rgba(74, 222, 128, 0.3)' : 'none'
          }}
        >
          <Layers size={19} />
          Carga Combinada (2 ou 3 Blocos / Pedreiras)
        </button>
      </div>

      {/* Se for Carga Combinada: Seletor de 2 ou 3 Blocos */}
      {tipoCarregamento === 'combinado' && (
        <div className="animate-fade" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 12,
          padding: '10px 16px',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8', fontSize: '0.9rem' }}>
            <Layers size={18} />
            <span><strong>Quantidade de Blocos no Carregamento:</strong></span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setQtdBlocosCombinados(2)}
              style={{
                padding: '7px 18px',
                borderRadius: 8,
                border: '1px solid',
                borderColor: qtdBlocosCombinados === 2 ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)',
                background: qtdBlocosCombinados === 2 ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                color: qtdBlocosCombinados === 2 ? '#38bdf8' : 'var(--slate-300)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.86rem',
                transition: 'all 0.15s'
              }}
            >
              2 Blocos (2 Pedreiras)
            </button>
            <button
              type="button"
              onClick={() => setQtdBlocosCombinados(3)}
              style={{
                padding: '7px 18px',
                borderRadius: 8,
                border: '1px solid',
                borderColor: qtdBlocosCombinados === 3 ? '#f59e0b' : 'rgba(255, 255, 255, 0.15)',
                background: qtdBlocosCombinados === 3 ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                color: qtdBlocosCombinados === 3 ? '#fbbf24' : 'var(--slate-300)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.86rem',
                transition: 'all 0.15s'
              }}
            >
              3 Blocos (Até 3 Pedreiras)
            </button>
          </div>
        </div>
      )}

      {mensagemErro && (
        <div className="animate-fade" style={{
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          color: '#fca5a5',
          padding: '12px 16px',
          borderRadius: 10,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: '0.92rem'
        }}>
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <span>{mensagemErro}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* ======================================================== */}
        {/* CASO 1: CARREGAMENTO SIMPLES (1 BLOCO)                   */}
        {/* ======================================================== */}
        {tipoCarregamento === 'simples' && (
          <>
            {/* BLOCO 1: Destino e Material */}
            <div className="glass-panel animate-fade" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 10 }}>
                <MapPin size={20} color="var(--vermont-green-light)" />
                <h2 style={{ fontSize: '1.15rem', margin: 0 }}>1. Localização, Material & Bloco</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {/* Escolha da Pedreira */}
                <div className="form-group">
                  <label className="form-label form-label-required">Pedreira de Carregamento</label>
                  <select
                    className="form-select"
                    value={formData.pedreira}
                    onChange={(e) => handlePedreiraChange(e.target.value)}
                    required
                  >
                    {PEDREIRAS_CEARA.map(p => (
                      <option key={p.id} value={p.nome}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Material da Pedreira */}
                <div className="form-group">
                  <label className="form-label form-label-required">Material da Pedreira</label>
                  <select
                    className="form-select"
                    value={formData.material}
                    onChange={(e) => handleChange('material', e.target.value)}
                    required
                  >
                    <option value="">Selecione o material...</option>
                    {obterMateriaisPorPedreira(formData.pedreira).map(mat => (
                      <option key={mat} value={mat}>
                        {mat}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                    Materiais oficiais disponíveis na pedreira selecionada
                  </span>
                </div>

                {/* Numeração do Bloco */}
                <div className="form-group">
                  <label className="form-label form-label-required">Numeração do Bloco</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: VT-2026/089 ou 4512"
                    value={formData.numero_bloco}
                    onChange={(e) => handleChange('numero_bloco', e.target.value)}
                    required
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
              </div>
            </div>

            {/* BLOCO 2: Data & Horário (Simples) */}
            <div className="glass-panel animate-fade" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 10 }}>
                <Calendar size={20} color="var(--vermont-green-light)" />
                <h2 style={{ fontSize: '1.15rem', margin: 0 }}>2. Data & Horário de Carregamento</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {/* Seletor de Data */}
                <div className="form-group">
                  <label className="form-label form-label-required">Data do Agendamento</label>
                  <input
                    type="date"
                    className="form-input"
                    min={hoje}
                    value={formData.data_agendamento}
                    onChange={(e) => handleChange('data_agendamento', e.target.value)}
                    required
                    style={{ colorScheme: 'dark' }}
                  />
                </div>

                {/* Horários Dia Útil */}
                {tipoDia === 'dia_util' && (
                  <div className="form-group animate-fade">
                    <label className="form-label form-label-required">
                      Horário de Carregamento
                      {horariosOcupados.length > 0 && (
                        <span style={{ fontSize: '0.74rem', color: '#fca5a5', fontWeight: 500, marginLeft: 6, textTransform: 'none' }}>
                          ({horariosOcupados.length} horário{horariosOcupados.length > 1 ? 's' : ''} já reservado{horariosOcupados.length > 1 ? 's' : ''})
                        </span>
                      )}
                    </label>
                    <select
                      className="form-select"
                      value={formData.horario_agendamento}
                      onChange={(e) => handleChange('horario_agendamento', e.target.value)}
                      required
                    >
                      <optgroup label="Turno Manhã (07:40 às 12:00 - Intervalos de 20 min)">
                        {HORARIOS_SEMANA.filter(h => h.turno === 'manha').map(h => {
                          const ocupado = horariosOcupados.includes(h.id);
                          return (
                            <option key={h.id} value={h.id} disabled={ocupado}>
                              {h.id} {ocupado ? '— [INDISPONÍVEL / OCUPADO]' : '— Disponível'}
                            </option>
                          );
                        })}
                      </optgroup>
                      <optgroup label="Turno Tarde (13:30 às 15:30 - Intervalos de 20 min)">
                        {HORARIOS_SEMANA.filter(h => h.turno === 'tarde').map(h => {
                          const ocupado = horariosOcupados.includes(h.id);
                          return (
                            <option key={h.id} value={h.id} disabled={ocupado}>
                              {h.id} {ocupado ? '— [INDISPONÍVEL / OCUPADO]' : '— Disponível'}
                            </option>
                          );
                        })}
                      </optgroup>
                      <optgroup label="Opção Especial">
                        <option value="outros">Outros (Especificar Horário / Justificativa)</option>
                      </optgroup>
                    </select>
                  </div>
                )}

                {/* Sábado Uruoca */}
                {tipoDia === 'sabado' && isPedreiraUruoca(formData.pedreira) && (
                  <div className="animate-fade" style={{
                    gridColumn: '1 / -1',
                    background: ocupacaoSabado.lotado ? 'var(--danger-bg)' : 'var(--vermont-green-subtle)',
                    border: `1px solid ${ocupacaoSabado.lotado ? 'var(--danger-border)' : 'var(--vermont-green-border)'}`,
                    borderRadius: 12,
                    padding: 16
                  }}>
                    <strong style={{ color: ocupacaoSabado.lotado ? '#fca5a5' : '#4ade80' }}>
                      {ocupacaoSabado.lotado ? '🚨 Limite de 12 Veículos Atingido para este Sábado' : `✅ Vagas Disponíveis para Sábado (${ocupacaoSabado.disponivel} de 12 vagas)`}
                    </strong>
                  </div>
                )}

                {/* Sábado Não Uruoca */}
                {tipoDia === 'sabado' && !isPedreiraUruoca(formData.pedreira) && (
                  <div className="animate-fade" style={{
                    gridColumn: '1 / -1',
                    background: 'var(--warning-bg)',
                    border: '1px solid var(--warning-border)',
                    borderRadius: 12,
                    padding: 14,
                    color: '#fef3c7'
                  }}>
                    A operação aos sábados é <strong>exclusiva para a pedreira de Uruoca - CE (Taj Mahal)</strong>. Demais pedreiras operam de segunda a sexta-feira.
                  </div>
                )}
              </div>

              {/* Justificativa outros */}
              {tipoDia === 'dia_util' && formData.horario_agendamento === 'outros' && (
                <div className="form-group animate-fade" style={{ marginTop: 16 }}>
                  <label className="form-label form-label-required">Especificação de Horário & Justificativa (Outros)</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Informe o horário pretendido e a justificativa..."
                    value={formData.justificativa_outros}
                    onChange={(e) => handleChange('justificativa_outros', e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* ======================================================== */}
        {/* CASO 2: CARREGAMENTO COMBINADO (2 BLOCOS / PEDREIRAS)    */}
        {/* ======================================================== */}
        {tipoCarregamento === 'combinado' && (
          <>
            {/* PONTO 1 DE CARREGAMENTO */}
            <div className="glass-panel animate-fade" style={{
              padding: 24,
              borderLeft: '4px solid #4ade80'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    background: '#00762c',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 26,
                    height: 26,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}>1</span>
                  <h2 style={{ fontSize: '1.15rem', margin: 0, color: '#4ade80' }}>1º Ponto de Carregamento</h2>
                </div>
                <span className="badge badge-vermont" style={{ fontSize: '0.72rem' }}>Primeira Coleta</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                {/* Pedreira 1 */}
                <div className="form-group">
                  <label className="form-label form-label-required">Pedreira (1º Ponto)</label>
                  <select
                    className="form-select"
                    value={formData.pedreira}
                    onChange={(e) => handlePedreiraChange(e.target.value)}
                    required
                  >
                    {PEDREIRAS_CEARA.map(p => (
                      <option key={p.id} value={p.nome}>{p.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Material 1 */}
                <div className="form-group">
                  <label className="form-label form-label-required">Material (1º Ponto)</label>
                  <select
                    className="form-select"
                    value={formData.material}
                    onChange={(e) => handleChange('material', e.target.value)}
                    required
                  >
                    <option value="">Selecione o material...</option>
                    {obterMateriaisPorPedreira(formData.pedreira).map(mat => (
                      <option key={mat} value={mat}>{mat}</option>
                    ))}
                  </select>
                </div>

                {/* Bloco 1 */}
                <div className="form-group">
                  <label className="form-label form-label-required">Nº do 1º Bloco</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: VT-1020"
                    value={formData.numero_bloco}
                    onChange={(e) => handleChange('numero_bloco', e.target.value)}
                    required
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                {/* Data 1 */}
                <div className="form-group">
                  <label className="form-label form-label-required">Data (1º Ponto)</label>
                  <input
                    type="date"
                    className="form-input"
                    min={hoje}
                    value={formData.data_agendamento}
                    onChange={(e) => handleChange('data_agendamento', e.target.value)}
                    required
                    style={{ colorScheme: 'dark' }}
                  />
                </div>

                {/* Horário 1 */}
                <div className="form-group">
                  <label className="form-label form-label-required">Horário (1º Ponto)</label>
                  <select
                    className="form-select"
                    value={formData.horario_agendamento}
                    onChange={(e) => handleChange('horario_agendamento', e.target.value)}
                    required
                  >
                    {HORARIOS_SEMANA.map(h => (
                      <option key={h.id} value={h.id} disabled={horariosOcupados.includes(h.id)}>
                        {h.id} {horariosOcupados.includes(h.id) ? '— [OCUPADO]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* PONTO 2 DE CARREGAMENTO */}
            <div className="glass-panel animate-fade" style={{
              padding: 24,
              borderLeft: '4px solid #38bdf8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    background: '#0284c7',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 26,
                    height: 26,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}>2</span>
                  <h2 style={{ fontSize: '1.15rem', margin: 0, color: '#38bdf8' }}>2º Ponto de Carregamento</h2>
                </div>
                <span className="badge" style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  fontSize: '0.72rem'
                }}>Segunda Coleta</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                {/* Pedreira 2 */}
                <div className="form-group">
                  <label className="form-label form-label-required">Pedreira (2º Ponto)</label>
                  <select
                    className="form-select"
                    value={ponto2.pedreira}
                    onChange={(e) => handlePedreira2Change(e.target.value)}
                    required
                  >
                    {PEDREIRAS_CEARA.map(p => (
                      <option key={p.id} value={p.nome}>{p.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Material 2 */}
                <div className="form-group">
                  <label className="form-label form-label-required">Material (2º Ponto)</label>
                  <select
                    className="form-select"
                    value={ponto2.material}
                    onChange={(e) => handlePonto2Change('material', e.target.value)}
                    required
                  >
                    <option value="">Selecione o material...</option>
                    {obterMateriaisPorPedreira(ponto2.pedreira).map(mat => (
                      <option key={mat} value={mat}>{mat}</option>
                    ))}
                  </select>
                </div>

                {/* Bloco 2 */}
                <div className="form-group">
                  <label className="form-label form-label-required">Nº do 2º Bloco</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: VT-3040"
                    value={ponto2.numero_bloco}
                    onChange={(e) => handlePonto2Change('numero_bloco', e.target.value)}
                    required
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                {/* Data 2 */}
                <div className="form-group">
                  <label className="form-label form-label-required">Data (2º Ponto)</label>
                  <input
                    type="date"
                    className="form-input"
                    min={hoje}
                    value={ponto2.data_agendamento}
                    onChange={(e) => handlePonto2Change('data_agendamento', e.target.value)}
                    required
                    style={{ colorScheme: 'dark' }}
                  />
                </div>

                {/* Horário 2 */}
                <div className="form-group">
                  <label className="form-label form-label-required">Horário (2º Ponto)</label>
                  <select
                    className="form-select"
                    value={ponto2.horario_agendamento}
                    onChange={(e) => handlePonto2Change('horario_agendamento', e.target.value)}
                    required
                  >
                    {HORARIOS_SEMANA.map(h => (
                      <option key={h.id} value={h.id} disabled={horariosOcupados2.includes(h.id)}>
                        {h.id} {horariosOcupados2.includes(h.id) ? '— [OCUPADO]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dica de deslocamento se for na mesma data */}
              {formData.data_agendamento === ponto2.data_agendamento && (
                <div style={{
                  marginTop: 14,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  fontSize: '0.8rem',
                  color: '#93c5fd',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <Info size={16} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Deslocamento entre pedreiras:</strong> Certifique-se de prever tempo suficiente de trânsito entre o 1º horário ({formData.horario_agendamento}) e o 2º horário ({ponto2.horario_agendamento}).
                  </span>
                </div>
              )}
            </div>

            {/* PONTO 3 DE CARREGAMENTO (SE COMBINADO COM 3 BLOCOS) */}
            {qtdBlocosCombinados === 3 && (
              <div className="glass-panel animate-fade" style={{
                padding: 24,
                borderLeft: '4px solid #f59e0b'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      background: '#ca8a04',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 26,
                      height: 26,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}>3</span>
                    <h2 style={{ fontSize: '1.15rem', margin: 0, color: '#fbbf24' }}>3º Ponto de Carregamento</h2>
                  </div>
                  <span className="badge" style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    fontSize: '0.72rem'
                  }}>Terceira Coleta</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  {/* Pedreira 3 */}
                  <div className="form-group">
                    <label className="form-label form-label-required">Pedreira (3º Ponto)</label>
                    <select
                      className="form-select"
                      value={ponto3.pedreira}
                      onChange={(e) => handlePedreira3Change(e.target.value)}
                      required
                    >
                      {PEDREIRAS_CEARA.map(p => (
                        <option key={p.id} value={p.nome}>{p.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* Material 3 */}
                  <div className="form-group">
                    <label className="form-label form-label-required">Material (3º Ponto)</label>
                    <select
                      className="form-select"
                      value={ponto3.material}
                      onChange={(e) => handlePonto3Change('material', e.target.value)}
                      required
                    >
                      <option value="">Selecione o material...</option>
                      {obterMateriaisPorPedreira(ponto3.pedreira).map(mat => (
                        <option key={mat} value={mat}>{mat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Bloco 3 */}
                  <div className="form-group">
                    <label className="form-label form-label-required">Nº do 3º Bloco</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: VT-5060"
                      value={ponto3.numero_bloco}
                      onChange={(e) => handlePonto3Change('numero_bloco', e.target.value)}
                      required
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>

                  {/* Data 3 */}
                  <div className="form-group">
                    <label className="form-label form-label-required">Data (3º Ponto)</label>
                    <input
                      type="date"
                      className="form-input"
                      min={hoje}
                      value={ponto3.data_agendamento}
                      onChange={(e) => handlePonto3Change('data_agendamento', e.target.value)}
                      required
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>

                  {/* Horário 3 */}
                  <div className="form-group">
                    <label className="form-label form-label-required">Horário (3º Ponto)</label>
                    <select
                      className="form-select"
                      value={ponto3.horario_agendamento}
                      onChange={(e) => handlePonto3Change('horario_agendamento', e.target.value)}
                      required
                    >
                      {HORARIOS_SEMANA.map(h => (
                        <option key={h.id} value={h.id} disabled={horariosOcupados3.includes(h.id)}>
                          {h.id} {horariosOcupados3.includes(h.id) ? '— [OCUPADO]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ======================================================== */}
        {/* BLOCO COMUM: Dados do Transporte, Veículo & Cliente       */}
        {/* ======================================================== */}
        <div className="glass-panel animate-fade" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 10 }}>
            <Truck size={20} color="var(--vermont-green-light)" />
            <h2 style={{ fontSize: '1.15rem', margin: 0 }}>
              {tipoCarregamento === 'combinado' ? '3. Veículo, Motorista & Cliente (Compartilhado)' : '3. Dados do Transporte & Veículo'}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {/* Cliente Destinatário */}
            <div className="form-group">
              <label className="form-label form-label-required">Cliente / Destinatário</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nome da empresa ou cliente final"
                value={formData.cliente}
                onChange={(e) => handleChange('cliente', e.target.value)}
                required
              />
            </div>

            {/* Nome da Transportadora */}
            <div className="form-group">
              <label className="form-label form-label-required">Nome da Transportadora</label>
              <input
                type="text"
                className="form-input"
                placeholder="Razão Social ou Nome Fantasia"
                value={formData.transportadora}
                onChange={(e) => handleChange('transportadora', e.target.value)}
                required
              />
            </div>

            {/* Nome do Motorista */}
            <div className="form-group">
              <label className="form-label form-label-required">Nome do Motorista</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nome completo do motorista"
                value={formData.motorista_nome}
                onChange={(e) => handleChange('motorista_nome', e.target.value)}
                required
              />
            </div>

            {/* CPF do Motorista */}
            <div className="form-group">
              <label className="form-label form-label-required">CPF do Motorista</label>
              <input
                type="text"
                className="form-input"
                placeholder="000.000.000-00"
                maxLength={14}
                value={formData.motorista_cpf}
                onChange={(e) => handleChange('motorista_cpf', formatarCPF(e.target.value))}
                required
              />
            </div>

            {/* Telefone / WhatsApp */}
            <div className="form-group">
              <label className="form-label">Telefone / WhatsApp (Motorista)</label>
              <input
                type="text"
                className="form-input"
                placeholder="(85) 99999-9999"
                maxLength={15}
                value={formData.motorista_telefone}
                onChange={(e) => handleChange('motorista_telefone', formatarTelefone(e.target.value))}
              />
            </div>

            {/* Tipo do Veículo */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label form-label-required">Tipo do Veículo</label>
              <select
                className="form-select"
                value={formData.tipo_veiculo}
                onChange={(e) => handleChange('tipo_veiculo', e.target.value)}
                required
              >
                {TIPOS_VEICULO.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
              <span style={{ fontSize: '0.76rem', color: '#86efac', marginTop: 2 }}>
                {configPlacas.quantidade === 3 && 'ℹ️ Bitrem / Rodotrem requer 3 placas: Cavalo, 1ª Carreta e 2ª Carreta.'}
                {configPlacas.quantidade === 1 && 'ℹ️ Truck / Bitruck requer apenas 1 placa (Veículo).'}
                {configPlacas.quantidade === 2 && 'ℹ️ Requer 2 placas: Placa do Cavalo e Placa da Carreta.'}
              </span>
            </div>

            {/* Placa do Cavalo / Veículo */}
            <div className="form-group">
              <label className="form-label form-label-required">{configPlacas.labelCavalo}</label>
              <input
                type="text"
                className="form-input"
                placeholder="ABC-1D23"
                maxLength={8}
                value={formData.placa_cavalo}
                onChange={(e) => handleChange('placa_cavalo', formatarPlaca(e.target.value))}
                required
                style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.08em' }}
              />
            </div>

            {/* 1ª Carreta */}
            {configPlacas.exigeCarreta1 && (
              <div className="form-group animate-fade">
                <label className="form-label form-label-required">{configPlacas.labelCarreta1}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="XYZ-4E56"
                  maxLength={8}
                  value={formData.placa_carreta}
                  onChange={(e) => handleChange('placa_carreta', formatarPlaca(e.target.value))}
                  required
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.08em' }}
                />
              </div>
            )}

            {/* 2ª Carreta */}
            {configPlacas.exigeCarreta2 && (
              <div className="form-group animate-fade">
                <label className="form-label form-label-required">{configPlacas.labelCarreta2}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="KML-8B90"
                  maxLength={8}
                  value={formData.placa_carreta_2}
                  onChange={(e) => handleChange('placa_carreta_2', formatarPlaca(e.target.value))}
                  required
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.08em' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Observações, Notificação & Documentos Obrigatórios */}
        <div className="glass-panel animate-fade" style={{ padding: 24 }}>
          {/* Observações Gerais */}
          <div className="form-group">
            <label className="form-label">Observações Adicionais (Opcional)</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Instruções especiais de carregamento ou orientações operacionais..."
              value={formData.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
            />
          </div>

          {/* Notificação por E-mail */}
          <div style={{
            marginTop: 18,
            padding: '12px 16px',
            borderRadius: 10,
            background: 'rgba(0, 118, 44, 0.12)',
            border: '1px solid var(--vermont-green-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.84rem'
          }}>
            <Mail size={18} color="#4ade80" style={{ flexShrink: 0 }} />
            <span style={{ color: 'var(--slate-200)' }}>
              Confirmação despachada para <strong style={{ color: '#4ade80' }}>o e-mail da logística</strong>
            </span>
          </div>

          {/* Documentos Obrigatórios */}
          <div style={{
            marginTop: 18,
            padding: '16px 18px',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(0, 118, 44, 0.35)',
            borderRadius: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <FileCheck size={20} color="#4ade80" />
              <strong style={{ color: '#fff', fontSize: '0.94rem' }}>
                Documentação Obrigatória para Apresentação na Pedreira
              </strong>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--slate-400)' }}>
              O motorista deverá portar e apresentar obrigatoriamente na portaria de cada pedreira:
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.84rem', color: '#e2e8f0', lineHeight: '1.6' }}>
              <li><strong>Obrigatório apresentação de CRLVs do cavalo e carreta atualizados;</strong></li>
              <li><strong>CNH compatível com o veículo;</strong></li>
              <li><strong>Motorista deve possuir o curso de cargas indivisíveis;</strong></li>
              <li><strong>Laudo de inspeção de rochas ou CSV dentro da validade.</strong></li>
            </ul>

            {/* Alerta Operacional: Confirmação Prévia de Blocos com Clientes */}
            <div style={{
              marginTop: 14,
              padding: '12px 14px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <AlertTriangle size={20} color="#fbbf24" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.84rem', color: '#fef3c7', lineHeight: '1.5' }}>
                <strong style={{ color: '#fde047', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'block', marginBottom: 4 }}>
                  Aviso Importante ao Transportador:
                </strong>
                <p style={{ margin: '0 0 6px 0' }}>
                  O transportador deverá sempre confirmar com o cliente, antes de realizar o carregamento, se os blocos estão devidamente envelopados e se encontram finalizados e liberados para transporte.
                </p>
                <p style={{ margin: 0, color: '#fde68a', fontSize: '0.81rem', fontWeight: 500 }}>
                  Essa confirmação é fundamental para evitar imprevistos, atrasos ou problemas durante o carregamento e o transporte.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botão de Envio */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14 }}>
          <button
            type="submit"
            disabled={
              enviando || 
              tipoDia === 'domingo' || 
              (tipoDia === 'sabado' && (!isPedreiraUruoca(formData.pedreira) || ocupacaoSabado.lotado)) ||
              (tipoCarregamento === 'combinado' && (
                tipoDia2 === 'domingo' || 
                (tipoDia2 === 'sabado' && (!isPedreiraUruoca(ponto2.pedreira) || ocupacaoSabado2.lotado)) ||
                (qtdBlocosCombinados === 3 && (
                  tipoDia3 === 'domingo' ||
                  (tipoDia3 === 'sabado' && (!isPedreiraUruoca(ponto3.pedreira) || ocupacaoSabado3.lotado))
                ))
              ))
            }
            className="btn btn-vermont glow-effect"
            style={{ padding: '14px 34px', fontSize: '1.05rem', minWidth: 280 }}
          >
            {enviando ? (
              <>
                <span className="spinner" /> Gravando agendamento...
              </>
            ) : (
              <>
                <Send size={20} />
                {tipoCarregamento === 'combinado' 
                  ? `Confirmar Agendamento Combinado (${qtdBlocosCombinados} Blocos)` 
                  : 'Confirmar Agendamento de Carregamento'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
