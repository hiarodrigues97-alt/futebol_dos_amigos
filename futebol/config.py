import os

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:  # python-dotenv é opcional
    pass


def _bool(nome, padrao):
    return os.getenv(nome, "1" if padrao else "0").strip().lower() in {"1", "true", "sim", "yes"}


class Config:
    DATABASE_URL = os.getenv("DATABASE_URL")
    # Relativo a futebol/static. Se o arquivo não existir, a rota de imagem avisa.
    IMAGEM_FUNDO = os.getenv("IMAGEM_FUNDO", "img/fundo-top10.png")
    FUSO_HORARIO = os.getenv("FUSO_HORARIO", "America/Sao_Paulo")

    # --- Proteção por senha ---
    # Sem ADMIN_PASSWORD a proteção fica DESLIGADA (qualquer um edita). Defina em produção.
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD") or None
    # Assina o cookie de login. Obrigatória quando ADMIN_PASSWORD existe e igual em todos os workers.
    SECRET_KEY = os.getenv("SECRET_KEY") or None
    SESSAO_DIAS = int(os.getenv("SESSAO_DIAS", "30"))
    # Cookie só trafega por HTTPS. Em desenvolvimento local (http) use COOKIE_SEGURO=0.
    COOKIE_SEGURO = _bool("COOKIE_SEGURO", True)
    # Ligue (=1) atrás de proxy/PaaS (Render, Railway, Heroku) para o limite de tentativas usar o IP real.
    TRUST_PROXY = _bool("TRUST_PROXY", False)
    LOGIN_MAX_TENTATIVAS = int(os.getenv("LOGIN_MAX_TENTATIVAS", "5"))
    LOGIN_BLOQUEIO_SEGUNDOS = int(os.getenv("LOGIN_BLOQUEIO_SEGUNDOS", "300"))
