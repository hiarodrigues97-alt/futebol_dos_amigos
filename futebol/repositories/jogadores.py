"""Todo o acesso ao banco fica aqui. Rotas não escrevem SQL."""
from ..db import cursor_banco
from ..errors import NaoEncontrado
from ..rankings import LIMITE_RANKING, RANKINGS
from ..validators import ACOES_ESTATISTICA, CAMPOS_ESTATISTICA

_NAO_ENCONTRADO = "Jogador não encontrado."


def listar():
    """Todos os jogadores, goleiros incluídos (para o sorteio). A tela separa linha e goleiros."""
    with cursor_banco(dict_cursor=True) as cur:
        cur.execute(
            """
            SELECT id, nome, posicao, nota, COALESCE(gols, 0) AS gols,
                   COALESCE(jogos, 0) AS jogos, COALESCE(vitorias, 0) AS vitorias
            FROM jogadores
            ORDER BY gols DESC, nome ASC
            """
        )
        return cur.fetchall()


def inserir(jogador):
    with cursor_banco() as cur:
        cur.execute(
            """INSERT INTO jogadores (nome, posicao, nota, gols, jogos, vitorias)
               VALUES (%(nome)s, %(posicao)s, %(nota)s, 0, 0, 0) RETURNING id""",
            jogador,
        )
        return cur.fetchone()[0]


def atualizar(jogador_id, jogador):
    with cursor_banco() as cur:
        cur.execute(
            """UPDATE jogadores SET nome = %(nome)s, posicao = %(posicao)s, nota = %(nota)s
               WHERE id = %(id)s""",
            {**jogador, "id": jogador_id},
        )
        if cur.rowcount == 0:
            raise NaoEncontrado(_NAO_ENCONTRADO)


def excluir(jogador_id):
    with cursor_banco() as cur:
        cur.execute("DELETE FROM jogadores WHERE id = %s", (jogador_id,))
        if cur.rowcount == 0:
            raise NaoEncontrado(_NAO_ENCONTRADO)


def alterar_estatistica(jogador_id, campo, acao):
    # campo/acao entram no SQL por f-string: só passam se estiverem nas listas permitidas.
    if campo not in CAMPOS_ESTATISTICA or acao not in ACOES_ESTATISTICA:
        raise ValueError("Campo ou ação inválidos.")
    expressao = (
        f"COALESCE({campo}, 0) + 1"
        if acao == "somar"
        else f"GREATEST(COALESCE({campo}, 0) - 1, 0)"
    )
    with cursor_banco() as cur:
        cur.execute(f"UPDATE jogadores SET {campo} = {expressao} WHERE id = %s", (jogador_id,))
        if cur.rowcount == 0:
            raise NaoEncontrado(_NAO_ENCONTRADO)


def ranking(tipo):
    configuracao = RANKINGS[tipo]
    with cursor_banco(dict_cursor=True) as cur:
        cur.execute(
            f"""
            SELECT nome, posicao, COALESCE(gols, 0) AS gols,
                   COALESCE(jogos, 0) AS jogos,
                   COALESCE(vitorias, 0) AS vitorias
            FROM jogadores
            {configuracao['filtro']}
            ORDER BY {configuracao['coluna']} DESC, nome ASC
            LIMIT {int(LIMITE_RANKING)}
            """
        )
        return cur.fetchall()


def registrar_jogos(ids):
    with cursor_banco() as cur:
        cur.execute(
            "UPDATE jogadores SET jogos = COALESCE(jogos, 0) + 1 WHERE id = ANY(%s)",
            (ids,),
        )
        return cur.rowcount
