import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, Truck, Calendar, Clock, MapPin, AlertCircle, CheckCircle2, History, User, ArrowRight } from 'lucide-react';
import { 
  PEDREIRAS_CEARA, 
  TIPOS_VEICULO, 
  HORARIOS_SEMANA, 
  STATUS_AGENDAMENTO,
  obterMateriaisPorPedreira,
  obterConfigPlacas,
  salvarEdicaoAgendamento,
  normalizarHistoricoStatus
} from '../services/agendamentoService';

export function ModalEditarAgendamento({ 
  agendamento, 
  onFechar, 
  onSalvo, 
  isAdmin = false,
  usuarioInfo = null 
}) {
  if (!agendamento) return null;

  const [formData, setFormData] = useState({
    ...agendamento,
    numero_bloco: agendamento.numero_bloco || '',
    material: agendamento.material || '',
    pedreira: agendamento.pedreira || PEDREIRAS_CEARA[0].nome,
    cliente_cnpj: agendamento.cliente_cnpj || '',
    cliente: agendamento.cliente || '',
    transportadora_cnpj: agendamento.transportadora_cnpj || '',
    transportadora: agendamento.transportadora || '',
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
    observacoes: agendamento.observacoes || '',
    status: agendamento.status || STATUS_AGENDAMENTO.AGUARDANDO
  });

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [materiaisDisponiveis, setMateriaisDisponiveis] = useState([]);

  useEffect(() => {
    const mats = obterMateriaisPorPedreira(formData.pedreira);
    setMateriaisDisponiveis(mats);
  }, [formData.pedreira]);

  const configPlacas = obterConfigPlacas(formData.tipo_veiculo);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);

    if (!formData.numero_bloco.trim()) {
      setErro('Informe a numeração do bloco.');
      setSalvando(false);
      return;
    }

    if (!isAdmin && formData.status === 'Aguardando Liberação' && agendamento.status !== 'Aguardando Liberação') {
      setErro('Acesso restrito: Apenas o Administrador Geral pode reverter o status para "Aguardando Liberação".');
      setSalvando(false);
      return;
    }

    const res = await salvarEdicaoAgendamento(formData, usuarioInfo || { isAdmin }, agendamento);
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
          background: '#0d1310',
          border: '1px solid var(--vermont-green-border)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), var(--vermont-green-glow)',
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
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
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
              color: '#4ade80'
            }}>
              <Edit3 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#fff' }}>
                Editar Informações do Carregamento
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#86efac', fontFamily: 'monospace' }}>
                Protocolo: #{agendamento.id ? String(agendamento.id).substring(0, 8).toUpperCase() : 'N/A'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
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
          
          {/* Seção 1: Dados do Bloco & Pedreira */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 10,
            padding: '16px 18px'
          }}>
            <strong style={{ color: '#4ade80', fontSize: '0.88rem', display: 'block', marginBottom: 12 }}>
              🪨 Informações do Bloco & Pedreira
            </strong>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div className="form-group">
                <label className="form-label form-label-required">Número do Bloco</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ textTransform: 'uppercase', fontWeight: 700 }}
                  value={formData.numero_bloco}
                  onChange={(e) => handleChange('numero_bloco', e.target.value.toUpperCase())}
                  required
                />
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
                  style={{ fontWeight: 700, color: formData.status === 'Finalizado' ? '#34d399' : formData.status === 'Carregando' ? '#38bdf8' : formData.status === 'Liberado para Carregar' ? '#c084fc' : formData.status === 'Cancelado' ? '#f87171' : '#fbbf24' }}
                >
                  {isAdmin ? (
                    <option value="Aguardando Liberação">🟡 Aguardando Liberação</option>
                  ) : (
                    formData.status === 'Aguardando Liberação' && (
                      <option value="Aguardando Liberação" disabled>🟡 Aguardando Liberação (Status Atual - Bloqueado p/ Reatribuir)</option>
                    )
                  )}
                  <option value="Liberado para Carregar">🟣 Liberado para Carregar</option>
                  <option value="Carregando">🔵 Carregando</option>
                  <option value="Finalizado">🟢 Finalizado</option>
                  <option value="Cancelado">🔴 Cancelado</option>
                </select>
                {!isAdmin && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)', marginTop: 2 }}>
                    🔒 Reversão para "Aguardando Liberação" é exclusiva do Administrador Geral.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Seção 2: Data e Horário */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 10,
            padding: '16px 18px'
          }}>
            <strong style={{ color: '#4ade80', fontSize: '0.88rem', display: 'block', marginBottom: 12 }}>
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

              <div className="form-group">
                <label className="form-label">CNPJ Destinatário</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  value={formData.cliente_cnpj}
                  onChange={(e) => {
                    const nums = e.target.value.replace(/\D/g, '').slice(0, 14);
                    let fmt = nums;
                    if (nums.length > 2) fmt = `${nums.slice(0, 2)}.${nums.slice(2)}`;
                    if (nums.length > 5) fmt = `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5)}`;
                    if (nums.length > 8) fmt = `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5, 8)}/${nums.slice(8)}`;
                    if (nums.length > 12) fmt = `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5, 8)}/${nums.slice(8, 12)}-${nums.slice(12)}`;
                    handleChange('cliente_cnpj', fmt);
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cliente Destinatário</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.cliente}
                  onChange={(e) => handleChange('cliente', e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Transporte, Motorista e Placas */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 10,
            padding: '16px 18px'
          }}>
            <strong style={{ color: '#4ade80', fontSize: '0.88rem', display: 'block', marginBottom: 12 }}>
              🚛 Transporte, Motorista & Placas
            </strong>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">CNPJ Transportadora</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  value={formData.transportadora_cnpj}
                  onChange={(e) => {
                    const nums = e.target.value.replace(/\D/g, '').slice(0, 14);
                    let fmt = nums;
                    if (nums.length > 2) fmt = `${nums.slice(0, 2)}.${nums.slice(2)}`;
                    if (nums.length > 5) fmt = `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5)}`;
                    if (nums.length > 8) fmt = `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5, 8)}/${nums.slice(8)}`;
                    if (nums.length > 12) fmt = `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5, 8)}/${nums.slice(8, 12)}-${nums.slice(12)}`;
                    handleChange('transportadora_cnpj', fmt);
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Transportadora</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.transportadora}
                  onChange={(e) => handleChange('transportadora', e.target.value.toUpperCase())}
                />
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

              <div className="form-group">
                <label className="form-label">Tipo de Veículo</label>
                <select
                  className="form-select"
                  value={formData.tipo_veiculo}
                  onChange={(e) => handleChange('tipo_veiculo', e.target.value)}
                >
                  {TIPOS_VEICULO.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
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
                </div>
              )}
            </div>
          </div>

          {/* Seção 4: Campo de Observações / Ocorrências */}
          <div style={{
            background: 'rgba(0, 118, 44, 0.08)',
            border: '1px solid var(--vermont-green-border)',
            borderRadius: 10,
            padding: '16px 18px'
          }}>
            <label className="form-label" style={{ color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
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
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 10,
              padding: '14px 18px'
            }}>
              <label className="form-label" style={{ color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <History size={15} /> Histórico de Alterações ({normalizarHistoricoStatus(agendamento.historico_status).length})
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                {normalizarHistoricoStatus(agendamento.historico_status).slice(0, 8).map((h, i) => {
                  const isEdicao = h.tipo === 'edicao_dados' || (Array.isArray(h.alteracoes) && h.alteracoes.length > 0);

                  return (
                    <div key={h.id || i} style={{
                      fontSize: '0.74rem',
                      background: isEdicao ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                      border: isEdicao ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
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
                            <span style={{ color: '#38bdf8', fontWeight: 600 }}>✏️ {h.descricao || 'Alteração Cadastral'}</span>
                          </>
                        ) : (
                          <>
                            <span style={{ color: 'var(--slate-400)' }}>{h.status_anterior}</span>
                            <ArrowRight size={11} color="var(--slate-500)" />
                            <span style={{ color: '#4ade80', fontWeight: 600 }}>{h.status_novo}</span>
                          </>
                        )}
                      </div>
                      <div style={{ color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span><strong>{h.usuario_nome}</strong> ({h.usuario_role})</span>
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
