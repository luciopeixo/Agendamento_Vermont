import React, { useState, useEffect, useMemo } from 'react';
import { 
  Printer, X, FileText, CheckCircle2, Shield, Truck, Edit2, 
  Copy, Eye, Check, AlertCircle, Layers
} from 'lucide-react';
import { 
  formatarDataBR, 
  formatarPlacasExibicao, 
  limparNomeEmpresa, 
  extrairBlocosDigitados,
  saoMesmaPedreira,
  isPedreiraUruoca
} from '../services/agendamentoService';

/**
 * Retorna o título oficial da autorização baseado na pedreira ou material
 */
export function formatarTituloAutorizacao(pedreira = '', material = '') {
  const pedr = String(pedreira || '').toUpperCase();
  const mat = String(material || '').toUpperCase();

  if (pedr.includes('URUOCA') || mat.includes('TAJ MAHAL')) {
    return 'AUTORIZAÇÃO DE CARREGAMENTO TAJ MAHAL';
  }
  if (pedr.includes('NEGRESCO') || mat.includes('NEGRESCO')) {
    return 'AUTORIZAÇÃO DE CARREGAMENTO NEGRESCO';
  }
  if (pedr.includes('DEL MARE') || pedr.includes('DELMARE') || mat.includes('DEL MARE')) {
    return 'AUTORIZAÇÃO DE CARREGAMENTO DEL MARE';
  }
  if (pedr.includes('JAIBARAS') || pedr.includes('SOBRAL') || mat.includes('BRECCIA IMPERIALE')) {
    return 'AUTORIZAÇÃO DE CARREGAMENTO JAIBARAS';
  }
  if (pedr.includes('SERROTE') || pedr.includes('SÃO GONÇALO') || pedr.includes('SAO GONCALO') || mat.includes('BLUE DEEP')) {
    return 'AUTORIZAÇÃO DE CARREGAMENTO SERROTE';
  }
  if (pedr.includes('BEBERIBE') || mat.includes('RAFFINATO')) {
    return 'AUTORIZAÇÃO DE CARREGAMENTO BEBERIBE';
  }

  // Fallback com material ou pedreira
  if (material) {
    return `AUTORIZAÇÃO DE CARREGAMENTO ${material.toUpperCase().trim()}`;
  }
  return `AUTORIZAÇÃO DE CARREGAMENTO ${pedreira.split('-')[0].toUpperCase().trim()}`;
}

/**
 * Tenta inferir o destino (UF/Estado) a partir do nome do cliente, observações ou destinatário
 */
export function inferirDestinoCliente(agendamento = {}) {
  const textoCompleto = `${agendamento.cliente || ''} ${agendamento.observacoes || ''} ${agendamento.justificativa_outros || ''}`.toUpperCase();

  // Estados comuns de exportação / destino de rochas
  const ufs = ['ES', 'CE', 'SP', 'MG', 'RJ', 'PR', 'SC', 'RS', 'BA', 'PE', 'RN', 'PB', 'MA', 'PI', 'PA', 'GO', 'TO'];
  
  for (const uf of ufs) {
    const regexUf = new RegExp(`\\b${uf}\\b`);
    if (regexUf.test(textoCompleto)) {
      return uf;
    }
  }

  if (textoCompleto.includes('ESPIRITO SANTO') || textoCompleto.includes('ESPÍRITO SANTO') || textoCompleto.includes('CACHOEIRO') || textoCompleto.includes('VITORIA') || textoCompleto.includes('VITÓRIA')) {
    return 'ES';
  }
  if (textoCompleto.includes('CEARA') || textoCompleto.includes('CEARÁ') || textoCompleto.includes('FORTALEZA') || textoCompleto.includes('SOBRAL') || textoCompleto.includes('PECEM') || textoCompleto.includes('PECÉM')) {
    return 'CE';
  }
  if (textoCompleto.includes('SAO PAULO') || textoCompleto.includes('SÃO PAULO') || textoCompleto.includes('SANTOS')) {
    return 'SP';
  }

  // Padrão de clientes do ES (Zucchi, Antolini, Guidoni, Marbrasa, Brasigran, etc.)
  if (textoCompleto.includes('ZUCCHI') || textoCompleto.includes('ANTOLINI') || textoCompleto.includes('GUIDONI') || textoCompleto.includes('MARBRASA') || textoCompleto.includes('BRASIGRAN') || textoCompleto.includes('MINERACAO ITAPEMIRIM')) {
    return 'ES';
  }

  return 'ES';
}

