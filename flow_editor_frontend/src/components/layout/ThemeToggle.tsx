import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "button" | "switch";
}

export const ThemeToggle = ({ className, size = "md", variant = "button" }: ThemeToggleProps) => {
  const { isDark, toggle } = useTheme();
  
  // Debug log
  console.log('🎨 [ThemeToggle] Renderizando:', { variant, isDark, size });

  if (variant === "switch") {
    // Interruptor (switch) para a sidebar
    return (
      <button
        onClick={toggle}
        className={cn(
          "relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300",
          "focus:outline-none focus:ring-2 focus:ring-[rgba(165,148,255,0.5)] focus:ring-offset-2 focus:ring-offset-[rgba(20,15,45,0.98)]",
          "shadow-lg hover:shadow-xl cursor-pointer",
          isDark 
            ? "bg-gradient-to-r from-[#A594FF] to-[#667eea] shadow-[0_0_12px_rgba(165,148,255,0.5)]" 
            : "bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.3)]",
          className
        )}
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
        style={{ 
          minWidth: '56px', 
          zIndex: 10002, 
          position: 'relative', 
          pointerEvents: 'auto',
          visibility: 'visible',
          opacity: 1,
          display: 'inline-flex'
        }}
      >
        <span
          className={cn(
            "inline-block h-6 w-6 transform rounded-full bg-white transition-all duration-300",
            "shadow-md flex items-center justify-center",
            isDark ? "translate-x-7" : "translate-x-1"
          )}
        >
          {isDark ? (
            <Moon className="w-4 h-4 text-[#A594FF]" />
          ) : (
            <Sun className="w-4 h-4 text-yellow-500" />
          )}
        </span>
      </button>
    );
  }

  // Botão padrão (para o chat)
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-14 h-14",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };
  
  return (
    <button
      onClick={toggle}
      className={cn(
        sizeClasses[size],
        "rounded-xl flex items-center justify-center",
        "bg-slate-100 dark:bg-slate-800",
        "hover:bg-slate-200 dark:hover:bg-slate-700",
        "transition-colors duration-300",
        className
      )}
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
    >
      {isDark ? (
        <Sun className={cn(iconSizes[size], "text-yellow-500")} />
      ) : (
        <Moon className={cn(iconSizes[size], "text-slate-600 dark:text-slate-300")} />
      )}
    </button>
  );
};
