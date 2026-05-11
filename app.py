from flask import Flask, render_template, request, redirect
import psycopg2
import os
import random

app = Flask(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")


# =========================================
# CONEXÃO
# =========================================

def get_connection():
    return psycopg2.connect(
        DATABASE_URL,
        sslmode='require'
    )


# =========================================
# CRIAR TABELA
# =========================================

def criar_tabela():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS jogadores (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(100),
            gols INTEGER DEFAULT 0,
            nota INTEGER DEFAULT 0,
            posicao VARCHAR(1),
            disponivel BOOLEAN DEFAULT TRUE
        )
    """)

    conn.commit()

    cur.close()
    conn.close()


criar_tabela()


# =========================================
# HOME
# =========================================

@app.route('/')
def index():

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT *
        FROM jogadores
        ORDER BY gols DESC, nome
    """)

    jogadores = cur.fetchall()

    cur.close()
    conn.close()

    return render_template(
        'index.html',
        jogadores=jogadores
    )


# =========================================
# ADICIONAR JOGADOR
# =========================================

@app.route('/adicionar', methods=['POST'])
def adicionar():

    nome = request.form['nome'].upper()
    nota = request.form['nota']
    posicao = request.form['posicao']

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO jogadores
        (nome, gols, nota, posicao)
        VALUES (%s, 0, %s, %s)
    """, (nome, nota, posicao))

    conn.commit()

    cur.close()
    conn.close()

    return redirect('/')


# =========================================
# EXCLUIR
# =========================================

@app.route('/excluir/<int:id>')
def excluir(id):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        DELETE FROM jogadores
        WHERE id = %s
    """, (id,))

    conn.commit()

    cur.close()
    conn.close()

    return redirect('/')


# =========================================
# GOL +
# =========================================

@app.route('/gol/<int:id>')
def gol(id):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE jogadores
        SET gols = gols + 1
        WHERE id = %s
    """, (id,))

    conn.commit()

    cur.close()
    conn.close()

    return redirect('/')


# =========================================
# GOL -
# =========================================

@app.route('/tirar_gol/<int:id>')
def tirar_gol(id):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE jogadores
        SET gols = CASE
            WHEN gols > 0 THEN gols - 1
            ELSE 0
        END
        WHERE id = %s
    """, (id,))

    conn.commit()

    cur.close()
    conn.close()

    return redirect('/')


# =========================================
# EDITAR JOGADOR
# =========================================

@app.route('/editar/<int:id>', methods=['POST'])
def editar(id):

    nome = request.form['nome'].upper()
    nota = request.form['nota']
    posicao = request.form['posicao']

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE jogadores
        SET nome = %s,
            nota = %s,
            posicao = %s
        WHERE id = %s
    """, (nome, nota, posicao, id))

    conn.commit()

    cur.close()
    conn.close()

    return redirect('/')


# =========================================
# DISPONÍVEL
# =========================================

@app.route('/disponivel/<int:id>')
def disponivel(id):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE jogadores
        SET disponivel = NOT disponivel
        WHERE id = %s
    """, (id,))

    conn.commit()

    cur.close()
    conn.close()

    return redirect('/')


# =========================================
# SORTEAR TIMES
# =========================================

@app.route('/sortear')
def sortear():

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT nome, nota, posicao
        FROM jogadores
        WHERE disponivel = TRUE
    """)

    jogadores = cur.fetchall()

    cur.close()
    conn.close()

    lista = []

    for jogador in jogadores:
        lista.append({
            'nome': jogador[0],
            'nota': jogador[1],
            'posicao': jogador[2]
        })

    random.shuffle(lista)

    time1 = []
    time2 = []
    time3 = []

    for i, jogador in enumerate(lista):

        if i % 3 == 0:
            time1.append(jogador)

        elif i % 3 == 1:
            time2.append(jogador)

        else:
            time3.append(jogador)

    return render_template(
        'times.html',
        time1=time1,
        time2=time2,
        time3=time3
    )


# =========================================
# RANKING GOLEIROS
# =========================================

@app.route('/goleiros')
def goleiros():

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT nome, gols
        FROM jogadores
        WHERE posicao = 'G'
        ORDER BY gols ASC
    """)

    goleiros = cur.fetchall()

    cur.close()
    conn.close()

    return render_template(
        'goleiros.html',
        goleiros=goleiros
    )


# =========================================
# START
# =========================================

if __name__ == '__main__':
    app.run(debug=True)