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

        let botoes = `
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
        `;

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

                <td>${botoes}</td>

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

    if (!confirm("Excluir jogador?")) return;

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

    let posicao = prompt("Posição:", posicaoAtual);

    let nota = prompt("Nota:", notaAtual);

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

function adicionarNoTime(time, jogador) {

    if (time.length >= 7) return false;

    time.push(jogador);

    return true;
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

    let goleiros = embaralhar(
        jogadores.filter(j => j.posicao === "G")
    );

    let atacantes = embaralhar(
        jogadores.filter(j => j.posicao === "A")
    );

    let meias = embaralhar(
        jogadores.filter(j => j.posicao === "M")
    );

    let zagueiros = embaralhar(
        jogadores.filter(j => j.posicao === "Z")
    );

    TIMES.time1 = [];
    TIMES.time2 = [];
    TIMES.time3 = [];

    let times = [
        TIMES.time1,
        TIMES.time2,
        TIMES.time3
    ];

    function distribuir(lista) {

        lista.forEach((j, index) => {

            let time = times[index % 3];

            adicionarNoTime(time, j);
        });
    }

    distribuir(goleiros);

    distribuir(atacantes);

    distribuir(meias);

    distribuir(zagueiros);

    renderizarTime("time1", TIMES.time1, 1);

    renderizarTime("time2", TIMES.time2, 2);

    renderizarTime("time3", TIMES.time3, 3);

    registrarJogos();
}

function renderizarTime(id, jogadores, numero) {

    let campo = document.getElementById(id);

    campo.innerHTML = "";

    let soma = 0;

    jogadores.forEach(j => soma += j.nota);

    document.getElementById(`notaTime${numero}`).innerHTML =
        `Nota: ${soma.toFixed(1)}`;

    let goleiros = jogadores.filter(j => j.posicao === "G");

    let zagueiros = jogadores.filter(j => j.posicao === "Z");

    let meias = jogadores.filter(j => j.posicao === "M");

    let atacantes = jogadores.filter(j => j.posicao === "A");

    function criarJogador(jogador, top, left) {

        let emoji = "⚽";

        if (jogador.posicao === "G") emoji = "🧤";

        if (jogador.posicao === "Z") emoji = "🛡️";

        if (jogador.posicao === "M") emoji = "🎯";

        let div = document.createElement("div");

        div.className = "jogador";

        div.style.top = top;

        div.style.left = left;

        div.innerHTML = `
            <div class="icone-jogador">
                ${emoji}
            </div>

            <div class="nome-jogador">
                ${jogador.nome}
            </div>
        `;

        campo.appendChild(div);
    }

    goleiros.forEach((j, i) => {
        criarJogador(j, "88%", "50%");
    });

    zagueiros.forEach((j, i) => {

        let posicoes = ["70%", "50%", "30%"];

        criarJogador(j, "68%", posicoes[i] || "50%");
    });

    meias.forEach((j, i) => {

        let posicoes = ["25%", "50%", "75%"];

        criarJogador(j, "48%", posicoes[i] || "50%");
    });

    atacantes.forEach((j, i) => {

        let posicoes = ["35%", "65%"];

        criarJogador(j, "22%", posicoes[i] || "50%");
    });
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

    listar();
}

async function salvarVitoria(nomeTime, numeroTime) {

    let time = TIMES[`time${numeroTime}`];

    let jogadores = time.map(j => j.nome);

    await fetch("/salvar-partida", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            nome_time: nomeTime,
            jogadores: jogadores
        })

    });

    alert("Vitória salva!");

    listar();
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