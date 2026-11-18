from datetime import timedelta

from flask import Flask, jsonify
from werkzeug.middleware.proxy_fix import ProxyFix

from .config import Config
from .errors import (
    ErroConfiguracao,
    ErroMuitasTentativas,
    ErroNaoAutorizado,
    ErroValidacao,
    NaoEncontrado,
)
from .routes import registrar_rotas


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    if app.config.get("ADMIN_PASSWORD") and not app.config.get("SECRET_KEY"):
        raise ErroConfiguracao(
            "Defina SECRET_KEY (ex.: python -c \"import secrets; print(secrets.token_hex(32))\") "
            "para usar ADMIN_PASSWORD."
        )

    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=bool(app.config.get("COOKIE_SEGURO")),
        PERMANENT_SESSION_LIFETIME=timedelta(days=app.config.get("SESSAO_DIAS", 30)),
    )
    if app.config.get("TRUST_PROXY"):
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)
    if not app.config.get("ADMIN_PASSWORD"):
        app.logger.warning("ADMIN_PASSWORD não definida: qualquer pessoa pode editar os dados.")

    registrar_rotas(app)
    registrar_erros(app)
    return app


def registrar_erros(app):
    @app.errorhandler(ErroValidacao)
    def erro_validacao(erro):
        return jsonify(erro=str(erro)), 400

    @app.errorhandler(ErroNaoAutorizado)
    def erro_nao_autorizado(erro):
        return jsonify(erro=str(erro)), 401

    @app.errorhandler(NaoEncontrado)
    def erro_nao_encontrado(erro):
        return jsonify(erro=str(erro)), 404

    @app.errorhandler(ErroMuitasTentativas)
    def erro_muitas_tentativas(erro):
        return jsonify(erro=str(erro)), 429

    @app.errorhandler(ErroConfiguracao)
    def erro_configuracao(erro):
        app.logger.error("Erro de configuração: %s", erro)
        return jsonify(erro=str(erro)), 500

    try:
        import psycopg2
    except ImportError:  # pragma: no cover
        return

    @app.errorhandler(psycopg2.Error)
    def erro_banco(erro):
        app.logger.exception("Erro no banco: %s", erro)
        return jsonify(erro="Não foi possível acessar o banco de dados."), 500
