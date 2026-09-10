import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AgendamentoForm } from './components/AgendamentoForm';
import { PainelGestao } from './components/PainelGestao';
import { AdminLogin } from './components/AdminLogin';
import { ComprovanteModal } from './components/ComprovanteModal';
import { RegrasModal } from './components/RegrasModal';
import { ShieldCheck, Mail, MapPin } from 'lucide-react';
import { EMAIL_NOTIFICACAO_DESTINO, isSupabaseConfigurado } from './services/agendamentoService';
import { supabase } from './lib/supabase';

export function App() {
  const [abaAtiva, setAbaAtiva] = useState('agendar');
  const [modalRegrasAberto, setModalRegrasAberto] = useState(false);
  const [agendamentoConcluido, setAgendamentoConcluido] = useState(null);
  
  // Tema de Fundo Mineral das Pedreiras Vermont
  const [temaFundo, setTemaFundo] = useState(() => {
    return localStorage.getItem('vermont_tema_fundo') || 'negresco';
  });

  useEffect(() => {
    document.body.className = `fundo-${temaFundo}`;
    localStorage.setItem('vermont_tema_fundo', temaFundo);
  }, [temaFundo]);

  // Estado de autenticação via Supabase Auth com persistência local
  const [usuarioAuth, setUsuarioAuth] = useState(() => {
    try {
      const raw = localStorage.getItem('vermont_auth_session');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    // Verifica sessão ativa existente se o Supabase estiver configurado
    if (isSupabaseConfigurado()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUsuarioAuth(session.user);
          localStorage.setItem('vermont_auth_session', JSON.stringify(session.user));
        }
      }).catch(() => {});

      // Escuta alterações de estado de autenticação em tempo real
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUsuarioAuth(session.user);
          localStorage.setItem('vermont_auth_session', JSON.stringify(session.user));
        } else if (_event === 'SIGNED_OUT') {
          setUsuarioAuth(null);
          localStorage.removeItem('vermont_auth_session');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const isAutenticado = !!usuarioAuth;
  const userMeta = usuarioAuth?.user_metadata || {};
  const userEmail = (usuarioAuth?.email || '').toLowerCase();

  // É Admin Geral se possuir role 'admin' ou e-mail de admin/faturamento
  const isAdmin = isAutenticado && (
    userMeta.role === 'admin' || 
    userEmail.startsWith('admin') || 
    userEmail.includes('faturamento') ||
    userEmail.includes('diretoria') ||
    userEmail.includes('logistica')
  );

  // Pedreira vinculada caso seja operador de campo
  const pedreiraOperador = isAdmin ? null : (
    userMeta.pedreira || (
      userEmail.includes('uruoca') ? 'Uruoca - CE (Taj Mahal)' :
      userEmail.includes('negresco') ? 'Massapê - CE (Negresco)' :
      userEmail.includes('delmare') ? 'Massapê - CE (Del Mare)' :
      userEmail.includes('jaibaras') ? 'Sobral - CE (Jaibaras)' :
      userEmail.includes('serrote') ? 'São Gonçalo do Amarante - CE (Serrote)' :
      userEmail.includes('beberibe') ? 'Beberibe - CE' : null
    )
  );

  const handleLoginSucesso = (user) => {
    if (user) {
      setUsuarioAuth(user);
      localStorage.setItem('vermont_auth_session', JSON.stringify(user));
    } else if (isSupabaseConfigurado()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUsuarioAuth(session.user);
          localStorage.setItem('vermont_auth_session', JSON.stringify(session.user));
        }
      });
    }
  };

  const handleLogout = async () => {
    try {
      if (isSupabaseConfigurado()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Erro ao encerrar sessão:', err);
    }
    localStorage.removeItem('vermont_auth_session');
    setUsuarioAuth(null);
    setAbaAtiva('agendar');
  };

  const handleAgendamentoSucesso = (agendamento) => {
    setAgendamentoConcluido(agendamento);
  };

  const handleVisualizarComprovante = (agendamento) => {
    setAgendamentoConcluido(agendamento);
  };

  const handleFecharComprovante = () => {
    setAgendamentoConcluido(null);
  };

  const handleNovoAgendamento = () => {
    setAgendamentoConcluido(null);
    setAbaAtiva('agendar');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Barra de Navegação */}
      <Navbar 
        abaAtiva={abaAtiva} 
        setAbaAtiva={setAbaAtiva} 
        onAbrirRegras={() => setModalRegrasAberto(true)}
        isAdmin={isAutenticado}
        onLogout={handleLogout}
        temaFundo={temaFundo}
        setTemaFundo={setTemaFundo}
      />

      {/* Conteúdo Principal */}
      <main style={{ flex: 1, padding: '24px 16px' }}>
        {abaAtiva === 'agendar' ? (
          <AgendamentoForm onAgendamentoSucesso={handleAgendamentoSucesso} />
        ) : isAutenticado ? (
          <PainelGestao 
            onVisualizarComprovante={handleVisualizarComprovante} 
            usuario={usuarioAuth}
            isAdmin={isAdmin}
            pedreiraOperador={pedreiraOperador}
          />
        ) : (
          <AdminLogin 
            onLoginSucesso={handleLoginSucesso}
            onVoltar={() => setAbaAtiva('agendar')}
          />
        )}
      </main>

      {/* Modal de Comprovante Oficial */}
      {agendamentoConcluido && (
        <ComprovanteModal
          agendamento={agendamentoConcluido}
          onFechar={handleFecharComprovante}
          onNovoAgendamento={handleNovoAgendamento}
        />
      )}

      {/* Modal de Regras Operacionais */}
      <RegrasModal
        aberto={modalRegrasAberto}
        onFechar={() => setModalRegrasAberto(false)}
      />

      {/* Rodapé Institucional Vermont Mineração */}
      <footer className="no-print" style={{
        background: 'linear-gradient(180deg, rgba(8, 12, 16, 0.95) 0%, rgba(5, 8, 10, 0.99) 100%)',
        borderTop: '1px solid rgba(0, 118, 44, 0.25)',
        padding: '32px 20px 28px',
        color: 'var(--slate-400)',
        marginTop: 48,
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: 1080,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14
        }}>
          {/* Título da Empresa com destaque elegante */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <span style={{
              display: 'inline-block',
              width: 28,
              height: 1,
              background: 'linear-gradient(90deg, transparent, #4ade80)'
            }} />
            <strong style={{
              color: '#ffffff',
              fontSize: '0.98rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-heading)',
              textShadow: '0 2px 10px rgba(0, 118, 44, 0.35)'
            }}>
              VERMONT MINERAÇÃO LTDA.
            </strong>
            <span style={{
              display: 'inline-block',
              width: 28,
              height: 1,
              background: 'linear-gradient(90deg, #4ade80, transparent)'
            }} />
          </div>

          {/* Polo Operacional Ceará e Unidades */}
          <div style={{
            fontSize: '0.84rem',
            lineHeight: 1.6,
            color: 'var(--slate-300)',
            maxWidth: 920,
            padding: '10px 20px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 12
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#4ade80', fontWeight: 700, marginRight: 8 }}>
              <MapPin size={14} color="#4ade80" />
              <span>Polo Operacional Ceará:</span>
            </div>
            <span>
              Uruoca (Taj Mahal) <span style={{ color: '#4ade80', margin: '0 5px' }}>•</span>
              Massapê (Negresco) <span style={{ color: '#4ade80', margin: '0 5px' }}>•</span>
              Massapê (Del Mare) <span style={{ color: '#4ade80', margin: '0 5px' }}>•</span>
              Sobral (Jaibaras) <span style={{ color: '#4ade80', margin: '0 5px' }}>•</span>
              São Gonçalo do Amarante (Serrote) <span style={{ color: '#4ade80', margin: '0 5px' }}>•</span>
              Beberibe
            </span>
          </div>

          {/* Metadados e links institucionais */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 16,
            fontSize: '0.78rem',
            color: 'var(--slate-400)',
            marginTop: 4
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} color="#34d399" />
              Portal Oficial de Agendamentos & Logística
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Mail size={14} color="#4ade80" />
              Notificações: <strong style={{ color: '#86efac' }}>E-mail da logística</strong>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
