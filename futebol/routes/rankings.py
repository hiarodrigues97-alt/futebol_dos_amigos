from flask import Blueprint, jsonify

from ..rankings import RANKINGS
from ..repositories import jogadores as repo

bp = Blueprint("rankings", __name__)


@bp.get("/ranking/<string:tipo>")
def ranking(tipo):
    if tipo not in RANKINGS:
        return jsonify(erro="Ranking não encontrado."), 404
    return jsonify(repo.ranking(tipo))
