import '../styles/globals.css';
import { ThemeProvider } from 'next-themes';
import React, { useState } from 'react';
import BackendExplanation from '../components/BackendExplanation';

export default function App({ Component, pageProps }) {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <Component {...pageProps} />
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '16px',
            color: '#2c3e50',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            zIndex: 1000,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'translateZ(0)',
            letterSpacing: '0.5px',
            minWidth: '160px',
            textAlign: 'center',
            userSelect: 'none',
            ':hover': {
              transform: 'translateY(-2px) scale(1.02)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
              background: 'rgba(255, 255, 255, 0.25)',
              borderColor: 'rgba(255, 255, 255, 0.4)',
            },
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px) scale(1.02)';
            e.target.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
            e.target.style.background = 'rgba(255, 255, 255, 0.25)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateZ(0)';
            e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)';
            e.target.style.background = 'rgba(255, 255, 255, 0.15)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseDown={(e) => {
            e.target.style.transform = 'translateY(0) scale(0.98)';
          }}
          onMouseUp={(e) => {
            e.target.style.transform = 'translateY(-2px) scale(1.02)';
          }}
        >
          <span style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '8px'
          }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)',
              animation: showExplanation ? 'none' : 'pulse 2s infinite'
            }}></span>
            Powered by Shov.com
          </span>
        </button>
        {showExplanation && (
          <BackendExplanation onClose={() => setShowExplanation(false)} />
        )}
      </div>
    </ThemeProvider>
  );
}