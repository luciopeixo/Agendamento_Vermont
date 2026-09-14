import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Printer, X, FileText, CheckCircle2, Shield, Truck, Edit3, 
  Eye, Check, AlertCircle, Layers, Sparkles, MapPin, Ruler
} from 'lucide-react';
import { 
  formatarDataBR, 
  formatarPlacasExibicao, 
  limparNomeEmpresa, 
  extrairBlocosDigitados, 
  saoMesmaPedreira 
} from '../services/agendamentoService';

/**
 * Componente do Logotipo Oficial da Vermont Mineração para cabeçalho
 * Usa a mesma logo oficial da página com alto contraste para impressão física
 */
function LogoVermontHeader({ isCompact = false }) {
  const [imgErro, setImgErro] = useState(false);

  return (
    <div style={{ textAlign: 'center', marginBottom: isCompact ? 4 : 10 }}>
      {!imgErro ? (
        <img 
          src="/assets/logo-vermont.png" 
          alt="Vermont Mineração" 
          style={{ 
            maxHeight: isCompact ? '34px' : '48px', 
            maxWidth: isCompact ? '160px' : '220px', 
            objectFit: 'contain',
            display: 'inline-block',
            filter: 'brightness(0)',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact'
          }}
          onError={(e) => {
            // Fallback para URL externa se necessário
            if (!e.target.dataset.triedFallback) {
              e.target.dataset.triedFallback = 'true';
              e.target.src = 'https://vermontmineracao.com/wp-content/uploads/2022/07/logo-vermont-site-1.png';
            } else {
              setImgErro(true);
            }
          }}
        />
      ) : (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: isCompact ? 6 : 10,
          padding: isCompact ? '2px 8px' : '4px 12px',
          border: '1.5px solid #000000',
          borderRadius: 6
        }}>
          <div style={{
            width: isCompact ? 24 : 32,
            height: isCompact ? 24 : 32,
            background: '#000000',
            color: '#ffffff',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: isCompact ? '0.95rem' : '1.2rem',
            fontFamily: 'sans-serif'
          }}>
            V
          </div>
          <div style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontSize: isCompact ? '0.90rem' : '1.1rem', fontWeight: 900, letterSpacing: '0.08em', color: '#000000', lineHeight: 1.1 }}>
              VERMONT
            </span>
            <span style={{ display: 'block', fontSize: isCompact ? '0.55rem' : '0.65rem', fontWeight: 700, letterSpacing: '0.22em', color: '#333333', lineHeight: 1 }}>
              MINERAÇÃO
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function AutorizacaoCarregamentoModal({
  agendamento,
  todosAgendamentos = [],
  pedreiraOperador = null,
  onFechar
}) {
  if (!agendamento) return null;

  // Campo de destino: por padrão em branco, obrigatório antes de imprimir
  const [destinoEditavel, setDestinoEditavel] = useState('');
  const [erroDestino, setErroDestino] = useState(false);
  // Medidas e Série na mesma linha de cada bloco
  const [medidasBloco1, setMedidasBloco1] = useState('');
  const [medidasBloco2, setMedidasBloco2] = useState('');
  const [medidasBloco3, setMedidasBloco3] = useState('');
  const [viasPorFolha, setViasPorFolha] = useState('dupla'); // 'dupla' (2 por página A4) ou 'unica' (1 por página)
  
  const inputDestinoRef = useRef(null);

  // Pedreira de referência: se for operador específico, isola a pedreira do operador
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
          const nomePedrCurto = item.pedreira ? item.pedreira.split('-')[0].trim() : 'Outra';
          if (!blocosDeOutrasPedreiras.includes(`${bloco} (${nomePedrCurto})`)) {
            blocosDeOutrasPedreiras.push(`${bloco} (${nomePedrCurto})`);
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

  const clienteFormatado = useMemo(() => {
    const limpo = limparNomeEmpresa(agendamento.cliente);
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

  // Validação e Execução de Impressão
  const handleImprimir = () => {
    const destinoLimpo = (destinoEditavel || '').trim();
    if (!destinoLimpo) {
      setErroDestino(true);
      if (inputDestinoRef.current) {
        inputDestinoRef.current.focus();
      }
      return;
    }

    setErroDestino(false);
    document.body.classList.add('imprimindo-autorizacao');
    const styleEl = document.createElement('style');
    styleEl.id = 'autorizacao-print-style';
    styleEl.innerHTML = `
      @page { 
        size: A4 portrait !important; 
        margin: 5mm 8mm !important; 
      }
      @media print {
        *, *:before, *:after {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          box-sizing: border-box !important;
        }
        html, body {
          width: 100% !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
        }
        body * {
          visibility: hidden !important;
        }
        #area-impressao-autorizacao, #area-impressao-autorizacao * {
          visibility: visible !important;
        }
        #area-impressao-autorizacao {
          position: static !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: flex-start !important;
          width: 100% !important;
          max-width: 580px !important;
          margin: 0 auto !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #000000 !important;
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
          break-after: avoid !important;
          break-inside: avoid !important;
        }
        .via-card-print {
          width: 100% !important;
          max-width: 580px !important;
          margin: 0 auto !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .via-divisor-corte {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          max-width: 580px !important;
          margin: 6px auto !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
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
   * Renderiza uma via do documento físico de Autorização de Carregamento
   */
  const renderizarViaDocumento = (numeroVia = 1) => {
    const isCompact = viasPorFolha === 'dupla';
    const bloco1 = blocosPedreira[0] || '';
    const bloco2 = blocosPedreira[1] || '';
    const bloco3 = blocosPedreira[2] || '';

    return (
      <div 
        className="via-card-print"
        style={{
          background: '#ffffff',
          color: '#000000',
          padding: isCompact ? '10px 14px' : '22px 26px',
          borderRadius: isCompact ? 4 : 8,
          border: '1.5px solid #000000',
          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
          maxWidth: isCompact ? '560px' : '600px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          boxShadow: isCompact ? 'none' : '0 2px 6px rgba(0,0,0,0.05)'
        }}
      >
        {/* Topo com Logomarca Oficial da Vermont Mineração */}
        <LogoVermontHeader isCompact={isCompact} />

        {/* Título Oficial Exclusivo: AUTORIZAÇÃO DE CARREGAMENTO */}
        <div style={{
          textAlign: 'center',
          fontSize: isCompact ? '0.90rem' : '1.15rem',
          fontWeight: 900,
          letterSpacing: '0.8px',
          color: '#000000',
          marginBottom: isCompact ? 6 : 12,
          textTransform: 'uppercase',
          borderBottom: '2px solid #000000',
          paddingBottom: isCompact ? 2 : 5
        }}>
          AUTORIZAÇÃO DE CARREGAMENTO
        </div>

        {/* Tabela Formatada com Bordas e Linhas Nítidas */}
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: isCompact ? '0.78rem' : '0.90rem',
          border: '1.5px solid #000000',
          tableLayout: 'fixed'
        }}>
          <tbody>
            {/* DATA */}
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ width: '36%', padding: isCompact ? '3.5px 8px' : '7px 12px', fontWeight: 800, borderRight: '1.5px solid #000000', background: '#f8fafc', color: '#111827' }}>
                DATA:
              </td>
              <td style={{ padding: isCompact ? '3.5px 8px' : '7px 12px', fontWeight: 700, color: '#000000' }}>
                {dataFormatada}
              </td>
            </tr>

            {/* CLIENTE */}
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ padding: isCompact ? '3.5px 8px' : '7px 12px', fontWeight: 800, borderRight: '1.5px solid #000000', background: '#f8fafc', color: '#111827' }}>
                CLIENTE:
              </td>
              <td style={{ padding: isCompact ? '3.5px 8px' : '7px 12px', fontWeight: 700, color: '#000000', wordBreak: 'break-word', lineHeight: 1.15 }}>
                {clienteFormatado}
              </td>
            </tr>

            {/* DESTINO */}
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ padding: isCompact ? '3.5px 8px' : '7px 12px', fontWeight: 800, borderRight: '1.5px solid #000000', background: '#f8fafc', color: '#111827' }}>
                DESTINO:
              </td>
              <td style={{ padding: isCompact ? '3.5px 8px' : '7px 12px', fontWeight: 800, color: destinoEditavel ? '#000000' : '#ef4444' }}>
                {destinoEditavel.trim() ? (
                  destinoEditavel.toUpperCase()
                ) : (
                  <span style={{ fontSize: isCompact ? '0.72rem' : '0.82rem', fontStyle: 'italic', color: '#ef4444' }}>
                    * Destino Obrigatório (Preencha acima)
                  </span>
                )}
              </td>
            </tr>

            {/* BLOCO 01 */}
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ width: '36%', padding: isCompact ? '3.5px 8px' : '7px 12px', fontWeight: 800, borderRight: '1.5px solid #000000', background: '#f8fafc', color: '#111827' }}>
                BLOCO 01:
              </td>
              <td style={{ padding: isCompact ? '3.5px 8px' : '7px 12px', color: '#000000' }}>
                <span style={{ fontWeight: 900, fontSize: isCompact ? '0.82rem' : '0.94rem' }}>
                  {bloco1 || '-'}
                </span>
                {medidasBloco1.trim() && (
                  <span style={{ marginLeft: isCompact ? '8px' : '12px', fontWeight: 700, fontSize: isCompact ? '0.74rem' : '0.86rem', color: '#111827' }}>
                    — {medidasBloco1.toUpperCase()}
                  </span>
                )}
              </td>
            </tr>

            {/* BLOCO 02 */}
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ width: '36%', padding: isCompact ? '3.5px 8px' : '7px 12px', fontWeight: 800, borderRight: '1.5px solid #000000', background: '#f8fafc', color: '#111827' }}>
                BLOCO 02:
              </td>
              <td style={{ padding: isCompact ? '3.5px 8px' : '7px 12px', color: '#000000' }}>
                <span style={{ fontWeight: 900, fontSize: isCompact ? '0.82rem' : '0.94rem' }}>
                  {bloco2}
                </span>
                {bloco2 && medidasBloco2.trim() && (
                  <span style={{ marginLeft: isCompact ? '8px' : '12px', fontWeight: 700, fontSize: isCompact ? '0.74rem' : '0.86rem', color: '#111827' }}>
                    — {medidasBloco2.toUpperCase()}
                  </span>
                )}
              </td>
            </tr>

            {/* BLOCO 03 */}
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ width: '36%', padding: isCompact ? '3.5px 8px' : '7px 12px', fontWeight: 800, borderRight: '1.5px solid #000000', background: '#f8fafc', color: '#111827' }}>
                BLOCO 03:
              </td>
              <td style={{ padding: isCompact ? '3.5px 8px' : '7px 12px', color: '#000000' }}>
                <span style={{ fontWeight: 900, fontSize: isCompact ? '0.82rem' : '0.94rem' }}>
                  {bloco3}
                </span>
                {bloco3 && medidasBloco3.trim() && (
                  <span style={{ marginLeft: isCompact ? '8px' : '12px', fontWeight: 700, fontSize: isCompact ? '0.74rem' : '0.86rem', color: '#111827' }}>
                    — {medidasBloco3.toUpperCase()}
                  </span>
                )}
              </td>
            </tr>

            {/* TRANSPORTADORA */}
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ padding: isCompact ? '3.5px 8px' : '7px 12px', fontWeight: 800, borderRight: '1.5px solid #000000', background: '#f8fafc', color: '#111827' }}>
                TRANSPORTADORA:
              </td>
              <td style={{ padding: isCompact ? '3.5px 8px' : '7px 12px', fontWeight: 700, color: '#000000', wordBreak: 'break-word', lineHeight: 1.15 }}>
                {transportadoraFormatada}
              </td>
            </tr>

            {/* MOTORISTA */}
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ padding: isCompact ? '3.5px 8px' : '7px 12px', fontWeight: 800, borderRight: '1.5px solid #000000', background: '#f8fafc', color: '#111827' }}>
                MOTORISTA:
              </td>
              <td style={{ padding: isCompact ? '3.5px 8px' : '7px 12px', fontWeight: 700, color: '#000000', wordBreak: 'break-word', lineHeight: 1.15 }}>
                {motoristaFormatado}
              </td>
            </tr>

            {/* PLACA */}
            <tr>
              <td style={{ padding: isCompact ? '3.5px 8px' : '7px 12px', fontWeight: 800, borderRight: '1.5px solid #000000', background: '#f8fafc', color: '#111827' }}>
                PLACA:
              </td>
              <td style={{ padding: isCompact ? '3.5px 8px' : '7px 12px', fontWeight: 900, color: '#000000', fontSize: isCompact ? '0.82rem' : '0.94rem' }}>
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
        maxHeight: '94vh',
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
                {pedreiraReferencia} • Documento oficial padronizado
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

        {/* Barra de Ajustes Obrigatórios (Destino e Formato de Impressão) */}
        <div className="no-print" style={{
          padding: '14px 20px',
          background: erroDestino ? 'rgba(239, 68, 68, 0.12)' : 'rgba(0, 0, 0, 0.35)',
          borderBottom: erroDestino ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          transition: 'all 0.2s ease'
        }}>
          {/* Campo Destino Obrigatório */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={16} color={erroDestino ? '#f87171' : '#4ade80'} />
              <label 
                htmlFor="input-destino-autorizacao"
                style={{ 
                  fontSize: '0.85rem', 
                  color: erroDestino ? '#f87171' : '#f1f5f9', 
                  fontWeight: 700 
                }}
              >
                Destino (UF/Cidade) <span style={{ color: '#ef4444' }}>*obrigatório</span>:
              </label>
            </div>

            <input
              id="input-destino-autorizacao"
              ref={inputDestinoRef}
              type="text"
              value={destinoEditavel}
              onChange={(e) => {
                setDestinoEditavel(e.target.value.toUpperCase());
                if (e.target.value.trim()) setErroDestino(false);
              }}
              placeholder="Digite o destino (Ex: ES, CE, SP...)"
              style={{
                minWidth: '220px',
                padding: '7px 12px',
                background: erroDestino ? 'rgba(239, 68, 68, 0.15)' : 'rgba(15, 23, 42, 0.9)',
                border: erroDestino ? '2px solid #ef4444' : '1px solid rgba(74, 222, 128, 0.4)',
                borderRadius: 6,
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.88rem',
                outline: 'none',
                boxShadow: erroDestino ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none'
              }}
            />

            {/* Botões de atalho rápido de UF */}
            <div style={{ display: 'flex', gap: 4 }}>
              {['ES', 'CE', 'SP', 'MG', 'RJ'].map((uf) => (
                <button
                  key={uf}
                  type="button"
                  onClick={() => {
                    setDestinoEditavel(uf);
                    setErroDestino(false);
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: 4,
                    background: destinoEditavel === uf ? 'var(--vermont-green)' : 'rgba(255, 255, 255, 0.08)',
                    color: destinoEditavel === uf ? '#ffffff' : '#cbd5e1',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer'
                  }}
                >
                  {uf}
                </button>
              ))}
            </div>
          </div>

          {/* Campo Aberto: Medidas e Número de Série dos Blocos (na mesma linha) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Ruler size={16} color="#38bdf8" />
              <label 
                htmlFor="input-medidas-bloco1"
                style={{ 
                  fontSize: '0.85rem', 
                  color: '#f1f5f9', 
                  fontWeight: 700 
                }}
              >
                Medidas / Série (Bloco 01):
              </label>
            </div>

            <input
              id="input-medidas-bloco1"
              type="text"
              value={medidasBloco1}
              onChange={(e) => setMedidasBloco1(e.target.value)}
              placeholder="Ex: 2.95 x 1.80 x 1.42 - Série #1084 (ou em branco p/ caneta)"
              style={{
                minWidth: '270px',
                padding: '7px 12px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: 6,
                color: '#38bdf8',
                fontWeight: 700,
                fontSize: '0.86rem',
                outline: 'none'
              }}
            />

            {blocosPedreira.length > 1 && (
              <input
                type="text"
                value={medidasBloco2}
                onChange={(e) => setMedidasBloco2(e.target.value)}
                placeholder="Medidas Bloco 02..."
                title="Medidas e Série do Bloco 02"
                style={{
                  minWidth: '180px',
                  padding: '7px 12px',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: 6,
                  color: '#38bdf8',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  outline: 'none'
                }}
              />
            )}

            {blocosPedreira.length > 2 && (
              <input
                type="text"
                value={medidasBloco3}
                onChange={(e) => setMedidasBloco3(e.target.value)}
                placeholder="Medidas Bloco 03..."
                title="Medidas e Série do Bloco 03"
                style={{
                  minWidth: '180px',
                  padding: '7px 12px',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: 6,
                  color: '#38bdf8',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  outline: 'none'
                }}
              />
            )}

            <button
              type="button"
              onClick={() => {
                setMedidasBloco1('2.95 x 1.80 x 1.42 - SÉRIE #1084');
                if (blocosPedreira.length > 1) {
                  setMedidasBloco2('2.85 x 1.75 x 1.38 - SÉRIE #1085');
                }
                if (blocosPedreira.length > 2) {
                  setMedidasBloco3('2.70 x 1.65 x 1.30 - SÉRIE #1086');
                }
              }}
              style={{
                padding: '5px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
                borderRadius: 4,
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                cursor: 'pointer'
              }}
              title="Simular medidas e número de série de exemplo na linha do bloco"
            >
              Simular Medidas
            </button>

            {(medidasBloco1 || medidasBloco2 || medidasBloco3) && (
              <button
                type="button"
                onClick={() => {
                  setMedidasBloco1('');
                  setMedidasBloco2('');
                  setMedidasBloco3('');
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#94a3b8',
                  border: 'none',
                  cursor: 'pointer'
                }}
                title="Deixar campos em branco para preenchimento manual"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Formato de Impressão */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>
              Formato:
            </span>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: 6, padding: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                type="button"
                onClick={() => setViasPorFolha('dupla')}
                style={{
                  padding: '5px 12px',
                  background: viasPorFolha === 'dupla' ? 'var(--vermont-green)' : 'transparent',
                  color: viasPorFolha === 'dupla' ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                2 Vias (Meia Página)
              </button>
              <button
                type="button"
                onClick={() => setViasPorFolha('unica')}
                style={{
                  padding: '5px 12px',
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

        {/* Mensagem de Erro / Alerta se tentar imprimir sem destino */}
        {erroDestino && (
          <div className="no-print" style={{
            margin: '10px 20px 0',
            padding: '8px 14px',
            background: 'rgba(239, 68, 68, 0.18)',
            border: '1px solid #ef4444',
            borderRadius: 8,
            color: '#fca5a5',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>
              <strong>Atenção:</strong> É obrigatório informar o <strong>Destino</strong> (UF ou Cidade) antes de gerar a impressão do documento.
            </span>
          </div>
        )}

        {/* Alerta Informativo se houver blocos em outras pedreiras */}
        {outrosBlocosOutrasPedreiras.length > 0 && (
          <div className="no-print" style={{
            margin: '10px 20px 0',
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
            gap: viasPorFolha === 'dupla' ? '6px' : '0px',
            maxWidth: viasPorFolha === 'dupla' ? '560px' : '600px',
            width: '100%',
            margin: '0 auto'
          }}>
            {/* 1ª Via */}
            <div style={{ width: '100%' }}>
              {renderizarViaDocumento(1)}
            </div>

            {/* Linha de Picote e Corte para 2ª Via */}
            {viasPorFolha === 'dupla' && (
              <div 
                className="via-divisor-corte"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  margin: '6px 0',
                  color: '#64748b',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  width: '100%'
                }}
              >
                <span style={{ flex: 1, borderTop: '1px dashed #94a3b8' }}></span>
                <span>✂ CORTE AQUI (2ª VIA) ✂</span>
                <span style={{ flex: 1, borderTop: '1px dashed #94a3b8' }}></span>
              </div>
            )}

            {/* 2ª Via (se modo folha dupla estiver ativado) */}
            {viasPorFolha === 'dupla' && (
              <div style={{ width: '100%' }}>
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
              padding: '10px 24px',
              fontWeight: 700,
              fontSize: '0.92rem',
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
