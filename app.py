from flask import (
    Flask,
    jsonify,
    request,
    render_template,
    send_file
)

import psycopg2
import psycopg2.extras
import os
import io

from PIL import (
    Image,
    ImageDraw,
    ImageFont
)
from datetime import datetime

app = Flask(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")


# ==================================================
# CONEXÃO
# ==================================================
def conectar():
    return psycopg2.connect(DATABASE_URL)


# ==================================================
# HOME
# ==================================================
@app.route("/")
def home():
    return render_template("index.html")


# ==================================================
# LISTAR JOGADORES
# ==================================================
@app.route("/jogadores", methods=["GET"])
def listar_jogadores():

    conn = conectar()

    cur = conn.cursor(
        cursor_factory=psycopg2.extras.RealDictCursor
    )

    cur.execute("""
        SELECT
            id,
            nome,
            posicao,
            nota,
            COALESCE(gols,0) AS gols,
            COALESCE(jogos,0) AS jogos,
            COALESCE(vitorias,0) AS vitorias
        FROM jogadores
        ORDER BY gols DESC, nome
    """)

    dados = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify(dados)


# ==================================================
# CADASTRAR JOGADOR
# ==================================================
@app.route("/jogadores", methods=["POST"])
def cadastrar_jogador():

    dados = request.json

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO jogadores (
            nome,
            posicao,
            nota,
            gols,
            jogos,
            vitorias
        )
        VALUES (%s,%s,%s,0,0,0)
    """, (
        dados["nome"].upper(),
        dados["posicao"],
        dados["nota"]
    ))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({
        "ok": True,
        "mensagem": "Jogador cadastrado"
    })


# ==================================================
# EDITAR JOGADOR
# ==================================================
@app.route("/jogadores/<int:id>", methods=["PUT"])
def editar_jogador(id):

    dados = request.json

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        UPDATE jogadores
        SET
            nome = %s,
            posicao = %s,
            nota = %s
        WHERE id = %s
    """, (
        dados["nome"].upper(),
        dados["posicao"],
        dados["nota"],
        id
    ))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({
        "ok": True,
        "mensagem": "Jogador atualizado"
    })


