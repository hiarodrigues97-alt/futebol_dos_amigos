
// =========================================
// LISTAR JOGADORES
// =========================================

async function carregarJogadores() {

    const resposta =
        await fetch("/jogadores");

    const jogadores =
        await resposta.json();

    const tabela =
        document.getElementById(
            "listaJogadores"
        );

    tabela.innerHTML = "";

    jogadores.forEach(j => {

        tabela.innerHTML += `
        <tr>

            <td>${j.nome}</td>

            <td>${j.posicao}</td>

            <td>

                ${j.gols}

                <button
                    class="btn btn-success btn-sm"
                    onclick="alterar(
                        ${j.id},
                        'gols',
                        'somar'
                    )"
                >
                    +
                </button>

                <button
                    class="btn btn-danger btn-sm"
                    onclick="alterar(
                        ${j.id},
                        'gols',
                        'subtrair'
                    )"
                >
                    -
                </button>

            </td>

            <td>

                ${j.jogos}

                <button
                    class="btn btn-success btn-sm"
                    onclick="alterar(
                        ${j.id},
                        'jogos',
                        'somar'
                    )"
                >
                    +
                </button>

                <button
                    class="btn btn-danger btn-sm"
                    onclick="alterar(
                        ${j.id},
                        'jogos',
                        'subtrair'
                    )"
                >
                    -
                </button>

            </td>

            <td>

                ${j.vitorias}

                <button
                    class="btn btn-success btn-sm"
                    onclick="alterar(
                        ${j.id},
                        'vitorias',
                        'somar'
                    )"
                >
                    +
                </button>

                <button
                    class="btn btn-danger btn-sm"
                    onclick="alterar(
                        ${j.id},
                        'vitorias',
                        'subtrair'
                    )"
                >
                    -
                </button>

            </td>

            <td>

                <button
                    class="btn btn-primary btn-sm"
                    onclick="editarJogador(
                        ${j.id},
                        '${j.nome}',
                        '${j.posicao}',
                        '${j.nota}'
                    )"
                >
                    Editar
                </button>

                <button
                    class="btn btn-danger btn-sm"
                    onclick="excluirJogador(
                        ${j.id}
                    )"
                >
                    Excluir
                </button>

            </td>

        </tr>
        `;
    });

}


// =========================================
// CADASTRAR
// =========================================

async function addJogador() {

    const nome =
        document.getElementById("nome").value;

    const posicao =
        document.getElementById("posicao").value;

    const nota =
        document.getElementById("nota").value;

    await fetch("/jogadores", {

        method: "POST",

        headers: {
            "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
            nome,
            posicao,
            nota
        })

    });

    document.getElementById("nome").value = "";
    document.getElementById("nota").value = "";

    carregarJogadores();

}


// =========================================
// EDITAR
// =========================================

async function editarJogador(
    id,
    nomeAtual,
    posicaoAtual,
    notaAtual
) {

    const nome =
        prompt("Nome", nomeAtual);

    if (!nome) return;

    const posicao =
        prompt(
            "Posição",
            posicaoAtual
        );

    if (!posicao) return;

    const nota =
        prompt(
            "Nota",
            notaAtual
        );

    await fetch(`/jogadores/${id}`, {

        method: "PUT",

        headers: {
            "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
            nome,
            posicao,
            nota
        })

    });

    carregarJogadores();

}


// =========================================
// EXCLUIR
// =========================================

async function excluirJogador(id) {

    if (!confirm(
        "Excluir jogador?"
    )) return;

    await fetch(`/jogadores/${id}`, {

        method: "DELETE"

    });

    carregarJogadores();

}


// =========================================
// ALTERAR ESTATÍSTICA
// =========================================

async function alterar(
    id,
    campo,
    acao
) {

    await fetch(
        `/jogadores/${id}/estatistica`,
        {

            method: "POST",

            headers: {
                "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
                campo,
                acao
            })

        }
    );

    carregarJogadores();

}


// =========================================
// TOP 10
// =========================================

async function carregarRanking() {

    const resposta =
        await fetch(
            "/ranking/artilharia"
        );

    const ranking =
        await resposta.json();

    const div =
        document.getElementById(
            "ranking"
        );

    div.innerHTML = "";

    ranking.forEach((j, index) => {

        div.innerHTML += `
            <div class="ranking-item">

                <span>
                    ${index + 1}º
                    ${j.nome}
                </span>

                <strong>
                    ${j.gols} gols
                </strong>

            </div>
        `;

    });

}


// =========================================
// GERAR IMAGEM
// =========================================

function gerarTop10() {

    window.open(
        "/top10-imagem",
        "_blank"
    );

}


// =========================================
// START
// =========================================

carregarJogadores();
carregarRanking();

