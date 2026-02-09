#!/bin/bash
cd "$(dirname "$0")"

# Ativar ambiente virtual se existir
if [ -d ".venv" ]; then
    echo "✅ Ativando ambiente virtual..."
    source .venv/bin/activate
elif [ -d "venv" ]; then
    echo "✅ Ativando ambiente virtual..."
    source venv/bin/activate
fi

# Verificar se uvicorn está instalado
if ! python3 -c "import uvicorn" 2>/dev/null; then
    echo "⚠️ uvicorn não encontrado. Instalando dependências..."
    pip install -q -r requirements.txt 2>/dev/null || pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org -q -r requirements.txt
fi

echo "🚀 Iniciando servidor na porta 8081..."
echo "📍 Acesse: http://localhost:8081"
echo "📍 Flow Editor: http://localhost:8081/flow"
echo "📍 Health check: http://localhost:8081/health"
echo ""
python3 -m uvicorn main:app --host 0.0.0.0 --port 8081 --reload
