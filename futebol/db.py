from contextlib import contextmanager

import psycopg2
import psycopg2.extras
from flask import current_app

from .errors import ErroConfiguracao


def conectar():
    url = current_app.config.get("DATABASE_URL")
    if not url:
        raise ErroConfiguracao("DATABASE_URL não configurada.")
    conn = psycopg2.connect(url)
    # Servidores costumam rodar em UTC: sem isto, o "ranking do dia" zeraria às 21h no Brasil.
    with conn.cursor() as cur:
        cur.execute("SET TIME ZONE %s", (current_app.config.get("FUSO_HORARIO", "America/Sao_Paulo"),))
    return conn


@contextmanager
def cursor_banco(dict_cursor=False):
    conn = conectar()
    factory = psycopg2.extras.RealDictCursor if dict_cursor else None
    cur = conn.cursor(cursor_factory=factory)
    try:
        yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()
