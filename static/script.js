async function listar() {

    let res = await fetch("/jogadores");

    let dados = await res.json();

    let lista = document.getElementById("lista");
    let listaGoleiros = document.getElementById("listaGoleiros");

    lista.innerHTML = "";
    listaGoleiros.innerHTML = "";

    // JOGADORES DE LINHA

    dados
    .filter(j => j.posicao !== "G")
    .forEach(j => {

        let botoes = "";

        if (TIPO_USUARIO === "admin") {

            botoes = `
                <button
                    class="btn btn-success btn-sm"
                    onclick="gol(${j.id})"
                >
                    + Gol
                </button>

                <button
                    class="btn btn-warning btn-sm"
                    onclick="removerGol(${j.id})"
                >
                    - Gol
                </button>

                <button
                    class="btn btn-danger btn-sm"
                    onclick="excluirJogador(${j.id})"
                >
                    Excluir
                </button>
            `;
        }

        lista.innerHTML += `
        <tr>

            <td>
                <input
                    type="checkbox"
                    class="disponivel"
                    onchange="atualizarContador()"
                    data-id="${j.id}"
                    data-nota="${j.nota}"
                    data-nome="${j.nome}"
                >
            </td>

            <td>${j.nome}</td>
            <td>${j.posicao}</td>
            <td>${j.gols}</td>
            <td>${j.nota}</td>

            ${TIPO_USUARIO === "admin" ? `<td>${botoes}</td>` : ""}

        </tr>
        `;
    });

    // GOLEIROS

    dados
    .filter(j => j.posicao === "G")
    .sort((a, b) => a.gols - b.gols)
    .forEach(j => {

        let botoes = "";

        if (TIPO_USUARIO === "admin") {

            botoes = `
                <button
                    class="btn btn-danger btn-sm"
                    onclick="gol(${j.id})"
                >
                    + Sofrido
                </button>

                <button
                    class="btn btn-warning btn-sm"
                    onclick="removerGol(${j.id})"
                >
                    - Sofrido
                </button>
            `;
        }

        listaGoleiros.innerHTML += `
        <tr>

            <td>${j.nome}</td>

            <td>${j.gols}</td>

            <td>${j.nota}</td>

            ${TIPO_USUARIO === "admin" ? `<td>${botoes}</td>` : ""}

        </tr>
        `;
    });
}