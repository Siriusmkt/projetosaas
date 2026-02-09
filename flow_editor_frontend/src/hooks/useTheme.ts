import { useEffect, useState } from "react";

export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Carregar tema do localStorage - Padrão: light (branco)
    const stored = localStorage.getItem("saas-theme");
    // Padrão é light (branco) se não houver preferência salva
    const shouldBeDark = stored === "dark";
    
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
    
    // Escutar mudanças na preferência do sistema
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("saas-theme")) {
        setIsDark(e.matches);
        document.documentElement.classList.toggle("dark", e.matches);
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggle = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    document.documentElement.classList.toggle("dark", newValue);
    localStorage.setItem("saas-theme", newValue ? "dark" : "light");
    
    // Disparar evento customizado para outras partes do sistema
    window.dispatchEvent(new CustomEvent("theme-change", { detail: { isDark: newValue } }));
  };

  return { isDark, toggle };
}
