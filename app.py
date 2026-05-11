# app.py

from flask import Flask, render_template, request, jsonify, redirect, session
import psycopg2
import os

app = Flask(__name__)

# =========================================
# SECRET KEY
# =========================================

app.secret_key = "futebol_dos_amigos"

# =========================================
# CONEXÃO POSTGRESQL
# =========================================

DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:

    conn = psycopg2.connect(DATABASE_URL)

else:

    conn = psycopg2.connect(
    host="127.0.0.1",
    port="5432",
    dbname="futebol_dos_amigos_db",
    user="postgres",
    password="Hm07041997"
    )
# =========================================
# LOGIN
# =========================================

@app.route("/login")
def login():

    return render_template("login.html")

# =========================================
# LOGAR
# =========================================

@app.route("/logar", methods=["POST"])
def logar():

    usuario = request.form["usuario"]
    senha = request.form["senha"]

    cur = conn.cursor()

    cur.execute("""
        SELECT
            id,
            nome,
            tipo
        FROM usuarios
        WHERE usuario = %s
        AND senha = %s
    """, (usuario, senha))

    user = cur.fetchone()

    if user:

        session["usuario_id"] = user[0]
        session["nome"] = user[1]
        session["tipo"] = user[2]

        return redirect("/")

    return "Usuário inválido"

# =========================================
# LOGOUT
# =========================================

@app.route("/logout")
def logout():

    session.clear()

    return redirect("/login")

# =========================================
# HOME
# =========================================

@app.route("/")
def home():

    if "usuario_id" not in session:

        return redirect("/login")

    return render_template(
        "index.html",
        nome=session["nome"],
        tipo=session["tipo"]
    )

# =========================================
# LISTAR JOGADORES
# =========================================

@app.route("/jogadores", methods=["GET"])
def jogadores():

    if "usuario_id" not in session:
        return jsonify([])

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

    if session["tipo"] != "admin":
        return jsonify({"erro": "Sem permissão"})

    data = request.json

    nome = data["nome"].upper()

    nota = data.get("nota", 0)

    posicao = data.get("posicao", "").upper()

    cur = conn.cursor()

    cur.execute("""
        INSERT INTO jogadores (
            nome,
            nota,
            posicao
        )
        VALUES (%s, %s, %s)
    """, (nome, nota, posicao))

    conn.commit()

    return jsonify({
        "msg": "Jogador adicionado"
    })

# =========================================
# ADICIONAR GOL
# =========================================

@app.route("/gol", methods=["POST"])
def gol():

    if session["tipo"] != "admin":
        return jsonify({"erro": "Sem permissão"})

    data = request.json

    cur = conn.cursor()

    cur.execute("""
        UPDATE jogadores
        SET gols = gols + 1
        WHERE id = %s
    """, (data["id"],))

    conn.commit()

    return jsonify({
        "msg": "Gol registrado"
    })

# =========================================
# REMOVER GOL
# =========================================

@app.route("/remover-gol", methods=["POST"])
def remover_gol():

    if session["tipo"] != "admin":
        return jsonify({"erro": "Sem permissão"})

    data = request.json

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

    return jsonify({
        "msg": "Gol removido"
    })

# =========================================
# EXCLUIR JOGADOR
# =========================================

@app.route("/excluir-jogador", methods=["POST"])
def excluir_jogador():

    if session["tipo"] != "admin":
        return jsonify({"erro": "Sem permissão"})

    data = request.json

    cur = conn.cursor()

    cur.execute("""
        DELETE FROM jogadores
        WHERE id = %s
    """, (data["id"],))

    conn.commit()

    return jsonify({
        "msg": "Jogador excluído"
    })

# =========================================
# RODAR APP
# =========================================

if __name__ == "__main__":
    app.run(debug=True)