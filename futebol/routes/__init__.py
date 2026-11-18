from . import auth, imagens, jogadores, paginas, rankings, times


def registrar_rotas(app):
    for modulo in (paginas, auth, jogadores, rankings, imagens, times):
        app.register_blueprint(modulo.bp)
