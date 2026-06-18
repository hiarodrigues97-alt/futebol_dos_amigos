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

    # ==========================
    # CARREGA IMAGEM DE FUNDO
    # ==========================

    imagem = Image.open(
        "static/fundo_ranking.png"
    ).convert("RGBA")

    largura, altura = imagem.size

    # ==========================
    # CAMADA ESCURA
    # ==========================

    overlay = Image.new(
        "RGBA",
        imagem.size,
        (0, 0, 0, 140)
    )

    imagem = Image.alpha_composite(
        imagem,
        overlay
    )

    draw = ImageDraw.Draw(imagem)

    # ==========================
    # FONTES
    # ==========================

    try:

        titulo_font = ImageFont.truetype(
            "arial.ttf",
            50
        )

        ranking_font = ImageFont.truetype(
            "arial.ttf",
            30
        )

        rodape_font = ImageFont.truetype(
            "arial.ttf",
            22
        )

    except:

        titulo_font = ImageFont.load_default()
        ranking_font = ImageFont.load_default()
        rodape_font = ImageFont.load_default()

    # ==========================
    # TÍTULO
    # ==========================

    draw.text(
        (150, 40),
        "🏆 TOP 10 ARTILHEIROS",
        fill="#FFD700",
        font=titulo_font
    )

    draw.text(
        (250, 100),
        "Futebol dos Amigos",
        fill="white",
        font=rodape_font
    )

    # ==========================
    # LISTA
    # ==========================

    y = 180

    for posicao, jogador in enumerate(
        ranking,
        start=1
    ):

        medalha = ""

        if posicao == 1:
            medalha = "🥇"

        elif posicao == 2:
            medalha = "🥈"

        elif posicao == 3:
            medalha = "🥉"

        linha = (
            f"{medalha} {posicao:>2}º  "
            f"{jogador['nome'][:20]}"
        )

        draw.text(
            (60, y),
            linha,
            fill="white",
            font=ranking_font
        )

        draw.text(
            (650, y),
            f"{jogador['gols']} ⚽",
            fill="#FFD700",
            font=ranking_font
        )

        y += 45

    # ==========================
    # DATA
    # ==========================

    draw.text(
        (220, altura - 50),
        f"Atualizado em {datetime.now().strftime('%d/%m/%Y')}",
        fill="white",
        font=rodape_font
    )

    # ==========================
    # RETORNA PNG
    # ==========================

    arquivo = io.BytesIO()

    imagem.convert("RGB").save(
        arquivo,
        format="PNG"
    )

    arquivo.seek(0)

    return send_file(
        arquivo,
        mimetype="image/png"
    )


# ==================================================
# START
# ==================================================
if __name__ == "__main__":
    app.run(debug=True)