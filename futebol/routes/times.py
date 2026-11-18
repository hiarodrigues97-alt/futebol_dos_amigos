from flask import Blueprint, jsonify, request

from ..auth import admin_obrigatorio
from ..repositories import jogadores as jogadores_repo
from ..repositories import partidas as partidas_repo
from ..validators import validar_ids_jogadores, validar_time

bp = Blueprint("times", __name__)


@bp.post("/jogos/registrar")
@admin_obrigatorio
def registrar_jogos():
    ids = validar_ids_jogadores(request.get_json(silent=True))
    return jsonify(ok=True, atualizados=jogadores_repo.registrar_jogos(ids))


@bp.post("/partidas")
@admin_obrigatorio
def salvar_vitoria():
    partidas_repo.registrar_vitoria(validar_time(request.get_json(silent=True)))
    return jsonify(ok=True), 201


@bp.get("/partidas/ranking")
def ranking_times():
    return jsonify(partidas_repo.ranking_do_dia())
