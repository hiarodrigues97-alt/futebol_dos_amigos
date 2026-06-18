
async function carregarJogadores() {

    const resposta =
        await fetch("/jogadores");

    const jogadores =
        await resposta.json();

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

        // GOLEIROS
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
                            '${j.nome}',
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

        // JOGADORES DE LINHA
        else {

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
                            '${j.nome}',
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

}

