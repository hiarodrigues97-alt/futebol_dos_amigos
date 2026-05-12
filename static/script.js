// static/script.js

async function listar() {

    let res = await fetch("/jogadores");

    let dados = await res.json();

    let listaLinha = document.getElementById("lista");
    let listaGoleiros = document.getElementById("listaGoleiros");

    listaLinha.innerHTML = "";
    listaGoleiros.innerHTML = "";

    dados.forEach(j => {

        let botoes = "";

        if (TIPO_USUARIO === "admin") {

            botoes = `
                <button class="btn btn-success btn-sm" onclick="gol(${j.id})">
                    + Gol
                </button>

                <button class="btn btn-warning btn-sm" onclick="removerGol(${j.id})">
                    - Gol
                </button>

                <button class="btn btn-info btn-sm" onclick="editarJogador(${j.id}, '${j.nome}', '${j.posicao}', ${j.nota})">
                    Editar
                </button>

                <button class="btn btn-danger btn-sm" onclick="excluirJogador(${j.id})">
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

            <td>${j.nota}</td>

            ${TIPO_USUARIO === "admin" ? `<td>${botoes}</td>` : ""}

        </tr>
        `;

        // GOLEIROS
        if (j.posicao.trim().toUpperCase() === "G") {

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

    let confirmar = confirm("Deseja excluir este jogador?");

    if (!confirmar) return;

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

    let nome = prompt("Nome do jogador:", nomeAtual);

    if (!nome) return;

    let posicao = prompt("Posição (Z, A, M, G):", posicaoAtual);

    if (!posicao) return;

    let nota = prompt("Nota do jogador:", notaAtual);

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

    jogadores.sort((a, b) => b.nota - a.nota);

    let time1 = [];
    let time2 = [];
    let time3 = [];

    let soma1 = 0;
    let soma2 = 0;
    let soma3 = 0;

    jogadores.forEach(j => {

        if (soma1 <= soma2 && soma1 <= soma3) {

            time1.push(j);
            soma1 += j.nota;

        } else if (soma2 <= soma1 && soma2 <= soma3) {

            time2.push(j);
            soma2 += j.nota;

        } else {

            time3.push(j);
            soma3 += j.nota;
        }

    });

    let t1 = document.getElementById("time1");
    let t2 = document.getElementById("time2");
    let t3 = document.getElementById("time3");

    t1.innerHTML = `<h5>Total Nota: ${soma1.toFixed(1)}</h5>`;
    t2.innerHTML = `<h5>Total Nota: ${soma2.toFixed(1)}</h5>`;
    t3.innerHTML = `<h5>Total Nota: ${soma3.toFixed(1)}</h5>`;

    time1.forEach(j => {
        t1.innerHTML += `<li>${j.nome} (${j.nota}) - ${j.posicao}</li>`;
    });

    time2.forEach(j => {
        t2.innerHTML += `<li>${j.nome} (${j.nota}) - ${j.posicao}</li>`;
    });

    time3.forEach(j => {
        t3.innerHTML += `<li>${j.nome} (${j.nota}) - ${j.posicao}</li>`;
    });
}

listar();