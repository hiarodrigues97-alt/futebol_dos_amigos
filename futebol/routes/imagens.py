from pathlib import Path

from flask import Blueprint, current_app, jsonify, request, send_file

from ..rankings import LIMITE_RANKING, RANKINGS
from ..repositories import jogadores as repo
from ..services.imagem import gerar_top10_png

bp = Blueprint("imagens", __name__)


@bp.get("/top10-imagem/<string:tipo>")
def top10_imagem(tipo):
    config = RANKINGS.get(tipo)
    if config is None:
        return jsonify(erro="Ranking não encontrado."), 404

    linhas = [(j["nome"], j[config["coluna"]]) for j in repo.ranking(tipo)]
    static = Path(current_app.static_folder)

    buffer = gerar_top10_png(
        titulo=config["titulo"],
        rotulo=config["rotulo"],
        linhas=linhas,
        caminho_fundo=static / current_app.config["IMAGEM_FUNDO"],
        pasta_fontes=static / "fonts",
        limite=LIMITE_RANKING,
    )
    return send_file(
        buffer,
        mimetype="image/png",
        download_name=f"top10-{tipo}.png",
        as_attachment=request.args.get("download") == "1",
        max_age=0,
    )
