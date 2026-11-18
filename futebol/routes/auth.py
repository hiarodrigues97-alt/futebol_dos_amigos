from flask import Blueprint, current_app, jsonify, request, session

from .. import auth
from ..errors import ErroNaoAutorizado, ErroValidacao

bp = Blueprint("auth", __name__, url_prefix="/auth")


@bp.get("/status")
def status():
    return jsonify(protegido=auth.protecao_ativa(), admin=auth.eh_admin())


@bp.post("/login")
def login():
    if not auth.protecao_ativa():
        raise ErroValidacao("A proteção por senha não está ativada (defina ADMIN_PASSWORD).")

    senha = str((request.get_json(silent=True) or {}).get("senha", ""))
    ip = request.remote_addr or "desconhecido"
    auth.checar_bloqueio(ip)

    if not senha or not auth.senha_correta(senha):
        auth.registrar_falha(ip)
        current_app.logger.warning("Tentativa de login de admin com senha incorreta (ip=%s)", ip)
        raise ErroNaoAutorizado("Senha incorreta.")

    auth.limpar_falhas(ip)
    session.clear()  # evita reaproveitar uma sessão antiga
    session["admin"] = True
    session.permanent = True
    return jsonify(ok=True, admin=True)


@bp.post("/logout")
def logout():
    session.clear()
    return jsonify(ok=True)
