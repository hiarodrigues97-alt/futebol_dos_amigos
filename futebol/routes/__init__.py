from . import imagens, jogadores, paginas, rankings


def registrar_rotas(app):
    for modulo in (paginas, jogadores, rankings, imagens):
        app.register_blueprint(modulo.bp)
