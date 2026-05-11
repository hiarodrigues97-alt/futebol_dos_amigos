from flask import Flask, render_template, request, redirect, jsonify
import psycopg2
import os

app = Flask(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)

# HOME
@app.route("/")
def index():

    cur = conn.cursor()

    # TODOS
    cur.execute("""
        SELECT *
        FROM jogadores
        ORDER BY nome
    """)

    jogadores = cur.fetchall()

    # ARTILHEIROS
    cur.execute("""
        SELECT *
        FROM jogadores
        WHERE posicao != 'G'
        ORDER BY gols DESC
    """)

    artilheiros = cur.fetchall()

    # GOLEIROS
    cur.execute("""
        SELECT *
        FROM jogadores
        WHERE posicao = 'G'
        ORDER BY gols ASC
    """)

    goleiros = cur.fetchall()

    cur.close()

    return render_template(
        "index.html",
        jogadores=jogadores,
        artilheiros=artilheiros,
        goleiros=goleiros
    )

# CADASTRAR
@app.route("/adicionar", methods=["POST"])
def adicionar():

    nome = request.form["nome"].upper()
    posicao = request.form["posicao"]
    nota = request.form["nota"]

    cur = conn.cursor()

    cur.execute("""
        INSERT INTO jogadores (
            nome,
            gols,
            nota,
            posicao
        )
        VALUES (%s, %s, %s, %s)
    """, (nome, 0, nota, posicao))

    conn.commit()
    cur.close()

    return redirect("/")

# EDITAR
@app.route("/editar/<int:id>", methods=["POST"])
def editar(id):

    nome = request.form["nome"].upper()
    gols = request.form["gols"]
    nota = request.form["nota"]
    posicao = request.form["posicao"]

    cur = conn.cursor()

    cur.execute("""
        UPDATE jogadores
        SET
            nome = %s,
            gols = %s,
            nota = %s,
            posicao = %s
        WHERE id = %s
    """, (nome, gols, nota, posicao, id))

    conn.commit()
    cur.close()

    return redirect("/")

# EXCLUIR
@app.route("/excluir/<int:id>")
def excluir(id):

    cur = conn.cursor()

    cur.execute("""
        DELETE FROM jogadores
        WHERE id = %s
    """, (id,))

    conn.commit()
    cur.close()

    return redirect("/")

# ADICIONAR GOL
@app.route("/gol/<int:id>")
def gol(id):

    cur = conn.cursor()

    cur.execute("""
        UPDATE jogadores
        SET gols = gols + 1
        WHERE id = %s
    """, (id,))

    conn.commit()
    cur.close()

    return redirect("/")

# REMOVER GOL
@app.route("/remover_gol/<int:id>")
def remover_gol(id):

    cur = conn.cursor()

    cur.execute("""
        UPDATE jogadores
        SET gols = GREATEST(gols - 1, 0)
        WHERE id = %s
    """, (id,))

    conn.commit()
    cur.close()

    return redirect("/")

if __name__ == "__main__":
    app.run()