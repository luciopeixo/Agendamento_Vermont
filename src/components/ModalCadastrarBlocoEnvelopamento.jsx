import React, { useState, useEffect, useRef } from 'react';
import { X, Layers, Box, Building2, Search, CheckCircle2, AlertTriangle, UploadCloud, Plus, UserPlus, Hash, FileText } from 'lucide-react';
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
  obterClientesDoBancoDeDados,
  listarEnvelopamentos,
  verificarDuplicidadeBloco,
  identificarDuplicidadesEmLista
} from '../services/envelopamentoService';
import { ModalGestaoClientes } from './ModalGestaoClientes';
import { ModalImportarRomaneioPdf } from './ModalImportarRomaneioPdf';

export function ModalCadastrarBlocoEnvelopamento({
  blocoEdicao = null,
  onFechar,
  onSalvo,
  usuarioNome = 'Equipe Vermont'
}) {
  const [modoAba, setModoAba] = useState('individual'); // 'individual' | 'lote' | 'pdf'
  const [modalGestaoClientesAberto, setModalGestaoClientesAberto] = useState(false);
  const [modalPdfAberto, setModalPdfAberto] = useState(false);
  const [envelopamentosExistentes, setEnvelopamentosExistentes] = useState([]);
  
  // Estado Individual
  const [formData, setFormData] = useState({
    id: blocoEdicao?.id || null,
    pedreira_id: blocoEdicao?.pedreira_id || 'uruoca',
    pedreira_nome: blocoEdicao?.pedreira_nome || 'Uruoca - CE (Taj Mahal)',
    material: blocoEdicao?.material || 'Taj Mahal',
    numero_bloco: blocoEdicao?.numero_bloco || '',
    peso_kg: blocoEdicao?.peso_kg || '',
    numero_romaneio: blocoEdicao?.numero_romaneio || '',
    cliente_nome: blocoEdicao?.cliente_nome || '',
    cliente_cnpj: blocoEdicao?.cliente_cnpj || '',
    status: blocoEdicao?.status || 'pendente_envelopamento',
    observacoes: blocoEdicao?.observacoes || ''
  });

  // Estado em Lote
  const [loteData, setLoteData] = useState({
    pedreira_id: 'uruoca',
    pedreira_nome: 'Uruoca - CE (Taj Mahal)',
    material: 'Taj Mahal',
    numero_romaneio: '',
    cliente_nome: '',
    cliente_cnpj: '',
    status: 'pendente_envelopamento',
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

  // Dropdown de CNPJs
  const [sugestoesCNPJ, setSugestoesCNPJ] = useState([]);
  const [mostrarDropdownCNPJ, setMostrarDropdownCNPJ] = useState(false);
  const dropdownCnpjRef = useRef(null);

  const carregarClientes = async () => {
    try {
      const res = await obterClientesDoBancoDeDados();
      setClientesBase(res);
    } catch (e) {}
  };

  useEffect(() => {
    carregarClientes();
    listarEnvelopamentos().then(res => setEnvelopamentosExistentes(res || [])).catch(() => {});
  }, []);

  // Verificação de duplicidade individual em tempo real
  const duplicidadeIndividual = React.useMemo(() => {
    if (!formData.numero_bloco || !formData.cliente_nome) return { ehDuplicado: false, existente: null };
    return verificarDuplicidadeBloco({
      numero_bloco: formData.numero_bloco,
      cliente_nome: formData.cliente_nome,
      cliente_cnpj: formData.cliente_cnpj,
      material: formData.material,
      pedreira_id: formData.pedreira_id,
      pedreira_nome: formData.pedreira_nome,
      idAtual: formData.id,
      listaExistente: envelopamentosExistentes
    });
  }, [formData.numero_bloco, formData.cliente_nome, formData.cliente_cnpj, formData.material, formData.pedreira_id, formData.pedreira_nome, formData.id, envelopamentosExistentes]);

  // Verificação de duplicidade em lote
  const blocosLoteAvaliados = React.useMemo(() => {
    if (!loteData.textoBlocos.trim() || !loteData.cliente_nome.trim()) return [];
    const linhas = loteData.textoBlocos
      .split(/[\n,;]+/)
      .map(b => sanitizarNumeroBloco(b, isClienteThorOuArgos(loteData.cliente_nome)))
      .filter(b => b.length > 0);

    const itens = linhas.map(bloco => ({
      numero_bloco: bloco,
      pedreira_id: loteData.pedreira_id,
      pedreira_nome: loteData.pedreira_nome,
      material: loteData.material,
      cliente_nome: loteData.cliente_nome,
      cliente_cnpj: loteData.cliente_cnpj
    }));
    return identificarDuplicidadesEmLista(itens, envelopamentosExistentes);
  }, [loteData.textoBlocos, loteData.cliente_nome, loteData.cliente_cnpj, loteData.pedreira_id, loteData.pedreira_nome, loteData.material, envelopamentosExistentes]);

  const duplicadosLote = React.useMemo(() => {
    return blocosLoteAvaliados.filter(b => b.ehDuplicado);
  }, [blocosLoteAvaliados]);

  const handleRemoverDuplicadosLote = () => {
    const unicos = blocosLoteAvaliados.filter(b => !b.ehDuplicado).map(b => b.numero_bloco);
    setLoteData(prev => ({
      ...prev,
      textoBlocos: unicos.join('\n')
    }));
  };

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickFora = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMostrarDropdownClientes(false);
      }
      if (dropdownCnpjRef.current && !dropdownCnpjRef.current.contains(e.target)) {
        setMostrarDropdownCNPJ(false);
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

  // Filtrar clientes por Nome ou CNPJ
  const handleFiltrarClientes = (termo) => {
    if (modoAba === 'individual') {
      setFormData(prev => ({ ...prev, cliente_nome: termo }));
    } else {
      setLoteData(prev => ({ ...prev, cliente_nome: termo }));
    }

    if (!termo || termo.trim().length < 1) {
      setSugestoesClientes(clientesBase.slice(0, 80));
      setMostrarDropdownClientes(true);
      return;
    }

    const t = termo.toLowerCase().trim();
    const digitos = t.replace(/\D/g, '');

    const filtrados = clientesBase.filter(c => {
      const nomeMatch = (c.nome || '').toLowerCase().includes(t);
      const cnpjMatch = (c.cnpj || '').toLowerCase().includes(t);
      const cnpjDigitosMatch = digitos.length >= 2 && String(c.cnpj || '').replace(/\D/g, '').includes(digitos);
      return nomeMatch || cnpjMatch || cnpjDigitosMatch;
    });

    setSugestoesClientes(filtrados.slice(0, 80));
    setMostrarDropdownClientes(true);
  };

  // Filtrar CNPJ com busca inteligente
  const handleFiltrarCNPJ = (valor) => {
    const fmt = formatarCNPJ(valor);
    if (modoAba === 'individual') {
      setFormData(prev => ({ ...prev, cliente_cnpj: fmt }));
    } else {
      setLoteData(prev => ({ ...prev, cliente_cnpj: fmt }));
    }

    const limpo = fmt.replace(/\D/g, '');
    if (limpo.length === 14) {
      handleBuscarCNPJ(limpo, modoAba);
    }

    if (!valor || valor.trim().length < 1) {
      const comCnpj = clientesBase.filter(c => !!c.cnpj);
      setSugestoesCNPJ(comCnpj.slice(0, 80));
      setMostrarDropdownCNPJ(true);
      return;
    }

    const filtrados = clientesBase.filter(c => {
      if (!c.cnpj) return false;
      const cnpjDigitos = c.cnpj.replace(/\D/g, '');
      return c.cnpj.includes(valor) || (limpo && cnpjDigitos.includes(limpo)) || c.nome.toLowerCase().includes(valor.toLowerCase());
    });
    setSugestoesCNPJ(filtrados.slice(0, 80));
    setMostrarDropdownCNPJ(true);
  };

  const handleSelecionarCliente = (cliente) => {
    const cnpjFmt = cliente.cnpj ? formatarCNPJ(cliente.cnpj) : '';
    if (modoAba === 'individual') {
      setFormData(prev => ({
        ...prev,
        cliente_nome: cliente.nome,
        cliente_cnpj: cnpjFmt || prev.cliente_cnpj
      }));
    } else {
      setLoteData(prev => ({
        ...prev,
        cliente_nome: cliente.nome,
        cliente_cnpj: cnpjFmt || prev.cliente_cnpj
      }));
    }
    setMostrarDropdownClientes(false);
    setMostrarDropdownCNPJ(false);
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

    // Validação de formato da barra para Taj Mahal (Thor/Argos exige "/", outros proíbe "/")
    const validacao = validarFormatoBlocoTajMahal({
      material: formData.material,
      cliente: formData.cliente_nome,
      numero_bloco: formData.numero_bloco
    });
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
      console.error('Erro ao salvar envelopamento:', err);
      setErro(err?.message || 'Erro ao salvar bloco. Tente novamente.');
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

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 10, 8, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div 
        className="glass-panel animate-fade" 
        style={{
          maxWidth: 620,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px 28px',
          borderRadius: 16,
          border: '1px solid rgba(0, 168, 62, 0.4)',
          boxShadow: '0 25px 55px rgba(0,0,0,0.85)',
          background: '#0d1310',
          position: 'relative'
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
                Controle de pátio e liberação de blocos Vermont
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

        {/* Abas: Individual vs Lote vs PDF (apenas para novos cadastros) */}
        {!blocoEdicao && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setModoAba('individual')}
              className={`btn ${modoAba === 'individual' ? 'btn-vermont' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '7px 12px', fontSize: '0.82rem', gap: 6, minWidth: 140 }}
            >
              <Plus size={15} />
              Individual
            </button>
            <button
              type="button"
              onClick={() => setModoAba('lote')}
              className={`btn ${modoAba === 'lote' ? 'btn-vermont' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '7px 12px', fontSize: '0.82rem', gap: 6, minWidth: 140 }}
            >
              <UploadCloud size={15} />
              Lote Manual
            </button>
            <button
              type="button"
              onClick={() => setModalPdfAberto(true)}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '7px 12px', fontSize: '0.82rem', gap: 6, minWidth: 140, color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)', background: 'rgba(56, 189, 248, 0.1)' }}
            >
              <FileText size={15} color="#38bdf8" />
              Importar PDF
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

              {/* Peso (Kg) */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>Peso (Kg):</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: 34.849,11"
                  value={formData.peso_kg}
                  onChange={(e) => setFormData(prev => ({ ...prev, peso_kg: e.target.value }))}
                />
              </div>

              {/* Romaneio Nº */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>Romaneio Nº (Opcional):</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: 839/26 ou S/N"
                  value={formData.numero_romaneio}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero_romaneio: e.target.value }))}
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

            {/* BARRA DE PESQUISA DE CLIENTES NO BANCO DE DADOS + BOTÃO CADASTRAR CLIENTE */}
            <div className="form-group" style={{ marginTop: 14, position: 'relative' }} ref={dropdownRef}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <label className="form-label" style={{ fontSize: '0.82rem', margin: 0 }}>
                  Cliente / Comprador ({clientesBase.length} cadastrados):
                </label>
                <button
                  type="button"
                  onClick={() => setModalGestaoClientesAberto(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4ade80',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontWeight: 600,
                    textDecoration: 'underline'
                  }}
                >
                  <UserPlus size={13} /> + Cadastrar / Gerenciar Clientes
                </button>
              </div>
              
              <div style={{ position: 'relative' }}>
                <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Pesquisar por nome ou CNPJ no banco de dados..."
                  value={formData.cliente_nome}
                  onChange={(e) => handleFiltrarClientes(e.target.value)}
                  onFocus={() => handleFiltrarClientes(formData.cliente_nome)}
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
                  border: '1px solid rgba(0, 168, 62, 0.5)',
                  borderRadius: 8,
                  marginTop: 4,
                  maxHeight: 250,
                  overflowY: 'auto',
                  zIndex: 100,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
                }}>
                  {sugestoesClientes.map((cli, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelecionarCliente(cli)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        fontSize: '0.84rem',
                        color: '#fff',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 168, 62, 0.22)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                        <Building2 size={15} color="#4ade80" style={{ flexShrink: 0 }} />
                        <strong style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {cli.nome}
                        </strong>
                      </div>
                      {cli.cnpj ? (
                        <span style={{
                          fontSize: '0.72rem',
                          background: 'rgba(74, 222, 128, 0.12)',
                          color: '#4ade80',
                          padding: '2px 8px',
                          borderRadius: 4,
                          border: '1px solid rgba(74, 222, 128, 0.3)',
                          fontFamily: 'monospace',
                          flexShrink: 0
                        }}>
                          {cli.cnpj}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.70rem', color: 'var(--slate-500)', flexShrink: 0 }}>
                          (Sem CNPJ)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CNPJ do Cliente (Opcional com Autocomplete e Busca Integrada) */}
            <div className="form-group" style={{ marginTop: 14, position: 'relative' }} ref={dropdownCnpjRef}>
              <label className="form-label" style={{ fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>CNPJ do Cliente (Opcional):</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>Preenche automaticamente ao selecionar o cliente acima</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="00.000.000/0000-00 (ou pesquise por CNPJ)"
                  value={formData.cliente_cnpj}
                  onChange={(e) => handleFiltrarCNPJ(e.target.value)}
                  onFocus={() => handleFiltrarCNPJ(formData.cliente_cnpj)}
                />
                {buscandoCNPJ && (
                  <span className="spinner" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14 }} />
                )}
              </div>

              {/* Dropdown de CNPJs Cadastrados */}
              {mostrarDropdownCNPJ && sugestoesCNPJ.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--slate-800)',
                  border: '1px solid rgba(0, 168, 62, 0.5)',
                  borderRadius: 8,
                  marginTop: 4,
                  maxHeight: 220,
                  overflowY: 'auto',
                  zIndex: 100,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
                }}>
                  {sugestoesCNPJ.map((cli, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelecionarCliente(cli)}
                      style={{
                        padding: '9px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                        color: '#fff'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 168, 62, 0.22)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontFamily: 'monospace', color: '#4ade80', fontWeight: 700 }}>
                        {cli.cnpj}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--slate-300)', marginLeft: 10 }}>
                        {cli.nome}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Observações / Detalhes de Pátio */}
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Observações / Detalhes de Pátio:</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Ex: Bloco no pátio 2..."
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              />
            </div>

            {/* Alerta de Duplicidade Individual */}
            {duplicidadeIndividual.ehDuplicado && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.14)',
                border: '1px solid rgba(239, 68, 68, 0.45)',
                borderRadius: 10,
                padding: '11px 15px',
                marginTop: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.82rem', color: '#fca5a5' }}>
                  <strong style={{ display: 'block', color: '#fff', marginBottom: 2 }}>
                    Atenção: Bloco em Duplicidade Detectado!
                  </strong>
                  O bloco <strong>{formData.numero_bloco}</strong> já se encontra cadastrado para <strong>{formData.cliente_nome}</strong> ({formData.material} - {formData.pedreira_nome}).
                  {duplicidadeIndividual.existente?.numero_romaneio && (
                    <span style={{ display: 'block', marginTop: 2, color: '#fecaca', fontSize: '0.76rem' }}>
                      Romaneio Original: <strong>{duplicidadeIndividual.existente.numero_romaneio}</strong> | Status: <strong>{duplicidadeIndividual.existente.status}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

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
                <label className="form-label" style={{ fontSize: '0.82rem' }}>Status dos Blocos:</label>
                <select
                  className="form-select"
                  value={loteData.status}
                  onChange={(e) => setLoteData(prev => ({ ...prev, status: e.target.value }))}
                >
                  {Object.values(STATUS_ENVELOPAMENTO).map(st => (
                    <option key={st.id} value={st.id}>{st.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Barra de Pesquisa de Cliente no Lote */}
            <div className="form-group" style={{ marginTop: 14, position: 'relative' }} ref={dropdownRef}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>
                Cliente / Destinatário Comum ({clientesBase.length} disponíveis):
              </label>
              
              <div style={{ position: 'relative' }}>
                <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Pesquisar cliente ou CNPJ..."
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
                  border: '1px solid rgba(0, 168, 62, 0.5)',
                  borderRadius: 8,
                  marginTop: 4,
                  maxHeight: 220,
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
                        <span style={{ fontSize: '0.72rem', color: '#4ade80', fontFamily: 'monospace' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label className="form-label" style={{ fontSize: '0.82rem', margin: 0 }}>
                  Lista de Números dos Blocos:
                </label>
                {blocosLoteAvaliados.length > 0 && (
                  <span style={{ fontSize: '0.74rem', color: duplicadosLote.length > 0 ? '#f87171' : '#4ade80', fontWeight: 600 }}>
                    {blocosLoteAvaliados.length} bloco(s) {duplicadosLote.length > 0 ? `(${duplicadosLote.length} duplicado${duplicadosLote.length > 1 ? 's' : ''})` : 'válidos'}
                  </span>
                )}
              </div>
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

            {/* Aviso de Duplicidade no Lote */}
            {duplicadosLote.length > 0 && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.14)',
                border: '1px solid rgba(239, 68, 68, 0.45)',
                borderRadius: 10,
                padding: '11px 15px',
                marginTop: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '0.82rem', color: '#fca5a5' }}>
                    <strong style={{ display: 'block', color: '#fff', marginBottom: 2 }}>
                      {duplicadosLote.length} bloco(s) em duplicidade detectado(s):
                    </strong>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#fecaca' }}>
                      {duplicadosLote.map(d => d.numero_bloco).join(', ')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoverDuplicadosLote}
                  className="btn btn-secondary"
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.74rem',
                    background: 'rgba(0, 168, 62, 0.2)',
                    borderColor: '#00a83e',
                    color: '#4ade80',
                    fontWeight: 600
                  }}
                >
                  Remover Duplicados do Texto ({duplicadosLote.length})
                </button>
              </div>
            )}

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

        {/* Modal de Gestão de Clientes */}
        {modalGestaoClientesAberto && (
          <ModalGestaoClientes
            onFechar={() => {
              setModalGestaoClientesAberto(false);
              carregarClientes();
            }}
            onClienteSelecionado={(cli) => {
              handleSelecionarCliente(cli);
              carregarClientes();
              setModalGestaoClientesAberto(false);
            }}
          />
        )}

        {/* Modal de Importação de Romaneio PDF */}
        {modalPdfAberto && (
          <ModalImportarRomaneioPdf
            usuarioNome={usuarioNome}
            onFechar={() => setModalPdfAberto(false)}
            onSucesso={(qtd) => {
              setModalPdfAberto(false);
              if (onSalvo) onSalvo(null, qtd);
              onFechar();
            }}
          />
        )}
      </div>
    </div>
  );
}
