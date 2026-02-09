import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AgenteRegra, DEFAULT_AGENTE_REGRAS } from '@/types/agente';
import { Shield, Info } from 'lucide-react';

interface RegrasFormProps {
  data: AgenteRegra[];
  onChange: (data: AgenteRegra[]) => void;
}

export function RegrasForm({ data, onChange }: RegrasFormProps) {
  // Inicializar com regras padrão se vazio
  const regras = data.length > 0 ? data : DEFAULT_AGENTE_REGRAS.map((r, i) => ({
    ...r,
    id: `temp_${i}`,
    agente_id: '',
  }));

  const toggleRegra = (regraKey: string) => {
    const updated = regras.map((r) => 
      r.regra_key === regraKey ? { ...r, is_active: !r.is_active } : r
    );
    onChange(updated);
  };

  const activeCount = regras.filter(r => r.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
        <Shield className="w-5 h-5 text-primary" />
        <div>
          <p className="font-medium text-sm">Regras de Segurança</p>
          <p className="text-xs text-muted-foreground">
            Defina o que o agente NÃO deve fazer. Ative pelo menos 3 regras.
          </p>
        </div>
        <div className="ml-auto">
          <span className={`text-sm font-medium ${activeCount >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            {activeCount}/7 ativas
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {regras.map((regra) => (
          <div 
            key={regra.regra_key}
            className={`p-4 rounded-lg border transition-colors ${
              regra.is_active 
                ? 'bg-primary/5 border-primary/30' 
                : 'bg-muted/30 border-border'
            }`}
          >
            <div className="flex items-start gap-3">
              <Switch
                checked={regra.is_active}
                onCheckedChange={() => toggleRegra(regra.regra_key)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label className="text-sm font-medium cursor-pointer" onClick={() => toggleRegra(regra.regra_key)}>
                  {regra.regra_nome}
                </Label>
                {regra.regra_descricao && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {regra.regra_descricao}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
        <Info className="w-4 h-4 text-amber-600 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Essas regras são críticas para garantir que o agente não cometa erros que possam prejudicar 
          a experiência do lead ou a reputação da empresa.
        </p>
      </div>
    </div>
  );
}