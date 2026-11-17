from ..db import cursor_banco


def registrar_vitoria(nome_time):
    with cursor_banco() as cur:
        cur.execute(
            "INSERT INTO partidas (nome_time, data_partida) VALUES (%s, NOW())",
            (nome_time,),
        )


def ranking_do_dia():
    with cursor_banco(dict_cursor=True) as cur:
        cur.execute(
            """
            SELECT nome_time, COUNT(*) AS vitorias
            FROM partidas
            WHERE DATE(data_partida) = CURRENT_DATE
            GROUP BY nome_time
            ORDER BY vitorias DESC, nome_time ASC
            """
        )
        return cur.fetchall()
