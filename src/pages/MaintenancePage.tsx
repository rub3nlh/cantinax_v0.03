import React from 'react';

export const MaintenancePage: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FDF6F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '32rem',
        textAlign: 'center'
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '3rem' }}>
          <img 
            src="https://spauqltlvfrjmfrghpgk.supabase.co/storage/v1/object/public/site-media//cantinaxl.png" 
            alt="LaCantinaXL Logo" 
            style={{
              height: '5rem',
              width: 'auto',
              objectFit: 'contain',
              margin: '0 auto'
            }}
          />
        </div>

        {/* Maintenance Icon */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            width: '6rem',
            height: '6rem',
            backgroundColor: '#ef4444',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '2rem'
          }}>
            🔧
          </div>
        </div>

        {/* Main Message */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '1.5rem',
            lineHeight: '1.2'
          }}>
            Estamos en mantenimiento
          </h1>
          
          <div style={{ marginBottom: '1rem' }}>
            <p style={{
              fontSize: '1.25rem',
              color: '#374151',
              marginBottom: '1rem'
            }}>
              Estamos trabajando para mejorar el sitio.
            </p>
            <p style={{
              fontSize: '1.25rem',
              color: '#374151'
            }}>
              En breve estaremos de vuelta.
            </p>
          </div>

          {/* Contact Information */}
          <div style={{
            marginTop: '3rem',
            padding: '1.5rem',
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f3f4f6'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>📧</span>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                ¿Tienes alguna duda?
              </h2>
            </div>
            <p style={{
              color: '#374151',
              marginBottom: '1rem'
            }}>
              Escríbenos a:
            </p>
            <a 
              href="mailto:soporte@lacantinaxl.com" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#ef4444',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
            >
              📧 soporte@lacantinaxl.com
            </a>
          </div>

          {/* Additional Info */}
          <div style={{ marginTop: '2rem' }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              Gracias por tu paciencia mientras mejoramos tu experiencia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
