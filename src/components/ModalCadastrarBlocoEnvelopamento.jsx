import React, { useState, useEffect, useRef } from 'react';
import { X, Layers, Box, Building2, Search, CheckCircle2, AlertTriangle, UploadCloud, Plus, Check } from 'lucide-react';
import { 
  PEDREIRAS_CEARA, 
  obterMateriaisPorPedreira, 
  formatarCNPJ, 
  consultarCNPJReceita,
  sanitizarNumeroBloco,
  validarFormatoBlocoTajMahal,
  isClienteThorOuArgos
} from '../services/agendamentoService';
import { 
  STATUS_ENVELOPAMENTO, 
  salvarEnvelopamento, 
  importarBlocosEmLote,
  obterClientesDoBancoDeDados
} from '../services/envelopamentoService';

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

  // Lista de clientes do banco de dados para pesquisa/autocomplete
  const [clientesBase, setClientesBase] = useState([]);
  const [sugestoesClientes, setSugestoesClientes] = useState([]);
  const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);
  const dropdownRef = useRef(null);

  // Carregar lista de clientes cadastrados no banco
  useEffect(() => {
    obterClientesDoBancoDeDados().then(res => {
      setClientesBase(res);
    }).catch(() => {});
  }, []);

  // Fechar dropdown de sugestões ao clicar fora
  useEffect(() => {
    const handleClickFora = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMostrarDropdownClientes(false);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

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

  const handlePedreiraChange = (pedId) => {
    const pedObj = PEDREIRAS_CEARA.find(p => p.id === pedId);
    const nomePed = pedObj ? pedObj.nome : pedId;
    if (modoAba === 'individual') {
      setFormData(prev => ({ ...prev, pedreira_id: pedId, pedreira_nome: nomePed }));
    } else {
      setLoteData(prev => ({ ...prev, pedreira_id: pedId, pedreira_nome: nomePed }));
    }
  };

  // Filtragem de clientes para a barra de pesquisa
  const handleFiltrarClientes = (termo) => {
    if (modoAba === 'individual') {
      setFormData(prev => ({ ...prev, cliente_nome: termo }));
    } else {
      setLoteData(prev => ({ ...prev, cliente_nome: termo }));
    }

    if (!termo || termo.trim().length < 1) {
      setSugestoesClientes(clientesBase.slice(0, 10));
      setMostrarDropdownClientes(true);
      return;
    }

    const t = termo.toLowerCase().trim();
    const filtrados = clientesBase.filter(c => 
      c.nome.toLowerCase().includes(t) || (c.cnpj && c.cnpj.includes(t))
    );
    setSugestoesClientes(filtrados.slice(0, 10));
    setMostrarDropdownClientes(true);
  };

  const handleSelecionarCliente = (cliente) => {
    if (modoAba === 'individual') {
      setFormData(prev => ({
        ...prev,
        cliente_nome: cliente.nome,
        cliente_cnpj: cliente.cnpj ? formatarCNPJ(cliente.cnpj) : prev.cliente_cnpj
      }));
    } else {
      setLoteData(prev => ({
        ...prev,
        cliente_nome: cliente.nome,
        cliente_cnpj: cliente.cnpj ? formatarCNPJ(cliente.cnpj) : prev.cliente_cnpj
      }));
    }
    setMostrarDropdownClientes(false);
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
      setErro('Informe o cliente / comprador do bloco.');
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

  const clienteAtual = modoAba === 'individual' ? formData.cliente_nome : loteData.cliente_nome;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div 
        className="glass-panel" 
        style={{
          maxWidth: 620,
          width: '100%',
          maxHeight: '90vh',
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
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 8 }}>
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
                  placeholder="Ex: 0326 ou 11/26 (Thor/Argos)"
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
            </div>

            {/* BARRA DE PESQUISA DE CLIENTES NO BANCO DE DADOS */}
            <div className="form-group" style={{ marginTop: 14, position: 'relative' }} ref={dropdownRef}>
              <label className="form-label" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Cliente / Comprador:</span>
                <span style={{ fontSize: '0.72rem', color: '#4ade80' }}>🔍 Pesquisa rápida no banco de dados</span>
              </label>
              
              <div style={{ position: 'relative' }}>
                <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Digite para pesquisar o cliente ou insira um novo..."
                  value={formData.cliente_nome}
                  onChange={(e) => handleFiltrarClientes(e.target.value)}
                  onFocus={() => {
                    handleFiltrarClientes(formData.cliente_nome);
                  }}
                  style={{ paddingLeft: 36 }}
                  required
                />
              </div>

              {/* Dropdown de Clientes Encontrados */}
              {mostrarDropdownClientes && sugestoesClientes.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--slate-800)',
                  border: '1px solid rgba(0, 168, 62, 0.4)',
                  borderRadius: 8,
                  marginTop: 4,
                  maxHeight: 180,
                  overflowY: 'auto',
                  zIndex: 100,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
                }}>
                  {sugestoesClientes.map((cli, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelecionarCliente(cli)}
                      style={{
                        padding: '9px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.84rem',
                        color: '#fff',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 168, 62, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Building2 size={14} color="#4ade80" />
                        <strong>{cli.nome}</strong>
                      </div>
                      {cli.cnpj && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
                          CNPJ: {cli.cnpj}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CNPJ do Cliente (Opcional) */}
            <div className="form-group" style={{ marginTop: 14 }}>
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

            {/* Observações / Detalhes de Pátio */}
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
            </div>

            {/* Barra de Pesquisa de Cliente no Lote */}
            <div className="form-group" style={{ marginTop: 14, position: 'relative' }} ref={dropdownRef}>
              <label className="form-label" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Cliente / Destinatário Comum:</span>
                <span style={{ fontSize: '0.72rem', color: '#4ade80' }}>🔍 Pesquisa no banco</span>
              </label>
              
              <div style={{ position: 'relative' }}>
                <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Pesquisar cliente ou digitar..."
                  value={loteData.cliente_nome}
                  onChange={(e) => handleFiltrarClientes(e.target.value)}
                  onFocus={() => handleFiltrarClientes(loteData.cliente_nome)}
                  style={{ paddingLeft: 36 }}
                  required
                />
              </div>

              {mostrarDropdownClientes && sugestoesClientes.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--slate-800)',
                  border: '1px solid rgba(0, 168, 62, 0.4)',
                  borderRadius: 8,
                  marginTop: 4,
                  maxHeight: 180,
                  overflowY: 'auto',
                  zIndex: 100,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
                }}>
                  {sugestoesClientes.map((cli, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelecionarCliente(cli)}
                      style={{
                        padding: '9px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.84rem',
                        color: '#fff'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 168, 62, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Building2 size={14} color="#4ade80" />
                        <strong>{cli.nome}</strong>
                      </div>
                      {cli.cnpj && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
                          CNPJ: {cli.cnpj}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>CNPJ do Cliente (Opcional):</label>
              <input
                type="text"
                className="form-input"
                placeholder="00.000.000/0000-00"
                value={loteData.cliente_cnpj}
                onChange={(e) => setLoteData(prev => ({ ...prev, cliente_cnpj: formatarCNPJ(e.target.value) }))}
              />
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>
                Lista de Números dos Blocos (Cole um por linha ou separados por vírgula):
              </label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Exemplo:&#10;1256926&#10;1256927&#10;1256928"
                value={loteData.textoBlocos}
                onChange={(e) => setLoteData(prev => ({ ...prev, textoBlocos: e.target.value }))}
                required
                style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
              />
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
