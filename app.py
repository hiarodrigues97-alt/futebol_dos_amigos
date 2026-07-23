"""API Flask para gerenciamento de jogadores e rankings."""

import io
import os
from contextlib import contextmanager
from pathlib import Path

import psycopg2
import psycopg2.extras
from flask import Flask, jsonify, render_template, request, send_file
from PIL import Image, ImageDraw, ImageFont


app = Flask(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")
STATIC_DIR = Path(app.static_folder or Path(app.root_path) / "static")
BACKGROUND_IMAGE = Path(
    os.getenv("TOP10_BACKGROUND", str(STATIC_DIR / "fundo-ranking.png"))
)

ESTATISTICAS_VALIDAS = {"gols", "jogos", "vitorias"}
ORDENS_RANKING = {
    "artilharia": "gols",
    "vitorias": "vitorias",
    "jogos": "jogos",
}


def conectar():
    """Abre uma conexão com o PostgreSQL configurado em DATABASE_URL."""
    if not DATABASE_URL:
        raise RuntimeError("A variável de ambiente DATABASE_URL não foi configurada.")
    return psycopg2.connect(DATABASE_URL)


@contextmanager
def cursor_banco(dict_cursor=False):
    """Garante commit, rollback e fechamento da conexão em qualquer cenário."""
    conn = conectar()
    factory = psycopg2.extras.RealDictCursor if dict_cursor else None
    cur = conn.cursor(cursor_factory=factory)

    try:
        yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


@app.errorhandler(psycopg2.Error)
def erro_banco(erro):
    app.logger.exception("Erro no banco de dados: %s", erro)
    return jsonify(erro="Não foi possível concluir a operação no banco de dados."), 500


@app.errorhandler(RuntimeError)
def erro_configuracao(erro):
    app.logger.error("Erro de configuração: %s", erro)
    return jsonify(erro=str(erro)), 500


def dados_jogador_obrigatorios():
    """Lê e valida o corpo JSON usado ao criar ou editar um jogador."""
    dados = request.get_json(silent=True)
    if not isinstance(dados, dict):
        return None, (jsonify(erro="Envie um JSON válido."), 400)

    nome = str(dados.get("nome", "")).strip()
    posicao = str(dados.get("posicao", "")).strip().upper()
    nota = dados.get("nota")

    if not nome or not posicao or nota is None:
        return None, (
            jsonify(erro="Os campos nome, posicao e nota são obrigatórios."),
            400,
        )

    if len(nome) > 100 or len(posicao) > 20:
        return None, (jsonify(erro="Nome ou posição excede o tamanho permitido."), 400)

    try:
        nota = float(nota)
    except (TypeError, ValueError):
        return None, (jsonify(erro="nota deve ser numérica."), 400)

    return {"nome": nome.upper(), "posicao": posicao, "nota": nota}, None


def buscar_ranking(tipo):
    """Busca os dez primeiros jogadores de um ranking permitido."""
    coluna_ordenacao = ORDENS_RANKING[tipo]
    filtro_goleiro = "WHERE posicao <> 'G'" if tipo == "artilharia" else ""

    with cursor_banco(dict_cursor=True) as cur:
        cur.execute(
            f"""
            SELECT nome,
                   COALESCE(gols, 0) AS gols,
                   COALESCE(jogos, 0) AS jogos,
                   COALESCE(vitorias, 0) AS vitorias
            FROM jogadores
            {filtro_goleiro}
            ORDER BY {coluna_ordenacao} DESC, nome ASC
            LIMIT 10
            """
        )
        return cur.fetchall()


def carregar_fonte(tamanho):
    """Usa Arial quando disponível e mantém um fallback para outros sistemas."""
    try:
        return ImageFont.truetype("arial.ttf", tamanho)
    except OSError:
        return ImageFont.load_default()


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/jogadores", methods=["GET"])
def listar_jogadores():
    with cursor_banco(dict_cursor=True) as cur:
        cur.execute(
            """
            SELECT id, nome, posicao, nota,
                   COALESCE(gols, 0) AS gols,
                   COALESCE(jogos, 0) AS jogos,
                   COALESCE(vitorias, 0) AS vitorias
            FROM jogadores
            ORDER BY gols DESC, nome ASC
            """
        )
        jogadores = cur.fetchall()
    return jsonify(jogadores)


@app.route("/jogadores", methods=["POST"])
def cadastrar_jogador():
    jogador, erro = dados_jogador_obrigatorios()
    if erro:
        return erro

    with cursor_banco() as cur:
        cur.execute(
            """
            INSERT INTO jogadores (nome, posicao, nota, gols, jogos, vitorias)
            VALUES (%(nome)s, %(posicao)s, %(nota)s, 0, 0, 0)
            RETURNING id
            """,
            jogador,
        )
        jogador_id = cur.fetchone()[0]

    return jsonify(ok=True, mensagem="Jogador cadastrado.", id=jogador_id), 201


@app.route("/jogadores/<int:jogador_id>", methods=["PUT"])
def editar_jogador(jogador_id):
    jogador, erro = dados_jogador_obrigatorios()
    if erro:
        return erro

    jogador["id"] = jogador_id
    with cursor_banco() as cur:
        cur.execute(
            """
            UPDATE jogadores
            SET nome = %(nome)s, posicao = %(posicao)s, nota = %(nota)s
            WHERE id = %(id)s
            """,
            jogador,
        )
        if cur.rowcount == 0:
            return jsonify(erro="Jogador não encontrado."), 404

    return jsonify(ok=True, mensagem="Jogador atualizado.")


@app.route("/jogadores/<int:jogador_id>", methods=["DELETE"])
def excluir_jogador(jogador_id):
    with cursor_banco() as cur:
        cur.execute("DELETE FROM jogadores WHERE id = %s", (jogador_id,))
        if cur.rowcount == 0:
            return jsonify(erro="Jogador não encontrado."), 404

    return jsonify(ok=True, mensagem="Jogador removido.")


@app.route("/jogadores/<int:jogador_id>/estatistica", methods=["POST"])
def atualizar_estatistica(jogador_id):
    dados = request.get_json(silent=True)
    if not isinstance(dados, dict):
        return jsonify(erro="Envie um JSON válido."), 400

    campo = dados.get("campo")
    acao = dados.get("acao")
    if campo not in ESTATISTICAS_VALIDAS:
        return jsonify(erro="Campo inválido."), 400
    if acao not in {"somar", "subtrair"}:
        return jsonify(erro="Ação inválida. Use 'somar' ou 'subtrair'."), 400

    operador = "+ 1" if acao == "somar" else "- 1"
    expressao = (
        f"COALESCE({campo}, 0) {operador}"
        if acao == "somar"
        else f"GREATEST(COALESCE({campo}, 0) {operador}, 0)"
    )

    with cursor_banco() as cur:
        # campo e expressao são formados exclusivamente a partir de listas permitidas acima.
        cur.execute(
            f"UPDATE jogadores SET {campo} = {expressao} WHERE id = %s",
            (jogador_id,),
        )
        if cur.rowcount == 0:
            return jsonify(erro="Jogador não encontrado."), 404

    return jsonify(ok=True, mensagem="Estatística atualizada.")


@app.route("/ranking/<string:tipo>")
def ranking(tipo):
    if tipo not in ORDENS_RANKING:
        return jsonify(erro="Ranking não encontrado."), 404
    return jsonify(buscar_ranking(tipo))


@app.route("/top10-imagem")
def top10_imagem():
    if not BACKGROUND_IMAGE.is_file():
        return jsonify(
            erro=f"Imagem de fundo não encontrada: {BACKGROUND_IMAGE}"
        ), 500

    ranking = buscar_ranking("artilharia")
    imagem = Image.open(BACKGROUND_IMAGE).convert("RGB")
    draw = ImageDraw.Draw(imagem)

    fonte_titulo = carregar_fonte(42)
    fonte_nome = carregar_fonte(34)
    fonte_gols = carregar_fonte(34)

    draw.rectangle((720, 300, 1365, 1280), fill=(0, 0, 0))
    draw.text((760, 120), "TOP 10", fill=(255, 193, 7), font=fonte_titulo)
    draw.text((760, 170), "ARTILHEIROS", fill=(255, 255, 255), font=fonte_titulo)

    for posicao, jogador in enumerate(ranking, start=1):
        y = 300 + (posicao - 1) * 85
        draw.text((760, y), f"{posicao}º", fill=(255, 193, 7), font=fonte_titulo)
        draw.text((860, y), str(jogador["nome"]), fill=(255, 255, 255), font=fonte_nome)
        draw.text(
            (1180, y),
            f"{jogador['gols']} gols",
            fill=(255, 193, 7),
            font=fonte_gols,
        )

    buffer = io.BytesIO()
    imagem.save(buffer, format="PNG")
    buffer.seek(0)
    return send_file(buffer, mimetype="image/png", download_name="top10-artilheiros.png")


if __name__ == "__main__":
    # Em produção, execute a aplicação com um servidor WSGI (Gunicorn, Waitress etc.).
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=False)
