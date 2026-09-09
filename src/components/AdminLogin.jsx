import React, { useState } from 'react';
import { Lock, ShieldCheck, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function AdminLogin({ onLoginSucesso, onVoltar }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Autenticação Segura via Supabase Auth
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      let login = usuario.trim().toLowerCase();
      // Remove qualquer @ se o usuário tiver digitado por hábito
      if (login.includes('@')) {
        login = login.split('@')[0];
      }

      // Mapeamento amigável de nomes das pedreiras e admin para login direto
      const mapaLogins = {
        'admin': 'admin',
        'uruoca': 'uruoca',
        'tajmahal': 'uruoca',
        'negresco': 'massape.negresco',
        'massape': 'massape.negresco',
        'massape.negresco': 'massape.negresco',
        'delmare': 'massape.delmare',
        'massape.delmare': 'massape.delmare',
        'sobral': 'jaibaras',
        'jaibaras': 'jaibaras',
        'serrote': 'serrote',
        'saogoncalo': 'serrote',
        'sao_goncalo': 'serrote',
        'beberibe': 'beberibe'
      };

      const loginFinal = mapaLogins[login] || login;
      const emailAutenticacao = `${loginFinal}@sistema.local`;
      const senhaLimpa = senha.trim();

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: emailAutenticacao,
        password: senhaLimpa
      });

      if (authError) {
        setCarregando(false);
        const msg = authError.message.toLowerCase();
        if (msg.includes('invalid') && (msg.includes('credentials') || msg.includes('grant'))) {
          setErro('Login ou senha incorretos. Verifique suas credenciais de acesso.');
        } else {
          setErro(`Falha na autenticação: ${authError.message}`);
        }
        return;
      }

      if (data?.session) {
        setCarregando(false);
        onLoginSucesso();
      } else {
        setCarregando(false);
        setErro('Sessão não estabelecida. Verifique o status da sua conta no Supabase.');
      }
    } catch (err) {
      setCarregando(false);
      setErro('Erro de comunicação com o servidor de autenticação do Supabase.');
    }
  };

  return (
    <div style={{
      maxWidth: 460,
      margin: '40px auto',
      padding: '0 16px'
    }}>
      <div className="glass-panel animate-fade" style={{
        padding: '36px 32px',
        background: 'linear-gradient(145deg, rgba(20, 28, 24, 0.95) 0%, rgba(13, 18, 16, 0.98) 100%)',
        border: '1px solid var(--vermont-green-border)',
        boxShadow: 'var(--vermont-green-glow)',
        borderRadius: 16,
        textAlign: 'center'
      }}>
        {/* Ícone de Cadeado */}
        <div style={{
          width: 58,
          height: 58,
          borderRadius: 14,
          background: 'var(--vermont-green-subtle)',
          border: '1px solid var(--vermont-green-border)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#4ade80',
          marginBottom: 16
        }}>
          <Lock size={28} />
        </div>

        <h2 style={{ fontSize: '1.4rem', margin: '0 0 6px 0', color: '#fff' }}>
          Acesso Restrito • Admin
        </h2>
        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--slate-400)' }}>
          Painel confidencial de gestão operacional e romaneios das pedreiras da Vermont Mineração
        </p>

        {erro && (
          <div className="animate-fade" style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: '#fca5a5',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: '0.82rem',
            margin: '18px 0 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textAlign: 'left'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
          <div className="form-group">
            <label className="form-label form-label-required">Login</label>
            <input
              type="text"
              className="form-input"
              placeholder="Login"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label form-label-required">Senha de Acesso</label>
            <div style={{ position: 'relative' }}>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                className="form-input"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--slate-400)',
                  cursor: 'pointer',
                  padding: 2
                }}
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="btn btn-vermont"
            style={{ width: '100%', marginTop: 8, padding: '12px 0' }}
          >
            {carregando ? (
              <>
                <span className="spinner" /> Autenticando...
              </>
            ) : (
              <>
                Entrar no Painel Admin <ArrowRight size={18} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onVoltar}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '10px 0', fontSize: '0.85rem' }}
          >
            Voltar ao Formulário de Agendamento
          </button>
        </form>

        <div style={{
          marginTop: 20,
          paddingTop: 14,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.76rem',
          color: 'var(--slate-400)'
        }}>
          Área restrita exclusivamente à equipe interna e logística da Vermont Mineração.
        </div>
      </div>
    </div>
  );
}
