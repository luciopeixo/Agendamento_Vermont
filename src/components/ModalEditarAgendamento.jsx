import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Edit3, Truck, Calendar, Clock, MapPin, AlertCircle, AlertTriangle, CheckCircle2, History, User, ArrowRight, Building2, Search, RefreshCw } from 'lucide-react';
import { 
  PEDREIRAS_CEARA, 
  TIPOS_VEICULO, 
  HORARIOS_SEMANA, 
  STATUS_AGENDAMENTO,
  obterMateriaisPorPedreira,
  obterConfigPlacas,
  salvarEdicaoAgendamento,
  normalizarHistoricoStatus,
  resolverCnpjCliente,
  resolverCnpjTransportadora,
  limparNomeEmpresa,
  sanitizarNumeroBloco,
  validarFormatoBlocoTajMahal,
  isClienteThorOuArgos,
  isClienteAntolini,
  isMaterialTajMahal,
  limparTagsInternasObservacoes,
  obterStatusConformidadeCNH,
  obterStatusConformidadeCavalo,
  obterStatusConformidadeCarreta,
  formatarCNPJ,
  consultarCNPJReceita,
  obterAgendamentosLocais,
  avaliarAptidaoLiberacaoAgendamento
} from '../services/agendamentoService';
import { 
  verificarStatusEnvelopamentoAgendamento, 
  listarEnvelopamentos 
} from '../services/envelopamentoService';

