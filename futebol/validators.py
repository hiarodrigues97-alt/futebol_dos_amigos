from .errors import ErroValidacao

POSICOES_VALIDAS = {"A", "M", "Z", "G"}
CAMPOS_ESTATISTICA = {"gols", "jogos", "vitorias"}
ACOES_ESTATISTICA = {"somar", "subtrair"}


def validar_jogador(dados):
    dados = dados or {}
    nome = str(dados.get("nome", "")).strip()
    posicao = str(dados.get("posicao", "")).strip().upper()
    nota = dados.get("nota")

    if not nome or posicao not in POSICOES_VALIDAS or nota is None:
        raise ErroValidacao("Informe nome, posição e nota válidos.")
    try:
        nota = float(nota)
    except (TypeError, ValueError):
        raise ErroValidacao("A nota deve ser numérica.") from None
    return {"nome": nome.upper(), "posicao": posicao, "nota": nota}


def validar_estatistica(dados):
    dados = dados or {}
    campo, acao = dados.get("campo"), dados.get("acao")
    if campo not in CAMPOS_ESTATISTICA or acao not in ACOES_ESTATISTICA:
        raise ErroValidacao("Campo ou ação inválidos.")
    return campo, acao


TIMES_VALIDOS = {"TIME 1", "TIME 2", "TIME 3"}


def validar_ids_jogadores(dados):
    ids = (dados or {}).get("jogadores")
    if not isinstance(ids, list) or not ids:
        raise ErroValidacao("Informe os jogadores da partida.")
    try:
        return sorted({int(i) for i in ids})
    except (TypeError, ValueError):
        raise ErroValidacao("Lista de jogadores inválida.") from None


def validar_time(dados):
    nome_time = str((dados or {}).get("nome_time", "")).strip().upper()
    if nome_time not in TIMES_VALIDOS:
        raise ErroValidacao("Time inválido.")
    return nome_time


def validar_fechamento(dados):
    nome_time = validar_time(dados)
    ids = validar_ids_jogadores(dados)
    if len(ids) > 30:
        raise ErroValidacao("Jogadores demais para um único time.")
    return nome_time, ids
