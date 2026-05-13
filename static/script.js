// static/script.js

let ultimoSorteio = [];

// ==========================================
// LISTAR JOGADORES
// ==========================================

async function listar() {

    let res = await fetch("/jogadores");

    let dados = await res.json();

    let listaLinha = document.getElementById("listaJogadores");

    let listaGoleiros = document.getElementById("listaGoleiros");

    listaLinha.innerHTML = "";

    listaGoleiros.innerHTML = "";

    // ORDENAÇÃO
    dados.sort((a, b) => {

        // Goleiros → menos vazado
        if (a.posicao === "G" && b.posicao === "G") {

            return a.gols - b.gols;
        }

        // Linha → artilharia
        return b.gols - a.gols;
    });

    dados.forEach(j => {

        let botoes = "";

        if (TIPO_USUARIO === "admin") {

            botoes = `

                <button
                    class="btn btn-success btn-sm"
                    onclick="gol(${j.id})"
                >
                    + Gol
                </button>

                <button
                    class="btn btn-warning btn-sm"
                    onclick="removerGol(${j.id})"
                >
                    - Gol
                </button>

                <button
                    class="btn btn-primary btn-sm"
                    onclick="editarJogador(${j.id}, '${j.nome}', '${j.posicao}', ${j.nota})"
                >
                    Editar
                </button>

                <button
                    class="btn btn-danger btn-sm"
                    onclick="excluirJogador(${j.id})"
                >
                    Excluir
                </button>
            `;
        }

        let linha = `

        <tr>

            <td>

                <input
                    type="checkbox"
                    class="disponivel"
                    onchange="atualizarContador()"
                    data-id="${j.id}"
                    data-nota="${j.nota}"
                    data-nome="${j.nome}"
                    data-posicao="${j.posicao}"
                >

            </td>

            <td>${j.nome}</td>

            <td>${j.posicao}</td>

            <td>${j.gols}</td>

            <td>${j.vitorias || 0}</td>

            <td>${j.jogos || 0}</td>

            <td>${j.nota}</td>

            ${TIPO_USUARIO === "admin"
                ? `<td>${botoes}</td>`
                : ""
            }

        </tr>
        `;

        // GOLEIROS
        if (j.posicao === "G") {

            listaGoleiros.innerHTML += linha;

        } else {

            listaLinha.innerHTML += linha;
        }

    });

    carregarRankingTimes();
}

// ==========================================
// ADD JOGADOR
// ==========================================

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

// ==========================================
// GOL
// ==========================================

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

// ==========================================
// REMOVER GOL
// ==========================================

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

// ==========================================
// EXCLUIR
// ==========================================

async function excluirJogador(id) {

    let confirmar = confirm("Deseja excluir este jogador?");

    if (!confirmar) return;

    await fetch("/excluir-jogador", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({ id })

    });

    listar();
}

// ==========================================
// EDITAR
// ==========================================

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

// ==========================================
// CONTADOR
// ==========================================

function atualizarContador() {

    let selecionados = document.querySelectorAll(".disponivel:checked");

    document.getElementById("contadorSelecionados").innerHTML =
        `Selecionados: ${selecionados.length}`;
}

// ==========================================
// EMBARALHAR
// ==========================================

function embaralhar(lista) {

    for (let i = lista.length - 1; i > 0; i--) {

        let j = Math.floor(Math.random() * (i + 1));

        [lista[i], lista[j]] = [lista[j], lista[i]];
    }

    return lista;
}

// ==========================================
// ADICIONAR NO TIME
// ==========================================

function adicionarNoTime(time, jogador) {

    if (time.jogadores.length >= 7) return false;

    time.jogadores.push(jogador);

    time.soma += jogador.nota;

    return true;
}

// ==========================================
// MENOR NOTA
// ==========================================

function timeComMenorNota(times) {

    return times.sort((a, b) => a.soma - b.soma)[0];
}

// ==========================================
// RENDERIZAR
// ==========================================

