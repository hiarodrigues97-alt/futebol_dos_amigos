from flask import Flask, render_template, request, jsonify
import psycopg2

app = Flask(__name__)

# =========================================
# CONEXÃO POSTGRESQL
# =========================================

import os

DATABASE_URL = os.environ.get("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)

# =========================================
# HOME
# =========================================

@app.route("/")
def home():
    return render_template("index.html")

# =========================================
# LISTAR JOGADORES
# =========================================

@app.route("/jogadores", methods=["GET"])
def jogadores():

    cur = conn.cursor()

    cur.execute("""
        SELECT
            id,
            nome,
            gols,
            nota,
            posicao
        FROM jogadores
        ORDER BY gols DESC, nota DESC
    """)

    dados = cur.fetchall()

    lista = []

    for d in dados:

        lista.append({
            "id": d[0],
            "nome": d[1],
            "gols": d[2],
            "nota": float(d[3]),
            "posicao": d[4]
        })

    return jsonify(lista)

# =========================================
# ADICIONAR JOGADOR
# =========================================

@app.route("/jogadores", methods=["POST"])
def add_jogador():

    data = request.json

    nome = data["nome"].upper()

    nota = data.get("nota", 0)

    posicao = data.get("posicao", "").upper()

    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO jogadores(nome, nota, posicao)
        VALUES(%s, %s, %s)
        """,
        (nome, nota, posicao)
    )

    conn.commit()

    return jsonify({
        "msg": "Jogador adicionado"
    })

# =========================================
# ADICIONAR GOL
# =========================================

@app.route("/gol", methods=["POST"])
def gol():

    data = request.json

    cur = conn.cursor()

    cur.execute(
        """
        UPDATE jogadores
        SET gols = gols + 1
        WHERE id = %s
        """,
        (data["id"],)
    )

    conn.commit()

    return jsonify({
        "msg": "Gol registrado"
    })

# =========================================
# REMOVER GOL
# =========================================

@app.route("/remover-gol", methods=["POST"])
def remover_gol():

    data = request.json

    cur = conn.cursor()

    cur.execute(
        """
        UPDATE jogadores
        SET gols = CASE
            WHEN gols > 0 THEN gols - 1
            ELSE 0
        END
        WHERE id = %s
        """,
        (data["id"],)
    )

    conn.commit()

    return jsonify({
        "msg": "Gol removido"
    })

# =========================================
# EXCLUIR JOGADOR
# =========================================

@app.route("/excluir-jogador", methods=["POST"])
def excluir_jogador():

    data = request.json

    cur = conn.cursor()

    cur.execute(
        """
        DELETE FROM jogadores
        WHERE id = %s
        """,
        (data["id"],)
    )

    conn.commit()

    return jsonify({
        "msg": "Jogador excluído"
    })

# =========================================
# RODAR APP
# =========================================

if __name__ == "__main__":
    app.run(debug=True)