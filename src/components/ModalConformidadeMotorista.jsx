import React, { useState, useEffect } from 'react';
import { 
  X, Save, ShieldCheck, ShieldAlert, AlertTriangle, AlertCircle, 
  Truck, User, FileText, Calendar, CheckCircle2, Clock, Info, Trash2
} from 'lucide-react';
import { 
  salvarMotoristaFrotaConformidade, 
  excluirMotoristaFrota, 
  formatarCPF, 
  formatarCNPJ, 
  validarCPF,
  obterBaseMotoristas,
  obterInfoLicenciamentoPorPlaca,
  calcularVencimentoCRLVPorPlaca,
  avaliarCRLVComDetran,
  avaliarLaudoRocha,
  ESTADOS_BRASIL,
  identificarUFPelaPlaca
} from '../services/agendamentoService';

export function ModalConformidadeMotorista({ 
  motoristaInicial = null, 
  aoFechar, 
  aoSalvar,
  usuarioNome = 'ADMIN'
}) {
  const [formData, setFormData] = useState({
    cpf: '',
    nome: '',
    telefone: '',
    transportadora: '',
    transportadora_cnpj: '',
    tipo_veiculo: 'Carreta / Bitrem',
    placa_cavalo: '',
    uf_cavalo: 'ES',
    crlv_validade_cavalo: '',
    placa_carreta: '',
    uf_carreta: 'ES',
    crlv_validade_carreta: '',
    validade_laudo_rocha: '',
    placa_carreta_2: '',
    uf_carreta_2: 'ES',
    crlv_validade_carreta_2: '',
    validade_laudo_rocha_2: '',
    cnh_categoria: 'E',
    cnh_validade: '',
    status_documental: 'REGULAR',
    observacoes: ''
  });

  const [temCarreta2, setTemCarreta2] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (motoristaInicial) {
      const cpfLimpo = String(motoristaInicial.cpf || '').replace(/\D/g, '');
      const base = obterBaseMotoristas();
      const motBase = cpfLimpo ? base.find(m => String(m.cpf).replace(/\D/g, '') === cpfLimpo) : null;
      
      const limpaCav = String(motoristaInicial.placa_cavalo || motBase?.placa_cavalo || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
      const veicCav = limpaCav ? base.find(m => String(m.placa_cavalo || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === limpaCav && m.crlv_validade_cavalo) : null;

      const limpaCarr = String(motoristaInicial.placa_carreta || motBase?.placa_carreta || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
      const veicCarr = limpaCarr ? base.find(m => (
        String(m.placa_carreta || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === limpaCarr ||
        String(m.placa_carreta_2 || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === limpaCarr
      ) && (m.crlv_validade_carreta || m.validade_laudo_rocha)) : null;

      const limpaCarr2 = String(motoristaInicial.placa_carreta_2 || motBase?.placa_carreta_2 || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
      const veicCarr2 = limpaCarr2 ? base.find(m => (
        String(m.placa_carreta_2 || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === limpaCarr2 ||
        String(m.placa_carreta || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === limpaCarr2
      ) && (m.crlv_validade_carreta_2 || m.crlv_validade_carreta)) : null;

      const cnhVal = motoristaInicial.cnh_validade || motBase?.cnh_validade || '';
      const crlvCav = motoristaInicial.crlv_validade_cavalo || motBase?.crlv_validade_cavalo || veicCav?.crlv_validade_cavalo || '';
      const crlvCarr = motoristaInicial.crlv_validade_carreta || motBase?.crlv_validade_carreta || veicCarr?.crlv_validade_carreta || '';
      const laudoR = motoristaInicial.validade_laudo_rocha || motBase?.validade_laudo_rocha || veicCarr?.validade_laudo_rocha || '';
      const crlvCarr2 = motoristaInicial.crlv_validade_carreta_2 || motBase?.crlv_validade_carreta_2 || veicCarr2?.crlv_validade_carreta_2 || '';
      const laudoR2 = motoristaInicial.validade_laudo_rocha_2 || motBase?.validade_laudo_rocha_2 || veicCarr2?.validade_laudo_rocha_2 || '';

      const ufCav = motoristaInicial.uf_cavalo || motBase?.uf_cavalo || veicCav?.uf_cavalo || identificarUFPelaPlaca(limpaCav) || 'ES';
      const ufCarr = motoristaInicial.uf_carreta || motBase?.uf_carreta || veicCarr?.uf_carreta || identificarUFPelaPlaca(limpaCarr) || 'ES';
      const ufCarr2 = motoristaInicial.uf_carreta_2 || motBase?.uf_carreta_2 || veicCarr2?.uf_carreta_2 || identificarUFPelaPlaca(limpaCarr2) || 'ES';

      setFormData({
        cpf: motoristaInicial.cpf || motBase?.cpf || '',
        nome: motoristaInicial.nome || motBase?.nome || '',
        telefone: motoristaInicial.telefone || motBase?.telefone || '',
        transportadora: motoristaInicial.transportadora || motBase?.transportadora || '',
        transportadora_cnpj: motoristaInicial.transportadora_cnpj || motBase?.transportadora_cnpj || '',
        tipo_veiculo: motoristaInicial.tipo_veiculo || motBase?.tipo_veiculo || 'Carreta / Bitrem',
        placa_cavalo: motoristaInicial.placa_cavalo || motBase?.placa_cavalo || '',
        uf_cavalo: ufCav,
        crlv_validade_cavalo: crlvCav,
        placa_carreta: motoristaInicial.placa_carreta || motBase?.placa_carreta || '',
        uf_carreta: ufCarr,
        crlv_validade_carreta: crlvCarr,
        validade_laudo_rocha: laudoR,
        placa_carreta_2: motoristaInicial.placa_carreta_2 || motBase?.placa_carreta_2 || '',
        uf_carreta_2: ufCarr2,
        crlv_validade_carreta_2: crlvCarr2,
        validade_laudo_rocha_2: laudoR2,
        cnh_categoria: motoristaInicial.cnh_categoria || motBase?.cnh_categoria || 'E',
        cnh_validade: cnhVal,
        status_documental: motoristaInicial.status_documental || motBase?.status_documental || 'REGULAR',
        observacoes: motoristaInicial.observacoes || motBase?.observacoes || ''
      });
      if (motoristaInicial.placa_carreta_2 || motBase?.placa_carreta_2 || crlvCarr2) {
        setTemCarreta2(true);
      }
    }
  }, [motoristaInicial]);

  const handleChange = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
    setErro('');
  };

  const handlePlacaCavaloChange = (valor) => {
    const fmt = formatarPlaca(valor);
    const limpa = fmt.replace(/[^A-Z0-9]/gi, '');
    const uf = identificarUFPelaPlaca(limpa);
    setFormData(prev => ({
      ...prev,
      placa_cavalo: fmt,
      uf_cavalo: uf || prev.uf_cavalo || 'ES'
    }));
    setErro('');
  };

  const handlePlacaCarretaChange = (valor) => {
    const fmt = formatarPlaca(valor);
    const limpa = fmt.replace(/[^A-Z0-9]/gi, '');
    const uf = identificarUFPelaPlaca(limpa);
    setFormData(prev => ({
      ...prev,
      placa_carreta: fmt,
      uf_carreta: uf || prev.uf_carreta || 'ES'
    }));
    setErro('');
  };

  const handlePlacaCarreta2Change = (valor) => {
    const fmt = formatarPlaca(valor);
    const limpa = fmt.replace(/[^A-Z0-9]/gi, '');
    const uf = identificarUFPelaPlaca(limpa);
    setFormData(prev => ({
      ...prev,
      placa_carreta_2: fmt,
      uf_carreta_2: uf || prev.uf_carreta_2 || 'ES'
    }));
    setErro('');
  };

  const formatarPlaca = (valor) => {
    const clean = valor.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
    if (clean.length > 3) {
      return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    }
    return clean;
  };

  const formatarTelefone = (valor) => {
    const nums = valor.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 2) return nums;
    if (nums.length <= 6) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    if (nums.length <= 10) return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
  };

  // Avalia visualmente o status de uma data de validade
  const calcularStatusValidade = (dataStr) => {
    if (!dataStr) return { status: 'vazio', label: 'Não informado', cor: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' };
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const [ano, mes, dia] = dataStr.split('-');
      const docDate = new Date(ano, mes - 1, dia);
      const diffMs = docDate.getTime() - hoje.getTime();
      const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDias < 0) {
        return { 
          status: 'vencido', 
          label: `Vencido há ${Math.abs(diffDias)} dias (${dia}/${mes}/${ano})`, 
          cor: '#ef4444', 
          bg: 'rgba(239, 68, 68, 0.15)',
          icone: AlertCircle
        };
      } else if (diffDias <= 30) {
        return { 
          status: 'avencer', 
          label: `Vence em ${diffDias} dias (${dia}/${mes}/${ano})`, 
          cor: '#f59e0b', 
          bg: 'rgba(245, 158, 11, 0.15)',
          icone: AlertTriangle
        };
      } else {
        return { 
          status: 'valido', 
          label: `Válido até ${dia}/${mes}/${ano}`, 
          cor: '#22c55e', 
          bg: 'rgba(34, 197, 94, 0.15)',
          icone: CheckCircle2
        };
      }
    } catch (_e) {
      return { status: 'vazio', label: 'Data inválida', cor: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' };
    }
  };

  // Avalia visualmente o status do CRLV baseado na Data do Último Registro e o calendário Detran
  const calcularStatusValidadeCRLV = (dataUltimoDoc, placa, uf) => {
    return avaliarCRLVComDetran(dataUltimoDoc, placa, '', uf);
  };

  const handleSubmeter = async (e) => {
    e.preventDefault();
    const cpfLimpo = formData.cpf.replace(/\D/g, '');
    if (!cpfLimpo || cpfLimpo.length !== 11) {
      setErro('Informe um CPF válido com 11 dígitos.');
      return;
    }
    if (!validarCPF(cpfLimpo)) {
      setErro('CPF inválido (dígitos verificadores incorretos).');
      return;
    }
    if (!formData.nome.trim()) {
      setErro('Nome do motorista é obrigatório.');
      return;
    }

    setSalvando(true);
    setErro('');

    const res = await salvarMotoristaFrotaConformidade({
      ...formData,
      cpf: cpfLimpo,
      atualizado_por: usuarioNome
    });

    setSalvando(false);
    if (res.sucesso) {
      setSucesso(true);
      setTimeout(() => {
        if (aoSalvar) aoSalvar(res.motorista);
        aoFechar();
      }, 700);
    } else {
      setErro(res.erro || 'Erro ao salvar conformidade.');
    }
  };

  const handleExcluir = async () => {
    if (!window.confirm(`Deseja realmente remover o cadastro de conformidade do motorista ${formData.nome}?`)) {
      return;
    }
    const res = await excluirMotoristaFrota(formData.cpf);
    if (res) {
      if (aoSalvar) aoSalvar(null);
      aoFechar();
    }
  };

  return (
    <div 
      className="modal-overlay" 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div 
        className="glass-panel" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden'
        }}
      >
        {/* Cabeçalho do Modal */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(to right, rgba(16, 185, 129, 0.1), transparent)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #059669, #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 800 }}>
                {motoristaInicial ? 'Conformidade de Motorista & Frota' : 'Novo Cadastro de Conformidade'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                Controle interno de CNH, CRLVs e Laudos de Inspeção de Rocha / CSV (Exclusivo Pedreiras & Admin)
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={aoFechar} 
            className="btn-icon" 
            style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              border: 'none', 
              color: '#94a3b8', 
              borderRadius: 8, 
              padding: 8,
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmeter} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {erro && (
            <div style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#fca5a5',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
              <span>{erro}</span>
            </div>
          )}

          {sucesso && (
            <div style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid #22c55e',
              color: '#86efac',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <CheckCircle2 size={18} color="#22c55e" style={{ flexShrink: 0 }} />
              <span>Dados de conformidade salvos com sucesso!</span>
            </div>
          )}

          {/* SEÇÃO 1: DADOS DO MOTORISTA & CNH */}
          <div style={{
            marginBottom: 20,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
              color: '#10b981',
              fontWeight: 700,
              fontSize: '0.92rem'
            }}>
              <User size={18} />
              <span>1. Dados do Motorista & CNH</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {/* CPF */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  CPF do Motorista *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="000.000.000-00"
                  value={formatarCPF(formData.cpf)}
                  onChange={(e) => handleChange('cpf', formatarCPF(e.target.value))}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              {/* NOME COMPLETO */}
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  Nome Completo do Motorista *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: JOÃO SILVA PEREIRA"
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value.toUpperCase())}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              {/* TELEFONE */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={(e) => handleChange('telefone', formatarTelefone(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              {/* CATEGORIA CNH */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  Categoria da CNH *
                </label>
                <select
                  className="form-select"
                  value={formData.cnh_categoria}
                  onChange={(e) => handleChange('cnh_categoria', e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="E">Categoria E (Carreta / Bitrem / Articulado)</option>
                  <option value="AE">Categoria AE (Articulado + Moto)</option>
                  <option value="D">Categoria D (Ônibus / Caminhão)</option>
                  <option value="AD">Categoria AD</option>
                  <option value="C">Categoria C (Caminhão Toco / Truck)</option>
                  <option value="AC">Categoria AC</option>
                  <option value="B">Categoria B (Veículo Leve)</option>
                </select>
              </div>

              {/* VENCIMENTO CNH */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  Data de Vencimento da CNH *
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.cnh_validade}
                  onChange={(e) => handleChange('cnh_validade', e.target.value)}
                  style={{ width: '100%' }}
                />
                {formData.cnh_validade && (
                  <div style={{ marginTop: 4 }}>
                    {(() => {
                      const res = calcularStatusValidade(formData.cnh_validade);
                      return (
                        <span style={{ fontSize: '0.72rem', color: res.cor, fontWeight: 700 }}>
                          ● {res.label}
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: CAVALO MECÂNICO */}
          <div style={{
            marginBottom: 20,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
              color: '#38bdf8',
              fontWeight: 700,
              fontSize: '0.92rem'
            }}>
              <Truck size={18} />
              <span>2. Cavalo Mecânico (Trator)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {/* PLACA CAVALO & UF */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: 0 }}>
                    Placa do Cavalo & Estado (UF)
                  </label>
                  {(() => {
                    const info = obterInfoLicenciamentoPorPlaca(formData.placa_cavalo, formData.uf_cavalo);
                    if (!info) return null;
                    return (
                      <span style={{ fontSize: '0.70rem', color: '#38bdf8', fontWeight: 600 }}>
                        Final {info.finalDigito} ({info.mesNome})
                      </span>
                    );
                  })()}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ABC-1234 / ABC1D23"
                    value={formData.placa_cavalo}
                    onChange={(e) => handlePlacaCavaloChange(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <select
                    className="form-select"
                    value={formData.uf_cavalo || 'ES'}
                    onChange={(e) => handleChange('uf_cavalo', e.target.value)}
                    style={{ width: '80px', fontSize: '0.8rem', padding: '6px 8px' }}
                    title="Estado (UF) do Detran do veículo"
                  >
                    {ESTADOS_BRASIL.map(est => (
                      <option key={est.sigla} value={est.sigla}>{est.sigla}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DATA DO ÚLTIMO REGISTRO DO CRLV CAVALO */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: 0 }}>
                    Data do Último Registro (CRLV Cavalo) *
                  </label>
                  {(() => {
                    const info = obterInfoLicenciamentoPorPlaca(formData.placa_cavalo, formData.uf_cavalo);
                    if (!info) return null;
                    return (
                      <span 
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          color: '#38bdf8',
                          fontSize: '0.68rem',
                          borderRadius: 4,
                          padding: '2px 6px',
                          fontWeight: 700
                        }}
                        title={`Vencimento oficial pelo Detran-${formData.uf_cavalo || 'ES'} para placa final ${info.labelPar || info.finalDigito}: ${String(info.diaLimite).padStart(2, '0')}/${String(info.mesNumero).padStart(2, '0')}`}
                      >
                        ⚡ Detran-{formData.uf_cavalo || 'ES'}: {String(info.diaLimite).padStart(2, '0')}/{String(info.mesNumero).padStart(2, '0')} (Final {info.labelPar || info.finalDigito})
                      </span>
                    );
                  })()}
                </div>
                <input
                  type="date"
                  className="form-input"
                  value={formData.crlv_validade_cavalo}
                  onChange={(e) => handleChange('crlv_validade_cavalo', e.target.value)}
                  style={{ width: '100%' }}
                />
                {formData.crlv_validade_cavalo && (
                  <div style={{ marginTop: 4 }}>
                    {(() => {
                      const res = calcularStatusValidadeCRLV(formData.crlv_validade_cavalo, formData.placa_cavalo, formData.uf_cavalo);
                      return (
                        <span style={{ fontSize: '0.72rem', color: res.cor, fontWeight: 700 }}>
                          ● {res.label}
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: IMPLEMENTO / CARRETA 1 & LAUDO DE ROCHA */}
          <div style={{
            marginBottom: 20,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
              color: '#a855f7',
              fontWeight: 700,
              fontSize: '0.92rem'
            }}>
              <FileText size={18} />
              <span>3. Carreta / Semirreboque 1 & Laudo de Inspeção de Rocha (CSV)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {/* PLACA CARRETA & UF */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: 0 }}>
                    Placa da Carreta 1 & Estado (UF)
                  </label>
                  {(() => {
                    const info = obterInfoLicenciamentoPorPlaca(formData.placa_carreta, formData.uf_carreta);
                    if (!info) return null;
                    return (
                      <span style={{ fontSize: '0.70rem', color: '#c084fc', fontWeight: 600 }}>
                        Final {info.finalDigito} ({info.mesNome})
                      </span>
                    );
                  })()}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ABC-1234 / ABC1D23"
                    value={formData.placa_carreta}
                    onChange={(e) => handlePlacaCarretaChange(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <select
                    className="form-select"
                    value={formData.uf_carreta || 'ES'}
                    onChange={(e) => handleChange('uf_carreta', e.target.value)}
                    style={{ width: '80px', fontSize: '0.8rem', padding: '6px 8px' }}
                    title="Estado (UF) do Detran do semirreboque"
                  >
                    {ESTADOS_BRASIL.map(est => (
                      <option key={est.sigla} value={est.sigla}>{est.sigla}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DATA DO ÚLTIMO REGISTRO DO CRLV CARRETA 1 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: 0 }}>
                    Data do Último Registro (CRLV Carreta 1) *
                  </label>
                  {(() => {
                    const info = obterInfoLicenciamentoPorPlaca(formData.placa_carreta, formData.uf_carreta);
                    if (!info) return null;
                    return (
                      <span 
                        style={{
                          background: 'rgba(168, 85, 247, 0.15)',
                          border: '1px solid rgba(168, 85, 247, 0.3)',
                          color: '#c084fc',
                          fontSize: '0.68rem',
                          borderRadius: 4,
                          padding: '2px 6px',
                          fontWeight: 700
                        }}
                        title={`Vencimento oficial pelo Detran-${formData.uf_carreta || 'ES'} para placa final ${info.labelPar || info.finalDigito}: ${String(info.diaLimite).padStart(2, '0')}/${String(info.mesNumero).padStart(2, '0')}`}
                      >
                        ⚡ Detran-{formData.uf_carreta || 'ES'}: {String(info.diaLimite).padStart(2, '0')}/{String(info.mesNumero).padStart(2, '0')} (Final {info.labelPar || info.finalDigito})
                      </span>
                    );
                  })()}
                </div>
                <input
                  type="date"
                  className="form-input"
                  value={formData.crlv_validade_carreta}
                  onChange={(e) => handleChange('crlv_validade_carreta', e.target.value)}
                  style={{ width: '100%' }}
                />
                {formData.crlv_validade_carreta && (
                  <div style={{ marginTop: 4 }}>
                    {(() => {
                      const res = calcularStatusValidadeCRLV(formData.crlv_validade_carreta, formData.placa_carreta, formData.uf_carreta);
                      return (
                        <span style={{ fontSize: '0.72rem', color: res.cor, fontWeight: 700 }}>
                          ● {res.label}
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* DATA DE VENCIMENTO DO LAUDO ROCHA / CSV */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  Data de Vencimento do Laudo de Rocha / CSV *
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.validade_laudo_rocha}
                  onChange={(e) => handleChange('validade_laudo_rocha', e.target.value)}
                  style={{ width: '100%' }}
                />
                {formData.validade_laudo_rocha && (
                  <div style={{ marginTop: 4 }}>
                    {(() => {
                      const res = avaliarLaudoRocha(formData.validade_laudo_rocha);
                      return (
                        <span style={{ fontSize: '0.72rem', color: res.cor, fontWeight: 700 }}>
                          ● {res.label}
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Toggle para Carreta 2 (Bitrem/Rodotrem) */}
            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px dashed rgba(255, 255, 255, 0.1)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.82rem', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={temCarreta2}
                  onChange={(e) => setTemCarreta2(e.target.checked)}
                />
                <span>Veículo possui <strong>2ª Carreta (Bitrem / Rodotrem)</strong></span>
              </label>

              {temCarreta2 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Placa Carreta 2 & Estado (UF)</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="ABC-1234"
                        value={formData.placa_carreta_2}
                        onChange={(e) => handlePlacaCarreta2Change(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <select
                        className="form-select"
                        value={formData.uf_carreta_2 || 'ES'}
                        onChange={(e) => handleChange('uf_carreta_2', e.target.value)}
                        style={{ width: '80px', fontSize: '0.8rem', padding: '6px 8px' }}
                        title="Estado (UF) do Detran da 2ª carreta"
                      >
                        {ESTADOS_BRASIL.map(est => (
                          <option key={est.sigla} value={est.sigla}>{est.sigla}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
                        Data do Último Registro (CRLV Carreta 2)
                      </label>
                      {(() => {
                        const info = obterInfoLicenciamentoPorPlaca(formData.placa_carreta_2, formData.uf_carreta_2);
                        if (!info) return null;
                        return (
                          <span 
                            style={{
                              background: 'rgba(168, 85, 247, 0.15)',
                              border: '1px solid rgba(168, 85, 247, 0.3)',
                              color: '#c084fc',
                              fontSize: '0.65rem',
                              borderRadius: 4,
                              padding: '2px 5px',
                              fontWeight: 700
                            }}
                            title={`Vencimento oficial pelo Detran-${formData.uf_carreta_2 || 'ES'} para placa final ${info.labelPar || info.finalDigito}: ${String(info.diaLimite).padStart(2, '0')}/${String(info.mesNumero).padStart(2, '0')}`}
                          >
                            ⚡ Detran-{formData.uf_carreta_2 || 'ES'}: {String(info.diaLimite).padStart(2, '0')}/{String(info.mesNumero).padStart(2, '0')} (Final {info.labelPar || info.finalDigito})
                          </span>
                        );
                      })()}
                    </div>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.crlv_validade_carreta_2}
                      onChange={(e) => handleChange('crlv_validade_carreta_2', e.target.value)}
                    />
                    {formData.crlv_validade_carreta_2 && (
                      <div style={{ marginTop: 2 }}>
                        {(() => {
                          const res = calcularStatusValidadeCRLV(formData.crlv_validade_carreta_2, formData.placa_carreta_2, formData.uf_carreta_2);
                          return (
                            <span style={{ fontSize: '0.68rem', color: res.cor, fontWeight: 700 }}>
                              ● {res.label}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Data de Vencimento do Laudo de Rocha (Carreta 2)
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.validade_laudo_rocha_2}
                      onChange={(e) => handleChange('validade_laudo_rocha_2', e.target.value)}
                    />
                    {formData.validade_laudo_rocha_2 && (
                      <div style={{ marginTop: 2 }}>
                        {(() => {
                          const res = avaliarLaudoRocha(formData.validade_laudo_rocha_2);
                          return (
                            <span style={{ fontSize: '0.68rem', color: res.cor, fontWeight: 700 }}>
                              ● {res.label}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SEÇÃO 4: TRANSPORTADORA & STATUS GERAL */}
          <div style={{
            marginBottom: 20,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
              color: '#fbbf24',
              fontWeight: 700,
              fontSize: '0.92rem'
            }}>
              <Info size={18} />
              <span>4. Transportadora & Status Operacional</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  Nome da Transportadora
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: TRANSPORTADORA VERMONT LTDA"
                  value={formData.transportadora}
                  onChange={(e) => handleChange('transportadora', e.target.value.toUpperCase())}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  CNPJ da Transportadora
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="00.000.000/0000-00"
                  value={formatarCNPJ(formData.transportadora_cnpj)}
                  onChange={(e) => handleChange('transportadora_cnpj', formatarCNPJ(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  Status Documental Geral
                </label>
                <select
                  className="form-select"
                  value={formData.status_documental}
                  onChange={(e) => handleChange('status_documental', e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="REGULAR">🟢 REGULAR (Liberado para Carregar)</option>
                  <option value="PENDENTE">🟡 PENDENTE (Aguardando Regularização)</option>
                  <option value="VENCIDO">🔴 VENCIDO (Documentos Expirados)</option>
                  <option value="BLOQUEADO">⛔ BLOQUEADO (Não Autorizado)</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  Observações Internas (Exclusivo Pedreira/Admin)
                </label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Observações sobre inspeção visual na portaria, restrições ou histórico..."
                  value={formData.observacoes}
                  onChange={(e) => handleChange('observacoes', e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Rodapé de Ações */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 12,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div>
              {motoristaInicial && (
                <button
                  type="button"
                  onClick={handleExcluir}
                  className="btn btn-danger"
                  style={{ fontSize: '0.82rem', padding: '8px 14px' }}
                >
                  <Trash2 size={16} />
                  <span>Excluir Cadastro</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={aoFechar}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="btn btn-vermont"
                style={{ fontSize: '0.85rem' }}
              >
                <Save size={16} />
                <span>{salvando ? 'Salvando...' : 'Salvar Conformidade'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
