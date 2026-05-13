let TIMES = {
    time1: [],
    time2: [],
    time3: []
};

async function listar() {

    let res = await fetch("/jogadores");

    let dados = await res.json();

    let listaLinha = document.getElementById("listaJogadores");

    let listaGoleiros = document.getElementById("listaGoleiros");

    listaLinha.innerHTML = "";

    listaGoleiros.innerHTML = "";

    dados.sort((a, b) => {

        if (a.posicao === "G" && b.posicao === "G") {
            return a.gols - b.gols;
        }

        return b.gols - a.gols;
    });

    dados.forEach(j => {

        let linha = `
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

            <td>${j.jogos || 0}</td>

            <td>${j.vitorias || 0}</td>

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

        if (j.posicao === "G") {

            listaGoleiros.innerHTML += linha;

        } else {

            listaLinha.innerHTML += linha;
        }

    });

    carregarRankingTimes();
}

async function addJogador() {

    let nome = document.getElementById("nome").value;

    let nota = document.getElementById("nota").value;

    let posicao = document.getElementById("posicao").value;

    if (nome === "") {

        alert("Digite o nome");

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

async function excluirJogador(id) {

    if (!confirm("Deseja excluir este jogador?")) return;

    await fetch("/excluir-jogador", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({id})

    });

    listar();
}

async function editarJogador(id, nomeAtual, posicaoAtual, notaAtual) {

    let nome = prompt("Nome:", nomeAtual);

    if (!nome) return;

    let posicao = prompt("Posição (G/A/M/Z):", posicaoAtual);

    if (!posicao) return;

    let nota = prompt("Nota:", notaAtual);

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

function atualizarContador() {

    let selecionados = document.querySelectorAll(".disponivel:checked");

    document.getElementById("contadorSelecionados").innerHTML =
        `Selecionados: ${selecionados.length}`;
}

function embaralhar(lista) {

    for (let i = lista.length - 1; i > 0; i--) {

        let j = Math.floor(Math.random() * (i + 1));

        [lista[i], lista[j]] = [lista[j], lista[i]];
    }

    return lista;
}

function sortear() {

    let selecionados = document.querySelectorAll(".disponivel:checked");

    let jogadores = [];

    selecionados.forEach(x => {

        jogadores.push({
            id: x.dataset.id,
            nome: x.dataset.nome,
            nota: parseFloat(x.dataset.nota),
            posicao: x.dataset.posicao
        });

    });

    if (jogadores.length < 21) {

        alert("Selecione pelo menos 21 jogadores");

        return;
    }

    // =========================
    // SEPARAR POR POSIÇÃO
    // =========================

    let goleiros = embaralhar(
        jogadores.filter(j => j.posicao === "G")
    );

    let zagueiros = embaralhar(
        jogadores.filter(j => j.posicao === "Z")
    );

    let meias = embaralhar(
        jogadores.filter(j => j.posicao === "M")
    );

    let atacantes = embaralhar(
        jogadores.filter(j => j.posicao === "A")
    );

    // =========================
    // LIMPAR TIMES
    // =========================

    TIMES.time1 = [];
    TIMES.time2 = [];
    TIMES.time3 = [];

    let times = [
        TIMES.time1,
        TIMES.time2,
        TIMES.time3
    ];

    // =========================
    // DISTRIBUIR
    // =========================

    function distribuir(lista) {

        lista.forEach((jogador, index) => {

            let time = times[index % 3];

            time.push(jogador);

        });

    }

    distribuir(goleiros);

    distribuir(zagueiros);

    distribuir(meias);

    distribuir(atacantes);

    // =========================
    // GARANTIR 7 JOGADORES
    // =========================

    let todos = [
        ...TIMES.time1,
        ...TIMES.time2,
        ...TIMES.time3
    ];

    TIMES.time1 = todos.slice(0, 7);

    TIMES.time2 = todos.slice(7, 14);

    TIMES.time3 = todos.slice(14, 21);

    // =========================
    // RENDER
    // =========================

    renderizarTodosTimes();
}

function criarJogador(jogador, top, left, campo) {

    let div = document.createElement("div");

    div.className = "jogador-campo";

    div.draggable = true;

    div.dataset.id = jogador.id;

    div.style.top = top;

    div.style.left = left;

    let icone = "⚽";

    if (jogador.posicao === "G") icone = "🧤";

    if (jogador.posicao === "Z") icone = "🛡️";

    if (jogador.posicao === "M") icone = "🎯";

    if (jogador.posicao === "A") icone = "🔥";

    div.innerHTML = `
        <div class="icone-jogador">
            ${icone}
        </div>

        <div class="nome-jogador">
            ${jogador.nome}
        </div>
    `;

    div.addEventListener("dragstart", (e) => {

        e.dataTransfer.setData(
            "jogadorId",
            jogador.id
        );

        e.dataTransfer.setData(
            "origem",
            campo.id
        );

    });

    campo.appendChild(div);
}

function renderizarTime(id, jogadores, numero) {

    let campo = document.getElementById(id);

    campo.innerHTML = "";

    let soma = 0;

    jogadores.forEach(j => soma += Number(j.nota));

    document.getElementById(`notaTime${numero}`).innerHTML =
        `Nota: ${soma.toFixed(1)}`;

    let goleiros = jogadores.filter(j => j.posicao === "G");

    let zagueiros = jogadores.filter(j => j.posicao === "Z");

    let meias = jogadores.filter(j => j.posicao === "M");

    let atacantes = jogadores.filter(j => j.posicao === "A");

    goleiros.forEach(j => {

        criarJogador(j, "86%", "50%", campo);

    });

    let posZ = ["25%", "50%", "75%"];

    zagueiros.forEach((j, i) => {

        criarJogador(j, "66%", posZ[i] || "50%", campo);

    });

    let posM = ["20%", "50%", "80%"];

    meias.forEach((j, i) => {

        criarJogador(j, "46%", posM[i] || "50%", campo);

    });

    let posA = ["25%", "50%", "75%"];

    atacantes.forEach((j, i) => {

        criarJogador(j, "20%", posA[i] || "50%", campo);

    });

    campo.addEventListener("dragover", (e) => {

        e.preventDefault();

    });

    campo.addEventListener("drop", (e) => {

        e.preventDefault();

        let jogadorId =
            e.dataTransfer.getData("jogadorId");

        let origem =
            e.dataTransfer.getData("origem");

        let destino = campo.id;

        if (origem === destino) return;

        let jogador = TIMES[origem].find(
            j => j.id == jogadorId
        );

        if (!jogador) return;

        TIMES[origem] =
            TIMES[origem].filter(
                j => j.id != jogadorId
            );

        TIMES[destino].push(jogador);

        renderizarTodosTimes();

    });
}

function renderizarTodosTimes() {

    renderizarTime("time1", TIMES.time1, 1);

    renderizarTime("time2", TIMES.time2, 2);

    renderizarTime("time3", TIMES.time3, 3);
}

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

async function salvarVitoria(numeroTime) {

    let time = TIMES[`time${numeroTime}`];

    let jogadores = time.map(j => ({
        id: j.id,
        nome: j.nome
    }));

    let res = await fetch("/salvar-partida", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            nome_time: `TIME ${numeroTime}`,
            jogadores: jogadores
        })

    });

    let retorno = await res.json();

    if (retorno.ok) {

        alert("Vitória salva com sucesso!");

        listar();

    } else {

        console.log(retorno);

        alert("Erro ao salvar vitória");
    }
}

async function carregarRankingTimes() {

    let res = await fetch("/ranking-times");

    let dados = await res.json();

    let div = document.getElementById("rankingTimes");

    div.innerHTML = "";

    dados.forEach(t => {

        div.innerHTML += `
            <div class="card-ranking">
                🏆 ${t.nome_time} - ${t.vitorias} vitórias
            </div>
        `;
    });
}

function copiarTimes() {

    let texto = "";

    Object.entries(TIMES).forEach(([nome, jogadores]) => {

        texto += `${nome.toUpperCase()}\n`;

        jogadores.forEach(j => {

            texto += `- ${j.nome}\n`;

        });

        texto += `\n`;

    });

    navigator.clipboard.writeText(texto);

    alert("Times copiados!");
}

listar();