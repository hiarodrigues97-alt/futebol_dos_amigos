"""Gera a imagem "Top 10" a partir da arte pronta (static/img/fundo-top10.png).

A arte tem duas listas: artilheiros (esquerda) e mais vitórias (direita). Para cada
linha, o serviço apaga o nome e o número que vieram na arte e escreve os do banco.
Não depende de Flask nem do banco: recebe os dados prontos e devolve o PNG.

As medidas abaixo são da arte original (1536x1024) e são escaladas se o tamanho mudar.
Se você trocar a arte por outra, ajuste só o dicionário LAYOUT.
"""
from __future__ import annotations

import io
import logging
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from ..errors import ErroConfiguracao

log = logging.getLogger(__name__)

REF_LARGURA, REF_ALTURA = 1536, 1024

LAYOUT = {
    # borda inferior da 1ª linha, distância entre linhas e altura de cada barra
    "base_y": 428.5,
    "passo_y": 56.9,
    "altura_linha": 51,
    "baseline_acima_da_borda": 12,  # onde assenta o texto, contando de baixo da barra
    "limite": 10,
    "listas": {
        "artilheiros": {"nome_x": 138, "valor_dir": 532, "limpar": (128, 538), "amostra_x": 124},
        "vitoriosos": {"nome_x": 1090, "valor_dir": 1480, "limpar": (1086, 1488), "amostra_x": 1082},
    },
}

COR_NOME = (246, 246, 246)
COR_NUMERO = (255, 232, 20)
COR_ROTULO = (236, 236, 236)
COR_SOMBRA = (0, 0, 0, 170)

FONTE_NEGRITO = "DejaVuSansCondensed-BoldOblique.ttf"
FONTE_NORMAL = "DejaVuSansCondensed-Oblique.ttf"
FONTES_SISTEMA_NEGRITO = ("DejaVuSansCondensed-BoldOblique.ttf", "DejaVuSans-Bold.ttf", "LiberationSans-Bold.ttf", "arialbd.ttf")
FONTES_SISTEMA_NORMAL = ("DejaVuSansCondensed-Oblique.ttf", "DejaVuSans.ttf", "LiberationSans-Regular.ttf", "arial.ttf")


@lru_cache(maxsize=64)
def carregar_fonte(negrito: bool, tamanho: int, pasta_fontes: str | None):
    tamanho = max(int(tamanho), 8)
    nomes = FONTES_SISTEMA_NEGRITO if negrito else FONTES_SISTEMA_NORMAL
    candidatas = ([str(Path(pasta_fontes) / nomes[0])] if pasta_fontes else []) + list(nomes)
    for candidata in candidatas:
        try:
            return ImageFont.truetype(candidata, tamanho)
        except OSError:
            continue
    log.warning("Fonte TrueType não encontrada; usando a fonte padrão do Pillow.")
    try:
        return ImageFont.load_default(size=tamanho)  # Pillow >= 10.1
    except TypeError:
        return ImageFont.load_default()


def _abrir_fundo(caminho):
    try:
        return Image.open(caminho).convert("RGB")
    except OSError as erro:  # inclui FileNotFoundError
        raise ErroConfiguracao(
            f"Imagem de fundo não encontrada ({caminho}). "
            "Coloque a arte em futebol/static/img/fundo-top10.png."
        ) from erro


def _limpar_linha(imagem, caixa, amostra_x, sx):
    """Apaga o texto da arte repetindo uma faixa vazia da própria barra (preserva o brilho)."""
    x0, y0, x1, y1 = caixa
    amostra = imagem.crop((amostra_x, y0, amostra_x + max(int(4 * sx), 2), y1))
    faixa = amostra.resize((1, y1 - y0), Image.BOX).resize((x1 - x0, y1 - y0), Image.NEAREST)
    imagem.paste(faixa, (x0, y0))


def _texto(draw, xy, conteudo, fonte, cor, sombra=1.5):
    """Escreve com a base do texto em xy (âncora 'ls'), com sombra leve."""
    for deslocamento, preenchimento in (((sombra, sombra), COR_SOMBRA), ((0, 0), cor)):
        pos = (xy[0] + deslocamento[0], xy[1] + deslocamento[1])
        try:
            draw.text(pos, conteudo, fill=preenchimento, font=fonte, anchor="ls")
        except ValueError:  # fonte bitmap antiga não aceita âncora
            draw.text((pos[0], pos[1] - fonte.size), conteudo, fill=preenchimento, font=fonte)


def _truncar(draw, conteudo, fonte, largura_max):
    if draw.textlength(conteudo, font=fonte) <= largura_max:
        return conteudo
    while len(conteudo) > 1 and draw.textlength(conteudo + "...", font=fonte) > largura_max:
        conteudo = conteudo[:-1]
    return conteudo.rstrip() + "..."


def gerar_top10_png(listas, caminho_fundo, pasta_fontes=None):
    """listas: {"artilheiros": [(nome, valor, rotulo), ...], "vitoriosos": [...]}

    Cada lista já vem ordenada; `rotulo` é o texto ao lado do número (ex.: "gols").
    Retorna um BytesIO pronto para send_file().
    """
    imagem = _abrir_fundo(caminho_fundo)
    largura, altura = imagem.size
    sx, sy = largura / REF_LARGURA, altura / REF_ALTURA
    fs = min(sx, sy)  # escala das fontes
    pasta = str(pasta_fontes) if pasta_fontes else None

    limite = LAYOUT["limite"]
    altura_linha = LAYOUT["altura_linha"]

    # 1) apaga os textos de exemplo da arte
    for chave, cfg in LAYOUT["listas"].items():
        for i in range(limite):
            borda = LAYOUT["base_y"] + i * LAYOUT["passo_y"]
            caixa = (
                int(cfg["limpar"][0] * sx),
                int((borda - altura_linha + 4) * sy),
                int(cfg["limpar"][1] * sx),
                int((borda - 3) * sy),
            )
            _limpar_linha(imagem, caixa, int(cfg["amostra_x"] * sx), sx)

    # 2) escreve os dados atuais
    draw = ImageDraw.Draw(imagem, "RGBA")
    f_nome = carregar_fonte(True, altura_linha * 0.62 * fs, pasta)
    f_numero = carregar_fonte(True, altura_linha * 0.76 * fs, pasta)
    f_rotulo = carregar_fonte(False, altura_linha * 0.52 * fs, pasta)

    for chave, cfg in LAYOUT["listas"].items():
        for i, (nome, valor, rotulo) in enumerate(listas.get(chave, [])[:limite]):
            base_y = (LAYOUT["base_y"] + i * LAYOUT["passo_y"] - LAYOUT["baseline_acima_da_borda"]) * sy
            direita = cfg["valor_dir"] * sx

            largura_rotulo = draw.textlength(rotulo, font=f_rotulo)
            largura_numero = draw.textlength(str(valor), font=f_numero)
            x_rotulo = direita - largura_rotulo
            x_numero = x_rotulo - 8 * sx - largura_numero
            _texto(draw, (x_rotulo, base_y), rotulo, f_rotulo, COR_ROTULO)
            _texto(draw, (x_numero, base_y), str(valor), f_numero, COR_NUMERO)

            x_nome = cfg["nome_x"] * sx
            nome_final = _truncar(draw, str(nome), f_nome, x_numero - 16 * sx - x_nome)
            _texto(draw, (x_nome, base_y), nome_final, f_nome, COR_NOME)

    buffer = io.BytesIO()
    imagem.save(buffer, format="PNG", optimize=True)
    buffer.seek(0)
    return buffer
