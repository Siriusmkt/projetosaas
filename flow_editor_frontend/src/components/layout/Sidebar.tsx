import { memo, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Phone,
  Megaphone,
  Link,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bot,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  submenu?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    id: 'assistentes',
    label: 'Assistentes',
    icon: Bot,
    submenu: [
      { label: 'Meus Assistentes', href: '/agentes' },
      { label: 'Importar Prompt', href: '/importar-prompt' },
      { label: 'Configurações Globais', href: '/config-globais' },
    ],
  },
  {
    id: 'conversas',
    label: 'Conversas',
    icon: MessageSquare,
    href: '/conversas',
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: Users,
    href: '/leads',
  },
  {
    id: 'campanhas',
    label: 'Campanhas',
    icon: Megaphone,
    href: '/campanhas',
  },
  {
    id: 'numeros',
    label: 'Números',
    icon: Phone,
    href: '/numeros',
  },
  {
    id: 'conexoes',
    label: 'Conexões',
    icon: Link,
    href: '/conexoes',
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: Settings,
    href: '/configuracoes',
  },
  {
    id: 'ajuda',
    label: 'Ajuda',
    icon: HelpCircle,
    href: '/ajuda',
  },
];

export const Sidebar = memo(function Sidebar() {
  console.log('🔵 [Sidebar] Renderizando sidebar com ThemeToggle');
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>('assistentes');

  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  const toggleDropdown = useCallback((id: string) => {
    setOpenDropdown(prev => prev === id ? null : id);
  }, []);

  const isActive = useCallback((href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  }, [location.pathname]);

  const isSubmenuActive = useCallback((submenu: { label: string; href: string }[]) => {
    return submenu.some(item => isActive(item.href));
  }, [isActive]);

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "h-screen flex flex-col flex-shrink-0",
          "bg-[rgba(20,15,45,0.98)] border-r border-[rgba(144,122,255,0.25)]",
          "transition-[width] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
          "shadow-[2px_0_20px_rgba(0,0,0,0.3)]",
          collapsed ? "w-[70px]" : "w-[280px]"
        )}
        style={{
          willChange: 'width',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 10000,
          height: '100vh',
        }}
      >
        {/* Toggle Button */}
        <button
          onClick={toggleCollapse}
          className={cn(
            "absolute top-[60px] w-[18px] h-[24px]",
            "bg-[rgba(120,100,200,0.8)] border border-[rgba(100,80,180,0.9)]",
            "border-l-0 rounded-r-[6px]",
            "text-[rgba(255,255,255,0.95)] cursor-pointer",
            "flex items-center justify-center",
            "transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
            "z-[1002] backdrop-blur-[10px]",
            "shadow-[2px_0_8px_rgba(0,0,0,0.3)]",
            "hover:bg-[rgba(130,110,210,0.9)] hover:border-[rgba(110,90,190,1)]",
            "hover:text-white hover:w-[20px] hover:shadow-[3px_0_12px_rgba(120,100,200,0.5)]",
            "active:w-[16px]"
          )}
          style={{ left: collapsed ? '70px' : '280px' }}
        >
          {collapsed ? (
            <ChevronRight className="w-[10px] h-[10px]" />
          ) : (
            <ChevronLeft className="w-[10px] h-[10px]" />
          )}
        </button>

        {/* Logo Section */}
        <div className={cn(
          "py-8 mb-12",
          collapsed ? "px-0 flex justify-center" : "px-8 text-center"
        )}>
          <div className={cn(
            "flex items-center justify-center rounded-xl",
            collapsed ? "w-[40px] h-[40px]" : "w-[180px] h-[60px] mx-auto mb-2"
          )}>
            <img 
              src="https://imagens-zipline.hgabnb.easypanel.host/u/2FsJTY.png" 
              alt="Salesdever Logo"
              className={cn(
                "object-contain",
                collapsed ? "w-8 h-8" : "w-full h-full"
              )}
            />
          </div>
          {!collapsed && (
            <p className="text-base text-[rgba(255,255,255,0.6)] font-medium tracking-[0.5px]">
              Painel de Controle
            </p>
          )}
        </div>

        {/* Nav Menu */}
        <nav className={cn(
          "overflow-y-auto overflow-x-hidden",
          collapsed ? "px-0 flex flex-col items-center" : "px-4"
        )}>
          {navItems.map((item) => (
            <div key={item.id} className={cn("mb-2", collapsed && "w-full flex justify-center")}>
              {item.submenu ? (
                // Dropdown Item
                <>
                  <button
                    onClick={() => toggleDropdown(item.id)}
                    className={cn(
                      "flex items-center w-full rounded-2xl font-medium relative overflow-hidden",
                      "transition-all duration-300 ease-out",
                      "text-[rgba(255,255,255,0.8)]",
                      isSubmenuActive(item.submenu) && "bg-[rgba(165,148,255,0.15)] text-white",
                      collapsed 
                        ? "justify-center p-3.5 w-[50px] h-[50px]" 
                        : "justify-between py-4 px-6",
                      "hover:bg-[rgba(165,148,255,0.1)] hover:text-white"
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon className={cn(
                        "flex-shrink-0 transition-all duration-300",
                        collapsed ? "w-[22px] h-[22px] mr-0" : "w-5 h-5 mr-3"
                      )} />
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                    {!collapsed && (
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform duration-300",
                        openDropdown === item.id && "rotate-180"
                      )} />
                    )}
                  </button>
                  
                  {/* Submenu */}
                  {!collapsed && openDropdown === item.id && (
                    <div className="mt-1 ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                      {item.submenu.map((subItem) => (
                        <button
                          key={subItem.href}
                          onClick={() => navigate(subItem.href)}
                          className={cn(
                            "w-full flex items-center py-3 px-4 rounded-xl text-sm",
                            "transition-all duration-200",
                            isActive(subItem.href)
                              ? "bg-[rgba(165,148,255,0.2)] text-white font-semibold"
                              : "text-[rgba(255,255,255,0.6)] hover:bg-[rgba(165,148,255,0.1)] hover:text-white"
                          )}
                        >
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // Regular Item
                <button
                  onClick={() => item.href && navigate(item.href)}
                  className={cn(
                    "flex items-center w-full rounded-2xl font-medium relative overflow-hidden",
                    "transition-all duration-300 ease-out",
                    isActive(item.href || '')
                      ? "bg-gradient-to-r from-[rgba(165,148,255,0.25)] to-[rgba(102,126,234,0.15)] text-white shadow-[inset_0_0_0_1px_rgba(165,148,255,0.3)]"
                      : "text-[rgba(255,255,255,0.8)] hover:bg-[rgba(165,148,255,0.1)] hover:text-white",
                    collapsed 
                      ? "justify-center p-3.5 w-[50px] h-[50px]" 
                      : "py-4 px-6"
                  )}
                >
                  <item.icon className={cn(
                    "flex-shrink-0 transition-all duration-300",
                    collapsed ? "w-[22px] h-[22px] mr-0" : "w-5 h-5 mr-3"
                  )} />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              )}
            </div>
          ))}
        </nav>

        {/* Spacer para empurrar conteúdo para baixo */}
        <div className="flex-1" />

        {/* Theme Toggle - Logo acima do perfil */}
        <div 
          className={cn(
            "border-t border-[rgba(165,148,255,0.15)]",
            collapsed ? "p-4 flex justify-center items-center" : "p-4 mx-4 mb-3"
          )}
          style={{ 
            minHeight: '80px', 
            display: 'flex', 
            alignItems: 'center', 
            zIndex: 10001, 
            position: 'relative',
            backgroundColor: 'rgba(20,15,45,0.98)',
            width: '100%',
            visibility: 'visible',
            opacity: 1
          }}
        >
          {collapsed ? (
            <div style={{ zIndex: 10002, position: 'relative', visibility: 'visible', opacity: 1 }}>
              <ThemeToggle variant="switch" size="md" />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 w-full" style={{ zIndex: 10002, position: 'relative', visibility: 'visible', opacity: 1 }}>
              <span className="text-sm text-[rgba(255,255,255,0.9)] font-semibold">Tema</span>
              <ThemeToggle variant="switch" size="md" />
            </div>
          )}
        </div>

        {/* User Section */}
        <div className={cn(
          "border-t border-[rgba(165,148,255,0.15)]",
          collapsed ? "p-3 flex justify-center" : "p-4 mx-4 mb-4"
        )}
        style={{ zIndex: 999, position: 'relative' }}
        >
          <div className={cn(
            "flex items-center gap-3 rounded-xl transition-all duration-300",
            !collapsed && "p-3 bg-[rgba(165,148,255,0.08)] border border-[rgba(165,148,255,0.15)] hover:border-[rgba(165,148,255,0.3)] hover:bg-[rgba(165,148,255,0.12)] cursor-pointer"
          )}>
            <div className={cn(
              "rounded-xl bg-gradient-to-br from-[#A594FF] to-[#667eea] flex items-center justify-center font-bold text-white",
              "shadow-[0_3px_12px_rgba(165,148,255,0.4)]",
              collapsed ? "w-[42px] h-[42px] text-lg" : "w-10 h-10 text-sm"
            )}>
              U
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">Usuário</p>
                <p className="text-xs text-[rgba(255,255,255,0.5)] truncate">usuario@email.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
});
