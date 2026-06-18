async function carregarJogadores() {

    console.log("Entrou na função");

    const resposta = await fetch("/jogadores");

    console.log("Resposta:", resposta);

    const jogadores = await resposta.json();

    console.log("Jogadores:", jogadores);

    try {

        const resposta = await fetch("/jogadores");

        if (!resposta.ok) {
            throw new Error("Erro ao carregar jogadores");
        }

        const jogadores = await resposta.json();

        const tabelaJogadores =
            document.getElementById("listaJogadores");

        const tabelaGoleiros =
            document.getElementById("listaGoleiros");

        if (!tabelaJogadores) {
            console.error("Elemento listaJogadores não encontrado.");
            return;
        }

        if (!tabelaGoleiros) {
            console.error("Elemento listaGoleiros não encontrado.");
            return;
        }

        tabelaJogadores.innerHTML = "";
        tabelaGoleiros.innerHTML = "";

        jogadores.forEach(j => {

            const linha = `
                <tr>

                    <td>${j.nome}</td>

                    ${j.posicao !== "G"
                        ? `<td>${j.posicao}</td>`
                        : ""}

                    ${j.posicao !== "G"
                        ? `
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
                        `
                        : ""}

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

            if (j.posicao === "G") {
                tabelaGoleiros.innerHTML += linha;
            } else {
                tabelaJogadores.innerHTML += linha;
            }

        });

        console.log(
            `Carregados ${jogadores.length} jogadores`
        );

    } catch (erro) {

        console.error(
            "Erro ao carregar jogadores:",
            erro
        );

    }

}