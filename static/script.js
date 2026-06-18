// =========================================
// LISTAR JOGADORES
// =========================================

async function carregarJogadores() {

    try {

        const resposta = await fetch("/jogadores");

        if (!resposta.ok) {
            throw new Error(
                `Erro HTTP ${resposta.status}`
            );
        }

        const jogadores = await resposta.json();

        const tabelaJogadores =
            document.getElementById(
                "listaJogadores"
            );

        const tabelaGoleiros =
            document.getElementById(
                "listaGoleiros"
            );

        tabelaJogadores.innerHTML = "";
        tabelaGoleiros.innerHTML = "";

        jogadores.forEach(j => {

            const nomeSeguro =
                j.nome.replace(/'/g, "\\'");

            if (j.posicao === "G") {

                tabelaGoleiros.innerHTML += `
                <tr>

                    <td>${j.nome}</td>

                    <td>
                        ${j.jogos}

                        <button
                            class="btn btn-success btn-sm"
                            onclick="alterar(${j.id},'jogos','somar')"
                        >
                            +
                        </button>

                        <button
                            class="btn btn-danger btn-sm"
                            onclick="alterar(${j.id},'jogos','subtrair')"
                        >
                            -
                        </button>
                    </td>

                    <td>
                        ${j.vitorias}

                        <button
                            class="btn btn-success btn-sm"
                            onclick="alterar(${j.id},'vitorias','somar')"
                        >
                            +
                        </button>

                        <button
                            class="btn btn-danger btn-sm"
                            onclick="alterar(${j.id},'vitorias','subtrair')"
                        >
                            -
                        </button>
                    </td>

                    <td>

                        <button
                            class="btn btn-primary btn-sm"
                            onclick="editarJogador(
                                ${j.id},
                                '${nomeSeguro}',
                                '${j.posicao}',
                                '${j.nota}'
                            )"
                        >
                            Editar
                        </button>

                        <button
                            class="btn btn-danger btn-sm"
                            onclick="excluirJogador(${j.id})"
                        >
                            Excluir
                        </button>

                    </td>

                </tr>
                `;

            } else {

                tabelaJogadores.innerHTML += `
                <tr>

                    <td>${j.nome}</td>

                    <td>${j.posicao}</td>

                    <td>
                        ${j.gols}

                        <button
                            class="btn btn-success btn-sm"
                            onclick="alterar(${j.id},'gols','somar')"
                        >
                            +
                        </button>

                        <button
                            class="btn btn-danger btn-sm"
                            onclick="alterar(${j.id},'gols','subtrair')"
                        >
                            -
                        </button>
                    </td>

                    <td>
                        ${j.jogos}

                        <button
                            class="btn btn-success btn-sm"
                            onclick="alterar(${j.id},'jogos','somar')"
                        >
                            +
                        </button>

                        <button
                            class="btn btn-danger btn-sm"
                            onclick="alterar(${j.id},'jogos','subtrair')"
                        >
                            -
                        </button>
                    </td>

                    <td>
                        ${j.vitorias}

                        <button
                            class="btn btn-success btn-sm"
                            onclick="alterar(${j.id},'vitorias','somar')"
                        >
                            +
                        </button>

                        <button
                            class="btn btn-danger btn-sm"
                            onclick="alterar(${j.id},'vitorias','subtrair')"
                        >
                            -
                        </button>
                    </td>

                    <td>

                        <button
                            class="btn btn-primary btn-sm"
                            onclick="editarJogador(
                                ${j.id},
                                '${nomeSeguro}',
                                '${j.posicao}',
                                '${j.nota}'
                            )"
                        >
                            Editar
                        </button>

                        <button
                            class="btn btn-danger btn-sm"
                            onclick="excluirJogador(${j.id})"
                        >
                            Excluir
                        </button>

                    </td>

                </tr>
                `;
            }

        });

    } catch (erro) {

        console.error(
            "Erro ao carregar jogadores:",
            erro
        );

    }

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

    if (!nome) {
        alert("Informe o nome");
        return;
    }

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
    carregarRanking();

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
        prompt("Nome:", nomeAtual);

    if (!nome) return;

    const posicao =
        prompt("Posição:", posicaoAtual);

    if (!posicao) return;

    const nota =
        prompt("Nota:", notaAtual);

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
    carregarRanking();

}


// =========================================
// EXCLUIR
// =========================================

async function excluirJogador(id) {

    if (!confirm(
        "Deseja excluir este jogador?"
    )) {
        return;
    }

    await fetch(`/jogadores/${id}`, {
        method: "DELETE"
    });

    carregarJogadores();
    carregarRanking();

}


// =========================================
// ALTERAR ESTATÍSTICAS
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
    carregarRanking();

}


// =========================================
// RANKING
// =========================================

async function carregarRanking() {

    try {

        const resposta =
            await fetch(
                "/ranking/artilharia"
            );

        if (!resposta.ok) {
            throw new Error(
                "Erro ao carregar ranking"
            );
        }

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
                        ${index + 1}º ${j.nome}
                    </span>

                    <strong>
                        ${j.gols} gols
                    </strong>

                </div>
            `;

        });

    } catch (erro) {

        console.error(
            "Erro ao carregar ranking:",
            erro
        );

    }

}


// =========================================
// GERAR IMAGEM TOP 10
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

window.onload = () => {

    carregarJogadores();
    carregarRanking();

}