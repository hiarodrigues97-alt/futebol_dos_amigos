import io
import os
from contextlib import contextmanager
from pathlib import Path

import psycopg2
import psycopg2.extras
from flask import Flask, jsonify, render_template, request, send_file
from PIL import Image, ImageDraw, ImageFont

app = Flask(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")
ESTATISTICAS_VALIDAS = {"gols", "jogos", "vitorias"}
RANKINGS = {
    "artilheiros": {"coluna": "gols", "titulo": "TOP 10 ARTILHEIROS", "filtro": "WHERE posicao <> 'G'"},
    "vitoriosos": {"coluna": "vitorias", "titulo": "TOP 10 VITORIOSOS", "filtro": ""},
}


def conectar():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL não configurada.")
    return psycopg2.connect(DATABASE_URL)


@contextmanager
def cursor_banco(dict_cursor=False):
    conn = conectar()
    factory = psycopg2.extras.RealDictCursor if dict_cursor else None
    cur = conn.cursor(cursor_factory=factory)
    try:
        yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def dados_jogador():
    data = request.get_json(silent=True) or {}
    nome = str(data.get("nome", "")).strip()
    posicao = str(data.get("posicao", "")).strip().upper()
    nota = data.get("nota")

    if not nome or posicao not in {"A", "M", "Z", "G"} or nota is None:
        return None, (jsonify(erro="Informe nome, posição e nota válidos."), 400)
    try:
        nota = float(nota)
    except (TypeError, ValueError):
        return None, (jsonify(erro="A nota deve ser numérica."), 400)
    return {"nome": nome.upper(), "posicao": posicao, "nota": nota}, None


def buscar_ranking(tipo):
    configuracao = RANKINGS[tipo]
    with cursor_banco(dict_cursor=True) as cur:
        cur.execute(
            f"""
            SELECT nome, posicao, COALESCE(gols, 0) AS gols,
                   COALESCE(jogos, 0) AS jogos,
                   COALESCE(vitorias, 0) AS vitorias
            FROM jogadores
            {configuracao['filtro']}
            ORDER BY {configuracao['coluna']} DESC, nome ASC
            LIMIT 10
            """
        )
        return cur.fetchall()


def fonte(tamanho):
    try:
        return ImageFont.truetype("arial.ttf", tamanho)
    except OSError:
        return ImageFont.load_default()


@app.errorhandler(psycopg2.Error)
def erro_banco(erro):
    app.logger.exception("Erro no banco: %s", erro)
    return jsonify(erro="Não foi possível acessar o banco de dados."), 500


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/jogadores", methods=["GET"])
def jogadores():
    with cursor_banco(dict_cursor=True) as cur:
        cur.execute(
            """
            SELECT id, nome, posicao, nota, COALESCE(gols, 0) AS gols,
                   COALESCE(jogos, 0) AS jogos, COALESCE(vitorias, 0) AS vitorias
            FROM jogadores ORDER BY gols ASC
            """
        )
        return jsonify(cur.fetchall())


@app.route("/jogadores", methods=["POST"])
def add_jogador():
    jogador, erro = dados_jogador()
    if erro:
        return erro
    with cursor_banco() as cur:
        cur.execute(
            """INSERT INTO jogadores (nome, posicao, nota, gols, jogos, vitorias)
               VALUES (%(nome)s, %(posicao)s, %(nota)s, 0, 0, 0) RETURNING id""",
            jogador,
        )
        jogador_id = cur.fetchone()[0]
    return jsonify(ok=True, id=jogador_id), 201


@app.route("/jogadores/<int:jogador_id>", methods=["PUT"])
def editar_jogador(jogador_id):
    jogador, erro = dados_jogador()
    if erro:
        return erro
    jogador["id"] = jogador_id
    with cursor_banco() as cur:
        cur.execute(
            """UPDATE jogadores SET nome = %(nome)s, posicao = %(posicao)s, nota = %(nota)s
               WHERE id = %(id)s""",
            jogador,
        )
        if cur.rowcount == 0:
            return jsonify(erro="Jogador não encontrado."), 404
    return jsonify(ok=True)


@app.route("/jogadores/<int:jogador_id>", methods=["DELETE"])
def excluir_jogador(jogador_id):
    with cursor_banco() as cur:
        cur.execute("DELETE FROM jogadores WHERE id = %s", (jogador_id,))
        if cur.rowcount == 0:
            return jsonify(erro="Jogador não encontrado."), 404
    return jsonify(ok=True)


@app.route("/jogadores/<int:jogador_id>/estatistica", methods=["POST"])
def alterar_estatistica(jogador_id):
    data = request.get_json(silent=True) or {}
    campo, acao = data.get("campo"), data.get("acao")
    if campo not in ESTATISTICAS_VALIDAS or acao not in {"somar", "subtrair"}:
        return jsonify(erro="Campo ou ação inválidos."), 400

    expressao = f"COALESCE({campo}, 0) + 1" if acao == "somar" else f"GREATEST(COALESCE({campo}, 0) - 1, 0)"
    with cursor_banco() as cur:
        cur.execute(f"UPDATE jogadores SET {campo} = {expressao} WHERE id = %s", (jogador_id,))
        if cur.rowcount == 0:
            return jsonify(erro="Jogador não encontrado."), 404
    return jsonify(ok=True)


@app.route("/ranking/<string:tipo>")
def ranking(tipo):
    if tipo not in RANKINGS:
        return jsonify(erro="Ranking não encontrado."), 404
    return jsonify(buscar_ranking(tipo))


@app.route("/top10-imagem/<string:tipo>")
def top10_imagem(tipo):
    if tipo not in RANKINGS:
        return jsonify(erro="Ranking não encontrado."), 404

    caminho_fundo = Path(app.static_folder) / "ChatGPT Image 18 de jun. de 2026, 17_14_57 (2).png"
    if not caminho_fundo.is_file():
        return jsonify(erro="Imagem de fundo não encontrada."), 500

    imagem = Image.open(caminho_fundo).convert("RGB")
    draw = ImageDraw.Draw(imagem)
    ranking_jogadores = buscar_ranking(tipo)
    titulo = RANKINGS[tipo]["titulo"]
    coluna = RANKINGS[tipo]["coluna"]

    largura, altura = imagem.size
    painel_esquerda = int(largura * 0.50)
    draw.rounded_rectangle((painel_esquerda, 70, largura - 60, altura - 70), 28, fill=(12, 22, 38))
    draw.text((painel_esquerda + 45, 115), titulo, fill=(255, 204, 0), font=fonte(42))
    draw.text((painel_esquerda + 45, 170), "FUTEBOL DOS AMIGOS", fill="white", font=fonte(24))

    y = 250
    for posicao, jogador in enumerate(ranking_jogadores, start=1):
        draw.rounded_rectangle((painel_esquerda + 35, y - 10, largura - 90, y + 50), 12, fill=(27, 45, 70))
        draw.text((painel_esquerda + 55, y), f"{posicao}º", fill=(255, 204, 0), font=fonte(28))
        draw.text((painel_esquerda + 130, y), jogador["nome"], fill="white", font=fonte(26))
        texto_valor = f"{jogador[coluna]} {'GOLS' if coluna == 'gols' else 'VITÓRIAS'}"
        draw.text((largura - 320, y), texto_valor, fill=(143, 240, 178), font=fonte(20))
        y += 75

    buffer = io.BytesIO()
    imagem.save(buffer, format="PNG")
    buffer.seek(0)
    return send_file(buffer, mimetype="image/png", download_name=f"top10-{tipo}.png")


if __name__ == "__main__":
    app.run(debug=True)
