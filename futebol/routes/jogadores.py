from flask import Blueprint, jsonify, request

from ..auth import admin_obrigatorio
from ..repositories import jogadores as repo
from ..validators import validar_estatistica, validar_jogador

bp = Blueprint("jogadores", __name__, url_prefix="/jogadores")


@bp.get("")
def listar():
    return jsonify(repo.listar())


@bp.post("")
@admin_obrigatorio
def adicionar():
    jogador = validar_jogador(request.get_json(silent=True))
    return jsonify(ok=True, id=repo.inserir(jogador)), 201


@bp.put("/<int:jogador_id>")
@admin_obrigatorio
def editar(jogador_id):
    jogador = validar_jogador(request.get_json(silent=True))
    repo.atualizar(jogador_id, jogador)
    return jsonify(ok=True)


@bp.delete("/<int:jogador_id>")
@admin_obrigatorio
def excluir(jogador_id):
    repo.excluir(jogador_id)
    return jsonify(ok=True)


@bp.post("/<int:jogador_id>/estatistica")
@admin_obrigatorio
def alterar_estatistica(jogador_id):
    campo, acao = validar_estatistica(request.get_json(silent=True))
    repo.alterar_estatistica(jogador_id, campo, acao)
    return jsonify(ok=True)