export function ModalEditarAgendamento({ 
  agendamento, 
  todosAgendamentos = [],
  onFechar, 
  onSalvo, 
  isAdmin = false,
  usuarioInfo = null 
}) {
  if (!agendamento) return null;

  const [formData, setFormData] = useState({
    id: agendamento.id,
    pedreira: agendamento.pedreira || '',
    material: agendamento.material || '',
    numero_bloco: agendamento.numero_bloco || '',
    cliente_cnpj: formatarCNPJ(agendamento.cliente_cnpj || resolverCnpjCliente(agendamento) || ''),
    cliente: limparNomeEmpresa(agendamento.cliente) || '',
    transportadora_cnpj: formatarCNPJ(agendamento.transportadora_cnpj || resolverCnpjTransportadora(agendamento) || ''),
    transportadora: limparNomeEmpresa(agendamento.transportadora) || '',
    motorista_nome: agendamento.motorista_nome || '',
    motorista_cpf: agendamento.motorista_cpf || '',
    motorista_telefone: agendamento.motorista_telefone || '',
    tipo_veiculo: agendamento.tipo_veiculo || TIPOS_VEICULO[0],
    placa_cavalo: agendamento.placa_cavalo || '',
    placa_carreta: agendamento.placa_carreta || '',
    placa_carreta_2: agendamento.placa_carreta_2 || '',
    data_agendamento: agendamento.data_agendamento || '',
    horario_agendamento: agendamento.horario_agendamento || '07:40',
    justificativa_outros: agendamento.justificativa_outros || '',
    observacoes: limparTagsInternasObservacoes(agendamento.observacoes || ''),
    status: agendamento.status || STATUS_AGENDAMENTO.AGUARDANDO
  });

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [materiaisDisponiveis, setMateriaisDisponiveis] = useState([]);

  const [statusCNPJCliente, setStatusCNPJCliente] = useState({
    buscando: false,
    valido: null,
    erro: '',
    encontrado: false,
    razaoSocial: '',
    situacao: ''
  });

  const [statusCNPJTransp, setStatusCNPJTransp] = useState({
    buscando: false,
    valido: null,
    erro: '',
    encontrado: false,
    razaoSocial: '',
    situacao: ''
  });

  useEffect(() => {
    const mats = obterMateriaisPorPedreira(formData.pedreira);
    setMateriaisDisponiveis(mats);
  }, [formData.pedreira]);

  const configPlacas = obterConfigPlacas(formData.tipo_veiculo);

  // Status de conformidade em tempo real para edição
  const statusCNH = useMemo(() => {
    return obterStatusConformidadeCNH(formData.motorista_cpf, formData.data_agendamento, formData.motorista_nome);
  }, [formData.motorista_cpf, formData.data_agendamento, formData.motorista_nome]);

  const statusDocCavalo = useMemo(() => {
    return obterStatusConformidadeCavalo(formData.placa_cavalo, formData.data_agendamento, '', formData.motorista_cpf, formData.motorista_nome);
  }, [formData.placa_cavalo, formData.data_agendamento, formData.motorista_cpf, formData.motorista_nome]);

  const statusDocCarreta1 = useMemo(() => {
    return obterStatusConformidadeCarreta(formData.placa_carreta, formData.data_agendamento, '', formData.motorista_cpf, formData.motorista_nome);
  }, [formData.placa_carreta, formData.data_agendamento, formData.motorista_cpf, formData.motorista_nome]);

  const statusDocCarreta2 = useMemo(() => {
    return obterStatusConformidadeCarreta(formData.placa_carreta_2, formData.data_agendamento, '', formData.motorista_cpf, formData.motorista_nome);
  }, [formData.placa_carreta_2, formData.data_agendamento, formData.motorista_cpf, formData.motorista_nome]);

  const alertaTajMahal = useMemo(() => {
    return validarFormatoBlocoTajMahal({
      material: formData.material,
      pedreira: formData.pedreira,
      cliente: formData.cliente,
      numero_bloco: formData.numero_bloco,
      isAdmin
    });
  }, [formData.material, formData.pedreira, formData.cliente, formData.numero_bloco, isAdmin]);

  const isAntoliniTaj = useMemo(() => {
    return isClienteAntolini(formData.cliente) && isMaterialTajMahal(formData.material, formData.pedreira);
  }, [formData.cliente, formData.material, formData.pedreira]);

  // Sincronização em tempo real do status de envelopamento do bloco
  const [infoEnvelopamento, setInfoEnvelopamento] = useState(null);
  const [listaEnvelopamentos, setListaEnvelopamentos] = useState([]);

  useEffect(() => {
    let ativo = true;
    if (formData.numero_bloco && formData.numero_bloco.length >= 2) {
      listarEnvelopamentos().then(envs => {
        if (ativo) {
          setListaEnvelopamentos(envs || []);
          const res = verificarStatusEnvelopamentoAgendamento(formData, envs);
          setInfoEnvelopamento(res);
        }
      }).catch(() => {});
    } else {
      setInfoEnvelopamento(null);
    }
    return () => { ativo = false; };
  }, [formData.numero_bloco, formData.cliente, formData.cliente_cnpj, formData.material, formData.pedreira]);

  const handleChange = (campo, valor) => {
    setFormData(prev => {
      const novo = { ...prev, [campo]: valor };
      if (campo === 'pedreira') {
        const novosMats = obterMateriaisPorPedreira(valor);
        if (novosMats.length > 0 && !novosMats.includes(prev.material)) {
          novo.material = novosMats[0];
        }
      }
      return novo;
    });
  };

  const consultarReceitaCliente = async (cnpjParaConsultar = formData.cliente_cnpj) => {
    const limpo = String(cnpjParaConsultar || '').replace(/\D/g, '');
    if (limpo.length !== 14) {
      if (limpo.length > 0) {
        setStatusCNPJCliente({
          buscando: false,
          valido: false,
          erro: 'CNPJ incompleto (deve conter 14 dígitos).',
          encontrado: false,
          razaoSocial: '',
          situacao: ''
        });
      }
      return;
    }

    setStatusCNPJCliente(prev => ({ ...prev, buscando: true, erro: '' }));
    try {
      const resultado = await consultarCNPJReceita(limpo);
      if (!resultado.valido) {
        setStatusCNPJCliente({
          buscando: false,
          valido: false,
          erro: resultado.erro || 'CNPJ inválido (dígitos verificadores incorretos).',
          encontrado: false,
          razaoSocial: '',
          situacao: ''
        });
      } else if (resultado.encontrado && (resultado.razao_social || resultado.empresa)) {
        const razao = (resultado.razao_social || resultado.empresa?.razao_social || resultado.empresa?.nome_fantasia || '').toUpperCase().trim();
        const situacao = resultado.empresa?.situacao_cadastral || 'ATIVA';
        setStatusCNPJCliente({
          buscando: false,
          valido: true,
          erro: '',
          encontrado: true,
          razaoSocial: razao,
          situacao: situacao
        });
        if (razao) {
          handleChange('cliente', razao);
        }
      } else {
        setStatusCNPJCliente({
          buscando: false,
          valido: true,
          erro: '',
          encontrado: false,
          razaoSocial: '',
          situacao: ''
        });
      }
    } catch (e) {
      setStatusCNPJCliente({
        buscando: false,
        valido: null,
        erro: 'Erro na consulta Receita.',
        encontrado: false,
        razaoSocial: '',
        situacao: ''
      });
    }
  };

  const handleCNPJClienteChange = async (valor) => {
    const formatado = formatarCNPJ(valor);
    handleChange('cliente_cnpj', formatado);

    const limpo = formatado.replace(/\D/g, '');
    if (limpo.length === 14) {
      await consultarReceitaCliente(formatado);
    } else {
      setStatusCNPJCliente({
        buscando: false,
        valido: null,
        erro: '',
        encontrado: false,
        razaoSocial: '',
        situacao: ''
      });
    }
  };

  const consultarReceitaTransportadora = async (cnpjParaConsultar = formData.transportadora_cnpj) => {
    const limpo = String(cnpjParaConsultar || '').replace(/\D/g, '');
    if (limpo.length !== 14) {
      if (limpo.length > 0) {
        setStatusCNPJTransp({
          buscando: false,
          valido: false,
          erro: 'CNPJ incompleto (deve conter 14 dígitos).',
          encontrado: false,
          razaoSocial: '',
          situacao: ''
        });
      }
      return;
    }

    setStatusCNPJTransp(prev => ({ ...prev, buscando: true, erro: '' }));
    try {
      const resultado = await consultarCNPJReceita(limpo);
      if (!resultado.valido) {
        setStatusCNPJTransp({
          buscando: false,
          valido: false,
          erro: resultado.erro || 'CNPJ inválido (dígitos verificadores incorretos).',
          encontrado: false,
          razaoSocial: '',
          situacao: ''
        });
      } else if (resultado.encontrado && (resultado.razao_social || resultado.empresa)) {
        const razao = (resultado.razao_social || resultado.empresa?.razao_social || resultado.empresa?.nome_fantasia || '').toUpperCase().trim();
        const situacao = resultado.empresa?.situacao_cadastral || 'ATIVA';
        setStatusCNPJTransp({
          buscando: false,
          valido: true,
          erro: '',
          encontrado: true,
          razaoSocial: razao,
          situacao: situacao
        });
        if (razao) {
          handleChange('transportadora', razao);
        }
      } else {
        setStatusCNPJTransp({
          buscando: false,
          valido: true,
          erro: '',
          encontrado: false,
          razaoSocial: '',
          situacao: ''
        });
      }
    } catch (e) {
      setStatusCNPJTransp({
        buscando: false,
        valido: null,
        erro: 'Erro na consulta Receita.',
        encontrado: false,
        razaoSocial: '',
        situacao: ''
      });
    }
  };

  const handleCNPJTransportadoraChange = async (valor) => {
    const formatado = formatarCNPJ(valor);
    handleChange('transportadora_cnpj', formatado);

    const limpo = formatado.replace(/\D/g, '');
    if (limpo.length === 14) {
      await consultarReceitaTransportadora(formatado);
    } else {
      setStatusCNPJTransp({
        buscando: false,
        valido: null,
        erro: '',
        encontrado: false,
        razaoSocial: '',
        situacao: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);

    const blocoLimpo = sanitizarNumeroBloco(formData.numero_bloco, false, isAntoliniTaj, isAdmin);
    if (!blocoLimpo) {
      setErro('Informe a numeração do bloco.');
      setSalvando(false);
      return;
    }

    const valTaj = validarFormatoBlocoTajMahal({
      material: formData.material,
      pedreira: formData.pedreira,
      cliente: formData.cliente,
      numero_bloco: blocoLimpo,
      isAdmin
    });
    if (!valTaj.valido) {
      setErro(valTaj.mensagem);
      setSalvando(false);
      return;
    }

    const dadosParaSalvar = {
      ...agendamento,
      ...formData,
      id: agendamento.id,
      numero_bloco: blocoLimpo
    };

    if (!isAdmin && agendamento.status === 'Aguardando Liberação' && formData.status !== 'Aguardando Liberação') {
      setErro('Acesso restrito: Agendamentos com status "Aguardando Liberação" só podem ser liberados ou alterados pelo Administrador Geral.');
      setSalvando(false);
      return;
    }

    if (!isAdmin && (agendamento.status === 'Finalizado' || agendamento.status === 'Carregado') && formData.status !== agendamento.status) {
      setErro('Acesso restrito: Agendamentos com status "Finalizado" estão concluídos e bloqueados para alteração pelas pedreiras. Apenas o Administrador Geral pode alterar ou reverter.');
      setSalvando(false);
      return;
    }

    if (!isAdmin && formData.status === 'Aguardando Liberação' && agendamento.status !== 'Aguardando Liberação') {
      setErro('Acesso restrito: Apenas o Administrador Geral pode reverter o status para "Aguardando Liberação".');
      setSalvando(false);
      return;
    }

    const res = await salvarEdicaoAgendamento(dadosParaSalvar, usuarioInfo || { isAdmin }, agendamento);
    setSalvando(false);

    if (res.success) {
      onSalvo(res.data);
      onFechar();
    } else {
      setErro(res.error || 'Erro ao salvar alterações do agendamento.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 10, 8, 0.88)',
      backdropFilter: 'blur(8px)',
      zIndex: 400,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }}>
      <div 
        className="glass-panel animate-fade"
        style={{
          width: '100%',
          maxWidth: 720,
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: '24px 28px',
          background: 'var(--bg-card-solid, #0d1310)',
          border: '1px solid var(--vermont-green-border)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), var(--vermont-green-glow)',
          position: 'relative',
          borderRadius: 16
        }}
      >
        {/* Topo do Modal */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 16,
          borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
          marginBottom: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: 'var(--vermont-green-subtle)',
              border: '1px solid var(--vermont-green-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--vermont-green-light)'
            }}>
              <Edit3 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--slate-100)' }}>
                Editar Informações do Carregamento
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--vermont-green-light)', fontFamily: 'monospace', fontWeight: 600 }}>
                Protocolo: #{agendamento.id ? String(agendamento.id).substring(0, 8).toUpperCase() : 'N/A'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--slate-400)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8
            }}
          >
            <X size={20} />
          </button>
        </div>

        {erro && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: '#fca5a5',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: '0.84rem',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Card Inteligente de Indicação de Liberação (Exclusivo Admin) */}
          {isAdmin && formData.status === 'Aguardando Liberação' && (() => {
            const aptidao = avaliarAptidaoLiberacaoAgendamento(formData, listaEnvelopamentos, todosAgendamentos);
            return (
              <div style={{
                background: aptidao.apto ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: aptidao.apto ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 10,
                padding: '12px 16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1rem' }}>{aptidao.apto ? '🟢' : '🔴'}</span>
                    <strong style={{ color: aptidao.apto ? '#4ade80' : '#f87171', fontSize: '0.86rem' }}>
                      {aptidao.apto 
                        ? (aptidao.isCargaCombinada ? 'Indicação: Carga Combinada Apta para Liberação' : 'Indicação: Apto para Liberação') 
                        : 'Indicação: Não Recomendado para Liberação'}
                    </strong>
                  </div>
                  <span style={{
                    background: aptidao.badge.bg,
                    color: aptidao.badge.cor,
                    border: `1px solid ${aptidao.badge.border}`,
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    fontWeight: 800
                  }}>
                    {aptidao.badge.label}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: '0.76rem' }}>
                  {/* Item 1 */}
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: 6, border: aptidao.bloco.apto ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(239,68,68,0.2)' }}>
                    <span style={{ color: aptidao.bloco.apto ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                      1. Bloco: {aptidao.bloco.label}
                    </span>
                    <div style={{ color: 'var(--slate-400)', fontSize: '0.70rem', marginTop: 2 }}>{aptidao.bloco.mensagem}</div>
                  </div>

                  {/* Item 2 */}
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: 6, border: aptidao.peso.apto ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(239,68,68,0.2)' }}>
                    <span style={{ color: aptidao.peso.apto ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                      2. {aptidao.isCargaCombinada ? 'Peso Total Combinado:' : 'Peso vs Porte:'} {aptidao.peso.pesoFormatado}
                    </span>
                    <div style={{ color: 'var(--slate-400)', fontSize: '0.70rem', marginTop: 2 }}>{aptidao.peso.mensagem}</div>
                  </div>

                  {/* Item 3 */}
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: 6, border: aptidao.documentos.apto ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(239,68,68,0.2)' }}>
                    <span style={{ color: aptidao.documentos.apto ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                      3. Docs: {aptidao.documentos.status === 'REGULAR' ? 'Regular' : aptidao.documentos.status === 'AVENCER' ? 'A Vencer' : aptidao.documentos.status === 'VENCIDO' ? 'Vencido' : 'Pendente'}
                    </span>
                    <div style={{ color: 'var(--slate-400)', fontSize: '0.70rem', marginTop: 2 }}>{aptidao.documentos.mensagem}</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Seção 1: Dados do Bloco & Pedreira */}
          <div style={{
            background: 'var(--bg-card-hover, rgba(255, 255, 255, 0.02))',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
            borderRadius: 10,
            padding: '16px 18px'
          }}>
            <strong style={{ color: 'var(--vermont-green-light)', fontSize: '0.88rem', display: 'block', marginBottom: 12 }}>
              🪨 Informações do Bloco & Pedreira
            </strong>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <label className="form-label form-label-required" style={{ margin: 0 }}>Número do Bloco</label>
                    {infoEnvelopamento?.registro?.peso_kg && (
                      <span
                        title={`⚖️ Peso Cadastrado: ${infoEnvelopamento.registro.peso_kg} kg`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 17,
                          height: 17,
                          borderRadius: '50%',
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.45)',
                          color: '#38bdf8',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          cursor: 'help',
                          userSelect: 'none',
                          lineHeight: 1
                        }}
                      >
                        ?
                      </span>
                    )}
                  </div>
                  {infoEnvelopamento && (
                    <span
                      title={`Status Envelopamento: ${infoEnvelopamento.label} (${infoEnvelopamento.descricao})`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: infoEnvelopamento.bg,
                        border: `1px solid ${infoEnvelopamento.border}`,
                        color: infoEnvelopamento.cor,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 4
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: infoEnvelopamento.cor,
                          boxShadow: infoEnvelopamento.isEnvelopadoOuLiberado 
                            ? '0 0 5px rgba(34, 197, 94, 0.8)' 
                            : infoEnvelopamento.status === 'nao_registrado'
                              ? 'none'
                              : '0 0 5px rgba(239, 68, 68, 0.8)',
                          display: 'inline-block'
                        }}
                      />
                      {infoEnvelopamento.label}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder={isAntoliniTaj ? "Ex: 2510TM ou 2510TM, 2511TM" : "Ex: 1256926"}
                  style={{ textTransform: 'uppercase', fontWeight: 700 }}
                  value={formData.numero_bloco}
                  onChange={(e) => handleChange('numero_bloco', e.target.value.toUpperCase())}
                  onBlur={(e) => handleChange('numero_bloco', sanitizarNumeroBloco(e.target.value, false, isAntoliniTaj, isAdmin))}
                  required
                />
                {isAntoliniTaj && (
                  <span style={{ fontSize: '0.74rem', color: '#38bdf8', display: 'block', marginTop: 4, fontWeight: 600 }}>
                    ℹ️ Blocos do Taj Mahal para Antolini devem terminar com <strong>TM</strong> (Ex: 2510TM, 2511TM).
                  </span>
                )}
                {isAdmin && (
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: 3 }}>
                    🔓 Edição Administrador: Permite salvar bloco com barra ("/") ou sem barra livremente.
                  </span>
                )}
                {!alertaTajMahal.valido && (
                  <span className="animate-fade" style={{ fontSize: '0.74rem', color: '#fca5a5', display: 'block', marginTop: 4, fontWeight: 600 }}>
                    ⚠️ {alertaTajMahal.mensagem}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label form-label-required">Pedreira</label>
                <select
                  className="form-select"
                  value={formData.pedreira}
                  onChange={(e) => handleChange('pedreira', e.target.value)}
                  disabled={!isAdmin}
                  required
                >
                  {PEDREIRAS_CEARA.map(p => (
                    <option key={p.id} value={p.nome}>{p.nome}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label form-label-required">Material da Pedreira</label>
                {materiaisDisponiveis.length > 0 ? (
                  <select
                    className="form-select"
                    value={formData.material}
                    onChange={(e) => handleChange('material', e.target.value)}
                    required
                  >
                    {materiaisDisponiveis.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    <option value="Outro">Outro Material</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    value={formData.material}
                    onChange={(e) => handleChange('material', e.target.value)}
                    required
                  />
                )}
              </div>

              <div className="form-group">
                <label className="form-label form-label-required">Status Operacional</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  disabled={!isAdmin && (agendamento.status === 'Aguardando Liberação' || agendamento.status === 'Finalizado' || agendamento.status === 'Carregado')}
                  style={{
                    fontWeight: 700,
                    color: formData.status === 'Finalizado' ? '#34d399' : formData.status === 'Carregando' ? '#38bdf8' : formData.status === 'Liberado para Carregar' ? '#c084fc' : formData.status === 'Cancelado' ? '#f87171' : '#fbbf24',
                    cursor: !isAdmin && (agendamento.status === 'Aguardando Liberação' || agendamento.status === 'Finalizado' || agendamento.status === 'Carregado') ? 'not-allowed' : undefined,
                    opacity: !isAdmin && (agendamento.status === 'Aguardando Liberação' || agendamento.status === 'Finalizado' || agendamento.status === 'Carregado') ? 0.75 : undefined
                  }}
                >
                  {isAdmin ? (
                    <option value="Aguardando Liberação">🟡 Aguardando Liberação</option>
                  ) : (
                    formData.status === 'Aguardando Liberação' && (
                      <option value="Aguardando Liberação">🟡 Aguardando Liberação (Bloqueado)</option>
                    )
                  )}
                  <option value="Liberado para Carregar">🟣 Liberado para Carregar</option>
                  <option value="Carregando">🔵 Carregando</option>
                  <option value="Finalizado">🟢 Finalizado</option>
                  <option value="Cancelado">🔴 Cancelado</option>
                </select>
                {!isAdmin && agendamento.status === 'Aguardando Liberação' ? (
                  <span style={{ fontSize: '0.72rem', color: '#fde68a', fontWeight: 600, display: 'block', marginTop: 4 }}>
                    🔒 Agendamentos em "Aguardando Liberação" só podem ter o status alterado pelo Administrador Geral.
                  </span>
                ) : !isAdmin && (agendamento.status === 'Finalizado' || agendamento.status === 'Carregado') ? (
                  <span style={{ fontSize: '0.72rem', color: '#86efac', fontWeight: 600, display: 'block', marginTop: 4 }}>
                    🔒 Agendamentos "Finalizados" estão concluídos e bloqueados para alteração pelas pedreiras. Apenas o Administrador Geral pode reverter.
                  </span>
                ) : !isAdmin && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)', marginTop: 2, display: 'block' }}>
                    🔒 Reversão para "Aguardando Liberação" é exclusiva do Administrador Geral.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Seção 2: Cliente Destinatário */}
          <div style={{
            background: 'var(--bg-card-hover, rgba(255, 255, 255, 0.02))',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
            borderRadius: 10,
            padding: '16px 18px'
          }}>
            <strong style={{ color: 'var(--vermont-green-light)', fontSize: '0.88rem', display: 'block', marginBottom: 12 }}>
              🏢 Cliente Destinatário
            </strong>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>CNPJ Destinatário</span>
                  {statusCNPJCliente.buscando && (
                    <span style={{ fontSize: '0.72rem', color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} /> Consultando Receita...
                    </span>
                  )}
                  {statusCNPJCliente.valido === false && (
                    <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 600 }}>
                      ❌ CNPJ Inválido
                    </span>
                  )}
                  {statusCNPJCliente.encontrado && (
                    <span style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Building2 size={12} /> Receita OK ({statusCNPJCliente.situacao})
                    </span>
                  )}
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    value={formData.cliente_cnpj}
                    onChange={(e) => handleCNPJClienteChange(e.target.value)}
                    onBlur={() => {
                      const dig = String(formData.cliente_cnpj || '').replace(/\D/g, '');
                      if (dig.length === 14) {
                        consultarReceitaCliente(formData.cliente_cnpj);
                      }
                    }}
                    style={{
                      flex: 1,
                      borderColor: statusCNPJCliente.valido === false ? '#ef4444' : statusCNPJCliente.encontrado ? '#00a83e' : undefined
                    }}
                  />
                  <button
                    type="button"
                    title="Consultar CNPJ na Receita Federal"
                    onClick={() => consultarReceitaCliente(formData.cliente_cnpj)}
                    disabled={statusCNPJCliente.buscando}
                    style={{
                      padding: '0 12px',
                      background: 'rgba(0, 168, 62, 0.15)',
                      border: '1px solid rgba(0, 168, 62, 0.35)',
                      color: 'var(--vermont-green-light)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {statusCNPJCliente.buscando ? (
                      <RefreshCw size={15} className="spinner" />
                    ) : (
                      <Search size={15} />
                    )}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Cliente Destinatário</span>
                  {(Boolean(formData.cliente_cnpj && formData.cliente_cnpj.replace(/\D/g, '').length >= 14) || statusCNPJCliente.encontrado) && (
                    <span style={{ fontSize: '0.72rem', color: '#86efac', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      🔒 Nomenclatura da Receita Federal
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Razão Social oficial da Receita Federal"
                  value={formData.cliente}
                  onChange={(e) => handleChange('cliente', e.target.value.toUpperCase())}
                  readOnly={Boolean((formData.cliente_cnpj && formData.cliente_cnpj.replace(/\D/g, '').length >= 14) || statusCNPJCliente.encontrado)}
                  style={{
                    backgroundColor: (Boolean(formData.cliente_cnpj && formData.cliente_cnpj.replace(/\D/g, '').length >= 14) || statusCNPJCliente.encontrado) ? 'rgba(0, 168, 62, 0.08)' : undefined,
                    borderColor: (Boolean(formData.cliente_cnpj && formData.cliente_cnpj.replace(/\D/g, '').length >= 14) || statusCNPJCliente.encontrado) ? 'rgba(0, 168, 62, 0.4)' : undefined,
                    cursor: (Boolean(formData.cliente_cnpj && formData.cliente_cnpj.replace(/\D/g, '').length >= 14) || statusCNPJCliente.encontrado) ? 'not-allowed' : undefined,
                    color: (Boolean(formData.cliente_cnpj && formData.cliente_cnpj.replace(/\D/g, '').length >= 14) || statusCNPJCliente.encontrado) ? '#e2e8f0' : undefined,
                    fontWeight: (Boolean(formData.cliente_cnpj && formData.cliente_cnpj.replace(/\D/g, '').length >= 14) || statusCNPJCliente.encontrado) ? 600 : undefined
                  }}
                />
                {(Boolean(formData.cliente_cnpj && formData.cliente_cnpj.replace(/\D/g, '').length >= 14) || statusCNPJCliente.encontrado) && (
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: 3 }}>
                    🔒 O nome é obtido e bloqueado automaticamente através da base da Receita Federal para manter a padronização oficial.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Seção 3: Data e Horário */}
          <div style={{
            background: 'var(--bg-card-hover, rgba(255, 255, 255, 0.02))',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
            borderRadius: 10,
            padding: '16px 18px'
          }}>
            <strong style={{ color: 'var(--vermont-green-light)', fontSize: '0.88rem', display: 'block', marginBottom: 12 }}>
              📅 Data & Horário do Carregamento
            </strong>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div className="form-group">
                <label className="form-label form-label-required">Data do Agendamento</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ colorScheme: 'dark' }}
                  value={formData.data_agendamento}
                  onChange={(e) => handleChange('data_agendamento', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label form-label-required">Horário Agendado</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.horario_agendamento}
                  onChange={(e) => handleChange('horario_agendamento', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Seção 4: Transporte, Motorista e Placas */}
          <div style={{
            background: 'var(--bg-card-hover, rgba(255, 255, 255, 0.02))',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
            borderRadius: 10,
            padding: '16px 18px'
          }}>
            <strong style={{ color: 'var(--vermont-green-light)', fontSize: '0.88rem', display: 'block', marginBottom: 12 }}>
              🚛 Transporte, Motorista & Placas
            </strong>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>CNPJ Transportadora</span>
                  {statusCNPJTransp.buscando && (
                    <span style={{ fontSize: '0.72rem', color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} /> Consultando Receita...
                    </span>
                  )}
                  {statusCNPJTransp.valido === false && (
                    <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 600 }}>
                      ❌ CNPJ Inválido
                    </span>
                  )}
                  {statusCNPJTransp.encontrado && (
                    <span style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Building2 size={12} /> Receita OK ({statusCNPJTransp.situacao})
                    </span>
                  )}
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    value={formData.transportadora_cnpj}
                    onChange={(e) => handleCNPJTransportadoraChange(e.target.value)}
                    onBlur={() => {
                      const dig = String(formData.transportadora_cnpj || '').replace(/\D/g, '');
                      if (dig.length === 14) {
                        consultarReceitaTransportadora(formData.transportadora_cnpj);
                      }
                    }}
                    style={{
                      flex: 1,
                      borderColor: statusCNPJTransp.valido === false ? '#ef4444' : statusCNPJTransp.encontrado ? '#00a83e' : undefined
                    }}
                  />
                  <button
                    type="button"
                    title="Consultar CNPJ na Receita Federal"
                    onClick={() => consultarReceitaTransportadora(formData.transportadora_cnpj)}
                    disabled={statusCNPJTransp.buscando}
                    style={{
                      padding: '0 12px',
                      background: 'rgba(0, 168, 62, 0.15)',
                      border: '1px solid rgba(0, 168, 62, 0.35)',
                      color: 'var(--vermont-green-light)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {statusCNPJTransp.buscando ? (
                      <RefreshCw size={15} className="spinner" />
                    ) : (
                      <Search size={15} />
                    )}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Transportadora</span>
                  {(Boolean(formData.transportadora_cnpj && formData.transportadora_cnpj.replace(/\D/g, '').length >= 14) || statusCNPJTransp.encontrado) && (
                    <span style={{ fontSize: '0.72rem', color: '#86efac', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      🔒 Nomenclatura da Receita Federal
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Razão Social oficial da Transportadora"
                  value={formData.transportadora}
                  onChange={(e) => handleChange('transportadora', e.target.value.toUpperCase())}
                  readOnly={Boolean((formData.transportadora_cnpj && formData.transportadora_cnpj.replace(/\D/g, '').length >= 14) || statusCNPJTransp.encontrado)}
                  style={{
                    backgroundColor: (Boolean(formData.transportadora_cnpj && formData.transportadora_cnpj.replace(/\D/g, '').length >= 14) || statusCNPJTransp.encontrado) ? 'rgba(0, 168, 62, 0.08)' : undefined,
                    borderColor: (Boolean(formData.transportadora_cnpj && formData.transportadora_cnpj.replace(/\D/g, '').length >= 14) || statusCNPJTransp.encontrado) ? 'rgba(0, 168, 62, 0.4)' : undefined,
                    cursor: (Boolean(formData.transportadora_cnpj && formData.transportadora_cnpj.replace(/\D/g, '').length >= 14) || statusCNPJTransp.encontrado) ? 'not-allowed' : undefined,
                    color: (Boolean(formData.transportadora_cnpj && formData.transportadora_cnpj.replace(/\D/g, '').length >= 14) || statusCNPJTransp.encontrado) ? '#e2e8f0' : undefined,
                    fontWeight: (Boolean(formData.transportadora_cnpj && formData.transportadora_cnpj.replace(/\D/g, '').length >= 14) || statusCNPJTransp.encontrado) ? 600 : undefined
                  }}
                />
                {(Boolean(formData.transportadora_cnpj && formData.transportadora_cnpj.replace(/\D/g, '').length >= 14) || statusCNPJTransp.encontrado) && (
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: 3 }}>
                    🔒 O nome da transportadora é obtido e bloqueado automaticamente através da base da Receita Federal.
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Motorista</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.motorista_nome}
                  onChange={(e) => handleChange('motorista_nome', e.target.value.toUpperCase())}
                />
              </div>

              <div className="form-group">
                <label className="form-label">CPF Motorista</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.motorista_cpf}
                  onChange={(e) => handleChange('motorista_cpf', e.target.value)}
                />
                {statusCNH && statusCNH.cadastrado && statusCNH.status !== 'sem_cnh' && (
                  <div className="animate-fade" style={{
                    marginTop: 4,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: statusCNH.bg || 'rgba(255,255,255,0.05)',
                    border: `1px solid ${statusCNH.cor}40`,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: statusCNH.cor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span>{statusCNH.status === 'valido' ? '🟢' : statusCNH.status === 'avencer' ? '🟡' : '🔴'}</span>
                    <span>{statusCNH.label}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp / Telefone</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.motorista_telefone}
                  onChange={(e) => handleChange('motorista_telefone', e.target.value)}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label className="form-label" style={{ margin: 0 }}>Tipo de Veículo</label>
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: 'rgba(0, 118, 44, 0.15)',
                    border: '1px solid rgba(0, 118, 44, 0.35)',
                    color: 'var(--vermont-green-light)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <Truck size={12} />
                    Porte: {formData.tipo_veiculo}
                  </span>
                </div>
                <select
                  className="form-select"
                  value={formData.tipo_veiculo}
                  onChange={(e) => handleChange('tipo_veiculo', e.target.value)}
                  style={{ fontWeight: 600 }}
                >
                  {TIPOS_VEICULO.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <div style={{
                  marginTop: 6,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'var(--warning-bg)',
                  border: '1px solid var(--warning-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.78rem',
                  color: 'var(--warning-text)'
                }}>
                  <AlertTriangle size={15} color="var(--warning-icon)" style={{ flexShrink: 0 }} />
                  <span>
                    <strong style={{ color: 'var(--warning-title)' }}>Atenção ao Porte:</strong> Certifique-se de que o tipo selecionado ({formData.tipo_veiculo}) é o veículo correto que comparecerá à pedreira.
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{configPlacas.labelCavalo || 'Placa Cavalo'}</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}
                  value={formData.placa_cavalo}
                  onChange={(e) => handleChange('placa_cavalo', e.target.value.toUpperCase())}
                />
                {statusDocCavalo && statusDocCavalo.cadastrado && (
                  <div className="animate-fade" style={{
                    marginTop: 4,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: statusDocCavalo.bg || 'rgba(255,255,255,0.05)',
                    border: `1px solid ${statusDocCavalo.cor}40`,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: statusDocCavalo.cor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span>{statusDocCavalo.status === 'valido' ? '🟢' : statusDocCavalo.status === 'avencer' ? '🟡' : '🔴'}</span>
                    <span>{statusDocCavalo.label}</span>
                  </div>
                )}
              </div>

              {configPlacas.exigeCarreta1 && (
                <div className="form-group">
                  <label className="form-label">{configPlacas.labelCarreta1 || 'Placa Carreta'}</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}
                    value={formData.placa_carreta}
                    onChange={(e) => handleChange('placa_carreta', e.target.value.toUpperCase())}
                  />
                  {statusDocCarreta1 && statusDocCarreta1.cadastrado && (
                    <div className="animate-fade" style={{
                      marginTop: 4,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: statusDocCarreta1.bg || 'rgba(255,255,255,0.05)',
                      border: `1px solid ${statusDocCarreta1.cor}40`,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: statusDocCarreta1.cor,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <span>{statusDocCarreta1.status === 'valido' ? '🟢' : statusDocCarreta1.status === 'avencer' ? '🟡' : '🔴'}</span>
                      <span>{statusDocCarreta1.label}</span>
                    </div>
                  )}
                </div>
              )}

              {configPlacas.exigeCarreta2 && (
                <div className="form-group">
                  <label className="form-label">{configPlacas.labelCarreta2 || 'Placa 2ª Carreta'}</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}
                    value={formData.placa_carreta_2}
                    onChange={(e) => handleChange('placa_carreta_2', e.target.value.toUpperCase())}
                  />
                  {statusDocCarreta2 && statusDocCarreta2.cadastrado && (
                    <div className="animate-fade" style={{
                      marginTop: 4,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: statusDocCarreta2.bg || 'rgba(255,255,255,0.05)',
                      border: `1px solid ${statusDocCarreta2.cor}40`,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: statusDocCarreta2.cor,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <span>{statusDocCarreta2.status === 'valido' ? '🟢' : statusDocCarreta2.status === 'avencer' ? '🟡' : '🔴'}</span>
                      <span>{statusDocCarreta2.label}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Seção 4: Campo de Observações / Ocorrências */}
          <div style={{
            background: 'var(--vermont-green-subtle)',
            border: '1px solid var(--vermont-green-border)',
            borderRadius: 10,
            padding: '16px 18px'
          }}>
            <label className="form-label" style={{ color: 'var(--vermont-green-light)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              📝 Observações Operacionais, Ocorrências & Balança
            </label>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.76rem', color: 'var(--slate-400)' }}>
              Registre anotações da expedição, pesagem líquida/bruta, autorizações especiais ou justificativas.
            </p>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Ex: Peso líquido 28.400 kg | Conferido por João na balança | Bloco liberado com laudo anexo..."
              value={formData.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
              style={{ resize: 'vertical', fontSize: '0.85rem' }}
            />
          </div>

          {/* Seção 5: Registro de Auditoria / Histórico de Alterações */}
          {normalizarHistoricoStatus(agendamento.historico_status).length > 0 && (
            <div style={{
              background: 'var(--bg-card-hover, rgba(15, 23, 42, 0.65))',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
              borderRadius: 10,
              padding: '14px 18px'
            }}>
              <label className="form-label" style={{ color: '#0284c7', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <History size={15} /> Histórico de Alterações ({normalizarHistoricoStatus(agendamento.historico_status).length})
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                {normalizarHistoricoStatus(agendamento.historico_status).slice(0, 8).map((h, i) => {
                  const isEdicao = h.tipo === 'edicao_dados' || (Array.isArray(h.alteracoes) && h.alteracoes.length > 0);

                  return (
                    <div key={h.id || i} style={{
                      fontSize: '0.74rem',
                      background: isEdicao ? 'var(--info-bg)' : 'var(--bg-card, rgba(255, 255, 255, 0.03))',
                      border: isEdicao ? '1px solid var(--info-border)' : '1px solid var(--border-subtle)',
                      padding: '6px 10px',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 6
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {isEdicao ? (
                          <>
                            <span style={{ color: '#0284c7', fontWeight: 600 }}>✏️ {h.descricao || 'Alteração Cadastral'}</span>
                          </>
                        ) : (
                          <>
                            <span style={{ color: 'var(--slate-400)' }}>{h.status_anterior}</span>
                            <ArrowRight size={11} color="var(--slate-400)" />
                            <span style={{ color: 'var(--vermont-green)', fontWeight: 600 }}>{h.status_novo}</span>
                          </>
                        )}
                      </div>
                      <div style={{ color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span><strong style={{ color: 'var(--slate-200)' }}>{h.usuario_nome}</strong> ({h.usuario_role})</span>
                        <span>•</span>
                        <span>{h.data_hora ? new Date(h.data_hora).toLocaleString('pt-BR') : ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={onFechar}
              className="btn btn-secondary"
              style={{ padding: '10px 20px' }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={salvando}
              className="btn btn-vermont"
              style={{ padding: '10px 24px', fontWeight: 700 }}
            >
              {salvando ? (
                <>
                  <span className="spinner" /> Salvando...
                </>
              ) : (
                <>
                  <Save size={18} /> Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
