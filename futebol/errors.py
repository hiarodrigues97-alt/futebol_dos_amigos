class ErroValidacao(ValueError):
    """Dados enviados pelo usuário são inválidos (HTTP 400)."""


class NaoEncontrado(LookupError):
    """Registro inexistente (HTTP 404)."""


class ErroConfiguracao(RuntimeError):
    """Configuração obrigatória ausente (HTTP 500)."""


class ErroNaoAutorizado(Exception):
    """Ação exige login de administrador (HTTP 401)."""


class ErroMuitasTentativas(Exception):
    """Muitas tentativas de login erradas (HTTP 429)."""