export function AutorizacaoCarregamentoModal({
  agendamento,
  todosAgendamentos = [],
  pedreiraOperador = null,
  onFechar
}) {
  if (!agendamento) return null;

  // Estados editáveis para ajuste fino antes de imprimir
  const [destinoEditavel, setDestinoEditavel] = useState(() => inferirDestinoCliente(agendamento));
  const [viasPorFolha, setViasPorFolha] = useState('dupla'); // 'dupla' (2 por página A4) ou 'unica' (1 por página)

  // Pedreira de referência: se o usuário logado for operador de uma pedreira específica, usa a sua; senão usa a do agendamento
  const pedreiraReferencia = useMemo(() => {
    if (pedreiraOperador && pedreiraOperador !== 'todas') {
      return pedreiraOperador;
    }
    return agendamento.pedreira || '';
  }, [pedreiraOperador, agendamento.pedreira]);

  // Inteligência de Cargas Mistas / Múltiplos Blocos
  const { blocosPedreira, outrosBlocosOutrasPedreiras } = useMemo(() => {
    const placaAlvo = String(agendamento.placa_cavalo || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const dataAlvo = agendamento.data_agendamento;

    // 1. Coleta todos os agendamentos do mesmo veículo na mesma data
    let agsMesmoVeiculo = [];
    if (placaAlvo && Array.isArray(todosAgendamentos) && todosAgendamentos.length > 0) {
      agsMesmoVeiculo = todosAgendamentos.filter(item => {
        const itemPlaca = String(item.placa_cavalo || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
        return itemPlaca === placaAlvo && item.data_agendamento === dataAlvo && String(item.status || '').toLowerCase() !== 'cancelado';
      });
    }

    if (agsMesmoVeiculo.length === 0) {
      agsMesmoVeiculo = [agendamento];
    }

    // Se o próprio agendamento tem array de pontos (carga combinada interna)
    if (agendamento.pontos && Array.isArray(agendamento.pontos) && agendamento.pontos.length > 0) {
      agsMesmoVeiculo = agendamento.pontos;
    }

    // 2. Extrai e separa os blocos por pedreira
    const blocosDaPedreiraAtual = [];
    const blocosDeOutrasPedreiras = [];

    agsMesmoVeiculo.forEach(item => {
      const blocosExtraidos = extrairBlocosDigitados(item.numero_bloco);
      const isMesmaPedr = saoMesmaPedreira(item.pedreira, pedreiraReferencia);

      blocosExtraidos.forEach(bloco => {
        if (isMesmaPedr) {
          if (!blocosDaPedreiraAtual.includes(bloco)) {
            blocosDaPedreiraAtual.push(bloco);
          }
        } else {
          if (!blocosDeOutrasPedreiras.includes(`${bloco} (${item.pedreira.split('-')[0].trim()})`)) {
            blocosDeOutrasPedreiras.push(`${bloco} (${item.pedreira.split('-')[0].trim()})`);
          }
        }
      });
    });

    // Se por acaso a lista da pedreira atual estiver vazia, usa os blocos do próprio agendamento
    if (blocosDaPedreiraAtual.length === 0) {
      const fallbackBlocos = extrairBlocosDigitados(agendamento.numero_bloco);
      blocosDaPedreiraAtual.push(...fallbackBlocos);
    }

    return {
      blocosPedreira: blocosDaPedreiraAtual,
      outrosBlocosOutrasPedreiras: blocosDeOutrasPedreiras
    };
  }, [agendamento, todosAgendamentos, pedreiraReferencia]);

  const tituloDocumento = useMemo(() => {
    return formatarTituloAutorizacao(pedreiraReferencia, agendamento.material);
  }, [pedreiraReferencia, agendamento.material]);

  const clienteFormatado = useMemo(() => {
    const limpo = limparNomeEmpresa(agendamento.cliente);
    // Se tiver nome muito longo (ex: RAZÃO SOCIAL LTDA), mantém legível em caixa alta
    return limpo ? limpo.toUpperCase() : 'NÃO INFORMADO';
  }, [agendamento.cliente]);

  const transportadoraFormatada = useMemo(() => {
    const limpo = limparNomeEmpresa(agendamento.transportadora);
    return limpo ? limpo.toUpperCase() : 'NÃO INFORMADA';
  }, [agendamento.transportadora]);

  const motoristaFormatado = useMemo(() => {
    return String(agendamento.motorista_nome || 'NÃO INFORMADO').trim().toUpperCase();
  }, [agendamento.motorista_nome]);

  const placasFormatadas = useMemo(() => {
    const cavalo = String(agendamento.placa_cavalo || '').trim().toUpperCase();
    const carreta = String(agendamento.placa_carreta || '').trim().toUpperCase();
    const carreta2 = String(agendamento.placa_carreta_2 || '').trim().toUpperCase();

    if (carreta && carreta2) {
      return `${cavalo} / ${carreta} / ${carreta2}`;
    }
    if (carreta) {
      return `${cavalo} / ${carreta}`;
    }
    return cavalo || '-';
  }, [agendamento]);

  const dataFormatada = useMemo(() => {
    return formatarDataBR(agendamento.data_agendamento);
  }, [agendamento.data_agendamento]);

  // Executa impressão limpa no formato retrato A4
  const handleImprimir = () => {
    document.body.classList.add('imprimindo-autorizacao');
    const styleEl = document.createElement('style');
    styleEl.id = 'autorizacao-print-style';
    styleEl.innerHTML = `
      @page { 
        size: A4 portrait !important; 
        margin: 8mm 10mm !important; 
      }
      @media print {
        body * {
          visibility: hidden !important;
        }
        #area-impressao-autorizacao, #area-impressao-autorizacao * {
          visibility: visible !important;
        }
        #area-impressao-autorizacao {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #000000 !important;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(styleEl);

    window.print();

    setTimeout(() => {
      document.body.classList.remove('imprimindo-autorizacao');
      const el = document.getElementById('autorizacao-print-style');
      if (el) el.remove();
    }, 1500);
  };

  /**
   * Renderiza uma via única do documento físico de Autorização de Carregamento
   */
  const renderizarViaDocumento = (numeroVia = 1) => {
    const bloco1 = blocosPedreira[0] || '';
    const bloco2 = blocosPedreira[1] || '';
    const bloco3 = blocosPedreira[2] || '';

    return (
      <div style={{
        background: '#ffffff',
        color: '#000000',
        padding: '16px 20px',
        borderRadius: 8,
        border: '1px solid #d1d5db',
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
        maxWidth: '540px',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        {/* Topo com Logomarca Oficial da Vermont Mineração */}
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <img 
            src="https://vermontmineracao.com/wp-content/uploads/2022/07/logo-vermont-site-1.png" 
            alt="Vermont Mineração" 
            style={{ 
              height: '46px', 
              maxWidth: '200px', 
              objectFit: 'contain',
              display: 'inline-block'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <div style={{ display: 'none', fontWeight: 900, fontSize: '1.2rem', letterSpacing: '1px', color: '#00762c' }}>
            VERMONT MINERAÇÃO
          </div>
        </div>

        {/* Título Oficial em Caixa Alta */}
        <div style={{
          textAlign: 'center',
          fontSize: '1.05rem',
          fontWeight: 900,
          letterSpacing: '0.5px',
          color: '#000000',
          marginBottom: 12,
          textTransform: 'uppercase',
          borderBottom: '2px solid #000000',
          paddingBottom: 6
        }}>
          {tituloDocumento}
        </div>

        {/* Tabela Formatada Padrão Vermont */}
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.88rem',
          border: '1px solid #000000'
        }}>
          <tbody>
            {/* DATA */}
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ width: '38%', padding: '6px 10px', fontWeight: 800, borderRight: '1px solid #000000', background: '#f9fafb' }}>
                DATA:
              </td>
              <td style={{ padding: '6px 10px', fontWeight: 700 }}>
                {dataFormatada}
              </td>
            </tr>

            {/* CLIENTE */}
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ padding: '6px 10px', fontWeight: 800, borderRight: '1px solid #000000', background: '#f9fafb' }}>
                CLIENTE:
              </td>
              <td style={{ padding: '6px 10px', fontWeight: 700 }}>
                {clienteFormatado}
              </td>
            </tr>

            {/* DESTINO */}
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ padding: '6px 10px', fontWeight: 800, borderRight: '1px solid #000000', background: '#f9fafb' }}>
                DESTINO:
              </td>
              <td style={{ padding: '6px 10px', fontWeight: 700 }}>
                {destinoEditavel || 'ES'}
              </td>
            </tr>

            {/* BLOCO 01 */}
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ padding: '6px 10px', fontWeight: 800, borderRight: '1px solid #000000', background: '#f9fafb' }}>
                BLOCO 01:
              </td>
              <td style={{ padding: '6px 10px', fontWeight: 800, color: '#000000' }}>
                {bloco1 || '-'}
              </td>
            </tr>

            {/* BLOCO 02 */}
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ padding: '6px 10px', fontWeight: 800, borderRight: '1px solid #000000', background: '#f9fafb' }}>
                BLOCO 02:
              </td>
              <td style={{ padding: '6px 10px', fontWeight: 800, color: '#000000' }}>
                {bloco2}
              </td>
            </tr>

            {/* BLOCO 03 */}
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ padding: '6px 10px', fontWeight: 800, borderRight: '1px solid #000000', background: '#f9fafb' }}>
                BLOCO 03:
              </td>
              <td style={{ padding: '6px 10px', fontWeight: 800, color: '#000000' }}>
                {bloco3}
              </td>
            </tr>

            {/* TRANSPORTADORA */}
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ padding: '6px 10px', fontWeight: 800, borderRight: '1px solid #000000', background: '#f9fafb' }}>
                TRANSPORTADORA:
              </td>
              <td style={{ padding: '6px 10px', fontWeight: 700 }}>
                {transportadoraFormatada}
              </td>
            </tr>

            {/* MOTORISTA */}
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ padding: '6px 10px', fontWeight: 800, borderRight: '1px solid #000000', background: '#f9fafb' }}>
                MOTORISTA:
              </td>
              <td style={{ padding: '6px 10px', fontWeight: 700 }}>
                {motoristaFormatado}
              </td>
            </tr>

            {/* PLACA */}
            <tr>
              <td style={{ padding: '6px 10px', fontWeight: 800, borderRight: '1px solid #000000', background: '#f9fafb' }}>
                PLACA:
              </td>
              <td style={{ padding: '6px 10px', fontWeight: 800 }}>
                {placasFormatadas}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 8, 15, 0.88)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px'
    }}>
      <div style={{
        background: '#0f172a',
        border: '1px solid rgba(0, 118, 44, 0.4)',
        borderRadius: 16,
        width: '100%',
        maxWidth: '820px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 118, 44, 0.2)',
        overflow: 'hidden'
      }}>
        {/* Cabeçalho do Modal */}
        <div className="no-print" style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 118, 44, 0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(0, 118, 44, 0.25)',
              border: '1px solid #22c55e',
              borderRadius: 10,
              padding: 8,
              color: '#4ade80',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                Autorização de Carregamento
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                {pedreiraReferencia} • Documento oficial para expedição e balança
              </p>
            </div>
          </div>

          <button
            onClick={onFechar}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              padding: 8,
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Barra de Ajustes Rápidos (Destino, Formato de Impressão) */}
        <div className="no-print" style={{
          padding: '12px 20px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          {/* Campo Destino Ajustável */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>
              Destino (UF/Cidade):
            </span>
            <input
              type="text"
              value={destinoEditavel}
              onChange={(e) => setDestinoEditavel(e.target.value.toUpperCase())}
              placeholder="Ex: ES, SP, CE..."
              style={{
                width: '110px',
                padding: '6px 10px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 6,
                color: '#4ade80',
                fontWeight: 700,
                fontSize: '0.85rem',
                textAlign: 'center',
                outline: 'none'
              }}
            />
          </div>

          {/* Formato de Impressão */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>
              Vias por folha:
            </span>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: 6, padding: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                type="button"
                onClick={() => setViasPorFolha('dupla')}
                style={{
                  padding: '4px 10px',
                  background: viasPorFolha === 'dupla' ? 'var(--vermont-green)' : 'transparent',
                  color: viasPorFolha === 'dupla' ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                2 Vias (Meia Folha)
              </button>
              <button
                type="button"
                onClick={() => setViasPorFolha('unica')}
                style={{
                  padding: '4px 10px',
                  background: viasPorFolha === 'unica' ? 'var(--vermont-green)' : 'transparent',
                  color: viasPorFolha === 'unica' ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                1 Via Completa
              </button>
            </div>
          </div>
        </div>

        {/* Alerta Informativo se houver blocos em outras pedreiras */}
        {outrosBlocosOutrasPedreiras.length > 0 && (
          <div className="no-print" style={{
            margin: '12px 20px 0',
            padding: '10px 14px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 8,
            color: '#38bdf8',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>
              <strong>Carga Mista com múltiplas pedreiras:</strong> Este veículo também carregará: {outrosBlocosOutrasPedreiras.join(', ')}. Esta autorização lista <strong>apenas os blocos da pedreira {pedreiraReferencia.split('-')[0].trim()}</strong>.
            </span>
          </div>
        )}

        {/* Visualização Prévia do Documento (Área que será impressa) */}
        <div style={{
          padding: '20px',
          flex: 1,
          overflowY: 'auto',
          background: 'rgba(0, 0, 0, 0.4)'
        }}>
          <div id="area-impressao-autorizacao" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: viasPorFolha === 'dupla' ? '28px' : '0px',
            maxWidth: '560px',
            margin: '0 auto'
          }}>
            {/* 1ª Via */}
            <div>
              {renderizarViaDocumento(1)}
            </div>

            {/* 2ª Via (se modo folha dupla estiver ativado) */}
            {viasPorFolha === 'dupla' && (
              <div style={{ borderTop: '1px dashed #9ca3af', paddingTop: '24px' }}>
                {renderizarViaDocumento(2)}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="no-print" style={{
          padding: '14px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 0, 0, 0.3)'
        }}>
          <button
            onClick={onFechar}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#e2e8f0',
              borderRadius: 8,
              padding: '9px 16px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            Fechar
          </button>

          <button
            onClick={handleImprimir}
            className="btn btn-vermont"
            style={{
              padding: '9px 22px',
              fontWeight: 700,
              fontSize: '0.9rem',
              gap: 8,
              boxShadow: '0 4px 14px rgba(0, 118, 44, 0.4)'
            }}
          >
            <Printer size={18} />
            Imprimir Autorização
          </button>
        </div>
      </div>
    </div>
  );
}
