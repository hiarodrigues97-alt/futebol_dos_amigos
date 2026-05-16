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
// CRIAR LINHA
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
// SORTEAR
// =========================================
function sortear() {

    const selecionados =
        document.querySelectorAll(".disponivel:checked");

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

    const goleiros =
        embaralhar(jogadores.filter(j => j.posicao === "G"));

    const zagueiros =
        embaralhar(jogadores.filter(j => j.posicao === "Z"));

    const meias =
        embaralhar(jogadores.filter(j => j.posicao === "M"));

    const atacantes =
        embaralhar(jogadores.filter(j => j.posicao === "A"));

    TIMES.time1 = [];
    TIMES.time2 = [];
    TIMES.time3 = [];

    function distribuir(lista) {

        lista.forEach((jogador, index) => {

            const numero = index % 3;

            if (numero === 0) TIMES.time1.push(jogador);

            if (numero === 1) TIMES.time2.push(jogador);

            if (numero === 2) TIMES.time3.push(jogador);

        });

    }

    distribuir(goleiros);
    distribuir(zagueiros);
    distribuir(meias);
    distribuir(atacantes);

    renderizarTodosTimes();

}

// =========================================
// CRIAR JOGADOR
// =========================================
function criarJogador(jogador, top, left, campo) {

    let icone = "⚽";

    if (jogador.posicao === "G") icone = "🧤";
    if (jogador.posicao === "Z") icone = "🛡️";
    if (jogador.posicao === "M") icone = "🎯";
    if (jogador.posicao === "A") icone = "🔥";

    const div = document.createElement("div");

    div.className = "jogador-campo";

    div.draggable = true;

    div.style.top = top;
    div.style.left = left;

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

    });

    campo.appendChild(div);

}

// =========================================
// RENDERIZAR TIME
// =========================================
function renderizarTime(id, jogadores, numero) {

    const campo = document.getElementById(id);

    campo.innerHTML = "";

    let soma = 0;

    jogadores.forEach(j => {

        soma += Number(j.nota || 0);

    });

    document.getElementById(
        `notaTime${numero}`
    ).innerHTML = `Nota: ${soma.toFixed(1)}`;

    const goleiros = jogadores.filter(j => j.posicao === "G");
    const zagueiros = jogadores.filter(j => j.posicao === "Z");
    const meias = jogadores.filter(j => j.posicao === "M");
    const atacantes = jogadores.filter(j => j.posicao === "A");

    goleiros.forEach(j => {

        criarJogador(j, "85%", "50%", campo);

    });

    const posicoesZaga = ["25%", "50%", "75%"];

    zagueiros.forEach((j, i) => {

        criarJogador(
            j,
            "65%",
            posicoesZaga[i] || "50%",
            campo
        );

    });

    const posicoesMeia = ["20%", "50%", "80%"];

    meias.forEach((j, i) => {

        criarJogador(
            j,
            "45%",
            posicoesMeia[i] || "50%",
            campo
        );

    });

    const posicoesAtaque = ["35%", "65%"];

    atacantes.forEach((j, i) => {

        criarJogador(
            j,
            "20%",
            posicoesAtaque[i] || "50%",
            campo
        );

    });

    campo.ondragover = function(e) {

        e.preventDefault();

    };

    campo.ondrop = function(e) {

        e.preventDefault();

        const jogadorId =
            e.dataTransfer.getData("id");

        const origem =
            e.dataTransfer.getData("origem");

        const destino = id;

        if (origem === destino) return;

        let jogador = TIMES[origem].find(
            j => String(j.id) === String(jogadorId)
        );

        if (!jogador) return;

        TIMES[origem] = TIMES[origem].filter(
            j => String(j.id) !== String(jogadorId)
        );

        TIMES[destino].push(jogador);

        renderizarTodosTimes();

    };

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
async function salvarVitoria(nomeTime) {

    await fetch("/salvar-partida", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            nome_time: nomeTime
        })

    });

    alert("Vitória salva!");

    carregarRankingTimes();

}

// =========================================
// RANKING
// =========================================
async function carregarRankingTimes() {

    const res = await fetch("/ranking-times");

    const dados = await res.json();

    const div =
        document.getElementById("rankingTimes");

    div.innerHTML = "";

    dados.forEach(t => {

        div.innerHTML += `
            <div class="card-ranking">
                🏆 ${t.nome_time}
                - ${t.vitorias} vitórias
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
// BAIXAR IMAGEM
// =========================================
function baixarImagem() {

    html2canvas(
        document.getElementById("areaTimes")
    ).then(canvas => {

        const link =
            document.createElement("a");

        link.download = "times.png";

        link.href = canvas.toDataURL();

        link.click();

    });

}

// =========================================
// START
// =========================================
listar();
