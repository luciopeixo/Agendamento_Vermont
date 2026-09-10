import React from 'react';
import { Calendar, ListChecks, Lock, LogOut, Palette } from 'lucide-react';

export function Navbar({ 
  abaAtiva, 
  setAbaAtiva, 
  isAdmin, 
  onLogout,
  temaFundo = 'negresco',
  setTemaFundo
}) {
  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Logo & Marca Vermont Mineração - Atalho Clicável para Página Inicial */}
        <div 
          onClick={() => setAbaAtiva('agendar')}
          className="navbar-brand"
          title="Clique para ir à página inicial (Novo Agendamento)"
        >
          <img 
            src="https://vermontmineracao.com/wp-content/uploads/2022/07/logo-vermont-site-1.png" 
            alt="Vermont Mineração"
            className="navbar-logo-img"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
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

          <div className="navbar-brand-info">
            <span className="badge badge-vermont navbar-badge">
              POLO CEARÁ
            </span>
            <p className="navbar-brand-title">
              Portal de Agendamento • Grupo Vermont
            </p>
          </div>
        </div>

        {/* Navegação entre Abas & Seletor de Fundo Visual */}
        <div className="navbar-actions">
          {/* Seletor de Fundo Nobre */}
          {setTemaFundo && (
            <div className="navbar-theme-selector" title="Alternar textura nobre de fundo">
              <Palette size={14} color="#00a83e" style={{ marginRight: 2 }} />
              <button
                type="button"
                onClick={() => setTemaFundo('negresco')}
                className={`theme-btn ${temaFundo === 'negresco' ? 'active' : ''}`}
                title="Tema Dark (Rochas Escuras Nobres)"
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setTemaFundo('tajmahal')}
                className={`theme-btn ${temaFundo === 'tajmahal' ? 'active' : ''}`}
                title="Tema Claro (Quartzito Nobre Translúcido)"
              >
                Claro
              </button>
              <button
                type="button"
                onClick={() => setTemaFundo('grafite')}
                className={`theme-btn ${temaFundo === 'grafite' ? 'active' : ''}`}
                title="Tema Grafite (Fundo Mineral Clean)"
              >
                Grafite
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setAbaAtiva('agendar')}
            className={`btn navbar-btn ${abaAtiva === 'agendar' ? 'btn-vermont' : 'btn-secondary'}`}
          >
            <Calendar size={17} />
            <span>Novo Agendamento</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('painel')}
            className={`btn navbar-btn ${abaAtiva === 'painel' ? 'btn-vermont' : 'btn-secondary'}`}
          >
            {isAdmin ? <ListChecks size={17} /> : <Lock size={15} color="#4ade80" />}
            <span>{isAdmin ? 'Painel de Carregamento' : 'Painel Admin'}</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={onLogout}
              className="btn btn-danger navbar-btn-logout"
              title="Sair do modo administrador"
            >
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
