import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import FlowEditorPage from "./pages/FlowEditor";
import FlowToolsPage from "./pages/FlowToolsPage";
import AgentesPage from "./pages/Agentes";
import AgenteConfigPage from "./pages/AgenteConfig";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/flow">
          <Routes>
            {/* Raiz /flow/ → editor (canvas + chat), não só chat */}
            <Route path="/" element={<FlowEditorPage />} />
            <Route path="/tools" element={<FlowToolsPage />} />
            <Route path="/agentes" element={<AgentesPage />} />
            <Route path="/agente/:agenteId/configurar" element={<AgenteConfigPage />} />
            {/* Flow Editor Visual com Chat IA integrado */}
            <Route path="/flow-editor" element={<FlowEditorPage />} />
            <Route path="/flow-editor/:agenteId" element={<FlowEditorPage />} />
            <Route path="*" element={<Navigate to="/agentes" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