function renderizarTime(elementoId, time, numero) {

    let elemento = document.getElementById(elementoId);

    elemento.innerHTML = `

        <h5>
            Nota Total: ${time.soma.toFixed(1)}
        </h5>

        <h6>
            Jogadores: ${time.jogadores.length}/7
        </h6>
    `;

    time.jogadores.forEach(j => {

        let emoji = "";

        if (j.posicao === "G") emoji = "🧤";
        if (j.posicao === "A") emoji = "⚽";
        if (j.posicao === "M") emoji = "🎯";
        if (j.posicao === "Z") emoji = "🛡️";

        elemento.innerHTML += `

            <li>
                ${emoji} ${j.nome} (${j.nota})
            </li>
        `;
    });

    elemento.innerHTML += `

        <button
            class="btn btn-success botao-vitoria"
            onclick="registrarVitoria('Time ${numero}', ${numero - 1})"
        >
            🏆 Registrar Vitória
        </button>
    `;
}

// ==========================================
// SORTEIO
// ==========================================

async function sortear() {

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

        alert("Selecione no mínimo 21 jogadores");

        return;
    }

    let goleiros = jogadores.filter(j => j.posicao === "G");

    let atacantes = jogadores.filter(j => j.posicao === "A");

    let meias = jogadores.filter(j => j.posicao === "M");

    let zagueiros = jogadores.filter(j => j.posicao === "Z");

    embaralhar(goleiros);
    embaralhar(atacantes);
    embaralhar(meias);
    embaralhar(zagueiros);

    let times = [
        { jogadores: [], soma: 0 },
        { jogadores: [], soma: 0 },
        { jogadores: [], soma: 0 }
    ];

    // 1 GOLEIRO CADA
    goleiros.forEach((j, i) => {

        if (i < 3) {

            adicionarNoTime(times[i], j);
        }
    });

    // 1 ATACANTE CADA
    atacantes.forEach((j, i) => {

        if (i < 3) {

            adicionarNoTime(times[i], j);
        }
    });

    let restantes = [
        ...goleiros.slice(3),
        ...atacantes.slice(3),
        ...meias,
        ...zagueiros
    ];

    restantes.sort((a, b) => b.nota - a.nota);

    restantes.forEach(j => {

        let ordenados = [...times].sort((a, b) => {

            if (a.jogadores.length !== b.jogadores.length) {

                return a.jogadores.length - b.jogadores.length;
            }

            return a.soma - b.soma;
        });

        for (let t of ordenados) {

            if (t.jogadores.length < 7) {

                adicionarNoTime(t, j);

                break;
            }
        }

    });

    ultimoSorteio = times;

    renderizarTime("time1", times[0], 1);

    renderizarTime("time2", times[1], 2);

    renderizarTime("time3", times[2], 3);

    // REGISTRAR JOGOS
    let ids = jogadores.map(j => j.id);

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

// ==========================================
// COPIAR TIMES
// ==========================================

function copiarTimes() {

    let texto = "";

    ultimoSorteio.forEach((time, index) => {

        texto += `\n🏆 TIME ${index + 1}\n`;

        time.jogadores.forEach(j => {

            texto += `- ${j.nome} (${j.nota})\n`;
        });

        texto += "\n";
    });

    navigator.clipboard.writeText(texto);

    alert("Times copiados!");
}

// ==========================================
// REGISTRAR VITÓRIA
// ==========================================

async function registrarVitoria(nome, index) {

    let time = ultimoSorteio[index];

    let ids = time.jogadores.map(j => j.id);

    await fetch("/salvar-partida", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            nome_time: nome,
            jogadores: ids
        })

    });

    alert("Vitória registrada!");

    carregarRankingTimes();
}

// ==========================================
// RANKING TIMES
// ==========================================

async function carregarRankingTimes() {

    let res = await fetch("/ranking-times");

    let dados = await res.json();

    let tabela = document.getElementById("rankingTimes");

    tabela.innerHTML = "";

    dados.forEach(t => {

        tabela.innerHTML += `

            <tr>

                <td>${t.nome_time}</td>

                <td>${t.vitorias}</td>

            </tr>
        `;
    });
}

listar();