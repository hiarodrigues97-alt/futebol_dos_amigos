"""Definição dos rankings. Para criar um novo, basta adicionar uma entrada aqui."""

LIMITE_RANKING = 10

RANKINGS = {
    "artilheiros": {
        "coluna": "gols",
        "titulo": "TOP 10 ARTILHEIROS",
        "rotulo": "GOLS",
        "filtro": "WHERE posicao <> 'G'",
    },
    "vitoriosos": {
        "coluna": "vitorias",
        "titulo": "TOP 10 VITORIOSOS",
        "rotulo": "VITÓRIAS",
        "filtro": "WHERE posicao <> 'G'",
    },
}
