import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Layers, 
  Clock, 
  Ban, 
  Check, 
  Edit3, 
  Trash2, 
  HelpCircle,
  RefreshCw,
  Search,
  Sparkles
} from 'lucide-react';
import { 
  lerEProcessarRomaneioPdf 
} from '../services/pdfRomaneioService';
import { 
  STATUS_ENVELOPAMENTO, 
  importarBlocosEmLote,
  obterClientesDoBancoDeDados,
  salvarClienteCadastrado
} from '../services/envelopamentoService';
import { 
  PEDREIRAS_CEARA, 
  obterMateriaisPorPedreira, 
  formatarCNPJ,
  consultarCNPJReceita
} from '../services/agendamentoService';

export function ModalImportarRomaneioPdf({
  onFechar,
  onSucesso,
  usuarioNome = 'Equipe Vermont'
}) {
  const [etapa, setEtapa] = useState('upload'); // 'upload' | 'processando' | 'revisao'
  const [arrastando, setArrastando] = useState(false);
  const [erro, setErro] = useState('');
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);

  // Clientes do banco para autocomplete
  const [clientesBase, setClientesBase] = useState([]);
  const [sugestoesClientes, setSugestoesClientes] = useState([]);
  const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleConsultarCnpjReceita = async (cnpjParaBuscar) => {
    const limpo = (cnpjParaBuscar || dadosProcessados?.cliente?.cnpj || '').replace(/\D/g, '');
    if (limpo.length !== 14) return;
    
    setBuscandoCnpj(true);
    try {
      const res = await consultarCNPJReceita(limpo);
      if (res?.valido && res?.empresa?.razao_social) {
        const razao = res.empresa.razao_social.toUpperCase().trim();
        setDadosProcessados(prev => ({
          ...prev,
          cliente: {
            ...prev.cliente,
            nome: razao,
            fonte: res.fonte || 'Receita Federal (Oficial)'
          },
          blocos: prev.blocos.map(b => ({
            ...b,
            cliente_nome: razao
          }))
        }));
      }
    } catch (e) {
      console.warn('Erro ao consultar CNPJ:', e);
    } finally {
      setBuscandoCnpj(false);
    }
  };

  useEffect(() => {
    obterClientesDoBancoDeDados().then(res => setClientesBase(res || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickFora = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMostrarDropdownClientes(false);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  const handleProcessarArquivo = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErro('Por favor, selecione um arquivo em formato PDF.');
      return;
    }

    setErro('');
    setNomeArquivo(file.name);
    setEtapa('processando');

    try {
      const resultado = await lerEProcessarRomaneioPdf(file);
      
      if (!resultado || !resultado.blocos || resultado.blocos.length === 0) {
        throw new Error('Nenhum bloco foi identificado no documento. Verifique se o PDF é um Romaneio padrão da Vermont.');
      }

      setDadosProcessados(resultado);
      setEtapa('revisao');
    } catch (err) {
      console.error('Erro ao processar PDF do romaneio:', err);
      setErro(err?.message || 'Falha ao processar o arquivo PDF. Verifique o layout do documento.');
      setEtapa('upload');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setArrastando(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessarArquivo(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setArrastando(true);
  };

  const handleDragLeave = () => {
    setArrastando(false);
  };

  // Alterar seleção em lote
  const handleToggleTodos = (selecionar) => {
    if (!dadosProcessados) return;
    setDadosProcessados(prev => ({
      ...prev,
      blocos: prev.blocos.map(b => ({ ...b, selecionado: selecionar }))
    }));
  };

  // Alterar seleção individual
  const handleToggleBloco = (id) => {
    if (!dadosProcessados) return;
    setDadosProcessados(prev => ({
      ...prev,
      blocos: prev.blocos.map(b => b.id === id ? { ...b, selecionado: !b.selecionado } : b)
    }));
  };

  // Alterar status de um bloco específico
  const handleAlterarStatusBloco = (id, novoStatus) => {
    if (!dadosProcessados) return;
    setDadosProcessados(prev => ({
      ...prev,
      blocos: prev.blocos.map(b => b.id === id ? { ...b, status: novoStatus } : b)
    }));
  };

  // Remover bloco da lista de importação
  const handleRemoverBloco = (id) => {
    if (!dadosProcessados) return;
    setDadosProcessados(prev => ({
      ...prev,
      blocos: prev.blocos.filter(b => b.id !== id)
    }));
  };

  // Atualizar cliente do cabeçalho
  const handleFiltrarClientes = (termo) => {
    if (!dadosProcessados) return;
    setDadosProcessados(prev => ({
      ...prev,
      cliente: { ...prev.cliente, nome: termo }
    }));

    if (!termo || termo.trim().length < 1) {
      setSugestoesClientes(clientesBase.slice(0, 50));
      setMostrarDropdownClientes(true);
      return;
    }

    const t = termo.toLowerCase().trim();
    const filtrados = clientesBase.filter(c => {
      const nMatch = (c.nome || '').toLowerCase().includes(t);
      const cMatch = (c.cnpj || '').includes(t);
      return nMatch || cMatch;
    });
    setSugestoesClientes(filtrados.slice(0, 50));
    setMostrarDropdownClientes(true);
  };

  const handleSelecionarCliente = (cli) => {
    if (!dadosProcessados) return;
    const cnpjFmt = cli.cnpj ? formatarCNPJ(cli.cnpj) : dadosProcessados.cliente.cnpj;
    setDadosProcessados(prev => ({
      ...prev,
      cliente: {
        nome: cli.nome,
        cnpj: cnpjFmt
      },
      blocos: prev.blocos.map(b => ({
        ...b,
        cliente_nome: cli.nome,
        cliente_cnpj: cnpjFmt
      }))
    }));
    setMostrarDropdownClientes(false);
  };

  // Alterar Pedreira
  const handleAlterarPedreira = (pedId) => {
    if (!dadosProcessados) return;
    const pedObj = PEDREIRAS_CEARA.find(p => p.id === pedId);
    const nome = pedObj ? pedObj.nome : pedId;
    setDadosProcessados(prev => ({
      ...prev,
      pedreira: { id: pedId, nome },
      blocos: prev.blocos.map(b => ({
        ...b,
        pedreira_id: pedId,
        pedreira_nome: nome
      }))
    }));
  };

  // Confirmar e Salvar Importação
  const handleConfirmarImportacao = async () => {
    if (!dadosProcessados) return;
    const selecionados = dadosProcessados.blocos.filter(b => b.selecionado);
    
    if (selecionados.length === 0) {
      setErro('Selecione pelo menos um bloco para importar.');
      return;
    }

    setSalvando(true);
    setErro('');

    try {
      // Garantir que todos os blocos herdem os dados finais do cabeçalho
      const itensProntos = selecionados.map(b => ({
        numero_bloco: b.numero_bloco,
        pedreira_id: dadosProcessados.pedreira.id,
        pedreira_nome: dadosProcessados.pedreira.nome,
        material: b.material,
        peso_kg: b.peso_kg || '',
        numero_romaneio: dadosProcessados.numeroRomaneio || b.numero_romaneio || '',
        data_romaneio: dadosProcessados.dataEmissao || b.data_romaneio || '',
        cliente_nome: dadosProcessados.cliente.nome,
        cliente_cnpj: dadosProcessados.cliente.cnpj,
        status: b.status,
        observacoes: b.observacoes || `Importado via Romaneio Nº ${dadosProcessados.numeroRomaneio}`
      }));

      // Salvar em lote
      await importarBlocosEmLote(itensProntos, usuarioNome);

      // Salvar cliente na base
      if (dadosProcessados.cliente.nome) {
        await salvarClienteCadastrado({
          nome: dadosProcessados.cliente.nome,
          cnpj: dadosProcessados.cliente.cnpj
        });
      }

      if (onSucesso) {
        onSucesso(itensProntos.length);
      }
      onFechar();
    } catch (err) {
      console.error('Erro ao salvar importação:', err);
      setErro(err?.message || 'Erro ao gravar os blocos no sistema.');
    } finally {
      setSalvando(false);
    }
  };

  const blocos = dadosProcessados?.blocos || [];
  const qtdSelecionados = blocos.filter(b => b.selecionado).length;
  const qtdPendentes = blocos.filter(b => b.selecionado && b.status === 'pendente_envelopamento').length;
  const qtdSemEnv = blocos.filter(b => b.selecionado && b.status === 'sem_envelopamento').length;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 10, 8, 0.90)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !salvando) onFechar();
      }}
    >
      <div 
        className="glass-panel animate-fade" 
        style={{
          maxWidth: etapa === 'revisao' ? 950 : 600,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '24px 28px',
          borderRadius: 16,
          border: '1px solid rgba(0, 168, 62, 0.4)',
          boxShadow: '0 25px 55px rgba(0,0,0,0.9)',
          background: '#0d1310',
          position: 'relative',
          transition: 'max-width 0.25s ease'
        }}
      >
        {/* Cabeçalho do Modal */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 14, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(0, 168, 62, 0.3), rgba(56, 189, 248, 0.2))',
              border: '1px solid #00a83e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 168, 62, 0.3)'
            }}>
              <FileText size={22} color="#4ade80" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                Importar Romaneio PDF
                <span style={{ fontSize: '0.70rem', background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(74, 222, 128, 0.3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Sparkles size={11} /> Reconhecimento Automático
                </span>
              </h3>
              <p style={{ margin: 0, fontSize: '0.80rem', color: 'var(--slate-400)' }}>
                Extração inteligente de blocos, pedreiras, clientes e classificação de envelopamento Vermont
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onFechar} 
            disabled={salvando}
            className="btn btn-secondary" 
            style={{ padding: 6, borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {erro && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: '0.84rem',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>{erro}</span>
          </div>
        )}

        {/* ETAPA 1: UPLOAD / DRAG & DROP */}
        {etapa === 'upload' && (
          <div>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: arrastando ? '2px dashed #4ade80' : '2px dashed rgba(255,255,255,0.2)',
                borderRadius: 14,
                padding: '40px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: arrastando ? 'rgba(0, 168, 62, 0.1)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s',
                marginBottom: 18
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleProcessarArquivo(e.target.files[0]);
                  }
                }}
              />
              <div style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'rgba(0, 168, 62, 0.15)',
                color: '#4ade80',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <UploadCloud size={30} />
              </div>
              <h4 style={{ margin: '0 0 6px', color: '#fff', fontSize: '1.05rem' }}>
                Clique ou arraste o arquivo PDF do Romaneio aqui
              </h4>
              <p style={{ margin: 0, color: 'var(--slate-400)', fontSize: '0.82rem' }}>
                Suporte nativo aos Romaneios de Saída emitidos pela Vermont Mineração
              </p>
            </div>

            {/* Explicação das Regras */}
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8', fontSize: '0.82rem', fontWeight: 600, marginBottom: 8 }}>
                <HelpCircle size={15} /> Como funciona o reconhecimento inteligente:
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.78rem', color: 'var(--slate-300)', lineHeight: '1.5' }}>
                <li><strong>Pedreira & Cliente:</strong> Reconhece automaticamente a localidade (ex: Uruoca / Massapê) e o cliente/CNPJ comprador.</li>
                <li><strong>Regra 1:</strong> Se a coluna <em>ENVELOPAMENTO</em> tiver valor monetário maior que R$ 0,00 $\rightarrow$ Bloco definido como <strong>Pendente de Envelopamento</strong>.</li>
                <li><strong>Regra 2:</strong> Se a coluna estiver zerada, mas nas <em>OBSERVAÇÕES</em> constar o número do bloco com valor em R$ $\rightarrow$ Bloco definido como <strong>Pendente de Envelopamento</strong>.</li>
                <li><strong>Regra 3:</strong> Sem cobrança no campo nem nas observações (ou declarado "Sem envelopamento") $\rightarrow$ Bloco definido como <strong>Sem envelopamento</strong>.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ETAPA 2: PROCESSANDO */}
        {etapa === 'processando' && (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <span className="spinner" style={{ width: 36, height: 36, display: 'inline-block', marginBottom: 16 }} />
            <h4 style={{ margin: '0 0 6px', color: '#fff', fontSize: '1.1rem' }}>Lendo e analisando romaneio...</h4>
            <p style={{ margin: 0, color: 'var(--slate-400)', fontSize: '0.84rem' }}>
              Processando <strong>{nomeArquivo}</strong> e aplicando as regras de envelopamento
            </p>
          </div>
        )}

        {/* ETAPA 3: REVISÃO E CONFIRMAÇÃO */}
        {etapa === 'revisao' && dadosProcessados && (
          <div>
            {/* Card de Resumo do Cabeçalho */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 18,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 14
            }}>
              {/* Romaneio */}
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)', display: 'block' }}>Romaneio Nº</span>
                <strong style={{ fontSize: '1.05rem', color: '#38bdf8', fontFamily: 'monospace' }}>
                  {dadosProcessados.numeroRomaneio || 'S/N'}
                </strong>
                {dadosProcessados.dataEmissao && (
                  <span style={{ fontSize: '0.70rem', color: 'var(--slate-400)', display: 'block' }}>
                    Emissão: {dadosProcessados.dataEmissao}
                  </span>
                )}
              </div>

              {/* Pedreira */}
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)', display: 'block' }}>Pedreira Detectada</span>
                <select
                  className="form-select"
                  value={dadosProcessados.pedreira.id}
                  onChange={(e) => handleAlterarPedreira(e.target.value)}
                  style={{ height: 34, fontSize: '0.82rem', padding: '4px 10px', marginTop: 2 }}
                >
                  {PEDREIRAS_CEARA.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              {/* Cliente */}
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>Cliente Comprador</span>
                  {dadosProcessados.cliente?.fonte && (
                    <span style={{
                      fontSize: '0.68rem',
                      background: dadosProcessados.cliente.fonte.includes('Receita') ? 'rgba(34, 197, 94, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                      color: dadosProcessados.cliente.fonte.includes('Receita') ? '#4ade80' : '#38bdf8',
                      padding: '1px 6px',
                      borderRadius: 4,
                      border: `1px solid ${dadosProcessados.cliente.fonte.includes('Receita') ? 'rgba(34, 197, 94, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                      fontWeight: 700
                    }}>
                      {dadosProcessados.cliente.fonte}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  className="form-input"
                  value={dadosProcessados.cliente.nome}
                  onChange={(e) => handleFiltrarClientes(e.target.value)}
                  onFocus={() => handleFiltrarClientes(dadosProcessados.cliente.nome)}
                  style={{ height: 34, fontSize: '0.82rem', padding: '4px 10px', marginTop: 2 }}
                  placeholder="Nome do cliente..."
                />
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
                    maxHeight: 200,
                    overflowY: 'auto',
                    zIndex: 200,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.8)'
                  }}>
                    {sugestoesClientes.map((c, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelecionarCliente(c)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '0.80rem',
                          color: '#fff',
                          borderBottom: '1px solid rgba(255,255,255,0.05)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 168, 62, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <strong>{c.nome}</strong>
                        {c.cnpj && <span style={{ color: '#4ade80', marginLeft: 8, fontSize: '0.70rem' }}>{c.cnpj}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CNPJ */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>CNPJ do Cliente</span>
                  {buscandoCnpj && (
                    <span style={{ fontSize: '0.68rem', color: '#38bdf8' }}>Consultando Receita...</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    className="form-input"
                    value={dadosProcessados.cliente.cnpj}
                    onChange={(e) => {
                      const fmt = formatarCNPJ(e.target.value);
                      const limpo = fmt.replace(/\D/g, '');
                      setDadosProcessados(prev => ({
                        ...prev,
                        cliente: { ...prev.cliente, cnpj: fmt },
                        blocos: prev.blocos.map(b => ({ ...b, cliente_cnpj: fmt }))
                      }));
                      if (limpo.length === 14) {
                        handleConsultarCnpjReceita(limpo);
                      }
                    }}
                    style={{ height: 34, fontSize: '0.82rem', padding: '4px 10px', marginTop: 2, flex: 1 }}
                    placeholder="00.000.000/0000-00"
                  />
                  {dadosProcessados.cliente.cnpj && (
                    <button
                      type="button"
                      onClick={() => handleConsultarCnpjReceita(dadosProcessados.cliente.cnpj)}
                      disabled={buscandoCnpj}
                      className="btn btn-secondary"
                      style={{ height: 34, padding: '0 8px', fontSize: '0.74rem', marginTop: 2, gap: 4 }}
                      title="Consultar Razão Social oficial na Receita Federal via BrasilAPI"
                    >
                      <RefreshCw size={13} className={buscandoCnpj ? 'spinner' : ''} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Barra de Seleção e Estatísticas */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.84rem', color: '#fff', fontWeight: 600 }}>
                  Blocos Identificados ({blocos.length})
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => handleToggleTodos(true)}
                    className="btn btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                  >
                    Marcar Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleTodos(false)}
                    className="btn btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                  >
                    Desmarcar Todos
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, fontSize: '0.76rem' }}>
                <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={13} /> {qtdPendentes} Pendentes de Envelopamento
                </span>
                <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Ban size={13} /> {qtdSemEnv} Sem Envelopamento
                </span>
              </div>
            </div>

            {/* Tabela de Blocos */}
            <div style={{
              maxHeight: 320,
              overflowY: 'auto',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              background: 'rgba(0,0,0,0.25)',
              marginBottom: 20
            }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={{ padding: '10px 12px', width: 40, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={blocos.length > 0 && blocos.every(b => b.selecionado)}
                        onChange={(e) => handleToggleTodos(e.target.checked)}
                      />
                    </th>
                    <th style={{ padding: '10px 12px', fontSize: '0.75rem', color: 'var(--slate-400)', textAlign: 'left' }}>BLOCO</th>
                    <th style={{ padding: '10px 12px', fontSize: '0.75rem', color: 'var(--slate-400)', textAlign: 'left' }}>MATERIAL</th>
                    <th style={{ padding: '10px 12px', fontSize: '0.75rem', color: 'var(--slate-400)', textAlign: 'center' }}>PESO (KG)</th>
                    <th style={{ padding: '10px 12px', fontSize: '0.75rem', color: 'var(--slate-400)', textAlign: 'left' }}>STATUS SUGERIDO & REGRA</th>
                    <th style={{ padding: '10px 12px', fontSize: '0.75rem', color: 'var(--slate-400)', textAlign: 'center', width: 50 }}>AÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {blocos.map((b) => {
                    const statusInfo = STATUS_ENVELOPAMENTO[b.status?.toUpperCase()] || STATUS_ENVELOPAMENTO.PENDENTE_ENVELOPAMENTO;
                    return (
                      <tr 
                        key={b.id}
                        style={{ 
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          opacity: b.selecionado ? 1 : 0.45,
                          background: b.status === 'pendente_envelopamento' ? 'rgba(245, 158, 11, 0.03)' : undefined
                        }}
                      >
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={b.selecionado}
                            onChange={() => handleToggleBloco(b.id)}
                          />
                        </td>

                        {/* Bloco */}
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#fff',
                            fontWeight: 800,
                            padding: '3px 7px',
                            borderRadius: 6,
                            fontSize: '0.84rem',
                            fontFamily: 'monospace'
                          }}>
                            {b.numero_bloco}
                          </span>
                        </td>

                        {/* Material */}
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '0.80rem', color: '#fff', fontWeight: 600 }}>
                            {b.material}
                          </span>
                        </td>

                        {/* Peso (Kg) */}
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {b.peso_kg ? (
                            <span style={{
                              fontSize: '0.78rem',
                              color: '#38bdf8',
                              fontWeight: 700,
                              fontFamily: 'monospace',
                              background: 'rgba(56, 189, 248, 0.1)',
                              padding: '2px 7px',
                              borderRadius: 4,
                              border: '1px solid rgba(56, 189, 248, 0.25)',
                              display: 'inline-block'
                            }}>
                              ⚖️ {b.peso_kg} kg
                            </span>
                          ) : (
                            <span style={{ color: 'var(--slate-500)', fontSize: '0.74rem' }}>-</span>
                          )}
                        </td>

                        {/* Status e Regra */}
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <select
                              className="form-select"
                              value={b.status}
                              onChange={(e) => handleAlterarStatusBloco(b.id, e.target.value)}
                              style={{
                                height: 30,
                                fontSize: '0.76rem',
                                padding: '2px 8px',
                                background: statusInfo.bg,
                                color: statusInfo.cor,
                                borderColor: statusInfo.border,
                                fontWeight: 700,
                                width: 'auto'
                              }}
                            >
                              {Object.values(STATUS_ENVELOPAMENTO).map(st => (
                                <option key={st.id} value={st.id}>{st.label}</option>
                              ))}
                            </select>

                            <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)', fontStyle: 'italic' }}>
                              {b.motivoStatus}
                            </span>
                          </div>
                        </td>

                        {/* Remover */}
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoverBloco(b.id)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 6px', color: '#f87171' }}
                            title="Remover este bloco da importação"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Rodapé e Ações */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setEtapa('upload');
                  setDadosProcessados(null);
                }}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', gap: 6 }}
              >
                <RefreshCw size={14} /> Escolher Outro PDF
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={onFechar} className="btn btn-secondary">
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={salvando || qtdSelecionados === 0}
                  onClick={handleConfirmarImportacao}
                  className="btn btn-vermont"
                  style={{ gap: 8, padding: '9px 20px', fontSize: '0.88rem' }}
                >
                  {salvando ? (
                    <span className="spinner" style={{ width: 16, height: 16 }} />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                  Confirmar e Importar {qtdSelecionados} Bloco{qtdSelecionados > 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
