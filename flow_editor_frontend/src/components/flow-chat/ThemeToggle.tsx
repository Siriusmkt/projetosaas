import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Mesmo tema do resto do SaaS (default light / tema branco)
    const stored = localStorage.getItem("saas-theme");
    const shouldBeDark = stored === "dark";

    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);

    const handleThemeChange = (e: CustomEvent) => {
      setIsDark(e.detail?.isDark ?? false);
    };
    window.addEventListener("theme-change", handleThemeChange as EventListener);
    return () => window.removeEventListener("theme-change", handleThemeChange as EventListener);
  }, []);

  const toggle = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    document.documentElement.classList.toggle("dark", newValue);
    // Usar o mesmo localStorage do sistema global
    localStorage.setItem("saas-theme", newValue ? "dark" : "light");
    // Disparar evento para sincronizar
    window.dispatchEvent(new CustomEvent("theme-change", { detail: { isDark: newValue } }));
  };

  return (
    <button
      onClick={toggle}
      title={isDark ? "Tema claro" : "Tema escuro"}
      className={cn(
        "rounded-xl flex items-center justify-center gap-2 px-3 py-2 min-w-[3rem] h-10",
        "border border-slate-300 dark:border-slate-600",
        "bg-white dark:bg-slate-800 shadow-sm",
        "hover:bg-slate-50 dark:hover:bg-slate-700",
        "transition-colors duration-300"
      )}
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-500" />
      ) : (
        <Moon className="w-5 h-5 text-violet-600" />
      )}
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300 hidden sm:inline">
        {isDark ? "Claro" : "Escuro"}
      </span>
    </button>
  );
};

export default ThemeToggle;
