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

async function gol(id) {

    await fetch("/gol", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({ id })

    });

    listar();
}

async function removerGol(id) {

    await fetch("/remover-gol", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({ id })

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

        body: JSON.stringify({ id })

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

function somaNotas(time) {

    let soma = 0;

    time.forEach(j => {

        soma += j.nota;

    });

    return soma;
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

    if (jogadores.length !== 21) {

        alert("Selecione exatamente 21 jogadores");

        return;
    }

    TIMES.time1 = [];
    TIMES.time2 = [];
    TIMES.time3 = [];

    let times = [
        TIMES.time1,
        TIMES.time2,
        TIMES.time3
    ];

    let goleiros = embaralhar(
        jogadores.filter(j => j.posicao === "G")
    );

    let atacantes = embaralhar(
        jogadores.filter(j => j.posicao === "A")
    );

    let restantes = jogadores.filter(j =>
        j.posicao !== "G" &&
        j.posicao !== "A"
    );

    goleiros.forEach((j, i) => {

        if (i < 3) {

            times[i].push(j);

        }

    });

    atacantes.forEach((j, i) => {

        if (i < 3) {

            times[i].push(j);

        }

    });

    restantes.sort((a, b) => b.nota - a.nota);

    restantes.forEach(jogador => {

        let menor = times
            .filter(t => t.length < 7)
            .sort((a, b) => somaNotas(a) - somaNotas(b))[0];

        menor.push(jogador);

    });

    renderizarTime("time1", TIMES.time1, 1);

    renderizarTime("time2", TIMES.time2, 2);

    renderizarTime("time3", TIMES.time3, 3);

    alert("Times sorteados com sucesso ⚽");
}

function renderizarTime(id, jogadores, numero) {

    let campo = document.getElementById(id);

    campo.innerHTML = "";

    let soma = 0;

    jogadores.forEach(j => {

        soma += j.nota;

    });

    document.getElementById(`notaTime${numero}`).innerHTML =
        `Nota: ${soma.toFixed(1)}`;

    jogadores.forEach((j, index) => {

        let jogador = document.createElement("div");

        jogador.className = "jogador-campo";

        jogador.draggable = true;

        jogador.dataset.index = index;

        jogador.dataset.time = numero;

        jogador.innerHTML = `
            <div>${j.nome}</div>
            <small>${j.posicao}</small>
        `;

        jogador.addEventListener("dragstart", dragStart);

        jogador.addEventListener("dragover", dragOver);

        jogador.addEventListener("drop", dropJogador);

        campo.appendChild(jogador);

    });
}

let jogadorArrastado = null;

function dragStart(e) {

    jogadorArrastado = {
        index: e.target.dataset.index,
        time: e.target.dataset.time
    };
}

function dragOver(e) {

    e.preventDefault();
}

function dropJogador(e) {

    e.preventDefault();

    let destino = {
        index: e.target.dataset.index,
        time: e.target.dataset.time
    };

    if (!destino.index) return;

    let origemTime = TIMES[`time${jogadorArrastado.time}`];

    let destinoTime = TIMES[`time${destino.time}`];

    let jogadorOrigem = origemTime[jogadorArrastado.index];

    let jogadorDestino = destinoTime[destino.index];

    origemTime[jogadorArrastado.index] = jogadorDestino;

    destinoTime[destino.index] = jogadorOrigem;

    renderizarTime("time1", TIMES.time1, 1);

    renderizarTime("time2", TIMES.time2, 2);

    renderizarTime("time3", TIMES.time3, 3);
}

async function salvarJogos() {

    let ids = [];

    Object.values(TIMES).forEach(time => {

        time.forEach(j => {

            ids.push(j.id);

        });

    });

    if (ids.length === 0) {

        alert("Faça o sorteio primeiro");

        return;
    }

    let res = await fetch("/registrar-jogo", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            jogadores: ids
        })

    });

    let retorno = await res.json();

    if (retorno.ok) {

        alert("Jogos registrados com sucesso ⚽");

        listar();

    } else {

        alert("Erro ao salvar jogos");

    }
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
            jogadores
        })

    });

    alert("Vitória salva!");

    listar();
}

async function carregarRankingTimes() {

    let res = await fetch("/ranking-times");

    let dados = await res.json();

    let div = document.getElementById("rankingTimes");

    if (!div) return;

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