let TIMES = {
    time1: [],
    time2: [],
    time3: []
};

// =========================================
// LISTAR
// =========================================
async function listar() {

    const res = await fetch("/jogadores");

    const dados = await res.json();

    const listaJogadores =
        document.getElementById("listaJogadores");

    const listaGoleiros =
        document.getElementById("listaGoleiros");

    listaJogadores.innerHTML = "";
    listaGoleiros.innerHTML = "";

    // LINHA
    const linha = dados
        .filter(j => j.posicao !== "G")
        .sort((a, b) => b.gols - a.gols);

    // GOLEIROS
    const goleiros = dados
        .filter(j => j.posicao === "G")
        .sort((a, b) => a.gols - b.gols);

    linha.forEach(j => {

        listaJogadores.innerHTML += criarLinha(j);

    });

    goleiros.forEach(j => {

        listaGoleiros.innerHTML += criarLinha(j);

    });

    carregarRankingTimes();
}


// =========================================
// LINHA TABELA
// =========================================
function criarLinha(j) {

    return `
    <tr>

        <td>
            <input
                type="checkbox"
                class="disponivel"
                onchange="atualizarContador()"
                data-id="${j.id}"
                data-nome="${j.nome}"
                data-nota="${j.nota}"
                data-posicao="${j.posicao}"
            >
        </td>

        <td>${j.nome}</td>

        <td>${j.posicao}</td>

        <td>${j.gols}</td>

        <td>${j.jogos}</td>

        <td>${j.vitorias}</td>

        <td>${j.nota}</td>

        <td>

            <button
                class="btn btn-success btn-sm"
                onclick="gol(${j.id})"
            >
                +⚽
            </button>

            <button
                class="btn btn-warning btn-sm"
                onclick="removerGol(${j.id})"
            >
                -⚽
            </button>

            <button
                class="btn btn-primary btn-sm"
                onclick="editarJogador(${j.id}, '${j.nome}', '${j.posicao}', ${j.nota})"
            >
                ✏️
            </button>

            <button
                class="btn btn-danger btn-sm"
                onclick="excluirJogador(${j.id})"
            >
                🗑️
            </button>

        </td>

    </tr>
    `;
}


// =========================================
// CONTADOR
// =========================================
function atualizarContador() {

    const selecionados =
        document.querySelectorAll(".disponivel:checked").length;

    document.getElementById(
        "contadorSelecionados"
    ).innerHTML = `Selecionados: ${selecionados}`;

}


// =========================================
// ADD JOGADOR
// =========================================
async function addJogador() {

    let nome = document.getElementById("nome").value;

    let nota = document.getElementById("nota").value;

    let posicao = document.getElementById("posicao").value;

    if (!nome || !nota) {

        alert("Preencha os campos");

        return;
    }

    await fetch("/jogadores", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            nome,
            nota,
            posicao
        })

    });

    document.getElementById("nome").value = "";
    document.getElementById("nota").value = "";

    listar();

}


// =========================================
// GOL
// =========================================
async function gol(id) {

    await fetch("/gol", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({id})

    });

    listar();

}


// =========================================
// REMOVER GOL
// =========================================
async function removerGol(id) {

    await fetch("/remover-gol", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({id})

    });

    listar();

}


// =========================================
// EXCLUIR
// =========================================
async function excluirJogador(id) {

    if (!confirm("Deseja excluir?")) return;

    await fetch("/excluir-jogador", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({id})

    });

    listar();

}


// =========================================
// EDITAR
// =========================================
async function editarJogador(id, nomeAtual, posicaoAtual, notaAtual) {

    const nome = prompt("Nome", nomeAtual);

    if (!nome) return;

    const posicao = prompt(
        "Posição (A/M/Z/G)",
        posicaoAtual
    );

    if (!posicao) return;

    const nota = prompt(
        "Nota",
        notaAtual
    );

    if (!nota) return;

    await fetch("/editar-jogador", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            id,
            nome,
            posicao,
            nota
        })

    });

    listar();

}

listar();