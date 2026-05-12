from flask import Flask, render_template, request, jsonify
import psycopg2
import os

app = Flask(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)

@app.route('/')
def index():

    return render_template('index.html')

@app.route('/jogadores')
def jogadores():

    cur = conn.cursor()

    cur.execute('''
        SELECT
            id,
            nome,
            posicao,
            gols,
            nota,
            COALESCE(jogos,0)
        FROM jogadores
        ORDER BY nome
    ''')

    dados = cur.fetchall()

    cur.close()

    lista = []

    for j in dados:

        lista.append({
            'id': j[0],
            'nome': j[1],
            'posicao': j[2],
            'gols': j[3],
            'nota': float(j[4]),
            'jogos': j[5]
        })

    return jsonify(lista)

@app.route('/jogadores', methods=['POST'])
def add_jogador():

    dados = request.json

    nome = dados['nome'].upper()
    posicao = dados['posicao'].upper()
    nota = dados['nota']

    cur = conn.cursor()

    cur.execute('''
        INSERT INTO jogadores
        (nome, posicao, gols, nota, jogos)
        VALUES (%s,%s,0,%s,0)
    ''', (nome, posicao, nota))

    conn.commit()

    cur.close()

    return jsonify({'ok': True})

@app.route('/gol', methods=['POST'])
def gol():

    dados = request.json

    cur = conn.cursor()

    cur.execute('''
        UPDATE jogadores
        SET gols = gols + 1
        WHERE id = %s
    ''', (dados['id'],))

    conn.commit()

    cur.close()

    return jsonify({'ok': True})

@app.route('/remover-gol', methods=['POST'])
def remover_gol():

    dados = request.json

    cur = conn.cursor()

    cur.execute('''
        UPDATE jogadores
        SET gols = CASE
            WHEN gols > 0 THEN gols - 1
            ELSE 0
        END
        WHERE id = %s
    ''', (dados['id'],))

    conn.commit()

    cur.close()

    return jsonify({'ok': True})

@app.route('/editar-jogador', methods=['POST'])
def editar_jogador():

    dados = request.json

    cur = conn.cursor()

    cur.execute('''
        UPDATE jogadores
        SET
            nome = %s,
            posicao = %s,
            nota = %s
        WHERE id = %s
    ''', (
        dados['nome'].upper(),
        dados['posicao'].upper(),
        dados['nota'],
        dados['id']
    ))

    conn.commit()

    cur.close()

    return jsonify({'ok': True})

@app.route('/excluir-jogador', methods=['POST'])
def excluir_jogador():

    dados = request.json

    cur = conn.cursor()

    cur.execute('DELETE FROM jogadores WHERE id = %s', (dados['id'],))

    conn.commit()

    cur.close()

    return jsonify({'ok': True})

@app.route('/adicionar-jogo', methods=['POST'])
def adicionar_jogo():

    dados = request.json

    ids = dados['ids']

    cur = conn.cursor()

    for jogador_id in ids:

        cur.execute('''
            UPDATE jogadores
            SET jogos = jogos + 1
            WHERE id = %s
        ''', (jogador_id,))

    conn.commit()

    cur.close()

    return jsonify({'ok': True})

if __name__ == '__main__':

    app.run(debug=True)