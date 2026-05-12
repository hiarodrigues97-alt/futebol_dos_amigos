from flask import Flask, render_template, request, jsonify
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