# ==================================================
# EXCLUIR JOGADOR
# ==================================================
@app.route("/jogadores/<int:id>", methods=["DELETE"])
def excluir_jogador(id):

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        DELETE FROM jogadores
        WHERE id = %s
    """, (id,))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({
        "ok": True,
        "mensagem": "Jogador removido"
    })


# ==================================================
# ATUALIZAR ESTATÍSTICAS
# ==================================================
@app.route(
    "/jogadores/<int:id>/estatistica",
    methods=["POST"]
)
def atualizar_estatistica(id):

    dados = request.json

    campo = dados["campo"]
    acao = dados["acao"]

    campos_validos = [
        "gols",
        "jogos",
        "vitorias"
    ]

    if campo not in campos_validos:

        return jsonify({
            "erro": "Campo inválido"
        }), 400

    conn = conectar()
    cur = conn.cursor()

    if acao == "somar":

        cur.execute(f"""
            UPDATE jogadores
            SET {campo} =
                COALESCE({campo},0) + 1
            WHERE id = %s
        """, (id,))

    elif acao == "subtrair":

        cur.execute(f"""
            UPDATE jogadores
            SET {campo} =
                CASE
                    WHEN COALESCE({campo},0) > 0
                    THEN {campo} - 1
                    ELSE 0
                END
            WHERE id = %s
        """, (id,))

    else:

        cur.close()
        conn.close()

        return jsonify({
            "erro": "Ação inválida"
        }), 400

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({
        "ok": True
    })


# ==================================================
# RANKING ARTILHARIA
# ==================================================
@app.route("/ranking/artilharia")
def ranking_artilharia():

    conn = conectar()

    cur = conn.cursor(
        cursor_factory=psycopg2.extras.RealDictCursor
    )

    cur.execute("""
        SELECT
            nome,
            gols,
            jogos,
            vitorias
        FROM jogadores
        WHERE posicao <> 'G'
        ORDER BY gols DESC, nome
        LIMIT 10
    """)

    dados = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify(dados)


# ==================================================
# RANKING VITÓRIAS
# ==================================================
@app.route("/ranking/vitorias")
def ranking_vitorias():

    conn = conectar()

    cur = conn.cursor(
        cursor_factory=psycopg2.extras.RealDictCursor
    )

    cur.execute("""
        SELECT
            nome,
            vitorias,
            jogos,
            gols
        FROM jogadores
        ORDER BY vitorias DESC, nome
        LIMIT 10
    """)

    dados = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify(dados)


# ==================================================
# RANKING JOGOS
# ==================================================
@app.route("/ranking/jogos")
def ranking_jogos():

    conn = conectar()

    cur = conn.cursor(
        cursor_factory=psycopg2.extras.RealDictCursor
    )

    cur.execute("""
        SELECT
            nome,
            jogos,
            gols,
            vitorias
        FROM jogadores
        ORDER BY jogos DESC, nome
        LIMIT 10
    """)

    dados = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify(dados)


# ==================================================
# GERAR IMAGEM TOP 10
# ==================================================

from flask import send_file
from PIL import Image, ImageDraw, ImageFont
import psycopg2.extras
import io
import os


@app.route("/top10-imagem")
def top10_imagem():

    try:

        conn = conectar()

        cur = conn.cursor(
            cursor_factory=psycopg2.extras.RealDictCursor
        )

        cur.execute("""
            SELECT
                nome,
                gols
            FROM jogadores
            WHERE posicao <> 'G'
            ORDER BY gols DESC, nome
            LIMIT 10
        """)

        ranking = cur.fetchall()

        cur.close()
        conn.close()

        #
        # IMAGEM DE FUNDO
        #
        caminho_imagem = os.path.join(
            "static",
            "ChatGPT Image 18 de jun. de 2026, 17_14_57 (2)"
        )

        imagem = Image.open(
            caminho_imagem
        ).convert("RGB")

        draw = ImageDraw.Draw(imagem)

        #
        # FONTES
        #
        try:

            fonte_posicao = ImageFont.truetype(
                "arial.ttf",
                42
            )

            fonte_nome = ImageFont.truetype(
                "arial.ttf",
                34
            )

            fonte_gols = ImageFont.truetype(
                "arial.ttf",
                34
            )

        except:

            fonte_posicao = ImageFont.load_default()
            fonte_nome = ImageFont.load_default()
            fonte_gols = ImageFont.load_default()

        #
        # LIMPA ÁREA DO RANKING
        #
        draw.rectangle(
            (
                720,
                300,
                1365,
                1280
            ),
            fill=(0, 0, 0)
        )

        #
        # TÍTULO
        #
        draw.text(
            (760, 120),
            "TOP 10",
            fill=(255, 193, 7),
            font=fonte_posicao
        )

        draw.text(
            (760, 170),
            "ARTILHEIROS",
            fill=(255, 255, 255),
            font=fonte_posicao
        )

        #
        # RANKING
        #
        y = 300

        for posicao, jogador in enumerate(
            ranking,
            start=1
        ):

            nome = jogador["nome"]
            gols = jogador["gols"]

            draw.text(
                (760, y),
                f"{posicao}º",
                fill=(255, 193, 7),
                font=fonte_posicao
            )

            draw.text(
                (860, y),
                nome,
                fill=(255, 255, 255),
                font=fonte_nome
            )

            draw.text(
                (1180, y),
                f"{gols} gols",
                fill=(255, 193, 7),
                font=fonte_gols
            )

            y += 85

        #
        # RETORNO
        #
        buffer = io.BytesIO()

        imagem.save(
            buffer,
            format="PNG"
        )

        buffer.seek(0)

        return send_file(
            buffer,
            mimetype="image/png"
        )

    except Exception as erro:

        return {
            "erro": str(erro)
        }, 500


# ==================================================
# START
# ==================================================
if __name__ == "__main__":
    app.run(debug=True)