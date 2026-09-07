import React from 'react';
import { Calendar, ListChecks, Lock, LogOut, Palette } from 'lucide-react';

export function Navbar({ 
  abaAtiva, 
  setAbaAtiva, 
  onAbrirRegras, 
  isAdmin, 
  onLogout,
  temaFundo = 'negresco',
  setTemaFundo
}) {
  return (
    <header className="navbar-container" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(9, 13, 16, 0.95)',
      backdropFilter: 'blur(18px)',
      borderBottom: '1px solid rgba(0, 118, 44, 0.35)',
      padding: '12px 24px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Logo & Marca Vermont Mineração - Atalho Clicável para Página Inicial */}
        <div 
          onClick={() => setAbaAtiva('agendar')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 14, 
            cursor: 'pointer',
            transition: 'transform 0.2s ease, opacity 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          title="Clique para ir à página inicial (Novo Agendamento)"
        >
          <img 
            src="https://vermontmineracao.com/wp-content/uploads/2022/07/logo-vermont-site-1.png" 
            alt="Vermont Mineração"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
            style={{
              height: 42,
              objectFit: 'contain'
            }}
          />
          <div style={{
            display: 'none',
            alignItems: 'center',
            gap: 8
          }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: 'var(--vermont-green-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
              color: '#fff'
            }}>
              V
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.05em', color: '#fff' }}>
                VERMONT
              </span>
              <span style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.15em', color: 'var(--vermont-green-light)', fontWeight: 600 }}>
                MINERAÇÃO
              </span>
            </div>
          </div>

          <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.14)', paddingLeft: 14 }}>
            <span className="badge badge-vermont" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
              POLO CEARÁ
            </span>
            <p style={{ 
              margin: '3px 0 0 0', 
              fontSize: '0.86rem', 
              fontWeight: 600,
              color: '#e2e8f0',
              letterSpacing: '0.01em'
            }}>
              Portal de Agendamento - Grupo Vermont Mineração
            </p>
          </div>
        </div>

        {/* Navegação entre Abas & Seletor de Fundo Visual */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Seletor de Fundo Nobre */}
          {setTemaFundo && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '3px 6px'
              }}
              title="Alternar textura nobre de fundo"
            >
              <Palette size={14} color="#00a83e" style={{ marginRight: 2 }} />
              <button
                type="button"
                onClick={() => setTemaFundo('negresco')}
                style={{
                  background: temaFundo === 'negresco' ? 'var(--vermont-green)' : 'transparent',
                  color: temaFundo === 'negresco' ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Tema Dark (Rochas Escuras Nobres)"
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setTemaFundo('tajmahal')}
                style={{
                  background: temaFundo === 'tajmahal' ? 'var(--vermont-green)' : 'transparent',
                  color: temaFundo === 'tajmahal' ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Tema Claro (Quartzito Nobre Translúcido)"
              >
                Claro
              </button>
              <button
                type="button"
                onClick={() => setTemaFundo('grafite')}
                style={{
                  background: temaFundo === 'grafite' ? 'var(--vermont-green)' : 'transparent',
                  color: temaFundo === 'grafite' ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Tema Grafite (Fundo Mineral Clean)"
              >
                Grafite
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setAbaAtiva('agendar')}
            className={`btn ${abaAtiva === 'agendar' ? 'btn-vermont' : 'btn-secondary'}`}
            style={{ fontSize: '0.88rem', padding: '9px 18px' }}
          >
            <Calendar size={18} />
            Novo Agendamento
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('painel')}
            className={`btn ${abaAtiva === 'painel' ? 'btn-vermont' : 'btn-secondary'}`}
            style={{ fontSize: '0.88rem', padding: '9px 18px' }}
          >
            {isAdmin ? <ListChecks size={18} /> : <Lock size={16} color="#4ade80" />}
            {isAdmin ? 'Painel de Carregamento' : 'Painel Admin'}
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={onLogout}
              className="btn btn-danger"
              title="Sair do modo administrador"
              style={{ fontSize: '0.84rem', padding: '9px 14px' }}
            >
              <LogOut size={16} />
              Sair
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
