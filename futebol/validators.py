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
