from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

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


def _agora_local():
    """Data/hora no fuso do grupo (o servidor costuma rodar em UTC)."""
    fuso = current_app.config.get("FUSO_HORARIO", "America/Sao_Paulo")
    try:
        return datetime.now(ZoneInfo(fuso))
    except (ZoneInfoNotFoundError, ValueError):
        return datetime.now(timezone(timedelta(hours=-3)))


@bp.get("/top10-imagem")
def top10_imagem():
    static = Path(current_app.static_folder)
    agora = _agora_local()
    buffer = gerar_top10_png(
        listas={tipo: _linhas(tipo) for tipo in RANKINGS},
        caminho_fundo=static / current_app.config["IMAGEM_FUNDO"],
        pasta_fontes=static / "fonts",
        data_texto=f"Atualizado em {agora:%d/%m/%Y}",
    )
    return send_file(
        buffer,
        mimetype="image/png",
        download_name=f"top10-{agora:%Y-%m-%d}.png",
        as_attachment=request.args.get("download") == "1",
        max_age=0,
    )
