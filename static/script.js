let TIMES = {
    time1: [],
    time2: [],
    time3: []
};

// =========================================
// LISTAR JOGADORES
// =========================================
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

// =========================================
// ADICIONAR JOGADOR
// =========================================
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

// =========================================
// EDITAR
// =========================================
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

// =========================================
// CONTADOR
// =========================================
function atualizarContador() {

    let selecionados = document.querySelectorAll(".disponivel:checked");

    document.getElementById("contadorSelecionados").innerHTML =
        `Selecionados: ${selecionados.length}`;
}

// =========================================
// EMBARALHAR
// =========================================
function embaralhar(lista) {

    for (let i = lista.length - 1; i > 0; i--) {

        let j = Math.floor(Math.random() * (i + 1));

        [lista[i], lista[j]] = [lista[j], lista[i]];
    }

    return lista;
}

// =========================================
// SORTEAR TIMES
// =========================================
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

    TIMES.time1 = [];
    TIMES.time2 = [];
    TIMES.time3 = [];

    function distribuir(lista) {

        lista.forEach((jogador, index) => {

            let numero = index % 3;

            if (numero === 0) {
                TIMES.time1.push(jogador);
            }

            if (numero === 1) {
                TIMES.time2.push(jogador);
            }

            if (numero === 2) {
                TIMES.time3.push(jogador);
            }

        });
    }

    distribuir(goleiros);
    distribuir(zagueiros);
    distribuir(meias);
    distribuir(atacantes);

    console.log(TIMES);

    renderizarTodosTimes();
}

// =========================================
// CRIAR JOGADOR VISUAL
// =========================================
function criarJogador(jogador, top, left, campo) {

    let div = document.createElement("div");

    div.className = "jogador-campo";

    div.draggable = true;

    div.style.top = top;

    div.style.left = left;

    let icone = "⚽";

    if (jogador.posicao === "G") {
        icone = "🧤";
    }

    if (jogador.posicao === "Z") {
        icone = "🛡️";
    }

    if (jogador.posicao === "M") {
        icone = "🎯";
    }

    if (jogador.posicao === "A") {
        icone = "🔥";
    }

    div.innerHTML = `
        <div class="icone-jogador">
            ${icone}
        </div>

        <div class="nome-jogador">
            ${jogador.nome}
        </div>
    `;

    div.addEventListener("dragstart", (e) => {

        e.dataTransfer.setData("id", jogador.id);

        e.dataTransfer.setData("origem", campo.id);

        div.classList.add("dragging");

    });

    div.addEventListener("dragend", () => {

        div.classList.remove("dragging");

    });

    campo.appendChild(div);
}

// =========================================
// RENDERIZAR TIME
// =========================================
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

    goleiros.forEach((j, i) => {

        criarJogador(j, "86%", "50%", campo);

    });

    let posicoesZaga = ["25%", "50%", "75%"];

    zagueiros.forEach((j, i) => {

        criarJogador(
            j,
            "66%",
            posicoesZaga[i] || "50%",
            campo
        );

    });

    let posicoesMeia = ["20%", "50%", "80%"];

    meias.forEach((j, i) => {

        criarJogador(
            j,
            "46%",
            posicoesMeia[i] || "50%",
            campo
        );

    });

    let posicoesAtaque = ["35%", "65%"];

    atacantes.forEach((j, i) => {

        criarJogador(
            j,
            "20%",
            posicoesAtaque[i] || "50%",
            campo
        );

    });

    // =========================
    // DRAG AND DROP
    // =========================

    campo.addEventListener("dragover", (e) => {

        e.preventDefault();

    });

    campo.addEventListener("drop", (e) => {

        e.preventDefault();

        let jogadorId = e.dataTransfer.getData("id");

        let origem = e.dataTransfer.getData("origem");

        let destino = campo.id;

        if (!jogadorId || !origem || !destino) return;

        if (origem === destino) return;

        let jogador = TIMES[origem].find(
            j => String(j.id) === String(jogadorId)
        );

        if (!jogador) return;

        TIMES[origem] = TIMES[origem].filter(
            j => String(j.id) !== String(jogadorId)
        );

        TIMES[destino].push(jogador);

        console.log("TIMES ATUALIZADOS:", TIMES);

        renderizarTodosTimes();

    });
}

// =========================================
// RENDERIZAR TODOS
// =========================================
function renderizarTodosTimes() {

    renderizarTime("time1", TIMES.time1, 1);

    renderizarTime("time2", TIMES.time2, 2);

    renderizarTime("time3", TIMES.time3, 3);
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
async function salvarVitoria(numeroTime) {

    let res = await fetch("/salvar-partida", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            nome_time: `TIME ${numeroTime}`
        })

    });

    let retorno = await res.json();

    if (retorno.ok) {

        alert("Vitória salva!");

        carregarRankingTimes();

    } else {

        alert("Erro ao salvar vitória");
    }
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
                🏆 ${t.nome_time} - ${t.vitorias} vitórias
            </div>
        `;
    });
}

// =========================================
// COPIAR TIMES
// =========================================
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

// =========================================
// START
// =========================================
listar();