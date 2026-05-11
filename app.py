# app.py

from flask import Flask, render_template, request, redirect, session
import psycopg2
import os
import random

app = Flask(__name__)
app.secret_key = "futebol123"

DATABASE_URL = os.getenv("DATABASE_URL")


def get_conn():
    return psycopg2.connect(DATABASE_URL, sslmode="require")


# =========================
# CRIAR TABELA
# =========================
def criar_tabela():

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS jogadores (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(100),
            gols INTEGER DEFAULT 0,
            vitorias INTEGER DEFAULT 0,
            derrotas INTEGER DEFAULT 0,
            nota INTEGER DEFAULT 0,
            posicao VARCHAR(1)
        )
    """)

    conn.commit()

    cur.close()
    conn.close()


criar_tabela()


# =========================
# HOME
# =========================
@app.route("/")
def index():

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT *
        FROM jogadores
        ORDER BY gols DESC, nome
    """)

    todos = cur.fetchall()

    cur.close()
    conn.close()

    goleiros = [j for j in todos if j[6] == "G"]
    jogadores = [j for j in todos if j[6] != "G"]

    goleiros = sorted(goleiros, key=lambda x: x[3])

    return render_template(
        "index.html",
        jogadores=jogadores,
        goleiros=goleiros,
        time1=[],
        time2=[],
        time3=[]
    )


# =========================
# LOGIN
# =========================
@app.route("/login", methods=["POST"])
def login():

    senha = request.form["senha"]

    if senha == "123":
        session["admin"] = True

    return redirect("/")


@app.route("/logout")
def logout():

    session.clear()

    return redirect("/")


# =========================
# ADICIONAR
# =========================
@app.route("/adicionar", methods=["POST"])
def adicionar():

    nome = request.form["nome"].upper()
    nota = request.form["nota"]
    posicao = request.form["posicao"]

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO jogadores
        (nome, nota, posicao)
        VALUES (%s,%s,%s)
    """, (nome, nota, posicao))

    conn.commit()

    cur.close()
    conn.close()

    return redirect("/")


# =========================
# EDITAR
# =========================
@app.route("/editar/<int:id>", methods=["POST"])
def editar(id):

    if not session.get("admin"):
        return redirect("/")

    nome = request.form["nome"].upper()
    gols = request.form["gols"]
    vitorias = request.form["vitorias"]
    derrotas = request.form["derrotas"]
    nota = request.form["nota"]
    posicao = request.form["posicao"]

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        UPDATE jogadores
        SET nome=%s,
            gols=%s,
            vitorias=%s,
            derrotas=%s,
            nota=%s,
            posicao=%s
        WHERE id=%s
    """, (
        nome,
        gols,
        vitorias,
        derrotas,
        nota,
        posicao,
        id
    ))

    conn.commit()

    cur.close()
    conn.close()

    return redirect("/")


# =========================
# EXCLUIR
# =========================
@app.route("/excluir/<int:id>")
def excluir(id):

    if not session.get("admin"):
        return redirect("/")

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        DELETE FROM jogadores
        WHERE id=%s
    """, (id,))

    conn.commit()

    cur.close()
    conn.close()

    return redirect("/")


# =========================
# GOLS +
# =========================
@app.route("/gol/<int:id>")
def gol(id):

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        UPDATE jogadores
        SET gols = gols + 1
        WHERE id=%s
    """, (id,))

    conn.commit()

    cur.close()
    conn.close()

    return redirect("/")


# =========================
# GOLS -
# =========================
@app.route("/menosgol/<int:id>")
def menosgol(id):

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        UPDATE jogadores
        SET gols = GREATEST(gols - 1, 0)
        WHERE id=%s
    """, (id,))

    conn.commit()

    cur.close()
    conn.close()

    return redirect("/")


# =========================
# VITORIA
# =========================
@app.route("/vitoria/<int:id>")
def vitoria(id):

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        UPDATE jogadores
        SET vitorias = vitorias + 1
        WHERE id=%s
    """, (id,))

    conn.commit()

    cur.close()
    conn.close()

    return redirect("/")


# =========================
# DERROTA
# =========================
@app.route("/derrota/<int:id>")
def derrota(id):

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        UPDATE jogadores
        SET derrotas = derrotas + 1
        WHERE id=%s
    """, (id,))

    conn.commit()

    cur.close()
    conn.close()

    return redirect("/")


# =========================
# SORTEAR TIMES
# =========================
@app.route("/sortear", methods=["POST"])
def sortear():

    jogadores_ids = request.form.getlist("jogadores")

    if len(jogadores_ids) < 6:
        return redirect("/")

    conn = get_conn()
    cur = conn.cursor()

    selecionados = []

    for jogador_id in jogadores_ids:

        cur.execute("""
            SELECT *
            FROM jogadores
            WHERE id=%s
        """, (jogador_id,))

        jogador = cur.fetchone()

        selecionados.append(jogador)

    random.shuffle(selecionados)

    time1 = []
    time2 = []
    time3 = []

    for i, jogador in enumerate(selecionados):

        if i % 3 == 0:
            time1.append(jogador)

        elif i % 3 == 1:
            time2.append(jogador)

        else:
            time3.append(jogador)

    cur.execute("""
        SELECT *
        FROM jogadores
        ORDER BY gols DESC
    """)

    todos = cur.fetchall()

    cur.close()
    conn.close()

    goleiros = [j for j in todos if j[6] == "G"]
    jogadores = [j for j in todos if j[6] != "G"]

    return render_template(
        "index.html",
        jogadores=jogadores,
        goleiros=goleiros,
        time1=time1,
        time2=time2,
        time3=time3
    )


if __name__ == "__main__":
    app.run(debug=True)