import { useEffect } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Tema escuro por padrão; prioridade localStorage
    const stored = localStorage.getItem("saas-theme");
    const shouldBeDark = stored !== "light";
    if (!stored) localStorage.setItem("saas-theme", "dark");

    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Quando embutido em iframe (menu principal), receber tema do pai
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "theme-change" && typeof e.data.theme === "string") {
        const isDark = e.data.theme === "dark";
        document.documentElement.classList.toggle("dark", isDark);
        localStorage.setItem("saas-theme", isDark ? "dark" : "light");
        window.dispatchEvent(new CustomEvent("theme-change", { detail: { isDark } }));
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return <>{children}</>;
}
