"""Geração da imagem de Top 10 (PNG) com Pillow.

Não depende de Flask nem do banco: recebe os dados prontos e devolve o PNG.
O layout é proporcional ao tamanho do fundo, então qualquer imagem serve.
"""
from __future__ import annotations

import io
import logging
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

log = logging.getLogger(__name__)

TAMANHO_PADRAO = (1536, 1024)  # usado quando não há imagem de fundo
SUBTITULO = "FUTEBOL DOS AMIGOS"

COR_PAINEL = (12, 22, 38)
COR_LINHA = (27, 45, 70)
COR_DESTAQUE = (255, 204, 0)
COR_TEXTO = (255, 255, 255)
COR_VALOR = (143, 240, 178)
MEDALHAS = {1: (255, 204, 0), 2: (192, 198, 210), 3: (205, 127, 50)}

# Fontes procuradas nesta ordem (depois das que estiverem em static/fonts).
FONTES_SISTEMA = (
    "DejaVuSans-Bold.ttf",
    "LiberationSans-Bold.ttf",
    "arialbd.ttf",
    "Arial Bold.ttf",
    "Helvetica.ttc",
)


@lru_cache(maxsize=64)
def carregar_fonte(tamanho: int, pasta_fontes: str | None = None):
    """Devolve uma fonte TrueType no tamanho pedido.

    O erro clássico era usar "arial.ttf": no Linux ela não existe e o Pillow caía
    em load_default(), que ignora o tamanho e gera texto minúsculo.
    """
    tamanho = max(int(tamanho), 8)
    candidatas = []
    if pasta_fontes:
        candidatas += [str(p) for p in sorted(Path(pasta_fontes).glob("*.[tToO][tT][fFcC]"))]
    candidatas += FONTES_SISTEMA

    for candidata in candidatas:
        try:
            return ImageFont.truetype(candidata, tamanho)
        except OSError:
            continue

    log.warning("Nenhuma fonte TrueType encontrada; usando a fonte padrão do Pillow.")
    try:
        return ImageFont.load_default(size=tamanho)  # Pillow >= 10.1
    except TypeError:
        return ImageFont.load_default()


def _fundo_gradiente(tamanho):
    largura, altura = tamanho
    imagem = Image.new("RGB", tamanho)
    draw = ImageDraw.Draw(imagem)
    for y in range(altura):
        t = y / max(altura - 1, 1)
        draw.line([(0, y), (largura, y)], fill=(int(11 + 8 * t), int(61 + 50 * t), int(46 + 24 * t)))
    return imagem


def _abrir_fundo(caminho):
    if caminho:
        try:
            return Image.open(caminho).convert("RGB")
        except OSError as erro:  # inclui FileNotFoundError
            log.warning("Fundo '%s' indisponível (%s); usando fundo gerado.", caminho, erro)
    return _fundo_gradiente(TAMANHO_PADRAO)


def _texto(draw, xy, conteudo, fonte, cor, ancora="la"):
    try:
        draw.text(xy, conteudo, fill=cor, font=fonte, anchor=ancora)
    except ValueError:  # fonte bitmap antiga não aceita âncora
        draw.text(xy, conteudo, fill=cor, font=fonte)


def _cabe(draw, conteudo, fonte, largura_max):
    return draw.textlength(conteudo, font=fonte) <= largura_max


def _truncar(draw, conteudo, fonte, largura_max):
    if _cabe(draw, conteudo, fonte, largura_max):
        return conteudo
    while len(conteudo) > 1 and not _cabe(draw, conteudo + "...", fonte, largura_max):
        conteudo = conteudo[:-1]
    return conteudo.rstrip() + "..."


def _fonte_que_cabe(draw, conteudo, tamanho, largura_max, pasta_fontes):
    tamanho = int(tamanho)
    fonte = carregar_fonte(tamanho, pasta_fontes)
    while tamanho > 12 and not _cabe(draw, conteudo, fonte, largura_max):
        tamanho -= 2
        fonte = carregar_fonte(tamanho, pasta_fontes)
    return fonte


def gerar_top10_png(titulo, rotulo, linhas, caminho_fundo=None, pasta_fontes=None, limite=10):
    """Gera o PNG do ranking.

    linhas: lista de (nome, valor), já ordenada.
    Retorna um BytesIO posicionado no início, pronto para send_file().
    """
    pasta = str(pasta_fontes) if pasta_fontes else None
    imagem = _abrir_fundo(caminho_fundo)
    draw = ImageDraw.Draw(imagem, "RGBA")

    largura, altura = imagem.size
    base = min(largura, altura)
    margem = max(int(base * 0.05), 24)

    # Painel na metade direita (mesmo desenho original, mas proporcional).
    x0, x1 = int(largura * 0.50), largura - margem
    y0, y1 = margem, altura - margem
    draw.rounded_rectangle((x0, y0, x1, y1), radius=int(base * 0.03), fill=(*COR_PAINEL, 235))

    largura_painel = x1 - x0
    interno = int(largura_painel * 0.06)
    cx0, cx1 = x0 + interno, x1 - interno

    # Cabeçalho
    f_titulo = _fonte_que_cabe(draw, titulo, largura_painel * 0.075, cx1 - cx0, pasta)
    y_titulo = y0 + interno
    _texto(draw, (cx0, y_titulo), titulo, f_titulo, COR_DESTAQUE)

    f_sub = carregar_fonte(largura_painel * 0.035, pasta)
    y_sub = y_titulo + int(f_titulo.size * 1.35) if hasattr(f_titulo, "size") else y_titulo + 60
    _texto(draw, (cx0, y_sub), SUBTITULO, f_sub, COR_TEXTO)

    # Lista: o espaço disponível é dividido por `limite`, então nunca estoura o painel.
    topo_lista = y_sub + int(largura_painel * 0.035 * 2.2)
    passo = (y1 - interno - topo_lista) / limite
    alt_linha = passo * 0.82
    recuo = alt_linha * 0.3

    f_pos = carregar_fonte(alt_linha * 0.42, pasta)
    f_nome = carregar_fonte(alt_linha * 0.40, pasta)
    f_valor = carregar_fonte(alt_linha * 0.34, pasta)

    if not linhas:
        _texto(draw, ((cx0 + cx1) / 2, (topo_lista + y1) / 2), "SEM DADOS AINDA", f_nome, COR_TEXTO, "mm")

    for i, (nome, valor) in enumerate(linhas[:limite]):
        topo = topo_lista + i * passo
        meio = topo + alt_linha / 2
        draw.rounded_rectangle(
            (cx0, int(topo), cx1, int(topo + alt_linha)), radius=int(alt_linha * 0.25), fill=COR_LINHA
        )

        _texto(draw, (cx0 + recuo, meio), f"{i + 1}º", f_pos, MEDALHAS.get(i + 1, COR_DESTAQUE), "lm")

        texto_valor = f"{valor} {rotulo}"
        _texto(draw, (cx1 - recuo, meio), texto_valor, f_valor, COR_VALOR, "rm")

        x_nome = cx0 + recuo + draw.textlength("10º", font=f_pos) + recuo
        largura_nome = (cx1 - recuo) - draw.textlength(texto_valor, font=f_valor) - recuo - x_nome
        nome_final = _truncar(draw, str(nome), f_nome, largura_nome)
        _texto(draw, (x_nome, meio), nome_final, f_nome, COR_TEXTO, "lm")

    buffer = io.BytesIO()
    imagem.save(buffer, format="PNG", optimize=True)
    buffer.seek(0)
    return buffer
