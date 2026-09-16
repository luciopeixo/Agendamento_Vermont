import React, { useState, useEffect } from 'react';
import { X, Building2, Plus, Search, Trash2, Edit3, CheckCircle2, AlertTriangle, Phone, Mail, FileText } from 'lucide-react';
import { formatarCNPJ, consultarCNPJReceita } from '../services/agendamentoService';
import { 
  obterClientesDoBancoDeDados, 
  salvarClienteCadastrado, 
  excluirClienteCadastrado 
} from '../services/envelopamentoService';

export function ModalGestaoClientes({ onFechar, onClienteSelecionado = null }) {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [modoFormulario, setModoFormulario] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false);
  const [erro, setErro] = useState('');

  const [formData, setFormData] = useState({
    id: null,
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    observacoes: ''
  });

  const carregarClientes = async () => {
    setCarregando(true);
    try {
      const lista = await obterClientesDoBancoDeDados();
      setClientes(lista);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  const handleBuscarCNPJ = async (cnpjLimpo) => {
    if (!cnpjLimpo || cnpjLimpo.length !== 14) return;
    setBuscandoCNPJ(true);
    try {
      const res = await consultarCNPJReceita(cnpjLimpo);
      if (res && res.razao_social) {
        setFormData(prev => ({
          ...prev,
          nome: res.razao_social,
          telefone: res.telefone || prev.telefone,
          email: res.email || prev.email
        }));
      }
    } catch (err) {
      console.warn('Erro ao consultar CNPJ:', err);
    } finally {
      setBuscandoCNPJ(false);
    }
  };

  const handleSalvarCliente = async (e) => {
    e.preventDefault();
    setErro('');

    if (!formData.nome.trim()) {
      setErro('Informe o nome ou razão social do cliente.');
      return;
    }

    setSalvando(true);
    try {
      const salvo = await salvarClienteCadastrado(formData);
      await carregarClientes();
      setModoFormulario(false);
      setFormData({ id: null, nome: '', cnpj: '', telefone: '', email: '', observacoes: '' });
      if (onClienteSelecionado) {
        onClienteSelecionado(salvo);
      }
    } catch (err) {
      setErro('Erro ao salvar cliente.');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirCliente = async (idOuNome, nomeExibicao) => {
    if (window.confirm(`Tem certeza que deseja remover o cliente "${nomeExibicao}"?`)) {
      try {
        await excluirClienteCadastrado(idOuNome);
        await carregarClientes();
      } catch (err) {
        console.error('Erro ao excluir:', err);
      }
    }
  };

  const clientesFiltrados = clientes.filter(c => {
    if (!busca) return true;
    const t = busca.toLowerCase().trim();
    return c.nome.toLowerCase().includes(t) || (c.cnpj && c.cnpj.includes(t));
  });

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
        zIndex: 10000,
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
          maxWidth: 680,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px 28px',
          borderRadius: 16,
          border: '1px solid rgba(0, 118, 44, 0.4)',
          boxShadow: '0 25px 55px rgba(0,0,0,0.85)',
          background: '#0d1310',
          position: 'relative'
        }}
      >
        {/* Cabeçalho */}
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
              <Building2 size={20} color="#4ade80" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff' }}>
                Gestão de Clientes Compradores
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--slate-400)' }}>
                Base unificada de clientes para envelopamento e agendamentos Vermont
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

        {/* Botão Novo Cliente / Alternar Formulário */}
        {!modoFormulario ? (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Pesquisar por nome ou CNPJ..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  style={{ paddingLeft: 36, height: 38, fontSize: '0.84rem' }}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormData({ id: null, nome: '', cnpj: '', telefone: '', email: '', observacoes: '' });
                  setModoFormulario(true);
                }}
                className="btn btn-vermont"
                style={{ height: 38, fontSize: '0.82rem', gap: 6 }}
              >
                <Plus size={16} /> Cadastrar Novo Cliente
              </button>
            </div>

            {/* Lista de Clientes */}
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden', maxHeight: 360, overflowY: 'auto' }}>
              {carregando ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--slate-400)' }}>
                  <span className="spinner" style={{ width: 18, height: 18, display: 'inline-block', marginBottom: 6 }} />
                  <p style={{ margin: 0, fontSize: '0.82rem' }}>Carregando clientes...</p>
                </div>
              ) : clientesFiltrados.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--slate-400)' }}>
                  <p style={{ margin: 0, fontSize: '0.86rem' }}>Nenhum cliente encontrado.</p>
                </div>
              ) : (
                clientesFiltrados.map((cli, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: '#fff', display: 'block' }}>
                        {cli.nome}
                      </strong>
                      <div style={{ display: 'flex', gap: 14, marginTop: 3, flexWrap: 'wrap' }}>
                        {cli.cnpj && (
                          <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)' }}>
                            CNPJ: {cli.cnpj}
                          </span>
                        )}
                        {cli.telefone && (
                          <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)' }}>
                            Tel: {cli.telefone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      {onClienteSelecionado && (
                        <button
                          type="button"
                          onClick={() => {
                            onClienteSelecionado(cli);
                            onFechar();
                          }}
                          className="btn btn-vermont"
                          style={{ padding: '5px 10px', fontSize: '0.74rem' }}
                          title="Selecionar este cliente"
                        >
                          Selecionar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            id: cli.id || null,
                            nome: cli.nome,
                            cnpj: cli.cnpj || '',
                            telefone: cli.telefone || '',
                            email: cli.email || '',
                            observacoes: cli.observacoes || ''
                          });
                          setModoFormulario(true);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '5px 8px' }}
                        title="Editar cliente"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluirCliente(cli.id || cli.nome, cli.nome)}
                        className="btn btn-danger"
                        style={{ padding: '5px 8px' }}
                        title="Excluir cliente"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* FORMULÁRIO DE CADASTRO / EDIÇÃO DE CLIENTE */
          <form onSubmit={handleSalvarCliente}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              
              {/* CNPJ */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>CNPJ (Opcional - Busca Automática):</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={(e) => {
                      const fmt = formatarCNPJ(e.target.value);
                      setFormData(prev => ({ ...prev, cnpj: fmt }));
                      const limpo = fmt.replace(/\D/g, '');
                      if (limpo.length === 14) {
                        handleBuscarCNPJ(limpo);
                      }
                    }}
                  />
                  {buscandoCNPJ && (
                    <span className="spinner" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14 }} />
                  )}
                </div>
              </div>

              {/* Razão Social / Nome */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>Razão Social / Nome do Cliente:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: THOR GRANITOS LTDA"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value.toUpperCase() }))}
                  required
                />
              </div>

              {/* Telefone / WhatsApp */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>Telefone / Contato (Opcional):</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                />
              </div>

              {/* E-mail */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>E-mail de Notificação (Opcional):</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="contato@cliente.com.br"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Observações / Instruções Especiais:</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Ex: Exige conferência prévia por fotos, laudo de rocha..."
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button 
                type="button" 
                onClick={() => {
                  setModoFormulario(false);
                  setFormData({ id: null, nome: '', cnpj: '', telefone: '', email: '', observacoes: '' });
                }} 
                className="btn btn-secondary"
              >
                Voltar para Lista
              </button>
              <button type="submit" disabled={salvando} className="btn btn-vermont" style={{ gap: 6 }}>
                {salvando ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <CheckCircle2 size={16} />}
                Salvar Cliente
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
