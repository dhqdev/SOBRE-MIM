import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Renderizado no lugar dos filhos quando algo quebra. Omitir = não renderiza nada. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Impede que a falha de um componente derrube a página toda.
 *
 * Motivo concreto: o fundo WebGL lançava exceção em ambientes sem GPU e o
 * portfólio inteiro virava uma tela preta.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Componente quebrou e foi isolado:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}

export default ErrorBoundary;
