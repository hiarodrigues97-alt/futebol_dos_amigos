// static/script.js

async function listar() {

    let res = await fetch("/jogadores");

    let dados = await res.json();

    let listaLinha = document.getElementById("listaJogadores");

    let listaGoleiros = document.getElementById("listaGoleiros");

    listaLinha.innerHTML = "";

    listaGoleiros.innerHTML = "";

    // ORDENAR
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
                <button class="btn btn-success btn-sm"
                    onclick="gol(${j.id})">
                    + Gol
                </button>

                <button class="btn btn-warning btn-sm"
                    onclick="removerGol(${j.id})">
                    - Gol
                </button>

                <button class="btn btn-primary btn-sm"
                    onclick="editarJogador(${j.id}, '${j.nome}', '${j.posicao}', ${j.nota})">
                    Editar
                </button>

                <button class="btn btn-danger btn-sm"
                    onclick="excluirJogador(${j.id})">
                    Excluir
                </button>
            `;
        }

        let emoji = "";

        if (j.posicao === "G") emoji = "🧤";
        if (j.posicao === "A") emoji = "⚽";
        if (j.posicao === "M") emoji = "🎯";
        if (j.posicao === "Z") emoji = "🛡️";

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

            <td>${emoji} ${j.nome}</td>

            <td>${j.posicao}</td>

            <td>${j.gols}</td>

            <td>${j.nota}</td>

            ${TIPO_USUARIO === "admin" ? `<td>${botoes}</td>` : ""}

        </tr>
        `;

        // GOLEIROS
        if (j.posicao === "G") {

            listaGoleiros.innerHTML += linha;

        } else {

            listaLinha.innerHTML += linha;
        }

    });
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
    document.getElementById("posicao").value = "";

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

function adicionarNoTime(time, jogador) {

    time.jogadores.push(jogador);

    time.soma += jogador.nota;
}

function timeComMenorNota(times) {

    return times.sort((a, b) => a.soma - b.soma)[0];
}

function renderizarTime(elementoId, time) {

    let elemento = document.getElementById(elementoId);

    elemento.innerHTML = `
        <h5>Total Nota: ${time.soma.toFixed(1)}</h5>
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
}

function sortear() {

    let selecionados = document.querySelectorAll(".disponivel:checked");

    let jogadores = [];

    selecionados.forEach(x => {

        jogadores.push({
            nome: x.dataset.nome,
            nota: parseFloat(x.dataset.nota),
            posicao: x.dataset.posicao
        });

    });

    // 3 TIMES COM 7
    if (jogadores.length !== 21) {

        alert("Selecione exatamente 21 jogadores.");

        return;
    }

    let goleiros = jogadores.filter(j => j.posicao === "G");

    let atacantes = jogadores.filter(j => j.posicao === "A");

    let restantes = jogadores.filter(j =>
        j.posicao !== "G" && j.posicao !== "A"
    );

    embaralhar(goleiros);

    embaralhar(atacantes);

    restantes.sort((a, b) => b.nota - a.nota);

    let times = [
        { jogadores: [], soma: 0 },
        { jogadores: [], soma: 0 },
        { jogadores: [], soma: 0 }
    ];

    // =========================
    // GOLEIROS
    // =========================

    goleiros.forEach((g, index) => {

        if (index < 3) {

            adicionarNoTime(times[index], g);

        } else {

            let disponiveis = times.filter(t => t.jogadores.length < 7);

            let menor = timeComMenorNota(disponiveis);

            adicionarNoTime(menor, g);
        }

    });

    // =========================
    // ATACANTES
    // =========================

    atacantes.forEach((a, index) => {

        if (index < 3) {

            let candidatos = times.filter(t => {

                let qtd = t.jogadores.filter(x => x.posicao === "A").length;

                return qtd === 0 && t.jogadores.length < 7;
            });

            candidatos.sort((x, y) => x.soma - y.soma);

            if (candidatos.length > 0) {

                adicionarNoTime(candidatos[0], a);

            }

        } else {

            let disponiveis = times.filter(t => t.jogadores.length < 7);

            let menor = timeComMenorNota(disponiveis);

            adicionarNoTime(menor, a);
        }

    });

    // =========================
    // RESTANTE POR NOTA
    // =========================

    restantes.forEach(j => {

        let disponiveis = times.filter(t => t.jogadores.length < 7);

        disponiveis.sort((a, b) => a.soma - b.soma);

        adicionarNoTime(disponiveis[0], j);

    });

    // =========================
    // RENDERIZAR
    // =========================

    renderizarTime("time1", times[0]);

    renderizarTime("time2", times[1]);

    renderizarTime("time3", times[2]);
}

listar();