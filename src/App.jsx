import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AgendamentoForm } from './components/AgendamentoForm';
import { PainelGestao } from './components/PainelGestao';
import { AdminLogin } from './components/AdminLogin';
import { ComprovanteModal } from './components/ComprovanteModal';
import { RegrasModal } from './components/RegrasModal';
import { ShieldCheck, Mail } from 'lucide-react';
import { EMAIL_NOTIFICACAO_DESTINO } from './services/agendamentoService';
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

  // Estado de autenticação via Supabase Auth (Admin ou Operador de Pedreira)
  const [usuarioAuth, setUsuarioAuth] = useState(null);

  useEffect(() => {
    // Verifica sessão ativa existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuarioAuth(session?.user || null);
    });

    // Escuta alterações de estado de autenticação em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuarioAuth(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isAutenticado = !!usuarioAuth;
  const userMeta = usuarioAuth?.user_metadata || {};
  const userEmail = (usuarioAuth?.email || '').toLowerCase();

  // É Admin Geral se possuir role 'admin' ou e-mail de admin/faturamento
  const isAdmin = isAutenticado && (
    userMeta.role === 'admin' || 
    userEmail.startsWith('admin') || 
    userEmail.includes('faturamento')
  );

  // Pedreira vinculada caso seja operador de campo
  const pedreiraOperador = isAdmin ? null : (
    userMeta.pedreira || (
      userEmail.includes('uruoca') ? 'URUOCA - CE (TAJ MAHAL)' :
      userEmail.includes('negresco') ? 'MASSAPÊ - CE (NEGRESCO)' :
      userEmail.includes('delmare') ? 'MASSAPÊ - CE (DEL MARE)' :
      userEmail.includes('jaibaras') ? 'SOBRAL - CE (JAIBARAS)' :
      userEmail.includes('serrote') ? 'SÃO GONÇALO DO AMARANTE - CE (SERROTE)' :
      userEmail.includes('beberibe') ? 'BEBERIBE - CE' : null
    )
  );

  const handleLoginSucesso = () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuarioAuth(session?.user || null);
    });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Erro ao encerrar sessão:', err);
    }
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
        background: 'rgba(10, 14, 18, 0.98)',
        borderTop: '1px solid rgba(0, 118, 44, 0.3)',
        padding: '24px 16px',
        fontSize: '0.84rem',
        color: 'var(--slate-400)',
        marginTop: 40
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div>
            <strong style={{ color: '#fff', fontSize: '0.92rem' }}>VERMONT MINERAÇÃO LTDA.</strong>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem' }}>
              Polo Operacional Ceará: URUOCA (TAJ MAHAL) • MASSAPÊ (NEGRESCO) • MASSAPÊ (DEL MARE) • SOBRAL (JAIBARAS) • SÃO GONÇALO DO AMARANTE (SERROTE) • BEBERIBE
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--slate-300)' }}>
              <Mail size={15} color="#4ade80" />
              Notificações: <strong style={{ color: '#4ade80' }}>{EMAIL_NOTIFICACAO_DESTINO}</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--slate-400)' }}>
              <ShieldCheck size={15} color="#34d399" />
              Portal Oficial de Agendamentos
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
