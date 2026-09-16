import React, { useState, useEffect } from 'react';
import { X, Layers, Box, Building2, FileText, CheckCircle2, AlertTriangle, UploadCloud, Plus, Info } from 'lucide-react';
import { 
  PEDREIRAS_CEARA, 
  obterMateriaisPorPedreira, 
  formatarCNPJ, 
  consultarCNPJReceita,
  sanitizarNumeroBloco,
  validarFormatoBlocoTajMahal,
  isClienteThorOuArgos
} from '../services/agendamentoService';
import { STATUS_ENVELOPAMENTO, salvarEnvelopamento, importarBlocosEmLote } from '../services/envelopamentoService';

export function ModalCadastrarBlocoEnvelopamento({
  blocoEdicao = null,
  onFechar,
  onSalvo,
  usuarioNome = 'Equipe Vermont'
}) {
  const [modoAba, setModoAba] = useState('individual'); // 'individual' ou 'lote'
  
  // Estado Individual
  const [formData, setFormData] = useState({
    id: blocoEdicao?.id || null,
    pedreira_id: blocoEdicao?.pedreira_id || 'uruoca',
    pedreira_nome: blocoEdicao?.pedreira_nome || 'Uruoca - CE (Taj Mahal)',
    material: blocoEdicao?.material || 'Taj Mahal',
    numero_bloco: blocoEdicao?.numero_bloco || '',
    cliente_nome: blocoEdicao?.cliente_nome || '',
    cliente_cnpj: blocoEdicao?.cliente_cnpj || '',
    comprimento: blocoEdicao?.comprimento || '',
    largura: blocoEdicao?.largura || '',
    altura: blocoEdicao?.altura || '',
    metro_cubico: blocoEdicao?.metro_cubico || '',
    peso_ton: blocoEdicao?.peso_ton || '',
    status: blocoEdicao?.status || 'pendente',
    observacoes: blocoEdicao?.observacoes || ''
  });

  // Estado em Lote
  const [loteData, setLoteData] = useState({
    pedreira_id: 'uruoca',
    pedreira_nome: 'Uruoca - CE (Taj Mahal)',
    material: 'Taj Mahal',
    cliente_nome: '',
    cliente_cnpj: '',
    status: 'pendente',
    textoBlocos: '',
    observacoes: ''
  });

  const [materiaisDisponiveis, setMateriaisDisponiveis] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false);

  // Atualizar lista de materiais conforme a pedreira selecionada
  useEffect(() => {
    const pedId = modoAba === 'individual' ? formData.pedreira_id : loteData.pedreira_id;
    const mats = obterMateriaisPorPedreira(pedId);
    setMateriaisDisponiveis(mats);
    
    if (modoAba === 'individual') {
      if (!mats.includes(formData.material)) {
        setFormData(prev => ({ ...prev, material: mats[0] || '' }));
      }
    } else {
      if (!mats.includes(loteData.material)) {
        setLoteData(prev => ({ ...prev, material: mats[0] || '' }));
      }
    }
  }, [formData.pedreira_id, loteData.pedreira_id, modoAba]);

  // Cálculo automático do metro cúbico ao alterar C x L x A
  useEffect(() => {
    const c = parseFloat(formData.comprimento);
    const l = parseFloat(formData.largura);
    const a = parseFloat(formData.altura);
    if (!isNaN(c) && !isNaN(l) && !isNaN(a) && c > 0 && l > 0 && a > 0) {
      setFormData(prev => ({ ...prev, metro_cubico: (c * l * a).toFixed(3) }));
    }
  }, [formData.comprimento, formData.largura, formData.altura]);

  const handlePedreiraChange = (pedId) => {
    const pedObj = PEDREIRAS_CEARA.find(p => p.id === pedId);
    const nomePed = pedObj ? pedObj.nome : pedId;
    if (modoAba === 'individual') {
      setFormData(prev => ({ ...prev, pedreira_id: pedId, pedreira_nome: nomePed }));
    } else {
      setLoteData(prev => ({ ...prev, pedreira_id: pedId, pedreira_nome: nomePed }));
    }
  };

  const handleBuscarCNPJ = async (cnpjLimpo, tipo) => {
    if (!cnpjLimpo || cnpjLimpo.length !== 14) return;
    setBuscandoCNPJ(true);
    try {
      const res = await consultarCNPJReceita(cnpjLimpo);
      if (res && res.razao_social) {
        if (tipo === 'individual') {
          setFormData(prev => ({ ...prev, cliente_nome: res.razao_social }));
        } else {
          setLoteData(prev => ({ ...prev, cliente_nome: res.razao_social }));
        }
      }
    } catch (err) {
      console.warn('Erro ao consultar CNPJ:', err);
    } finally {
      setBuscandoCNPJ(false);
    }
  };

  const handleSubmitIndividual = async (e) => {
    e.preventDefault();
    setErro('');

    if (!formData.numero_bloco.trim()) {
      setErro('Informe o número do bloco.');
      return;
    }
    if (!formData.cliente_nome.trim()) {
      setErro('Informe o nome do cliente / comprador do bloco.');
      return;
    }

    // Validação de formato da barra para Taj Mahal
    const validacao = validarFormatoBlocoTajMahal(formData.material, formData.cliente_nome, formData.numero_bloco);
    if (!validacao.valido) {
      setErro(validacao.mensagem);
      return;
    }

    setSalvando(true);
    try {
      const registro = await salvarEnvelopamento(formData, usuarioNome);
      if (onSalvo) onSalvo(registro);
      onFechar();
    } catch (err) {
      console.error(err);
      setErro('Erro ao salvar bloco. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const handleSubmitLote = async (e) => {
    e.preventDefault();
    setErro('');

    if (!loteData.textoBlocos.trim()) {
      setErro('Cole ou digite pelo menos um número de bloco.');
      return;
    }
    if (!loteData.cliente_nome.trim()) {
      setErro('Informe o cliente comprador para este lote de blocos.');
      return;
    }

    // Extrai números de blocos (linhas, vírgulas ou espaços)
    const linhas = loteData.textoBlocos
      .split(/[\n,;]+/)
      .map(b => sanitizarNumeroBloco(b, isClienteThorOuArgos(loteData.cliente_nome)))
      .filter(b => b.length > 0);

    if (linhas.length === 0) {
      setErro('Nenhum número de bloco válido foi identificado.');
      return;
    }

    setSalvando(true);
    try {
      const itens = linhas.map(bloco => ({
        numero_bloco: bloco,
        pedreira_id: loteData.pedreira_id,
        pedreira_nome: loteData.pedreira_nome,
        material: loteData.material,
        cliente_nome: loteData.cliente_nome,
        cliente_cnpj: loteData.cliente_cnpj,
        status: loteData.status,
        observacoes: loteData.observacoes
      }));

      await importarBlocosEmLote(itens, usuarioNome);
      if (onSalvo) onSalvo(null, itens.length);
      onFechar();
    } catch (err) {
      console.error(err);
      setErro('Erro ao importar lote de blocos.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div 
        className="glass-panel" 
        style={{
          maxWidth: 680,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: 24,
          borderRadius: 14,
          border: '1px solid rgba(0, 118, 44, 0.4)',
          boxShadow: '0 20px 45px rgba(0,0,0,0.7)',
          background: 'var(--slate-900)'
        }}
      >
        {/* Cabeçalho do Modal */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 14, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(0, 168, 62, 0.2)',
              border: '1px solid #00a83e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Layers size={20} color="#4ade80" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff' }}>
                {blocoEdicao ? 'Editar Bloco no Envelopamento' : 'Cadastrar Bloco para Envelopamento'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--slate-400)' }}>
                Controle de pátio, conferência física e liberação para agendamento
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onFechar} 
            className="btn btn-secondary" 
            style={{ padding: 6, borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Abas: Individual vs Lote (apenas para novos cadastros) */}
        {!blocoEdicao && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 8 }}>
            <button
              type="button"
              onClick={() => setModoAba('individual')}
              className={`btn ${modoAba === 'individual' ? 'btn-vermont' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '7px 12px', fontSize: '0.82rem', gap: 6 }}
            >
              <Plus size={15} />
              Cadastro Individual
            </button>
            <button
              type="button"
              onClick={() => setModoAba('lote')}
              className={`btn ${modoAba === 'lote' ? 'btn-vermont' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '7px 12px', fontSize: '0.82rem', gap: 6 }}
            >
              <UploadCloud size={15} />
              Importação em Lote (Múltiplos)
            </button>
          </div>
        )}

        {erro && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: '0.85rem',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>{erro}</span>
          </div>
        )}

        {/* FORMULÁRIO INDIVIDUAL */}
        {modoAba === 'individual' ? (
          <form onSubmit={handleSubmitIndividual}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              
              {/* Pedreira */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>Pedreira / Unidade:</label>
                <select
                  className="form-select"
                  value={formData.pedreira_id}
                  onChange={(e) => handlePedreiraChange(e.target.value)}
                  required
                >
                  {PEDREIRAS_CEARA.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              {/* Material */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>Material / Rocha:</label>
                <select
                  className="form-select"
                  value={formData.material}
                  onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                  required
                >
                  {materiaisDisponiveis.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Número do Bloco */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>Número do Bloco:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: 1256926 ou 11/26 (Thor/Argos)"
                  value={formData.numero_bloco}
                  onChange={(e) => {
                    const sanitizado = sanitizarNumeroBloco(e.target.value, isClienteThorOuArgos(formData.cliente_nome));
                    setFormData(prev => ({ ...prev, numero_bloco: sanitizado }));
                  }}
                  required
                />
              </div>

              {/* Status do Envelopamento */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>Status do Envelopamento:</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                >
                  {Object.values(STATUS_ENVELOPAMENTO).map(st => (
                    <option key={st.id} value={st.id}>{st.label}</option>
                  ))}
                </select>
              </div>

              {/* CNPJ do Cliente */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>CNPJ do Cliente (Opcional):</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="00.000.000/0000-00"
                    value={formData.cliente_cnpj}
                    onChange={(e) => {
                      const fmt = formatarCNPJ(e.target.value);
                      setFormData(prev => ({ ...prev, cliente_cnpj: fmt }));
                      const limpo = fmt.replace(/\D/g, '');
                      if (limpo.length === 14) {
                        handleBuscarCNPJ(limpo, 'individual');
                      }
                    }}
                  />
                  {buscandoCNPJ && (
                    <span className="spinner" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14 }} />
                  )}
                </div>
              </div>

              {/* Nome do Cliente */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>Cliente / Comprador:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nome do Cliente / Destinatário"
                  value={formData.cliente_nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, cliente_nome: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Medidas Físicas (Opcionais) */}
            <div style={{ marginTop: 14, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-300)', display: 'block', marginBottom: 10 }}>
                📏 Dimensões e Cubagem (Opcional):
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--slate-400)' }}>Comp. (m):</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="Ex: 3.20"
                    value={formData.comprimento}
                    onChange={(e) => setFormData(prev => ({ ...prev, comprimento: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--slate-400)' }}>Largura (m):</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="Ex: 1.85"
                    value={formData.largura}
                    onChange={(e) => setFormData(prev => ({ ...prev, largura: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--slate-400)' }}>Altura (m):</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="Ex: 1.90"
                    value={formData.altura}
                    onChange={(e) => setFormData(prev => ({ ...prev, altura: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--slate-400)' }}>Volume (m³):</label>
                  <input
                    type="text"
                    className="form-input"
                    readOnly
                    placeholder="0.000"
                    value={formData.metro_cubico}
                    style={{ background: 'rgba(0,0,0,0.2)', color: '#4ade80' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--slate-400)' }}>Peso (Ton):</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="Ex: 28.5"
                    value={formData.peso_ton}
                    onChange={(e) => setFormData(prev => ({ ...prev, peso_ton: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Observações / Detalhes de Pátio:</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Ex: Bloco no pátio 2, envelopamento com manta reforçada..."
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              />
            </div>

            {/* Botões de Ação */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={onFechar} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={salvando} className="btn btn-vermont" style={{ gap: 6 }}>
                {salvando ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <CheckCircle2 size={16} />}
                {blocoEdicao ? 'Salvar Alterações' : 'Cadastrar Bloco'}
              </button>
            </div>
          </form>
        ) : (
          /* FORMULÁRIO EM LOTE */
          <form onSubmit={handleSubmitLote}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>Pedreira / Unidade:</label>
                <select
                  className="form-select"
                  value={loteData.pedreira_id}
                  onChange={(e) => handlePedreiraChange(e.target.value)}
                  required
                >
                  {PEDREIRAS_CEARA.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>Material / Rocha:</label>
                <select
                  className="form-select"
                  value={loteData.material}
                  onChange={(e) => setLoteData(prev => ({ ...prev, material: e.target.value }))}
                  required
                >
                  {materiaisDisponiveis.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>CNPJ do Cliente (Opcional):</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="00.000.000/0000-00"
                    value={loteData.cliente_cnpj}
                    onChange={(e) => {
                      const fmt = formatarCNPJ(e.target.value);
                      setLoteData(prev => ({ ...prev, cliente_cnpj: fmt }));
                      const limpo = fmt.replace(/\D/g, '');
                      if (limpo.length === 14) {
                        handleBuscarCNPJ(limpo, 'lote');
                      }
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>Cliente / Destinatário Comum:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nome do Cliente"
                  value={loteData.cliente_nome}
                  onChange={(e) => setLoteData(prev => ({ ...prev, cliente_nome: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>
                Lista de Números dos Blocos (Cole um por linha ou separados por vírgula):
              </label>
              <textarea
                className="form-input"
                rows={5}
                placeholder="Exemplo:&#10;1256926&#10;1256927&#10;1256928"
                value={loteData.textoBlocos}
                onChange={(e) => setLoteData(prev => ({ ...prev, textoBlocos: e.target.value }))}
                required
                style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', marginTop: 4, display: 'block' }}>
                💡 Cada linha será cadastrada como um bloco independente vinculado ao cliente e pedreira informados.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={onFechar} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={salvando} className="btn btn-vermont" style={{ gap: 6 }}>
                {salvando ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <UploadCloud size={16} />}
                Importar Blocos em Lote
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
