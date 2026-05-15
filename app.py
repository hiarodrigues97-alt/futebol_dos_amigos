from flask import Flask, render_template, request, jsonify
import psycopg2
import psycopg2.extras
import os

app = Flask(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")


# =========================================
# CONEXÃO
# =========================================
def conectar():

    return psycopg2.connect(DATABASE_URL)


# =========================================
# HOME
# =========================================
@app.route("/")
def index():

    return render_template("index.html")


# =========================================
# LISTAR JOGADORES
# =========================================
@app.route("/jogadores")
def jogadores():

    conn = conectar()

    cur = conn.cursor(
        cursor_factory=psycopg2.extras.RealDictCursor
    )

    cur.execute("""
        SELECT
            id,
            nome,
            posicao,
            COALESCE(gols,0) AS gols,
            COALESCE(jogos,0) AS jogos,
            COALESCE(vitorias,0) AS vitorias,
            nota
        FROM jogadores
        ORDER BY gols DESC, nome
    """)

    dados = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify(dados)


# =========================================
# ADICIONAR
# =========================================
@app.route("/jogadores", methods=["POST"])
def add_jogador():

    data = request.json

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
        data["nome"].upper(),
        data["posicao"],
        data["nota"]
    ))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({"ok": True})


# =========================================
# GOL
# =========================================
@app.route("/gol", methods=["POST"])
def gol():

    data = request.json

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        UPDATE jogadores
        SET gols = gols + 1
        WHERE id = %s
    """, (data["id"],))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({"ok": True})


# =========================================
# REMOVER GOL
# =========================================
@app.route("/remover-gol", methods=["POST"])
def remover_gol():

    data = request.json

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        UPDATE jogadores
        SET gols = CASE
            WHEN gols > 0 THEN gols - 1
            ELSE 0
        END
        WHERE id = %s
    """, (data["id"],))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({"ok": True})


# =========================================
# EXCLUIR
# =========================================
@app.route("/excluir-jogador", methods=["POST"])
def excluir_jogador():

    data = request.json

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        DELETE FROM jogadores
        WHERE id = %s
    """, (data["id"],))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({"ok": True})


# =========================================
# EDITAR
# =========================================
@app.route("/editar-jogador", methods=["POST"])
def editar_jogador():

    data = request.json

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
        data["nome"].upper(),
        data["posicao"],
        data["nota"],
        data["id"]
    ))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({"ok": True})


# =========================================
# REGISTRAR JOGOS
# =========================================
@app.route("/registrar-jogo", methods=["POST"])
def registrar_jogo():

    data = request.json

    jogadores = data["jogadores"]

    conn = conectar()
    cur = conn.cursor()

    for jogador_id in jogadores:

        cur.execute("""
            UPDATE jogadores
            SET jogos = COALESCE(jogos,0) + 1
            WHERE id = %s
        """, (jogador_id,))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({"ok": True})


# =========================================
# SALVAR VITÓRIA
# =========================================
@app.route("/salvar-partida", methods=["POST"])
def salvar_partida():

    data = request.json

    nome_time = data["nome_time"]

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO partidas (
            nome_time,
            data_partida
        )
        VALUES (%s, NOW())
    """, (nome_time,))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({"ok": True})


# =========================================
# RANKING TIMES
# =========================================
@app.route("/ranking-times")
def ranking_times():

    conn = conectar()

    cur = conn.cursor(
        cursor_factory=psycopg2.extras.RealDictCursor
    )

    cur.execute("""
        SELECT
            nome_time,
            COUNT(*) AS vitorias
        FROM partidas
        WHERE DATE(data_partida) = CURRENT_DATE
        GROUP BY nome_time
        ORDER BY vitorias DESC
    """)

    dados = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify(dados)


# =========================================
# DASHBOARD
# =========================================
@app.route("/dashboard")
def dashboard():

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
        LIMIT 5
    """)

    artilheiros = cur.fetchall()

    cur.execute("""
        SELECT
            nome,
            gols
        FROM jogadores
        WHERE posicao = 'G'
        ORDER BY gols DESC
        LIMIT 1
    """)

    goleiro = cur.fetchone()

    cur.close()
    conn.close()

    return jsonify({
        "artilheiros": artilheiros,
        "goleiro": goleiro
    })


# =========================================
# START
# =========================================
if __name__ == "__main__":

    app.run(debug=True)