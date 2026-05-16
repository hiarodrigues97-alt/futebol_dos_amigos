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

    let listaJogadores =
        document.getElementById("listaJogadores");

    let listaGoleiros =
        document.getElementById("listaGoleiros");

    listaJogadores.innerHTML = "";

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

            listaJogadores.innerHTML += linha;
        }

    });

    carregarRankingTimes();

    carregarDashboard();
}


// =========================================
// ADICIONAR
// =========================================
async function addJogador() {

    let nome =
        document.getElementById("nome").value;

    let posicao =
        document.getElementById("posicao").value;

    let nota =
        document.getElementById("nota").value;

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
            posicao,
            nota
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
async function editarJogador(
    id,
    nomeAtual,
    posicaoAtual,
    notaAtual
) {

    let nome = prompt("Nome", nomeAtual);

    if (!nome) return;

    let posicao = prompt(
        "Posição (A/M/Z/G)",
        posicaoAtual
    );

    if (!posicao) return;

    let nota = prompt(
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


// =========================================
// EMBARALHAR
// =========================================
function embaralhar(lista) {

    return lista.sort(() => Math.random() - 0.5);
}


// =========================================
// SORTEAR
// =========================================
function sortear() {

    let checks =
        document.querySelectorAll(".disponivel:checked");

    let jogadores = [];

    checks.forEach(c => {

        jogadores.push({
            id: c.dataset.id,
            nome: c.dataset.nome,
            posicao: c.dataset.posicao,
            nota: Number(c.dataset.nota)
        });

    });

    if (jogadores.length < 21) {

        alert("Selecione 21 jogadores");

        return;
    }

    TIMES = {
        time1: [],
        time2: [],
        time3: []
    };

    let goleiros =
        embaralhar(jogadores.filter(j => j.posicao === "G"));

    let zagueiros =
        embaralhar(jogadores.filter(j => j.posicao === "Z"));

    let meias =
        embaralhar(jogadores.filter(j => j.posicao === "M"));

    let atacantes =
        embaralhar(jogadores.filter(j => j.posicao === "A"));

    distribuir(goleiros);

    distribuir(zagueiros);

    distribuir(meias);

    distribuir(atacantes);

    renderizarTimes();
}


// =========================================
// DISTRIBUIR
// =========================================
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


// =========================================
// ICONE
// =========================================
function iconeJogador(posicao) {

    if (posicao === "G") return "🧤";

    if (posicao === "Z") return "🛡️";

    if (posicao === "M") return "🎯";

    return "🔥";
}


// =========================================
// RENDERIZAR
// =========================================
function renderizarTimes() {

    let area =
        document.getElementById("areaTimes");

    area.innerHTML = "";

    Object.entries(TIMES).forEach(([nome, jogadores], index) => {

        area.innerHTML += `
            <div class="col-md-4 mb-4">

                <div class="card p-3">

                    <h2>
                        Time ${index + 1}
                    </h2>

                    <div
                        class="campo"
                        id="${nome}"
                    ></div>

                    <button
                        class="btn btn-success btn-vitoria"
                        onclick="salvarVitoria(${index + 1})"
                    >
                        🏆 Registrar Vitória
                    </button>

                </div>

            </div>
        `;

        let campo =
            document.getElementById(nome);

        let goleiros =
            jogadores.filter(j => j.posicao === "G");

        let zagueiros =
            jogadores.filter(j => j.posicao === "Z");

        let meias =
            jogadores.filter(j => j.posicao === "M");

        let atacantes =
            jogadores.filter(j => j.posicao === "A");

        goleiros.forEach(j => {

            criarJogador(campo, j, "85%", "50%");

        });

        zagueiros.forEach((j, i) => {

            let posicoes = ["25%", "50%", "75%"];

            criarJogador(
                campo,
                j,
                "65%",
                posicoes[i]
            );

        });

        meias.forEach((j, i) => {

            let posicoes = ["20%", "50%", "80%"];

            criarJogador(
                campo,
                j,
                "45%",
                posicoes[i]
            );

        });

        atacantes.forEach((j, i) => {

            let posicoes = ["35%", "65%"];

            criarJogador(
                campo,
                j,
                "20%",
                posicoes[i]
            );

        });

    });

}


// =========================================
// CRIAR JOGADOR
// =========================================
function criarJogador(
    campo,
    jogador,
    top,
    left
) {

    let div = document.createElement("div");

    div.className = "jogador-campo";

    div.style.top = top;

    div.style.left = left;

    div.innerHTML = `
        <div class="icone-jogador">
            ${iconeJogador(jogador.posicao)}
        </div>

        <div class="nome-jogador">
            ${jogador.nome}
        </div>
    `;

    campo.appendChild(div);
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

    let res =
        await fetch("/ranking-times");

    let dados =
        await res.json();

    let div =
        document.getElementById("rankingTimes");

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

    let res =
        await fetch("/dashboard");

    let dados =
        await res.json();

    let artilheiros =
        document.getElementById("topArtilheiros");

    artilheiros.innerHTML = "";

    dados.artilheiros.forEach(a => {

        artilheiros.innerHTML += `
            <div>
                ⚽ ${a.nome} - ${a.gols}
            </div>
        `;

    });

    let goleiro =
        document.getElementById("goleiroVazado");

    goleiro.innerHTML = "";

    if (dados.goleiro) {

        goleiro.innerHTML = `
            <div>
                🧤 ${dados.goleiro.nome}
                - ${dados.goleiro.gols} gols
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

        texto += `${nome.toUpperCase()}\n`;

        jogadores.forEach(j => {

            texto += `- ${j.nome}\n`;

        });

        texto += "\n";

    });

    navigator.clipboard.writeText(texto);

    alert("Copiado!");
}


// =========================================
// BAIXAR IMAGEM
// =========================================
function baixarImagem() {

    html2canvas(
        document.getElementById("areaTimes")
    ).then(canvas => {

        let link =
            document.createElement("a");

        link.download = "times.png";

        link.href = canvas.toDataURL();

        link.click();

    });

}


listar();