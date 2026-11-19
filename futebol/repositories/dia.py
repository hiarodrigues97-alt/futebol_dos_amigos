"""Fechamento do dia: o time com mais vitórias do dia dá +1 em `vitorias` aos seus jogadores."""
from ..db import cursor_banco
from ..errors import ErroValidacao, NaoEncontrado

_DDL = """
CREATE TABLE IF NOT EXISTS fechamentos_dia (
    data_dia  date PRIMARY KEY,
    nome_time text NOT NULL,
    jogadores integer[] NOT NULL,
    criado_em timestamptz NOT NULL DEFAULT now()
)
"""
_tabela_criada = False


def _garantir_tabela():
    # Transação própria: se a criação fosse desfeita junto com outra operação, o flag mentiria.
    global _tabela_criada
    if _tabela_criada:
        return
    with cursor_banco() as cur:
        cur.execute(_DDL)
    _tabela_criada = True


def status_hoje():
    """Dict {nome_time, jogadores:[nomes]} se o dia já foi fechado; senão None."""
    _garantir_tabela()
    with cursor_banco(dict_cursor=True) as cur:
        cur.execute(
            """
            SELECT f.nome_time,
                   ARRAY(SELECT j.nome FROM jogadores j
                         WHERE j.id = ANY(f.jogadores) ORDER BY j.nome) AS jogadores
            FROM fechamentos_dia f
            WHERE f.data_dia = CURRENT_DATE
            """
        )
        return cur.fetchone()


def fechar(nome_time, ids):
    """Soma +1 vitória aos `ids`, tudo numa transação. Devolve quantos jogadores receberam."""
    _garantir_tabela()
    with cursor_banco(dict_cursor=True) as cur:
        # 1) o time precisa estar entre os líderes do dia (o servidor não confia só na tela)
        cur.execute(
            """
            SELECT nome_time, COUNT(*) AS vitorias
            FROM partidas
            WHERE DATE(data_partida) = CURRENT_DATE
            GROUP BY nome_time
            """
        )
        placar = cur.fetchall()
        if not placar:
            raise ErroValidacao("Nenhuma vitória de time foi registrada hoje.")
        maximo = max(linha["vitorias"] for linha in placar)
        lideres = {linha["nome_time"] for linha in placar if linha["vitorias"] == maximo}
        if nome_time not in lideres:
            raise ErroValidacao(f"{nome_time} não é o time com mais vitórias hoje.")

        # 2) uma vez por dia: a chave primária barra o segundo fechamento (mesmo em cliques simultâneos)
        cur.execute(
            """
            INSERT INTO fechamentos_dia (data_dia, nome_time, jogadores)
            VALUES (CURRENT_DATE, %s, %s)
            ON CONFLICT (data_dia) DO NOTHING
            RETURNING data_dia
            """,
            (nome_time, ids),
        )
        if cur.fetchone() is None:
            raise ErroValidacao("O dia de hoje já foi fechado. Desfaça o fechamento para refazer.")

        # 3) +1 vitória; se algum id não existir, nada é gravado (a transação é desfeita)
        cur.execute(
            "UPDATE jogadores SET vitorias = COALESCE(vitorias, 0) + 1 WHERE id = ANY(%s)",
            (ids,),
        )
        if cur.rowcount != len(ids):
            raise ErroValidacao("Algum jogador informado não existe mais.")
        return cur.rowcount


def desfazer():
    """Remove o fechamento de hoje e tira o +1 de quem recebeu. Devolve quantos jogadores."""
    _garantir_tabela()
    with cursor_banco(dict_cursor=True) as cur:
        cur.execute("DELETE FROM fechamentos_dia WHERE data_dia = CURRENT_DATE RETURNING jogadores")
        linha = cur.fetchone()
        if linha is None:
            raise NaoEncontrado("O dia de hoje não está fechado.")
        cur.execute(
            "UPDATE jogadores SET vitorias = GREATEST(COALESCE(vitorias, 0) - 1, 0) WHERE id = ANY(%s)",
            (linha["jogadores"],),
        )
        return cur.rowcount
