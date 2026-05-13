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

            <td>${j.jogos}</td>

            <td>${j.vitorias}</td>

            <td>${j.nota}</td>

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

    TIMES.time1 = [];
    TIMES.time2 = [];
    TIMES.time3 = [];

    let times = [
        TIMES.time1,
        TIMES.time2,
        TIMES.time3
    ];

    embaralhar(jogadores);

    jogadores.forEach((j, index) => {

        times[index % 3].push(j);

    });

    renderizarTime("time1", TIMES.time1, 1);

    renderizarTime("time2", TIMES.time2, 2);

    renderizarTime("time3", TIMES.time3, 3);
}

function criarJogador(jogador, top, left, campo) {

    let div = document.createElement("div");

    div.className = "jogador-campo";

    div.style.top = top;

    div.style.left = left;

    div.innerHTML = `
        <div class="icone-jogador">⚽</div>
        <div class="nome-jogador">${jogador.nome}</div>
    `;

    campo.appendChild(div);
}

function renderizarTime(id, jogadores, numero) {

    let campo = document.getElementById(id);

    campo.innerHTML = "";

    let soma = 0;

    jogadores.forEach(j => soma += j.nota);

    document.getElementById(`notaTime${numero}`).innerHTML =
        `Nota: ${soma.toFixed(1)}`;

    jogadores.forEach((j, i) => {

        criarJogador(
            j,
            `${20 + (i * 10)}%`,
            `${20 + ((i % 3) * 25)}%`,
            campo
        );

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

        alert("Vitória salva!");

        listar();

    } else {

        alert("Erro ao salvar");
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

listar();