# 🚀 Como Iniciar o Servidor

## Método 1: Usando o Script (Recomendado)

```bash
cd "/Users/patrickdiasparis/Downloads/salesdever_software_main-main 7/saas_server"
./start_server.sh
```

## Método 2: Manualmente

```bash
# 1. Ir para o diretório do servidor
cd "/Users/patrickdiasparis/Downloads/salesdever_software_main-main 7/saas_server"

# 2. Ativar ambiente virtual
source .venv/bin/activate

# 3. Iniciar servidor (porta padrão 8000)
python main.py
# Ou com uvicorn direto:
# python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
# Para usar outra porta: set PORT=8080 (Windows) ou PORT=8080 python main.py (Linux/Mac)
```

## Verificar se está funcionando

Abra no navegador (porta padrão **8000**):
- **SaaS / raiz:** http://localhost:8000
- **Health check:** http://localhost:8000/health
- **Flow Editor:** http://localhost:8000/flow
- **API:** http://localhost:8000/api/flows

## Se houver erros

1. **Erro de importação:** Verifique se todas as dependências estão instaladas:
   ```bash
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Porta já em uso:** Pare o processo que está usando a porta 8000 (ou a que você definiu em PORT):
   ```bash
   # Windows (PowerShell):
   Get-NetTCPConnection -LocalPort 8000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
   # Linux/Mac:
   lsof -ti:8000 | xargs kill -9
   ```

3. **Erro de módulo não encontrado:** Ative o ambiente virtual antes de executar:
   ```bash
   source .venv/bin/activate
   ```

## URLs Importantes

- **Servidor:** http://localhost:8000
- **Health Check:** http://localhost:8000/health
- **Flow Editor:** http://localhost:8000/flow?assistente_id=XXX&tenant_id=XXX
- **API Flows:** http://localhost:8000/api/flows
