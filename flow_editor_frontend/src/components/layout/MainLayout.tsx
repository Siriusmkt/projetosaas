import { memo, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = memo(function MainLayout({ children }: MainLayoutProps) {
  return (
    <div 
      className="flex min-h-screen overflow-x-hidden"
      style={{
        background: '#040017',
        fontFamily: "'Raleway', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 min-h-screen relative overflow-x-hidden" style={{ marginLeft: '280px', transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)', paddingLeft: '0' }}>
        {/* Animated Background */}
        <div 
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: `
              radial-gradient(circle at 20% 50%, rgba(165, 148, 255, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(102, 126, 234, 0.06) 0%, transparent 50%)
            `,
            animation: 'backgroundFloat 20s ease-in-out infinite',
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* CSS Keyframes */}
        <style>{`
          @keyframes backgroundFloat {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(3%, 3%); }
          }
        `}</style>
      </main>
    </div>
  );
});
