let TIMES = {
    time1: [],
    time2: [],
    time3: []
};

let graficoArtilheiros = null;
let graficoGoleiros = null;

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

function distribuir(lista, time1, time2, time3) {

    lista.forEach((j, index) => {

        if (index % 3 === 0) time1.push(j);
        if (index % 3 === 1) time2.push(j);
        if (index % 3 === 2) time3.push(j);

    });
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

    distribuir(goleiros, TIMES.time1, TIMES.time2, TIMES.time3);
    distribuir(zagueiros, TIMES.time1, TIMES.time2, TIMES.time3);
    distribuir(meias, TIMES.time1, TIMES.time2, TIMES.time3);
    distribuir(atacantes, TIMES.time1, TIMES.time2, TIMES.time3);

    renderizarTodosTimes();
}

function criarJogador(jogador, top, left, campo) {

    let div = document.createElement("div");

    div.className = "jogador-campo";

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

    goleiros.forEach(j => criarJogador(j,"86%","50%",campo));

    let z = ["25%","50%","75%"];

    zagueiros.forEach((j,i)=>{
        criarJogador(j,"66%",z[i] || "50%",campo);
    });

    let m = ["20%","50%","80%"];

    meias.forEach((j,i)=>{
        criarJogador(j,"46%",m[i] || "50%",campo);
    });

    let a = ["35%","65%"];

    atacantes.forEach((j,i)=>{
        criarJogador(j,"20%",a[i] || "50%",campo);
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

        time.forEach(j => ids.push(j.id));

    });

    await fetch("/registrar-jogo", {
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            jogadores: ids
        })
    });

    alert("Jogos registrados!");

    listar();
}

async function salvarVitoria(numeroTime) {

    await fetch("/salvar-partida", {

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({
            nome_time:`TIME ${numeroTime}`
        })

    });

    carregarRankingTimes();
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

async function carregarDashboard() {

    let res = await fetch("/dashboard");

    let dados = await res.json();

    let nomesArt = dados.artilheiros.map(x => x.nome);
    let golsArt = dados.artilheiros.map(x => x.gols);

    if (graficoArtilheiros) {
        graficoArtilheiros.destroy();
    }

    graficoArtilheiros = new Chart(
        document.getElementById("graficoArtilheiros"),
        {
            type:"bar",
            data:{
                labels:nomesArt,
                datasets:[{
                    label:"Gols",
                    data:golsArt
                }]
            }
        }
    );

    let nomesGol = dados.goleiros.map(x => x.nome);
    let golsGol = dados.goleiros.map(x => x.gols);

    if (graficoGoleiros) {
        graficoGoleiros.destroy();
    }

    graficoGoleiros = new Chart(
        document.getElementById("graficoGoleiros"),
        {
            type:"bar",
            data:{
                labels:nomesGol,
                datasets:[{
                    label:"Gols Sofridos",
                    data:golsGol
                }]
            }
        }
    );
}

function copiarTimes() {

    let texto = "";

    Object.entries(TIMES).forEach(([nome, jogadores]) => {

        texto += `${nome.toUpperCase()}\n`;

        jogadores.forEach(j => {

            texto += `- ${j.nome}\n`;

        });

        texto += "\n";

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