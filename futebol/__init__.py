from flask import Flask, jsonify

from .config import Config
from .errors import ErroConfiguracao, ErroValidacao, NaoEncontrado
from .routes import registrar_rotas


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    registrar_rotas(app)
    registrar_erros(app)
    return app


def registrar_erros(app):
    @app.errorhandler(ErroValidacao)
    def erro_validacao(erro):
        return jsonify(erro=str(erro)), 400

    @app.errorhandler(NaoEncontrado)
    def erro_nao_encontrado(erro):
        return jsonify(erro=str(erro)), 404

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
