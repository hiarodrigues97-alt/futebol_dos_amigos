import os

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:  # python-dotenv é opcional
    pass


class Config:
    DATABASE_URL = os.getenv("DATABASE_URL")
    # Relativo a futebol/static. Se o arquivo não existir, a imagem usa um fundo gerado.
    IMAGEM_FUNDO = os.getenv("IMAGEM_FUNDO", "img/fundo-top10.png")
    FUSO_HORARIO = os.getenv("FUSO_HORARIO", "America/Sao_Paulo")
