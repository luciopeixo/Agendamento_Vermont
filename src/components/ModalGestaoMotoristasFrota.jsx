import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Search, Plus, Edit3, ShieldCheck, ShieldAlert, AlertTriangle, AlertCircle, 
  Truck, User, Calendar, CheckCircle2, RefreshCw, FileText, Download, Filter, Trash2
} from 'lucide-react';
import { 
  obterBaseMotoristasCompleta, 
  carregarBaseMotoristasUnificada,
  excluirMotoristaFrota,
  validarCPF,
  formatarCPF, 
  formatarCNPJ, 
  verificarConformidadeDocumental
} from '../services/agendamentoService';
import { ModalConformidadeMotorista } from './ModalConformidadeMotorista';
import * as XLSX from 'xlsx';

export function ModalGestaoMotoristasFrota({ 
  aoFechar, 
  usuarioNome = 'ADMIN',
  isAdmin = false,
  todosAgendamentos = []
}) {
  const [lista, setLista] = useState(() => obterBaseMotoristasCompleta());
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos' | 'regulares' | 'avencer' | 'vencidos'
  const [motoristaEditando, setMotoristaEditando] = useState(null);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      const dados = await carregarBaseMotoristasUnificada(todosAgendamentos);
      setLista(dados);
    } catch (e) {
      console.warn('Erro ao carregar motoristas:', e);
      setLista(obterBaseMotoristasCompleta());
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [todosAgendamentos]);

  // Processa cada motorista com a verificação de conformidade em relação a hoje
  const listaProcessada = useMemo(() => {
    const hojeStr = new Date().toISOString().split('T')[0];
    return lista.map(mot => {
      const conf = verificarConformidadeDocumental({
        cpf: mot.cpf,
        placaCavalo: mot.placa_cavalo,
        placaCarreta: mot.placa_carreta,
        placaCarreta2: mot.placa_carreta_2,
        dataAgendamento: hojeStr,
        tipoVeiculo: mot.tipo_veiculo
      });
      return {
        ...mot,
        conformidade: conf
      };
    });
  }, [lista]);

  // Contadores para os filtros
  const contadores = useMemo(() => {
    let regulares = 0;
    let avencer = 0;
    let vencidos = 0;
    let pendentes = 0;

    listaProcessada.forEach(item => {
      const st = item.conformidade?.statusGeral;
      if (st === 'VENCIDO') vencidos++;
      else if (st === 'AVENCER') avencer++;
      else if (st === 'REGULAR') regulares++;
      else pendentes++;
    });

    return {
      todos: listaProcessada.length,
      regulares,
      avencer,
      vencidos,
      pendentes
    };
  }, [listaProcessada]);

  // Filtragem por texto e por status
  const listaFiltrada = useMemo(() => {
    let res = listaProcessada;

    // Filtro de status
    if (filtroStatus === 'regulares') {
      res = res.filter(m => m.conformidade?.statusGeral === 'REGULAR');
    } else if (filtroStatus === 'avencer') {
      res = res.filter(m => m.conformidade?.statusGeral === 'AVENCER');
    } else if (filtroStatus === 'vencidos') {
      res = res.filter(m => m.conformidade?.statusGeral === 'VENCIDO');
    } else if (filtroStatus === 'pendentes') {
      res = res.filter(m => m.conformidade?.statusGeral === 'NAO_CADASTRADO' || m.conformidade?.statusGeral === 'PENDENTE');
    }

    // Busca textual
    if (busca.trim()) {
      const termo = busca.toUpperCase().trim();
      res = res.filter(m => {
        const cpf = String(m.cpf || '').replace(/\D/g, '');
        const nome = String(m.nome || '').toUpperCase();
        const transp = String(m.transportadora || '').toUpperCase();
        const cavalo = String(m.placa_cavalo || '').toUpperCase();
        const carreta = String(m.placa_carreta || '').toUpperCase();
        return cpf.includes(termo) || nome.includes(termo) || transp.includes(termo) || cavalo.includes(termo) || carreta.includes(termo);
      });
    }

    return res;
  }, [listaProcessada, filtroStatus, busca]);

  const abrirNovoCadastro = () => {
    setMotoristaEditando(null);
    setModalEdicaoAberto(true);
  };

  const abrirEdicao = (mot) => {
    setMotoristaEditando(mot);
    setModalEdicaoAberto(true);
  };

  const exportarExcel = () => {
    const dadosExport = listaProcessada.map(m => ({
      'CPF': formatarCPF(m.cpf),
      'Nome do Motorista': m.nome || '-',
      'Telefone': m.telefone || '-',
      'Categoria CNH': m.cnh_categoria || '-',
      'Validade CNH': m.cnh_validade || '-',
      'Placa Cavalo': m.placa_cavalo || '-',
      'Vencimento CRLV Cavalo': m.crlv_validade_cavalo || '-',
      'Placa Carreta': m.placa_carreta || '-',
      'Vencimento CRLV Carreta': m.crlv_validade_carreta || '-',
      'Validade Laudo Rocha / CSV': m.validade_laudo_rocha || '-',
      'Transportadora': m.transportadora || '-',
      'Status Geral': m.conformidade.statusGeral,
      'Pendências / Vencidos': m.conformidade.itensVencidos.map(i => i.titulo).join(', ') || 'Nenhuma'
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Conformidade Frota');
    XLSX.writeFile(wb, `Conformidade_Motoristas_Vermont_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const formatarDataBR = (dataStr) => {
    if (!dataStr) return '-';
    try {
      const [ano, mes, dia] = dataStr.split('-');
      return `${dia}/${mes}/${ano}`;
    } catch (_e) {
      return dataStr;
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
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget && !modalEdicaoAberto) aoFechar();
      }}
    >
      <div 
        className="glass-panel" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1150px',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden'
        }}
      >
        {/* Cabeçalho */}
        <div style={{
          padding: '16px 24px',
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
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>
                Base de Motoristas & Frota • Conformidade Documental
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                Gestão e controle de CNHs, CRLVs e Laudos de Inspeção de Rocha / CSV para Pedreiras e Admin
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={carregarDados}
              disabled={carregando}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '8px 12px' }}
              title="Recarregar e sincronizar base de motoristas com todos os agendamentos"
            >
              <RefreshCw size={15} className={carregando ? 'spin' : ''} />
              <span>{carregando ? 'Atualizando...' : 'Recarregar'}</span>
            </button>
            <button
              type="button"
              onClick={exportarExcel}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '8px 12px' }}
              title="Exportar base completa para Excel"
            >
              <Download size={15} />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={abrirNovoCadastro}
              className="btn btn-vermont"
              style={{ fontSize: '0.82rem', padding: '8px 14px' }}
            >
              <Plus size={16} />
              <span>Novo Motorista / Veículo</span>
            </button>
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
        </div>

        {/* Barra de Filtros e Busca */}
        <div style={{
          padding: '14px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          {/* Campo de Busca */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Buscar por CPF, Nome, Placa (Cavalo/Carreta) ou Transportadora..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ paddingLeft: 36, width: '100%', fontSize: '0.85rem' }}
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Abas / Pílulas de Status */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setFiltroStatus('todos')}
              className={`btn ${filtroStatus === 'todos' ? 'btn-secondary' : 'btn-ghost'}`}
              style={{
                fontSize: '0.8rem',
                padding: '6px 12px',
                borderRadius: 20,
                border: filtroStatus === 'todos' ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent'
              }}
            >
              Todos ({contadores.todos})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('regulares')}
              className="btn"
              style={{
                fontSize: '0.8rem',
                padding: '6px 12px',
                borderRadius: 20,
                background: filtroStatus === 'regulares' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(34, 197, 94, 0.1)',
                border: filtroStatus === 'regulares' ? '1px solid #22c55e' : '1px solid rgba(34, 197, 94, 0.2)',
                color: '#86efac'
              }}
            >
              🟢 Regulares ({contadores.regulares})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('avencer')}
              className="btn"
              style={{
                fontSize: '0.8rem',
                padding: '6px 12px',
                borderRadius: 20,
                background: filtroStatus === 'avencer' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.1)',
                border: filtroStatus === 'avencer' ? '1px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.2)',
                color: '#fde047'
              }}
            >
              🟡 A Vencer ≤ 30d ({contadores.avencer})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('vencidos')}
              className="btn"
              style={{
                fontSize: '0.8rem',
                padding: '6px 12px',
                borderRadius: 20,
                background: filtroStatus === 'vencidos' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.1)',
                border: filtroStatus === 'vencidos' ? '1px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.2)',
                color: '#fca5a5'
              }}
            >
              🔴 Vencidos ({contadores.vencidos})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('pendentes')}
              className="btn"
              style={{
                fontSize: '0.8rem',
                padding: '6px 12px',
                borderRadius: 20,
                background: filtroStatus === 'pendentes' ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.1)',
                border: filtroStatus === 'pendentes' ? '1px solid #94a3b8' : '1px solid rgba(148, 163, 184, 0.2)',
                color: '#cbd5e1'
              }}
            >
              ⚪ Doc Pendente ({contadores.pendentes})
            </button>
          </div>
        </div>

        {/* Tabela de Motoristas e Conformidade */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {listaFiltrada.length === 0 ? (
            <div style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: '#94a3b8'
            }}>
              <AlertCircle size={40} style={{ margin: '0 auto 12px', color: '#64748b' }} />
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Nenhum motorista/veículo encontrado</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem' }}>Tente ajustar a busca ou o filtro de status.</p>
            </div>
          ) : (
            <div className="table-responsive-container" style={{ border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.85)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', color: '#cbd5e1', fontWeight: 700 }}>Motorista / CPF</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', color: '#cbd5e1', fontWeight: 700 }}>CNH & Categoria</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', color: '#cbd5e1', fontWeight: 700 }}>Cavalo (Último CRLV)</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', color: '#cbd5e1', fontWeight: 700 }}>Carreta / Laudo Rocha (CSV)</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', color: '#cbd5e1', fontWeight: 700 }}>Transportadora</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', color: '#cbd5e1', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', color: '#cbd5e1', fontWeight: 700 }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {listaFiltrada.map((item, idx) => {
                    const st = item.conformidade?.statusGeral;
                    const isVencido = st === 'VENCIDO';
                    const isAvencer = st === 'AVENCER';
                    const isRegular = st === 'REGULAR';
                    const vencCavalo = calcularVencimentoUmAno(item.crlv_validade_cavalo);
                    const vencCarreta = calcularVencimentoUmAno(item.crlv_validade_carreta);

                    return (
                      <tr 
                        key={item.cpf || idx}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'rgba(255, 255, 255, 0.03)'
                        }}
                      >
                        {/* Motorista */}
                        <td style={{ padding: '10px 14px', color: '#f8fafc' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.nome || 'NÃO INFORMADO'}</div>
                          <div style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span>CPF: {formatarCPF(item.cpf)}</span>
                            {!validarCPF(item.cpf) && (
                              <span style={{ color: '#f87171', fontSize: '0.70rem', background: 'rgba(239, 68, 68, 0.15)', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                                ⚠️ CPF Inválido / Erro
                              </span>
                            )}
                          </div>
                          {item.telefone && <div style={{ fontSize: '0.74rem', color: '#38bdf8' }}>📞 {item.telefone}</div>}
                        </td>

                        {/* CNH */}
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.4)', fontWeight: 800 }}>
                              Cat. {item.cnh_categoria || 'E'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.76rem', marginTop: 4, color: item.cnh_validade ? '#cbd5e1' : '#64748b' }}>
                            Val: <strong>{formatarDataBR(item.cnh_validade)}</strong>
                          </div>
                        </td>

                        {/* Cavalo Mecânico */}
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#38bdf8' }}>
                            {item.placa_cavalo || '-'}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: item.crlv_validade_cavalo ? '#cbd5e1' : '#64748b' }}>
                            CRLV: <strong>{formatarDataBR(item.crlv_validade_cavalo)}</strong>
                          </div>
                        </td>

                        {/* Carreta e Laudo de Rocha */}
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#c084fc' }}>
                            {item.placa_carreta || '-'}
                            {item.placa_carreta_2 && <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginLeft: 4 }}>+ {item.placa_carreta_2}</span>}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: item.crlv_validade_carreta ? '#cbd5e1' : '#64748b' }}>
                            CRLV: <strong>{formatarDataBR(item.crlv_validade_carreta)}</strong>
                          </div>
                          <div style={{ fontSize: '0.76rem', color: item.validade_laudo_rocha ? '#fbbf24' : '#64748b', fontWeight: 600 }}>
                            Laudo CSV: {formatarDataBR(item.validade_laudo_rocha)}
                          </div>
                        </td>

                        {/* Transportadora */}
                        <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '0.78rem' }}>
                          <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{item.transportadora || '-'}</div>
                          {item.transportadora_cnpj && <div>CNPJ: {formatarCNPJ(item.transportadora_cnpj)}</div>}
                        </td>

                        {/* Status Geral */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {isVencido ? (
                            <span 
                              className="badge" 
                              style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid #ef4444', fontWeight: 800, padding: '4px 8px' }}
                              title={item.conformidade?.itensVencidos?.map(i => `${i.titulo} (${i.labelData})`).join(' | ')}
                            >
                              🔴 Vencido
                            </span>
                          ) : isAvencer ? (
                            <span 
                              className="badge" 
                              style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fde047', border: '1px solid #f59e0b', fontWeight: 800, padding: '4px 8px' }}
                              title={item.conformidade?.itensAVencer?.map(i => `${i.titulo} (${i.labelData})`).join(' | ')}
                            >
                              🟡 A Vencer
                            </span>
                          ) : isRegular ? (
                            <span 
                              className="badge" 
                              style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#86efac', border: '1px solid #22c55e', fontWeight: 800, padding: '4px 8px' }}
                            >
                              🟢 Regular
                            </span>
                          ) : (
                            <span 
                              className="badge" 
                              style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: '1px solid rgba(148, 163, 184, 0.3)', fontWeight: 600, padding: '4px 8px' }}
                              title={item.conformidade?.camposFaltando?.length > 0 ? `Pendente de dados: ${item.conformidade.camposFaltando.join(', ')}` : 'Documentos não preenchidos'}
                            >
                              ⚪ Doc Pendente
                            </span>
                          )}
                        </td>

                        {/* Ações */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => abrirEdicao(item)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                              title="Editar dados e validades deste motorista/frota"
                            >
                              <Edit3 size={14} />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const nome = item.nome || 'este motorista';
                                const cpfFmt = formatarCPF(item.cpf);
                                if (window.confirm(`Deseja realmente remover o cadastro de ${nome} (${cpfFmt}) da base?`)) {
                                  await excluirMotoristaFrota(item.cpf);
                                  carregarDados();
                                }
                              }}
                              className="btn-icon btn-ghost"
                              style={{ 
                                color: '#f87171', 
                                padding: 6,
                                borderRadius: 6,
                                cursor: 'pointer',
                                background: 'rgba(239, 68, 68, 0.1)'
                              }}
                              title="Excluir este cadastro (útil para duplicados ou CPFs digitados errados)"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Modal de Edição/Cadastro */}
      {modalEdicaoAberto && (
        <ModalConformidadeMotorista
          motoristaInicial={motoristaEditando}
          usuarioNome={usuarioNome}
          aoFechar={() => setModalEdicaoAberto(false)}
          aoSalvar={() => {
            carregarDados();
          }}
        />
      )}
    </div>
  );
}
