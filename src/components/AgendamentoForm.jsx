import React, { useState, useEffect } from 'react';
import { 
  Truck, Calendar, Clock, MapPin, AlertTriangle, Send, Info, Mail, FileCheck
} from 'lucide-react';
import { 
  PEDREIRAS_CEARA, 
  HORARIOS_SEMANA, 
  TIPOS_VEICULO, 
  obterConfigPlacas,
  obterOcupacaoSabado, 
  obterHorariosOcupados,
  salvarAgendamento,
  isPedreiraUruoca,
  DOCUMENTOS_OBRIGATORIOS_PEDREIRA,
  EMAIL_NOTIFICACAO_DESTINO
} from '../services/agendamentoService';

export function AgendamentoForm({ onAgendamentoSucesso }) {
  const hoje = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    pedreira: PEDREIRAS_CEARA[0].nome,
    material: '',
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

  // Avalia o tipo de dia e carrega vagas de sábado ou horários ocupados
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
      verificarVagasSabado(formData.data_agendamento);
      setHorariosOcupados([]);
    } else {
      setTipoDia('dia_util');
      carregarHorariosOcupados(formData.data_agendamento, formData.pedreira);
    }
  }, [formData.data_agendamento, formData.pedreira]);

  const verificarVagasSabado = async (dataStr) => {
    setCarregandoOcupacao(true);
    const dadosOcupacao = await obterOcupacaoSabado(dataStr);
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

  const handleChange = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
    if (mensagemErro) setMensagemErro('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagemErro('');

    if (tipoDia === 'domingo') {
      setMensagemErro('As pedreiras não realizam carregamentos aos domingos. Por favor, selecione outra data.');
      return;
    }

    if (tipoDia === 'sabado' && !isPedreiraUruoca(formData.pedreira)) {
      setMensagemErro('Aos sábados, o carregamento opera exclusivamente na pedreira de URUOCA - CE (TAJ MAHAL). Por favor, selecione uma data entre segunda e sexta-feira ou altere para a pedreira de Uruoca.');
      return;
    }

    if (tipoDia === 'sabado' && ocupacaoSabado.lotado) {
      setMensagemErro('O limite máximo de 12 veículos para este sábado na pedreira de Uruoca foi atingido. Escolha outra data.');
      return;
    }

    if (tipoDia === 'dia_util' && formData.horario_agendamento !== 'outros' && horariosOcupados.includes(formData.horario_agendamento)) {
      setMensagemErro(`O horário ${formData.horario_agendamento} já foi reservado nesta pedreira. Por favor, selecione outro horário disponível.`);
      return;
    }

    if (!formData.material.trim()) {
      setMensagemErro('Informe o material da pedreira.');
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

    if (!formData.numero_bloco.trim()) {
      setMensagemErro('Informe a numeração do bloco.');
      return;
    }

    if (!formData.cliente.trim()) {
      setMensagemErro('Informe o nome do cliente destinatário.');
      return;
    }

    if (tipoDia === 'dia_util' && formData.horario_agendamento === 'outros' && !formData.justificativa_outros.trim()) {
      setMensagemErro('Por favor, especifique o horário solicitado ou a justificativa na opção "Outros".');
      return;
    }

    setEnviando(true);

    const dadosParaSalvar = {
      ...formData,
      tipo_dia: tipoDia,
      horario_agendamento: tipoDia === 'sabado' ? 'Sábado - Cota do Dia (Até 12 Veículos)' : formData.horario_agendamento
    };

    const resultado = await salvarAgendamento(dadosParaSalvar);

    setEnviando(false);

    if (resultado.success) {
      onAgendamentoSucesso(resultado.agendamento);
    } else {
      setMensagemErro(resultado.error || 'Erro ao processar agendamento. Tente novamente.');
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px 0' }}>
      {/* Banner Superior Limpo e Sofisticado */}
      <div className="glass-panel" style={{
        padding: '22px 26px',
        marginBottom: 20,
        background: 'linear-gradient(135deg, rgba(16, 24, 20, 0.95) 0%, rgba(10, 15, 13, 0.98) 100%)',
        border: '1px solid var(--vermont-green-border)',
        boxShadow: 'var(--vermont-green-glow)',
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
        
        {/* BLOCO 1: Destino e Material (Campo Aberto) */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 10 }}>
            <MapPin size={20} color="var(--vermont-green-light)" />
            <h2 style={{ fontSize: '1.15rem', margin: 0 }}>1. Localização, Material & Bloco</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {/* Escolha da Pedreira - Nomenclatura Exata */}
            <div className="form-group">
              <label className="form-label form-label-required">Pedreira de Carregamento</label>
              <select
                className="form-select"
                value={formData.pedreira}
                onChange={(e) => handleChange('pedreira', e.target.value)}
                required
              >
                {PEDREIRAS_CEARA.map(p => (
                  <option key={p.id} value={p.nome}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Material da Pedreira - CAMPO ABERTO IMPUTADO */}
            <div className="form-group">
              <label className="form-label form-label-required">Material da Pedreira</label>
              <input
                type="text"
                className="form-input"
                placeholder="Digite o material da pedreira (campo livre)"
                value={formData.material}
                onChange={(e) => handleChange('material', e.target.value)}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                Informação aberta imputada conforme romaneio ou pedido
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

            {/* Cliente */}
            <div className="form-group">
              <label className="form-label form-label-required">Cliente / Destinatário</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nome da empresa ou cliente do bloco"
                value={formData.cliente}
                onChange={(e) => handleChange('cliente', e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* BLOCO 2: Dados do Transporte & Veículo */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 10 }}>
            <Truck size={20} color="var(--vermont-green-light)" />
            <h2 style={{ fontSize: '1.15rem', margin: 0 }}>2. Dados do Transporte & Veículo</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
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

            {/* Carreta (apenas se não for Truck/Bitruck) */}
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

            {/* 2ª Carreta (apenas se for Bitrem ou Rodotrem) */}
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

        {/* BLOCO 3: Data e Horário com Bloqueio de Horários Utilizados */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 10 }}>
            <Calendar size={20} color="var(--vermont-green-light)" />
            <h2 style={{ fontSize: '1.15rem', margin: 0 }}>3. Data & Horário</h2>
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

            {/* Horários com Indisponibilização em Tempo Real */}
            {tipoDia === 'dia_util' && (
              <div className="form-group animate-fade">
                <label className="form-label form-label-required">
                  Horário de Carregamento
                  {horariosOcupados.length > 0 && (
                    <span style={{ fontSize: '0.74rem', color: '#fca5a5', fontWeight: 500, marginLeft: 6, textTransform: 'none' }}>
                      ({horariosOcupados.length} horário{horariosOcupados.length > 1 ? 's' : ''} já reservado{horariosOcupados.length > 1 ? 's' : ''} nesta data)
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

                <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                  Horários já agendados para a pedreira e data selecionadas ficam bloqueados automaticamente
                </span>
              </div>
            )}

            {/* Sábado: Exclusivo para Uruoca - Cota Máxima de 12 Veículos */}
            {tipoDia === 'sabado' && isPedreiraUruoca(formData.pedreira) && (
              <div className="form-group animate-fade" style={{ gridColumn: '1 / -1' }}>
                <div style={{
                  background: ocupacaoSabado.lotado ? 'var(--danger-bg)' : 'rgba(0, 118, 44, 0.1)',
                  border: ocupacaoSabado.lotado ? '1px solid var(--danger-border)' : '1px solid var(--vermont-green-border)',
                  padding: 16,
                  borderRadius: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Clock size={18} color={ocupacaoSabado.lotado ? '#ef4444' : '#4ade80'} />
                      <strong style={{ color: '#fff', fontSize: '0.95rem' }}>
                        Regra de Sábado (Uruoca): Quantidade Máxima de 12 Veículos
                      </strong>
                    </div>

                    <span className={`badge ${ocupacaoSabado.lotado ? 'badge-danger' : 'badge-vermont'}`}>
                      {carregandoOcupacao ? 'Consultando vagas...' : `${ocupacaoSabado.total} / 12 VAGAS UTILIZADAS`}
                    </span>
                  </div>

                  <p style={{ margin: '4px 0 10px 0', fontSize: '0.84rem', color: 'var(--slate-300)' }}>
                    Aos sábados não há horários fracionados: os 12 veículos cadastrados são atendidos por ordem de chegada no turno do sábado.
                  </p>

                  <div style={{
                    width: '100%',
                    height: 10,
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 999,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(100, (ocupacaoSabado.total / 12) * 100)}%`,
                      height: '100%',
                      background: ocupacaoSabado.lotado ? '#ef4444' : 'linear-gradient(90deg, #10b981 0%, #00762c 70%, #f59e0b 100%)',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.78rem', color: 'var(--slate-400)' }}>
                    <span>0 veículos</span>
                    <strong style={{ color: ocupacaoSabado.disponivel <= 2 ? '#f87171' : '#4ade80' }}>
                      {ocupacaoSabado.disponivel} vagas restantes
                    </strong>
                    <span>Máximo: 12</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sábado: Bloqueado para pedreiras que NÃO sejam Uruoca */}
            {tipoDia === 'sabado' && !isPedreiraUruoca(formData.pedreira) && (
              <div className="animate-fade" style={{
                gridColumn: '1 / -1',
                background: 'var(--warning-bg)',
                border: '1px solid var(--warning-border)',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: '#fef3c7'
              }}>
                <AlertTriangle size={24} color="var(--warning)" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.96rem', color: '#fbbf24' }}>
                    Carregamento Aos Sábados Indisponível nesta Pedreira
                  </strong>
                  <span style={{ fontSize: '0.84rem' }}>
                    A operação aos sábados é <strong>exclusiva para a pedreira de URUOCA - CE (TAJ MAHAL)</strong>. As pedreiras de Massapê, Sobral e São Gonçalo do Amarante operam exclusivamente de segunda a sexta-feira. Selecione uma data de segunda a sexta ou altere a pedreira para Uruoca.
                  </span>
                </div>
              </div>
            )}

            {/* Domingo */}
            {tipoDia === 'domingo' && (
              <div className="animate-fade" style={{
                gridColumn: '1 / -1',
                background: 'var(--warning-bg)',
                border: '1px solid var(--warning-border)',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: '#fef3c7'
              }}>
                <AlertTriangle size={24} color="var(--warning)" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>Pedreiras Fechadas aos Domingos</strong>
                  <span style={{ fontSize: '0.84rem' }}>
                    Não há carregamento aos domingos. Selecione uma data de segunda a sábado.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Campo condicional para opção "Outros" */}
          {tipoDia === 'dia_util' && formData.horario_agendamento === 'outros' && (
            <div className="form-group animate-fade" style={{ marginTop: 16 }}>
              <label className="form-label form-label-required">
                Especificação de Horário & Justificativa (Outros)
              </label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Informe o horário pretendido e a justificativa para carregamento fora das janelas de 20 minutos..."
                value={formData.justificativa_outros}
                onChange={(e) => handleChange('justificativa_outros', e.target.value)}
                required
              />
            </div>
          )}

          {/* Observações Gerais */}
          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Observações Adicionais (Opcional)</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Instruções especiais de carregamento ou orientações operacionais..."
              value={formData.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
            />
          </div>

          {/* NOVO POSICIONAMENTO: Texto de Confirmação de E-mail APÓS as Observações Adicionais */}
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
              Confirmação despachada para <strong style={{ color: '#4ade80' }}>{EMAIL_NOTIFICACAO_DESTINO}</strong>
            </span>
          </div>

          {/* Card Oficial: Documentos Obrigatórios na Pedreira */}
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
              O motorista deverá portar e apresentar obrigatoriamente na portaria:
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.84rem', color: '#e2e8f0', lineHeight: '1.6' }}>
              <li><strong>Obrigatório apresentação de CRLVs do cavalo e carreta atualizados;</strong></li>
              <li><strong>CNH compatível com o veículo;</strong></li>
              <li><strong>Motorista deve possuir o curso de cargas indivisíveis;</strong></li>
              <li><strong>Laudo de inspeção de rochas ou CSV dentro da validade.</strong></li>
            </ul>
          </div>
        </div>

        {/* Botão de Envio */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14 }}>
          <button
            type="submit"
            disabled={
              enviando || 
              tipoDia === 'domingo' || 
              (tipoDia === 'sabado' && (!isPedreiraUruoca(formData.pedreira) || ocupacaoSabado.lotado))
            }
            className="btn btn-vermont glow-effect"
            style={{ padding: '14px 34px', fontSize: '1.05rem', minWidth: 260 }}
          >
            {enviando ? (
              <>
                <span className="spinner" /> Gravando dados...
              </>
            ) : (
              <>
                <Send size={20} />
                Confirmar Agendamento
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
