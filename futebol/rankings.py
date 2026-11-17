"""Definição dos rankings. Para criar um novo, basta adicionar uma entrada aqui."""

LIMITE_RANKING = 10

RANKINGS = {
    "artilheiros": {
        "coluna": "gols",
        "rotulo_singular": "gol",
        "rotulo_plural": "gols",
        "filtro": "WHERE posicao <> 'G'",
    },
    "vitoriosos": {
        "coluna": "vitorias",
        "rotulo_singular": "vitória",
        "rotulo_plural": "vitórias",
        "filtro": "WHERE posicao <> 'G'",
    },
}
