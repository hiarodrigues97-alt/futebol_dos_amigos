from pathlib import Path

from flask import Blueprint, current_app, request, send_file

from ..rankings import RANKINGS
from ..repositories import jogadores as repo
from ..services.imagem import gerar_top10_png

bp = Blueprint("imagens", __name__)


def _linhas(tipo):
    config = RANKINGS[tipo]
    linhas = []
    for jogador in repo.ranking(tipo):
        valor = jogador[config["coluna"]]
        rotulo = config["rotulo_singular"] if valor == 1 else config["rotulo_plural"]
        linhas.append((jogador["nome"], valor, rotulo))
    return linhas


@bp.get("/top10-imagem")
def top10_imagem():
    static = Path(current_app.static_folder)
    buffer = gerar_top10_png(
        listas={tipo: _linhas(tipo) for tipo in RANKINGS},
        caminho_fundo=static / current_app.config["IMAGEM_FUNDO"],
        pasta_fontes=static / "fonts",
    )
    return send_file(
        buffer,
        mimetype="image/png",
        download_name="top10-futebol-dos-amigos.png",
        as_attachment=request.args.get("download") == "1",
        max_age=0,
    )
