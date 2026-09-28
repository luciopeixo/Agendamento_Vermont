import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  FileText, 
  Building2, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  RefreshCw,
  Calendar,
  Layers,
  Box
} from 'lucide-react';
import { 
  PEDREIRAS_CEARA, 
  formatarCNPJ, 
  consultarCNPJReceita 
} from '../services/agendamentoService';
import { 
  editarRomaneioCompleto, 
  obterClientesDoBancoDeDados 
} from '../services/envelopamentoService';

export function ModalEditarRomaneio({
  romaneio,
  onFechar,
  onSucesso,
  usuarioNome = 'Equipe Vermont'
}) {
  const blocos = romaneio?.blocos || [];
  const primeiroBloco = blocos[0] || {};

  const [formData, setFormData] = useState({
    numero_romaneio: romaneio?.numeroRomaneio || primeiroBloco.numero_romaneio || '',
    data_romaneio: romaneio?.dataRomaneio || primeiroBloco.data_romaneio || '',
    cliente_nome: romaneio?.clienteNome || primeiroBloco.cliente_nome || '',
    cliente_cnpj: romaneio?.clienteCnpj || primeiroBloco.cliente_cnpj || '',
    pedreira_id: primeiroBloco.pedreira_id || 'uruoca',
    pedreira_nome: primeiroBloco.pedreira_nome || 'Uruoca - CE (Taj Mahal)'
  });

  const [clientesBase, setClientesBase] = useState([]);
  const [sugestoesClientes, setSugestoesClientes] = useState([]);
  const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);
  const dropdownClienteRef = useRef(null);

  const [sugestoesCNPJ, setSugestoesCNPJ] = useState([]);
  const [mostrarDropdownCNPJ, setMostrarDropdownCNPJ] = useState(false);
  const dropdownCnpjRef = useRef(null);

  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [mostrarBlocos, setMostrarBlocos] = useState(false);

  useEffect(() => {
    obterClientesDoBancoDeDados()
      .then(res => setClientesBase(res || []))
      .catch(() => {});
  }, []);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickFora = (e) => {
      if (dropdownClienteRef.current && !dropdownClienteRef.current.contains(e.target)) {
        setMostrarDropdownClientes(false);
      }
      if (dropdownCnpjRef.current && !dropdownCnpjRef.current.contains(e.target)) {
        setMostrarDropdownCNPJ(false);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  const handleChange = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
    setErro('');
  };

  const handlePedreiraChange = (pedId) => {
    const pedObj = PEDREIRAS_CEARA.find(p => p.id === pedId);
    setFormData(prev => ({
      ...prev,
      pedreira_id: pedId,
      pedreira_nome: pedObj ? pedObj.nome : prev.pedreira_nome
    }));
  };

  const handleFiltrarCliente = (valor) => {
    handleChange('cliente_nome', valor);
    if (!valor || valor.trim().length < 1) {
      setSugestoesClientes(clientesBase.slice(0, 50));
      setMostrarDropdownClientes(true);
      return;
    }
    const t = valor.toLowerCase().trim();
    const filtrados = clientesBase.filter(c => 
      (c.nome || '').toLowerCase().includes(t) || 
      (c.cnpj || '').includes(t)
    );
    setSugestoesClientes(filtrados.slice(0, 50));
    setMostrarDropdownClientes(true);
  };

  const handleSelecionarCliente = (c) => {
    setFormData(prev => ({
      ...prev,
      cliente_nome: c.nome,
      cliente_cnpj: c.cnpj ? formatarCNPJ(c.cnpj) : prev.cliente_cnpj
    }));
    setMostrarDropdownClientes(false);
  };

  const handleFiltrarCNPJ = (valor) => {
    const formatado = formatarCNPJ(valor);
    handleChange('cliente_cnpj', formatado);

    const limpo = formatado.replace(/\D/g, '');
    if (!valor || valor.trim().length < 1) {
      setSugestoesCNPJ(clientesBase.filter(c => !!c.cnpj).slice(0, 50));
      setMostrarDropdownCNPJ(true);
      return;
    }

    const filtrados = clientesBase.filter(c => {
      if (!c.cnpj) return false;
      const cLimpo = c.cnpj.replace(/\D/g, '');
      return c.cnpj.includes(valor) || (limpo && cLimpo.includes(limpo)) || c.nome.toLowerCase().includes(valor.toLowerCase());
    });
    setSugestoesCNPJ(filtrados.slice(0, 50));
    setMostrarDropdownCNPJ(true);
  };

  const handleSelecionarCNPJ = (c) => {
    setFormData(prev => ({
      ...prev,
      cliente_cnpj: formatarCNPJ(c.cnpj),
      cliente_nome: c.nome || prev.cliente_nome
    }));
    setMostrarDropdownCNPJ(false);
  };

  const handleConsultarReceita = async () => {
    const limpo = String(formData.cliente_cnpj || '').replace(/\D/g, '');
    if (limpo.length !== 14) {
      setErro('Digite um CNPJ válido com 14 dígitos para consultar na Receita Federal.');
      return;
    }

    try {
      setBuscandoCNPJ(true);
      setErro('');
      const info = await consultarCNPJReceita(limpo);
      if (info && (info.razao_social || info.nome)) {
        const nomeEncontrado = (info.razao_social || info.nome).toUpperCase().trim();
        setFormData(prev => ({
          ...prev,
          cliente_nome: nomeEncontrado
        }));
      } else {
        setErro('CNPJ não encontrado ou serviço da Receita indisponível no momento.');
      }
    } catch (e) {
      setErro('Erro ao consultar CNPJ na Receita Federal.');
    } finally {
      setBuscandoCNPJ(false);
    }
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!formData.cliente_nome?.trim()) {
      setErro('O nome do cliente é obrigatório.');
      return;
    }

    const ids = blocos.map(b => b.id).filter(Boolean);
    if (ids.length === 0) {
      setErro('Nenhum bloco válido encontrado para este romaneio.');
      return;
    }

    try {
      setSalvando(true);
      setErro('');

      await editarRomaneioCompleto({
        ids,
        novosDados: {
          numero_romaneio: formData.numero_romaneio,
          data_romaneio: formData.data_romaneio,
          cliente_nome: formData.cliente_nome,
          cliente_cnpj: formData.cliente_cnpj,
          pedreira_id: formData.pedreira_id,
          pedreira_nome: formData.pedreira_nome
        },
        usuarioNome
      });

      if (onSucesso) onSucesso();
      onFechar();
    } catch (err) {
      console.error('Erro ao editar romaneio:', err);
      setErro(err.message || 'Erro ao salvar alterações do romaneio.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div 
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: 16
      }}
      onClick={onFechar}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 14,
          border: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(10, 15, 29, 0.98))',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(56, 189, 248, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                Editar Romaneio Completo
              </h3>
              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--slate-400)' }}>
                Atualizar dados do cabeçalho e de todos os {blocos.length} bloco(s) deste romaneio
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: 'var(--slate-400)',
              cursor: 'pointer',
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <form onSubmit={handleSalvar} style={{ overflowY: 'auto', padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {erro && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <AlertTriangle size={16} />
              <span>{erro}</span>
            </div>
          )}

          {/* Aviso informativo de abrangência */}
          <div style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            color: '#38bdf8',
            fontSize: '0.80rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Box size={16} />
              <span>
                Esta edição atualizará o Cliente e CNPJ de <strong>todos os {blocos.length} bloco(s)</strong> vinculados a este Romaneio.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMostrarBlocos(!mostrarBlocos)}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontSize: '0.74rem',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              {mostrarBlocos ? 'Ocultar blocos' : `Ver ${blocos.length} bloco(s)`}
            </button>
          </div>

          {/* Lista expansível de blocos afetados */}
          {mostrarBlocos && (
            <div style={{
              background: 'rgba(0,0,0,0.25)',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '10px',
              maxHeight: 140,
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {blocos.map(b => (
                  <span 
                    key={b.id}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    Bloco {b.numero_bloco} {b.peso_kg ? `(${b.peso_kg} kg)` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Grid de Dados Principais */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {/* Número do Romaneio */}
            <div>
              <label className="label" style={{ fontSize: '0.80rem', fontWeight: 700, marginBottom: 5 }}>
                <FileText size={13} style={{ display: 'inline', marginRight: 4 }} />
                Número do Romaneio
              </label>
              <input
                type="text"
                className="input"
                value={formData.numero_romaneio}
                onChange={e => handleChange('numero_romaneio', e.target.value.toUpperCase())}
                placeholder="Ex: 0004132"
                style={{ width: '100%', fontFamily: 'monospace', fontWeight: 700 }}
              />
            </div>

            {/* Data do Romaneio */}
            <div>
              <label className="label" style={{ fontSize: '0.80rem', fontWeight: 700, marginBottom: 5 }}>
                <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
                Data de Emissão (Romaneio)
              </label>
              <input
                type="text"
                className="input"
                value={formData.data_romaneio}
                onChange={e => handleChange('data_romaneio', e.target.value)}
                placeholder="Ex: 17/09/2026"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Razão Social / Cliente */}
          <div style={{ position: 'relative' }} ref={dropdownClienteRef}>
            <label className="label" style={{ fontSize: '0.80rem', fontWeight: 700, marginBottom: 5 }}>
              <Building2 size={13} style={{ display: 'inline', marginRight: 4 }} />
              Cliente (Razão Social) *
            </label>
            <input
              type="text"
              className="input"
              value={formData.cliente_nome}
              onChange={e => handleFiltrarCliente(e.target.value)}
              onFocus={() => {
                if (clientesBase.length > 0) {
                  setSugestoesClientes(clientesBase.slice(0, 50));
                  setMostrarDropdownClientes(true);
                }
              }}
              placeholder="Ex: GRANITO ZUCCHI LTDA"
              style={{ width: '100%', fontWeight: 700 }}
              required
            />

            {/* Dropdown de Autocomplete de Clientes */}
            {mostrarDropdownClientes && sugestoesClientes.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 50,
                marginTop: 4,
                background: '#0f172a',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: 8,
                boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
                maxHeight: 200,
                overflowY: 'auto'
              }}>
                {sugestoesClientes.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelecionarCliente(c)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <strong style={{ color: '#f8fafc' }}>{c.nome}</strong>
                    {c.cnpj && (
                      <span style={{ color: '#94a3b8', fontSize: '0.74rem', fontFamily: 'monospace' }}>
                        {formatarCNPJ(c.cnpj)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CNPJ do Cliente com Consulta Receita */}
          <div style={{ position: 'relative' }} ref={dropdownCnpjRef}>
            <label className="label" style={{ fontSize: '0.80rem', fontWeight: 700, marginBottom: 5 }}>
              CNPJ do Destinatário
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="input"
                value={formData.cliente_cnpj}
                onChange={e => handleFiltrarCNPJ(e.target.value)}
                onFocus={() => {
                  const comCnpj = clientesBase.filter(c => !!c.cnpj);
                  if (comCnpj.length > 0) {
                    setSugestoesCNPJ(comCnpj.slice(0, 50));
                    setMostrarDropdownCNPJ(true);
                  }
                }}
                placeholder="00.000.000/0000-00"
                style={{ flex: 1, fontFamily: 'monospace', fontWeight: 600 }}
              />
              <button
                type="button"
                onClick={handleConsultarReceita}
                disabled={buscandoCNPJ}
                className="btn btn-secondary"
                style={{
                  padding: '0 12px',
                  fontSize: '0.76rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#38bdf8',
                  borderColor: 'rgba(56, 189, 248, 0.35)',
                  whiteSpace: 'nowrap'
                }}
                title="Consultar Razão Social oficial na Receita Federal pelo CNPJ"
              >
                {buscandoCNPJ ? <RefreshCw size={13} className="spin" /> : <Search size={13} />}
                Consultar Receita
              </button>
            </div>

            {/* Dropdown de Autocomplete de CNPJs */}
            {mostrarDropdownCNPJ && sugestoesCNPJ.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 50,
                marginTop: 4,
                background: '#0f172a',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: 8,
                boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
                maxHeight: 200,
                overflowY: 'auto'
              }}>
                {sugestoesCNPJ.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelecionarCNPJ(c)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                      {formatarCNPJ(c.cnpj)}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>
                      {c.nome}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pedreira / Unidade */}
          <div>
            <label className="label" style={{ fontSize: '0.80rem', fontWeight: 700, marginBottom: 5 }}>
              <Layers size={13} style={{ display: 'inline', marginRight: 4 }} />
              Pedreira / Unidade de Extração
            </label>
            <select
              className="select"
              value={formData.pedreira_id}
              onChange={e => handlePedreiraChange(e.target.value)}
              style={{ width: '100%' }}
            >
              {PEDREIRAS_CEARA.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Rodapé / Botões */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: 10,
            paddingTop: 16,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.84rem' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="btn btn-vermont"
              style={{
                padding: '8px 20px',
                fontSize: '0.84rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {salvando ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  Salvando Romaneio...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Salvar Alterações do Romaneio
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
