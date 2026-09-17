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
  Sparkles,
  Files
} from 'lucide-react';
import { 
  lerEProcessarRomaneioPdf 
} from '../services/pdfRomaneioService';
import { 
  STATUS_ENVELOPAMENTO, 
  importarBlocosEmLote,
  obterClientesDoBancoDeDados,
  salvarClienteCadastrado,
  listarEnvelopamentos,
  identificarDuplicidadesEmLista
} from '../services/envelopamentoService';
import { 
  PEDREIRAS_CEARA, 
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
  const [avisosImportacao, setAvisosImportacao] = useState([]);
  const [progresso, setProgresso] = useState({ total: 0, atual: 0, nomeArquivo: '' });
  const [blocosProcessados, setBlocosProcessados] = useState([]);
  const [romaneiosResumo, setRomaneiosResumo] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [envelopamentosExistentes, setEnvelopamentosExistentes] = useState([]);

  // Clientes do banco para autocomplete/consultas
  const [clientesBase, setClientesBase] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    obterClientesDoBancoDeDados().then(res => setClientesBase(res || [])).catch(() => {});
    listarEnvelopamentos().then(res => setEnvelopamentosExistentes(res || [])).catch(() => {});
  }, []);

  // Recalcular duplicidades para a lista consolidada
  const recalcularDuplicidadesLista = (listaBlocos, baseExistente) => {
    return identificarDuplicidadesEmLista(listaBlocos, baseExistente || envelopamentosExistentes);
  };

  // Processar múltiplos arquivos PDF
  const handleProcessarArquivos = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList).filter(f => 
      f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (files.length === 0) {
      setErro('Por favor, selecione arquivos válidos em formato PDF.');
      return;
    }

    setErro('');
    setAvisosImportacao([]);
    setEtapa('processando');
    setProgresso({ total: files.length, atual: 0, nomeArquivo: files[0].name });

    // Carregar base atualizada de envelopamentos
    let baseExistente = envelopamentosExistentes;
    try {
      const maisRecentes = await listarEnvelopamentos();
      if (Array.isArray(maisRecentes)) {
        baseExistente = maisRecentes;
        setEnvelopamentosExistentes(maisRecentes);
      }
    } catch (e) {}

    const todosBlocos = [];
    const resumoDocs = [];
    const errosOcorridos = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgresso({ total: files.length, atual: i + 1, nomeArquivo: file.name });

      try {
        const res = await lerEProcessarRomaneioPdf(file);
        if (!res || !res.blocos || res.blocos.length === 0) {
          errosOcorridos.push(`"${file.name}": Nenhum bloco identificado no documento.`);
          continue;
        }

        resumoDocs.push({
          arquivo: file.name,
          numeroRomaneio: res.numeroRomaneio,
          dataEmissao: res.dataEmissao,
          pedreira: res.pedreira,
          cliente: res.cliente,
          qtdBlocos: res.blocos.length
        });

        res.blocos.forEach((b, bIdx) => {
          todosBlocos.push({
            id: `pdf_${i}_${bIdx}_${b.numero_bloco || Math.random()}`,
            numero_bloco: b.numero_bloco,
            pedreira_id: res.pedreira?.id || '',
            pedreira_nome: res.pedreira?.nome || 'Não especificada',
            material: b.material || 'Não especificado',
            peso_kg: b.peso_kg || '',
            numero_romaneio: res.numeroRomaneio || '',
            data_romaneio: res.dataEmissao || '',
            cliente_nome: res.cliente?.nome || '',
            cliente_cnpj: res.cliente?.cnpj || '',
            cliente_fonte: res.cliente?.fonte || '',
            status: b.status || 'sem_envelopamento',
            motivoStatus: b.motivoStatus || '',
            observacoes: b.observacoes || (res.numeroRomaneio ? `Importado via Romaneio Nº ${res.numeroRomaneio}` : ''),
            arquivoOrigem: file.name
          });
        });
      } catch (err) {
        console.error(`Erro ao processar PDF ${file.name}:`, err);
        errosOcorridos.push(`"${file.name}": ${err?.message || 'Erro ao processar'}`);
      }
    }

    if (todosBlocos.length === 0) {
      setErro(`Nenhum bloco válido foi extraído dos ${files.length} arquivo(s). Verifique se são Romaneios válidos.`);
      setAvisosImportacao(errosOcorridos);
      setEtapa('upload');
      return;
    }

    if (errosOcorridos.length > 0) {
      setAvisosImportacao(errosOcorridos);
    }

    // Avaliar duplicidades no conjunto consolidado (contra banco e entre os próprios arquivos)
    const blocosAvaliados = recalcularDuplicidadesLista(todosBlocos, baseExistente);

    // Desmarcar duplicados por padrão
    const blocosComSelecao = blocosAvaliados.map(b => ({
      ...b,
      selecionado: !b.ehDuplicado
    }));

    setRomaneiosResumo(resumoDocs);
    setBlocosProcessados(blocosComSelecao);
    setEtapa('revisao');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setArrastando(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessarArquivos(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setArrastando(true);
  };

  const handleDragLeave = () => {
    setArrastando(false);
  };

  // Alterar seleção em lote (apenas blocos válidos/não duplicados)
  const handleToggleTodos = (selecionar) => {
    setBlocosProcessados(prev => prev.map(b => ({
      ...b,
      selecionado: b.ehDuplicado ? false : selecionar
    })));
  };

  // Marcar apenas novos (desmarcando todos os duplicados)
  const handleMarcarApenasNovos = () => {
    setBlocosProcessados(prev => prev.map(b => ({
      ...b,
      selecionado: !b.ehDuplicado
    })));
  };

  // Alterar seleção individual (bloqueado para itens duplicados)
  const handleToggleBloco = (id) => {
    setBlocosProcessados(prev => prev.map(b => {
      if (b.id !== id) return b;
      if (b.ehDuplicado) return { ...b, selecionado: false };
      return { ...b, selecionado: !b.selecionado };
    }));
  };

  // Alterar status de um bloco específico
  const handleAlterarStatusBloco = (id, novoStatus) => {
    setBlocosProcessados(prev => prev.map(b => b.id === id ? { ...b, status: novoStatus } : b));
  };

  // Remover bloco da lista de importação
  const handleRemoverBloco = (id) => {
    setBlocosProcessados(prev => {
      const novaLista = prev.filter(b => b.id !== id);
      return recalcularDuplicidadesLista(novaLista, envelopamentosExistentes);
    });
  };

  // Confirmar e Salvar Importação
  const handleConfirmarImportacao = async () => {
    const selecionados = blocosProcessados.filter(b => b.selecionado && !b.ehDuplicado);
    
    if (selecionados.length === 0) {
      setErro('Inclusão bloqueada: Nenhum bloco válido/novo selecionado para importação.');
      return;
    }

    setSalvando(true);
    setErro('');

    try {
      const itensProntos = selecionados.map(b => ({
        numero_bloco: b.numero_bloco,
        pedreira_id: b.pedreira_id,
        pedreira_nome: b.pedreira_nome,
        material: b.material,
        peso_kg: b.peso_kg || '',
        numero_romaneio: b.numero_romaneio || '',
        data_romaneio: b.data_romaneio || '',
        cliente_nome: b.cliente_nome,
        cliente_cnpj: b.cliente_cnpj,
        status: b.status,
        observacoes: b.observacoes || (b.numero_romaneio ? `Importado via Romaneio Nº ${b.numero_romaneio}` : '')
      }));

      // Salvar em lote no Supabase
      await importarBlocosEmLote(itensProntos, usuarioNome);

      // Salvar clientes únicos identificados no banco
      const clientesUnicos = [];
      const clientesMap = new Map();
      itensProntos.forEach(item => {
        if (item.cliente_nome && !clientesMap.has(item.cliente_nome.toUpperCase().trim())) {
          clientesMap.set(item.cliente_nome.toUpperCase().trim(), true);
          clientesUnicos.push({
            nome: item.cliente_nome,
            cnpj: item.cliente_cnpj || ''
          });
        }
      });

      for (const cli of clientesUnicos) {
        try {
          await salvarClienteCadastrado(cli);
        } catch (e) {
          console.warn('Aviso ao salvar cliente cadastrado:', e);
        }
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

  const blocos = blocosProcessados;
  const qtdSelecionados = blocos.filter(b => b.selecionado && !b.ehDuplicado).length;
  const qtdPendentes = blocos.filter(b => b.selecionado && b.status === 'pendente_envelopamento').length;
  const qtdSemEnv = blocos.filter(b => b.selecionado && b.status === 'sem_envelopamento').length;
  const qtdDuplicados = blocos.filter(b => b.ehDuplicado).length;

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
          maxWidth: etapa === 'revisao' ? 1080 : 640,
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
              width: 42,
              height: 42,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(0, 168, 62, 0.3), rgba(56, 189, 248, 0.2))',
              border: '1px solid #00a83e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 168, 62, 0.3)'
            }}>
              <Files size={22} color="#4ade80" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                Importar Romaneios PDF
                <span style={{ fontSize: '0.70rem', background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(74, 222, 128, 0.3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Sparkles size={11} /> Importação Múltipla
                </span>
              </h3>
              <p style={{ margin: 0, fontSize: '0.80rem', color: 'var(--slate-400)' }}>
                Arraste ou selecione múltiplos PDFs de romaneio de uma só vez para análise e importação consolidada
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

        {avisosImportacao.length > 0 && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fde68a',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: '0.80rem',
            marginBottom: 16
          }}>
            <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={15} color="#fbbf24" /> Avisos durante o processamento de alguns arquivos:
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {avisosImportacao.map((aviso, idx) => (
                <li key={idx}>{aviso}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ETAPA 1: UPLOAD / DRAG & DROP MULTI-ARQUIVOS */}
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
                padding: '44px 24px',
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
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleProcessarArquivos(e.target.files);
                  }
                }}
              />
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(0, 168, 62, 0.15)',
                color: '#4ade80',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <UploadCloud size={32} />
              </div>
              <h4 style={{ margin: '0 0 6px', color: '#fff', fontSize: '1.1rem' }}>
                Clique ou arraste um ou mais PDFs de Romaneio aqui
              </h4>
              <p style={{ margin: 0, color: 'var(--slate-400)', fontSize: '0.84rem' }}>
                Você pode selecionar vários arquivos de uma só vez (Ctrl+Clique ou Shift+Clique)
              </p>
            </div>

            {/* Explicação das Regras */}
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8', fontSize: '0.82rem', fontWeight: 600, marginBottom: 8 }}>
                <HelpCircle size={15} /> Como funciona a importação múltipla:
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.78rem', color: 'var(--slate-300)', lineHeight: '1.5' }}>
                <li><strong>Processamento em lote:</strong> Cada PDF tem seu romaneio, pedreira, cliente e blocos lidos individualmente.</li>
                <li><strong>Consolidação:</strong> Todos os blocos são reunidos em uma lista única para conferência e confirmação em uma só etapa.</li>
                <li><strong>Regras de Envelopamento:</strong> Reconhece valor na coluna <em>ENVELOPAMENTO</em> ou no texto das <em>OBSERVAÇÕES</em> (ex: R$ 350,00 bloco 36/26).</li>
                <li><strong>Proteção contra duplicidade:</strong> Identifica e bloqueia blocos já existentes no sistema ou duplicados dentro do próprio lote enviado.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ETAPA 2: PROCESSANDO EM PROGRESSO */}
        {etapa === 'processando' && (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <span className="spinner" style={{ width: 40, height: 40, display: 'inline-block', marginBottom: 18 }} />
            <h4 style={{ margin: '0 0 8px', color: '#fff', fontSize: '1.15rem' }}>
              Processando arquivos ({progresso.atual} de {progresso.total})...
            </h4>
            <p style={{ margin: '0 0 16px', color: 'var(--slate-400)', fontSize: '0.86rem' }}>
              Lendo e analisando <strong>{progresso.nomeArquivo}</strong>
            </p>
            <div style={{
              width: '100%',
              maxWidth: 360,
              height: 8,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 4,
              overflow: 'hidden',
              margin: '0 auto'
            }}>
              <div style={{
                width: `${progresso.total > 0 ? (progresso.atual / progresso.total) * 100 : 0}%`,
                height: '100%',
                background: '#4ade80',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        {/* ETAPA 3: REVISÃO E CONFIRMAÇÃO */}
        {etapa === 'revisao' && (
          <div>
            {/* Resumo dos Arquivos / Romaneios Processados */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={15} /> Romaneios Reconhecidos ({romaneiosResumo.length})
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)' }}>
                  Total de {blocos.length} bloco(s) extraído(s)
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 8,
                maxHeight: 120,
                overflowY: 'auto'
              }}>
                {romaneiosResumo.map((rom, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.05)',
                      fontSize: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 700, marginBottom: 2 }}>
                      <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>Romaneio {rom.numeroRomaneio || 'S/N'}</span>
                      <span style={{ color: '#4ade80' }}>{rom.qtdBlocos} bloco(s)</span>
                    </div>
                    <div style={{ color: 'var(--slate-300)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {rom.cliente?.nome || 'Cliente não identificado'}
                    </div>
                    <div style={{ color: 'var(--slate-400)', fontSize: '0.70rem' }}>
                      {rom.pedreira?.nome || 'Pedreira'} {rom.dataEmissao ? `• ${rom.dataEmissao}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aviso de Blocos Duplicados */}
            {qtdDuplicados > 0 && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fca5a5', fontSize: '0.82rem' }}>
                  <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                  <span>
                    <strong>{qtdDuplicados} bloco(s) em duplicidade</strong> detectado(s) e bloqueados para proteger o banco de dados.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleMarcarApenasNovos}
                  className="btn btn-secondary"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.74rem',
                    background: 'rgba(0, 168, 62, 0.2)',
                    borderColor: '#00a83e',
                    color: '#4ade80',
                    fontWeight: 600
                  }}
                >
                  Manter Apenas Novos ({blocos.length - qtdDuplicados})
                </button>
              </div>
            )}

            {/* Barra de Seleção e Estatísticas */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.84rem', color: '#fff', fontWeight: 600 }}>
                  Blocos Prontos para Importação ({blocos.length})
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
                  {qtdDuplicados > 0 && (
                    <button
                      type="button"
                      onClick={handleMarcarApenasNovos}
                      className="btn btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '0.72rem', color: '#4ade80' }}
                    >
                      Apenas Novos
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, fontSize: '0.76rem', flexWrap: 'wrap' }}>
                <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={13} /> {qtdPendentes} Pendentes de Envelopamento
                </span>
                <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Ban size={13} /> {qtdSemEnv} Sem Envelopamento
                </span>
                {qtdDuplicados > 0 && (
                  <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                    <AlertTriangle size={13} /> {qtdDuplicados} Duplicados
                  </span>
                )}
              </div>
            </div>

            {/* Tabela de Blocos Consolidados */}
            <div style={{
              maxHeight: 340,
              overflowY: 'auto',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              background: 'rgba(0,0,0,0.25)',
              marginBottom: 20
            }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={{ padding: '10px 12px', width: 40, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        disabled={blocos.filter(b => !b.ehDuplicado).length === 0}
                        checked={blocos.filter(b => !b.ehDuplicado).length > 0 && blocos.filter(b => !b.ehDuplicado).every(b => b.selecionado)}
                        onChange={(e) => handleToggleTodos(e.target.checked)}
                        title={blocos.filter(b => !b.ehDuplicado).length === 0 ? 'Todos os blocos são duplicados' : 'Marcar/desmarcar todos os novos'}
                      />
                    </th>
                    <th style={{ padding: '10px 12px', fontSize: '0.75rem', color: 'var(--slate-400)', textAlign: 'left' }}>BLOCO</th>
                    <th style={{ padding: '10px 12px', fontSize: '0.75rem', color: 'var(--slate-400)', textAlign: 'left' }}>ROMANEIO & ORIGEM</th>
                    <th style={{ padding: '10px 12px', fontSize: '0.75rem', color: 'var(--slate-400)', textAlign: 'left' }}>CLIENTE & PEDREIRA</th>
                    <th style={{ padding: '10px 12px', fontSize: '0.75rem', color: 'var(--slate-400)', textAlign: 'left' }}>MATERIAL</th>
                    <th style={{ padding: '10px 12px', fontSize: '0.75rem', color: 'var(--slate-400)', textAlign: 'center' }}>PESO (KG)</th>
                    <th style={{ padding: '10px 12px', fontSize: '0.75rem', color: 'var(--slate-400)', textAlign: 'left' }}>STATUS SUGERIDO</th>
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
                          opacity: b.ehDuplicado ? 0.45 : (b.selecionado ? 1 : 0.6),
                          background: b.ehDuplicado 
                            ? 'rgba(239, 68, 68, 0.05)' 
                            : (b.status === 'pendente_envelopamento' ? 'rgba(245, 158, 11, 0.03)' : undefined)
                        }}
                      >
                        {/* Checkbox */}
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            disabled={b.ehDuplicado}
                            checked={!b.ehDuplicado && b.selecionado}
                            onChange={() => handleToggleBloco(b.id)}
                            title={b.ehDuplicado ? 'Inclusão bloqueada: Bloco já cadastrado no sistema' : 'Selecionar bloco'}
                            style={{ cursor: b.ehDuplicado ? 'not-allowed' : 'pointer' }}
                          />
                        </td>

                        {/* Bloco */}
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{
                              background: b.ehDuplicado ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                              color: b.ehDuplicado ? '#fca5a5' : '#fff',
                              fontWeight: 800,
                              padding: '3px 7px',
                              borderRadius: 6,
                              fontSize: '0.84rem',
                              fontFamily: 'monospace',
                              border: b.ehDuplicado ? '1px solid rgba(239, 68, 68, 0.4)' : undefined
                            }}>
                              {b.numero_bloco}
                            </span>
                            {b.ehDuplicado && (
                              <span 
                                title={b.motivoDuplicidade}
                                style={{
                                  fontSize: '0.68rem',
                                  background: 'rgba(239, 68, 68, 0.25)',
                                  color: '#f87171',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  cursor: 'help',
                                  border: '1px solid rgba(239, 68, 68, 0.35)'
                                }}
                              >
                                <Ban size={11} /> Bloqueado
                              </span>
                            )}
                          </div>
                          {b.ehDuplicado && b.motivoDuplicidade && (
                            <div style={{ fontSize: '0.68rem', color: '#fca5a5', marginTop: 3 }}>
                              {b.motivoDuplicidade}
                            </div>
                          )}
                        </td>

                        {/* Romaneio */}
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontSize: '0.80rem', color: '#38bdf8', fontWeight: 700, fontFamily: 'monospace' }}>
                            Nº {b.numero_romaneio || 'S/N'}
                          </div>
                          <div style={{ fontSize: '0.70rem', color: 'var(--slate-400)', whiteSpace: 'nowrap' }}>
                            {b.data_romaneio || b.arquivoOrigem}
                          </div>
                        </td>

                        {/* Cliente & Pedreira */}
                        <td style={{ padding: '10px 12px', maxWidth: 200 }}>
                          <div style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={b.cliente_nome}>
                            {b.cliente_nome || 'Cliente não identificado'}
                          </div>
                          <div style={{ fontSize: '0.70rem', color: 'var(--slate-400)' }}>
                            {b.pedreira_nome}
                          </div>
                        </td>

                        {/* Material */}
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>
                            {b.material}
                          </span>
                        </td>

                        {/* Peso (Kg) */}
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {b.peso_kg ? (
                            <span style={{
                              fontSize: '0.76rem',
                              color: '#38bdf8',
                              fontWeight: 700,
                              fontFamily: 'monospace',
                              background: 'rgba(56, 189, 248, 0.1)',
                              padding: '2px 6px',
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <select
                              className="form-select"
                              value={b.status}
                              disabled={b.ehDuplicado}
                              onChange={(e) => handleAlterarStatusBloco(b.id, e.target.value)}
                              style={{
                                height: 28,
                                fontSize: '0.74rem',
                                padding: '2px 8px',
                                background: statusInfo.bg,
                                color: statusInfo.cor,
                                borderColor: statusInfo.border,
                                fontWeight: 700,
                                width: 'auto',
                                opacity: b.ehDuplicado ? 0.5 : 1
                              }}
                            >
                              {Object.values(STATUS_ENVELOPAMENTO).map(st => (
                                <option key={st.id} value={st.id}>{st.label}</option>
                              ))}
                            </select>
                            {b.motivoStatus && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--slate-400)', fontStyle: 'italic' }}>
                                {b.motivoStatus}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Remover */}
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoverBloco(b.id)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 6px', color: '#f87171' }}
                            title="Remover este bloco da lista"
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
                  setBlocosProcessados([]);
                  setRomaneiosResumo([]);
                }}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', gap: 6 }}
              >
                <RefreshCw size={14} /> Selecionar Outros PDFs
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={onFechar} className="btn btn-secondary">
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={salvando || qtdSelecionados === 0 || (blocos.length > 0 && blocos.every(b => b.ehDuplicado))}
                  onClick={handleConfirmarImportacao}
                  className={`btn ${(blocos.length > 0 && blocos.every(b => b.ehDuplicado)) ? 'btn-secondary' : 'btn-vermont'}`}
                  style={{ 
                    gap: 8, 
                    padding: '9px 20px', 
                    fontSize: '0.88rem',
                    opacity: (blocos.length > 0 && blocos.every(b => b.ehDuplicado)) ? 0.6 : 1,
                    cursor: (blocos.length > 0 && blocos.every(b => b.ehDuplicado)) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {salvando ? (
                    <span className="spinner" style={{ width: 16, height: 16 }} />
                  ) : (blocos.length > 0 && blocos.every(b => b.ehDuplicado)) ? (
                    <Ban size={18} color="#ef4444" />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                  {(blocos.length > 0 && blocos.every(b => b.ehDuplicado)) 
                    ? 'Inclusão Bloqueada (Todos Duplicados)'
                    : `Confirmar e Importar ${qtdSelecionados} Bloco${qtdSelecionados > 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

