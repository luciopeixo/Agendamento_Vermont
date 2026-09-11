import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          maxWidth: 600,
          margin: '40px auto',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div className="glass-panel" style={{
            padding: '36px 28px',
            borderRadius: 16,
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'linear-gradient(145deg, rgba(30, 18, 18, 0.95) 0%, rgba(18, 12, 12, 0.98) 100%)'
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171',
              marginBottom: 16
            }}>
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ color: '#fff', fontSize: '1.25rem', marginBottom: 8 }}>
              Ops! Ocorreu um problema ao carregar o painel
            </h3>
            <p style={{ color: 'var(--slate-400)', fontSize: '0.88rem', marginBottom: 20 }}>
              Os dados estão preservados com segurança. Clique abaixo para tentar novamente ou retornar ao início.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReset}
                className="btn btn-vermont"
                style={{ padding: '10px 20px', gap: 8 }}
              >
                <RefreshCw size={16} /> Tentar Novamente
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="btn btn-secondary"
                style={{ padding: '10px 20px', gap: 8 }}
              >
                <Home size={16} /> Recarregar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
