"""Login de administrador por senha única (cookie de sessão assinado)."""
import hmac
import threading
import time
from functools import wraps

from flask import current_app, session

from .errors import ErroMuitasTentativas, ErroNaoAutorizado

_falhas = {}  # ip -> {"conta": int, "bloqueado_ate": float}
_trava = threading.Lock()


def protecao_ativa():
    return bool(current_app.config.get("ADMIN_PASSWORD"))


def eh_admin():
    # Sem senha configurada não há como proteger: todos são tratados como admin.
    return (not protecao_ativa()) or session.get("admin") is True


def admin_obrigatorio(funcao):
    @wraps(funcao)
    def interno(*args, **kwargs):
        if not eh_admin():
            raise ErroNaoAutorizado("Faça login como administrador.")
        return funcao(*args, **kwargs)

    return interno


def senha_correta(senha):
    esperada = current_app.config["ADMIN_PASSWORD"]
    return hmac.compare_digest(senha.encode("utf-8"), esperada.encode("utf-8"))


def checar_bloqueio(ip):
    agora = time.monotonic()
    with _trava:
        for chave in [k for k, v in _falhas.items() if v["bloqueado_ate"] <= agora and v["conta"] == 0]:
            del _falhas[chave]
        restante = _falhas.get(ip, {}).get("bloqueado_ate", 0) - agora
    if restante > 0:
        minutos = max(int(restante // 60) + 1, 1)
        raise ErroMuitasTentativas(f"Muitas tentativas. Tente novamente em {minutos} min.")


def registrar_falha(ip):
    cfg = current_app.config
    with _trava:
        item = _falhas.setdefault(ip, {"conta": 0, "bloqueado_ate": 0.0})
        item["conta"] += 1
        if item["conta"] >= cfg["LOGIN_MAX_TENTATIVAS"]:
            item["bloqueado_ate"] = time.monotonic() + cfg["LOGIN_BLOQUEIO_SEGUNDOS"]
            item["conta"] = 0


def limpar_falhas(ip):
    with _trava:
        _falhas.pop(ip, None)


def resetar_limitador():  # usado nos testes
    with _trava:
        _falhas.clear()
