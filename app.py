from flask import Flask, render_template, request, jsonify
import psycopg2
import os

app = Flask(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")

def conectar():

    return psycopg2.connect(DATABASE_URL)

@app.route("/")
def index():

    return render_template(
        "index.html",
        tipo_usuario="admin"
    )

@app.route("/jogadores")
def jogadores():

    conn = conectar()

    cur = conn.cursor()

    cur.execute("""
        SELECT
            id,
            nome,
            posicao,
            gols,
            nota
        FROM jogadores
        ORDER BY
            CASE
                WHEN posicao = 'G' THEN 0
                ELSE 1
            END,
            gols ASC,
            nome
    """)

    dados = cur.fetchall()

    jogadores = []

    for j in dados:

        jogadores.append({
            "id": j[0],
            "nome": j[1],
            "posicao": j[2],
            "gols": j[3],
            "nota": float(j[4])
        })

    cur.close()
    conn.close()

    return jsonify(jogadores)

@app.route("/jogadores", methods=["POST"])
def add_jogador():

    dados = request.json

    conn = conectar()

    cur = conn.cursor()

    cur.execute("""
        INSERT INTO jogadores (
            nome,
            posicao,
            gols,
            nota
        )
        VALUES (%s, %s, 0, %s)
    """, (
        dados["nome"],
        dados["posicao"],
        dados["nota"]
    ))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({"ok": True})

@app.route("/gol", methods=["POST"])
def gol():

    dados = request.json

    conn = conectar()

    cur = conn.cursor()

    cur.execute("""
        UPDATE jogadores
        SET gols = gols + 1
        WHERE id = %s
    """, (dados["id"],))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({"ok": True})

@app.route("/remover-gol", methods=["POST"])
def remover_gol():

    dados = request.json

    conn = conectar()

    cur = conn.cursor()

    cur.execute("""
        UPDATE jogadores
        SET gols = CASE
            WHEN gols > 0 THEN gols - 1
            ELSE 0
        END
        WHERE id = %s
    """, (dados["id"],))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({"ok": True})

@app.route("/editar-jogador", methods=["POST"])
def editar_jogador():

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
        dados["nome"],
        dados["posicao"],
        dados["nota"],
        dados["id"]
    ))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({"ok": True})

@app.route("/excluir-jogador", methods=["POST"])
def excluir_jogador():

    dados = request.json

    conn = conectar()

    cur = conn.cursor()

    cur.execute("""
        DELETE FROM jogadores
        WHERE id = %s
    """, (dados["id"],))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({"ok": True})

if __name__ == "__main__":

    app.run(host="0.0.0.0", port=10000)