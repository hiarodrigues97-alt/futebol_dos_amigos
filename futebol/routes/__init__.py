from . import imagens, jogadores, paginas, rankings, times


def registrar_rotas(app):
    for modulo in (paginas, jogadores, rankings, imagens, times):
        app.register_blueprint(modulo.bp)
