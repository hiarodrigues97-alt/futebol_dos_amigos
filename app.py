from flask import Flask, jsonify, request
import psycopg2
import psycopg2.extras
import os

app = Flask(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")


# ==================================================
# CONEXÃO
# ==================================================
def conectar():
    return psycopg2.connect(DATABASE_URL)


# ==================================================
# HOME
# ==================================================
@app.route("/")
def home():
    return jsonify({
        "sistema": "Futebol dos Amigos",
        "status": "online"
    })


# ==================================================
# LISTAR JOGADORES
# ==================================================
@app.route("/jogadores", methods=["GET"])
def listar_jogadores():

    conn = conectar()

    cur = conn.cursor(
        cursor_factory=psycopg2.extras.RealDictCursor
    )

    cur.execute("""
        SELECT
            id,
            nome,
            posicao,
            nota,
            COALESCE(gols,0) as gols,
            COALESCE(jogos,0) as jogos,
            COALESCE(vitorias,0) as vitorias
        FROM jogadores
        ORDER BY nome
    """)

    dados = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify(dados)


# ==================================================
# CADASTRAR JOGADOR
# ==================================================
@app.route("/jogadores", methods=["POST"])
def cadastrar_jogador():

    dados = request.json

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
        dados["nome"].upper(),
        dados["posicao"],
        dados["nota"]
    ))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({
        "ok": True,
        "mensagem": "Jogador cadastrado"
    })


# ==================================================
# EDITAR JOGADOR
# ==================================================
@app.route("/jogadores/<int:id>", methods=["PUT"])
def editar_jogador(id):

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
        dados["nome"].upper(),
        dados["posicao"],
        dados["nota"],
        id
    ))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({
        "ok": True,
        "mensagem": "Jogador atualizado"
    })


# ==================================================
# EXCLUIR JOGADOR
# ==================================================
@app.route("/jogadores/<int:id>", methods=["DELETE"])
def excluir_jogador(id):

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        DELETE FROM jogadores
        WHERE id = %s
    """, (id,))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({
        "ok": True,
        "mensagem": "Jogador removido"
    })


# ==================================================
# ATUALIZAR ESTATÍSTICAS
# ==================================================
@app.route("/jogadores/<int:id>/estatistica", methods=["POST"])
def atualizar_estatistica(id):

    dados = request.json

    campo = dados["campo"]
    acao = dados["acao"]

    campos_validos = [
        "gols",
        "jogos",
        "vitorias"
    ]

    if campo not in campos_validos:
        return jsonify({
            "erro": "Campo inválido"
        }), 400

    conn = conectar()
    cur = conn.cursor()

    if acao == "somar":

        cur.execute(f"""
            UPDATE jogadores
            SET {campo} = COALESCE({campo},0) + 1
            WHERE id = %s
        """, (id,))

    elif acao == "subtrair":

        cur.execute(f"""
            UPDATE jogadores
            SET {campo} =
                CASE
                    WHEN COALESCE({campo},0) > 0
                    THEN {campo} - 1
                    ELSE 0
                END
            WHERE id = %s
        """, (id,))

    else:

        return jsonify({
            "erro": "Ação inválida"
        }), 400

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({
        "ok": True
    })


# ==================================================
# TOP ARTILHEIROS
# ==================================================
@app.route("/ranking/artilharia")
def ranking_artilharia():

    conn = conectar()

    cur = conn.cursor(
        cursor_factory=psycopg2.extras.RealDictCursor
    )

    cur.execute("""
        SELECT
            nome,
            gols,
            jogos,
            vitorias
        FROM jogadores
        ORDER BY gols DESC, nome
        LIMIT 10
    """)

    dados = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify(dados)


# ==================================================
# TOP VITÓRIAS
# ==================================================
@app.route("/ranking/vitorias")
def ranking_vitorias():

    conn = conectar()

    cur = conn.cursor(
        cursor_factory=psycopg2.extras.RealDictCursor
    )

    cur.execute("""
        SELECT
            nome,
            vitorias,
            jogos,
            gols
        FROM jogadores
        ORDER BY vitorias DESC, nome
        LIMIT 10
    """)

    dados = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify(dados)


# ==================================================
# TOP PRESENÇA
# ==================================================
@app.route("/ranking/jogos")
def ranking_jogos():

    conn = conectar()

    cur = conn.cursor(
        cursor_factory=psycopg2.extras.RealDictCursor
    )

    cur.execute("""
        SELECT
            nome,
            jogos,
            gols,
            vitorias
        FROM jogadores
        ORDER BY jogos DESC, nome
        LIMIT 10
    """)

    dados = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify(dados)


# ==================================================
# START
# ==================================================
if __name__ == "__main__":
    app.run(debug=True)