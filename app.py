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
# GERAR IMAGEM TOP 10 ARTILHEIROS
# ==================================================
@app.route("/top10-imagem")
def top10_imagem():

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

    # ==========================================
    # TEMPLATE
    # ==========================================

    imagem = Image.open(
        "static/top10_template.png"
    ).convert("RGBA")

    draw = ImageDraw.Draw(imagem)

    # ==========================================
    # FONTES
    # ==========================================

    try:

        fonte_nome = ImageFont.truetype(
            "arialbd.ttf",
            38
        )

        fonte_gols = ImageFont.truetype(
            "arialbd.ttf",
            44
        )

        fonte_data = ImageFont.truetype(
            "arial.ttf",
            20
        )

    except:

        fonte_nome = ImageFont.load_default()
        fonte_gols = ImageFont.load_default()
        fonte_data = ImageFont.load_default()

    # ==========================================
    # APAGA ÁREA ANTIGA DO RANKING
    # ==========================================

    x_inicio = 730
    y_inicio = 420
    x_fim = 2040
    y_fim = 1620

    draw.rectangle(
        [
            (x_inicio, y_inicio),
            (x_fim, y_fim)
        ],
        fill=(0, 0, 0, 180)
    )

    # ==========================================
    # POSIÇÕES DAS LINHAS
    # ==========================================

    posicoes_y = [
        455,
        565,
        675,
        785,
        895,
        1005,
        1115,
        1225,
        1335,
        1445
    ]

    # ==========================================
    # DESENHA RANKING
    # ==========================================

    for indice in range(10):

        if indice < len(ranking):

            nome = ranking[indice]["nome"].upper()[:18]
            gols = str(ranking[indice]["gols"])

        else:

            nome = "-"
            gols = "0"

        y = posicoes_y[indice]

        draw.text(
            (865, y),
            nome,
            fill="white",
            font=fonte_nome
        )

        draw.text(
            (1690, y),
            gols,
            fill="#f7c948",
            font=fonte_gols
        )

    # ==========================================
    # DATA
    # ==========================================

    draw.text(
        (1450, 1540),
        datetime.now().strftime(
            "%d/%m/%Y %H:%M"
        ),
        fill="white",
        font=fonte_data
    )

    # ==========================================
    # RETORNO
    # ==========================================

    buffer = io.BytesIO()

    imagem.save(
        buffer,
        format="PNG"
    )

    buffer.seek(0)

    return send_file(
        buffer,
        mimetype="image/png",
        download_name="top10_artilheiros.png"
    )


# ==================================================
# START
# ==================================================
if __name__ == "__main__":
    app.run(debug=True)