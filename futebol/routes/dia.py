from flask import Blueprint, jsonify, request

from ..auth import admin_obrigatorio
from ..repositories import dia as repo
from ..validators import validar_fechamento

bp = Blueprint("dia", __name__, url_prefix="/dia")


@bp.get("/status")
def status():
    fechamento = repo.status_hoje()
    if fechamento is None:
        return jsonify(fechado=False)
    return jsonify(fechado=True, nome_time=fechamento["nome_time"], jogadores=fechamento["jogadores"])


@bp.post("/fechar")
@admin_obrigatorio
def fechar():
    nome_time, ids = validar_fechamento(request.get_json(silent=True))
    return jsonify(ok=True, atualizados=repo.fechar(nome_time, ids)), 201


@bp.post("/desfazer")
@admin_obrigatorio
def desfazer():
    return jsonify(ok=True, atualizados=repo.desfazer())
