from flask import Flask, render_template, request, redirect
import psycopg2
import os
import random

app = Flask(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")


def get_db_connection():
    return psycopg2.connect(
        DATABASE_URL,
        sslmode='require'
    )


@app.route('/')
def index():

    conn = get_db_connection()
    cur = conn.cursor()

    # Jogadores de linha
    cur.execute("""
        SELECT *
        FROM jogadores
        WHERE posicao != 'G'
        ORDER BY gols DESC, nota DESC
    """)
    jogadores = cur.fetchall()

    # Goleiros
    cur.execute("""
        SELECT *
        FROM jogadores
        WHERE posicao = 'G'
        ORDER BY gols_sofridos ASC
    """)
    goleiros = cur.fetchall()

    cur.close()
    conn.close()

    return render_template(
        'index.html',
        jogadores=jogadores,
        goleiros=goleiros
    )


@app.route('/adicionar', methods=['POST'])
def adicionar():

    nome = request.form['nome'].upper()
    posicao = request.form['posicao']
    nota = int(request.form['nota'])

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO jogadores
        (nome, posicao, nota, gols, gols_sofridos)
        VALUES (%s, %s, %s, 0, 0)
    """, (nome, posicao, nota))

    conn.commit()

    cur.close()
    conn.close()

    return redirect('/')


@app.route('/editar_jogador/<int:id>', methods=['POST'])
def editar_jogador(id):

    nome = request.form['nome'].upper()
    posicao = request.form['posicao']
    nota = int(request.form['nota'])

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE jogadores
        SET nome = %s,
            posicao = %s,
            nota = %s
        WHERE id = %s
    """, (nome, posicao, nota, id))

    conn.commit()

    cur.close()
    conn.close()

    return redirect('/')


@app.route('/deletar/<int:id>')
def deletar(id):

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("DELETE FROM jogadores WHERE id = %s", (id,))

    conn.commit()

    cur.close()
    conn.close()

    return redirect('/')


@app.route('/gol/<int:id>')
def gol(id):

    conn = get_db_connection()
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


@app.route('/gol_sofrido/<int:id>')
def gol_sofrido(id):

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE jogadores
        SET gols_sofridos = gols_sofridos + 1
        WHERE id = %s
    """, (id,))

    conn.commit()

    cur.close()
    conn.close()

    return redirect('/')


@app.route('/sortear')
def sortear():

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT *
        FROM jogadores
        ORDER BY RANDOM()
    """)

    jogadores = cur.fetchall()

    cur.close()
    conn.close()

    random.shuffle(jogadores)

    time1 = jogadores[0::3]
    time2 = jogadores[1::3]
    time3 = jogadores[2::3]

    return render_template(
        'index.html',
        jogadores=[],
        goleiros=[],
        time1=time1,
        time2=time2,
        time3=time3
    )


if __name__ == '__main__':
    app.run(debug=True)