import os
from pathlib import Path
from dotenv import load_dotenv

# Carregar .env: cwd (onde o servidor foi iniciado), saas_server e raiz do projeto
_this_dir = Path(__file__).resolve().parent
_saas_server_dir = _this_dir.parent  # saas_server
_project_root = _saas_server_dir.parent  # saasatt-main
load_dotenv()  # cwd
load_dotenv(_saas_server_dir / ".env")
load_dotenv(_project_root / ".env")


class Settings:
    # Supabase (SUPABASE_SERVICE_KEY é alias comum para a service role key)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://gwjcgzeybqiyqezuswpt.supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "") or os.getenv("SUPABASE_SERVICE_KEY", "")
    # Chave anon (para o frontend; se não existir, o front pode usar a mesma key para leitura em dev)
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "") or os.getenv("SUPABASE_PUBLISHABLE_KEY", "")

    # Storage
    BUCKET_NAME: str = os.getenv("BUCKET_NAME", "arquivos_tools")

    # File Upload
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB

    # Tipos de arquivo aceitos por categoria
    ALLOWED_AUDIO_TYPES = [".mp3", ".ogg", ".wav", ".m4a", ".aac"]
    ALLOWED_VIDEO_TYPES = [".mp4", ".mov", ".avi", ".mkv", ".webm"]
    ALLOWED_IMAGE_TYPES = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]
    ALLOWED_DOCUMENT_TYPES = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt"]

    @property
    def all_allowed_types(self):
        return (
            self.ALLOWED_AUDIO_TYPES
            + self.ALLOWED_VIDEO_TYPES
            + self.ALLOWED_IMAGE_TYPES
            + self.ALLOWED_DOCUMENT_TYPES
        )


settings = Settings()

