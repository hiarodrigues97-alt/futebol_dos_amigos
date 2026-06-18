async function carregarJogadores() {

    try {

        console.log("Carregando jogadores...");

        const resposta = await fetch("/jogadores");

        if (!resposta.ok) {
            throw new Error(
                `Erro HTTP: ${resposta.status}`
            );
        }

        const jogadores = await resposta.json();

        console.log(jogadores);

        const tabelaJogadores =
            document.getElementById("listaJogadores");

        const tabelaGoleiros =
            document.getElementById("listaGoleiros");

        if (!tabelaJogadores) {
            console.error("listaJogadores não encontrada");
            return;
        }

        if (!tabelaGoleiros) {
            console.error("listaGoleiros não encontrada");
            return;
        }

        tabelaJogadores.innerHTML = "";
        tabelaGoleiros.innerHTML = "";

        jogadores.forEach(j => {

            const linhaJogador = `
                <tr>
                    <td>${j.nome}</td>
                    <td>${j.posicao}</td>

                    <td>
                        ${j.gols}
                        <button class="btn btn-success btn-sm"
                            onclick="alterar(${j.id},'gols','somar')">
                            +
                        </button>
                        <button class="btn btn-danger btn-sm"
                            onclick="alterar(${j.id},'gols','subtrair')">
                            -
                        </button>
                    </td>

                    <td>
                        ${j.jogos}
                        <button class="btn btn-success btn-sm"
                            onclick="alterar(${j.id},'jogos','somar')">
                            +
                        </button>
                        <button class="btn btn-danger btn-sm"
                            onclick="alterar(${j.id},'jogos','subtrair')">
                            -
                        </button>
                    </td>

                    <td>
                        ${j.vitorias}
                        <button class="btn btn-success btn-sm"
                            onclick="alterar(${j.id},'vitorias','somar')">
                            +
                        </button>
                        <button class="btn btn-danger btn-sm"
                            onclick="alterar(${j.id},'vitorias','subtrair')">
                            -
                        </button>
                    </td>

                    <td>
                        <button class="btn btn-primary btn-sm"
                            onclick="editarJogador(
                                ${j.id},
                                '${j.nome}',
                                '${j.posicao}',
                                '${j.nota}'
                            )">
                            Editar
                        </button>

                        <button class="btn btn-danger btn-sm"
                            onclick="excluirJogador(${j.id})">
                            Excluir
                        </button>
                    </td>
                </tr>
            `;

            const linhaGoleiro = `
                <tr>
                    <td>${j.nome}</td>

                    <td>
                        ${j.jogos}
                        <button class="btn btn-success btn-sm"
                            onclick="alterar(${j.id},'jogos','somar')">
                            +
                        </button>
                        <button class="btn btn-danger btn-sm"
                            onclick="alterar(${j.id},'jogos','subtrair')">
                            -
                        </button>
                    </td>

                    <td>
                        ${j.vitorias}
                        <button class="btn btn-success btn-sm"
                            onclick="alterar(${j.id},'vitorias','somar')">
                            +
                        </button>
                        <button class="btn btn-danger btn-sm"
                            onclick="alterar(${j.id},'vitorias','subtrair')">
                            -
                        </button>
                    </td>

                    <td>
                        <button class="btn btn-primary btn-sm"
                            onclick="editarJogador(
                                ${j.id},
                                '${j.nome}',
                                '${j.posicao}',
                                '${j.nota}'
                            )">
                            Editar
                        </button>

                        <button class="btn btn-danger btn-sm"
                            onclick="excluirJogador(${j.id})">
                            Excluir
                        </button>
                    </td>
                </tr>
            `;

            if (j.posicao === "G") {
                tabelaGoleiros.innerHTML += linhaGoleiro;
            } else {
                tabelaJogadores.innerHTML += linhaJogador;
            }

        });

    } catch (erro) {

        console.error(
            "Erro ao carregar jogadores:",
            erro
        );

    }

}
async function carregarRanking() {

    console.log("Entrou no ranking");

    const resposta =
        await fetch("/ranking/artilharia");

    console.log("Resposta ranking:", resposta);

    const ranking =
        await resposta.json();

    console.log("Dados ranking:", ranking);

    const div =
        document.getElementById("ranking");

    div.innerHTML = "";

    ranking.forEach((j, index) => {

        div.innerHTML += `
            <div class="ranking-item">
                <span>${index + 1}º ${j.nome}</span>
                <strong>${j.gols} gols</strong>
            </div>
        `;

    });

}

// =========================================
// START
// =========================================

window.onload = function () {

    carregarJogadores();
    carregarRanking();

};