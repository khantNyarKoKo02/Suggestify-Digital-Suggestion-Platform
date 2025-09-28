import React from 'react'

type Props = { children: React.ReactNode }
type State = { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // eslint-disable-next-line no-console
    console.error('Application error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
          <h1>Something went wrong.</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error?.message}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

