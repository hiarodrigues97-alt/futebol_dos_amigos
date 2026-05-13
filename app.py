from flask import Flask, render_template, request, jsonify
import psycopg2
import psycopg2.extras
import os
import json
from datetime import datetime

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

    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("""
        SELECT
            id,
            nome,
            posicao,
            gols,
            nota,
            COALESCE(jogos,0) AS jogos,
            COALESCE(vitorias,0) AS vitorias
        FROM jogadores
        ORDER BY gols DESC, nome
    """)

    dados = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify(dados)


# =========================================
# ADD JOGADOR
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

    return jsonify({
        "ok": True
    })


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

    return jsonify({
        "ok": True
    })


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

    return jsonify({
        "ok": True
    })


# =========================================
# EXCLUIR
# =========================================
@app.route("/excluir-jogador", methods=["POST"])
def excluir():

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

    return jsonify({
        "ok": True
    })


# =========================================
# EDITAR
# =========================================
@app.route("/editar-jogador", methods=["POST"])
def editar():

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

    return jsonify({
        "ok": True
    })


# =========================================
# REGISTRAR JOGO
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

    return jsonify({
        "ok": True
    })


# =========================================
# SALVAR PARTIDA
# =========================================
@app.route("/salvar-partida", methods=["POST"])
def salvar_partida():

    dados = request.json

    nome_time = dados["nome_time"]

    jogadores = dados["jogadores"]

    conn = conectar()

    cur = conn.cursor()

    try:

        # =========================
        # SALVAR PARTIDA
        # =========================

        cur.execute("""
            INSERT INTO partidas (
                nome_time,
                jogadores,
                data_partida
            )
            VALUES (%s, %s, NOW())
        """, (
            nome_time,
            json.dumps(jogadores)
        ))

        # =========================
        # SOMAR VITÓRIAS
        # =========================

        for jogador in jogadores:

            cur.execute("""
                UPDATE jogadores
                SET vitorias = COALESCE(vitorias, 0) + 1
                WHERE id = %s
            """, (jogador["id"],))

        conn.commit()

        cur.close()

        conn.close()

        return jsonify({
            "ok": True
        })

    except Exception as e:

        conn.rollback()

        print("ERRO SALVAR PARTIDA:", e)

        return jsonify({
            "ok": False,
            "erro": str(e)
        })


# =========================================
# RANKING TIMES
# =========================================
@app.route("/ranking-times")
def ranking_times():

    conn = conectar()

    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("""
        SELECT
            nome_time,
            COUNT(*) AS vitorias
        FROM partidas
        GROUP BY nome_time
        ORDER BY vitorias DESC
    """)

    dados = cur.fetchall()

    ranking = []

    for r in dados:

        ranking.append({
            "nome_time": r["nome"],
            "vitorias": r["vitorias"]
        })

    cur.close()
    conn.close()

    return jsonify(ranking)


# =========================================
# TESTE
# =========================================
@app.route("/teste")
def teste():

    return jsonify({
        "status": "ok"
    })


# =========================================
# START
# =========================================
if __name__ == "__main__":

    app.run(debug=True)