let TIMES = {
    time1: [],
    time2: [],
    time3: []
};

// =========================================
// LISTAR
// =========================================
async function listar() {

    let res = await fetch("/jogadores");

    let dados = await res.json();

    let listaLinha = document.getElementById("listaJogadores");

    let listaGoleiros = document.getElementById("listaGoleiros");

    listaLinha.innerHTML = "";

    listaGoleiros.innerHTML = "";

    dados.forEach(j => {

        let linha = `
        <tr>

            <td>
                <input
                    type="checkbox"
                    class="disponivel"
                    data-id="${j.id}"
                    data-nome="${j.nome}"
                    data-posicao="${j.posicao}"
                    data-nota="${j.nota}"
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
                    onclick="editarJogador(${j.id}, '${j.nome}', '${j.posicao}', '${j.nota}')"
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

        if (j.posicao === "G") {

            listaGoleiros.innerHTML += linha;

        } else {

            listaLinha.innerHTML += linha;
        }

    });

    carregarRankingTimes();

    carregarDashboard();
}


// =========================================
// ADD
// =========================================
async function addJogador() {

    let nome = document.getElementById("nome").value;

    let posicao = document.getElementById("posicao").value;

    let nota = document.getElementById("nota").value;

    await fetch("/jogadores", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            nome,
            posicao,
            nota
        })

    });

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

    let nome = prompt("Nome", nomeAtual);

    let posicao = prompt("Posição", posicaoAtual);

    let nota = prompt("Nota", notaAtual);

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


// =========================================
// SORTEAR
// =========================================
function sortear() {

    let checks = document.querySelectorAll(".disponivel:checked");

    let jogadores = [];

    checks.forEach(c => {

        jogadores.push({
            id: c.dataset.id,
            nome: c.dataset.nome,
            posicao: c.dataset.posicao,
            nota: c.dataset.nota
        });

    });

    TIMES.time1 = jogadores.slice(0,7);

    TIMES.time2 = jogadores.slice(7,14);

    TIMES.time3 = jogadores.slice(14,21);

    renderizarTimes();
}


// =========================================
// RENDERIZAR
// =========================================
function renderizarTimes() {

    let area = document.getElementById("areaTimes");

    area.innerHTML = "";

    Object.entries(TIMES).forEach(([nome, jogadores], index) => {

        area.innerHTML += `
            <div class="col-md-4 mb-4">

                <div class="card p-3">

                    <h2>
                        Time ${index + 1}
                    </h2>

                    <div class="campo" id="${nome}"></div>

                    <button
                        class="btn btn-success btn-vitoria"
                        onclick="salvarVitoria(${index + 1})"
                    >
                        🏆 Registrar Vitória
                    </button>

                </div>

            </div>
        `;

        let campo = document.getElementById(nome);

        jogadores.forEach((j, i) => {

            let div = document.createElement("div");

            div.className = "jogador-campo";

            div.style.top = `${15 + (i * 10)}%`;

            div.style.left = `50%`;

            div.innerHTML = `
                <div class="icone-jogador">
                    ⚽
                </div>

                <div class="nome-jogador">
                    ${j.nome}
                </div>
            `;

            campo.appendChild(div);

        });

    });

}


// =========================================
// REGISTRAR JOGOS
// =========================================
async function registrarJogos() {

    let ids = [];

    Object.values(TIMES).forEach(time => {

        time.forEach(j => {

            ids.push(j.id);

        });

    });

    await fetch("/registrar-jogo", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            jogadores: ids
        })

    });

    alert("Jogos registrados!");

    listar();
}


// =========================================
// SALVAR VITÓRIA
// =========================================
async function salvarVitoria(numero) {

    await fetch("/salvar-partida", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            nome_time: `TIME ${numero}`
        })

    });

    carregarRankingTimes();

    alert("Vitória salva!");
}


// =========================================
// RANKING
// =========================================
async function carregarRankingTimes() {

    let res = await fetch("/ranking-times");

    let dados = await res.json();

    let div = document.getElementById("rankingTimes");

    div.innerHTML = "";

    dados.forEach(t => {

        div.innerHTML += `
            <div class="card-ranking">
                🏆 ${t.nome_time} - ${t.vitorias}
            </div>
        `;

    });

}


// =========================================
// DASHBOARD
// =========================================
async function carregarDashboard() {

    let res = await fetch("/dashboard");

    let dados = await res.json();

    let artilheiros = document.getElementById("topArtilheiros");

    artilheiros.innerHTML = "";

    dados.artilheiros.forEach(a => {

        artilheiros.innerHTML += `
            <div>
                ⚽ ${a.nome} - ${a.gols}
            </div>
        `;

    });

    let goleiro = document.getElementById("goleiroVazado");

    if (dados.goleiro) {

        goleiro.innerHTML = `
            <div>
                🧤 ${dados.goleiro.nome} - ${dados.goleiro.gols} gols
            </div>
        `;

    }

}


// =========================================
// COPIAR
// =========================================
function copiarTimes() {

    let texto = "";

    Object.entries(TIMES).forEach(([nome, jogadores]) => {

        texto += `${nome}\n`;

        jogadores.forEach(j => {

            texto += `${j.nome}\n`;

        });

        texto += `\n`;

    });

    navigator.clipboard.writeText(texto);

    alert("Copiado!");
}


// =========================================
// IMAGEM
// =========================================
function baixarImagem() {

    html2canvas(document.getElementById("areaTimes"))
    .then(canvas => {

        let link = document.createElement("a");

        link.download = "times.png";

        link.href = canvas.toDataURL();

        link.click();

    });

}


listar();