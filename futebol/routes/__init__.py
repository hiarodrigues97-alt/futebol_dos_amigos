from . import auth, dia, imagens, jogadores, paginas, rankings, times


def registrar_rotas(app):
    for modulo in (paginas, auth, jogadores, rankings, imagens, times, dia):
        app.register_blueprint(modulo.bp)
