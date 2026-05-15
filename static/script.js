let TIMES = {
    time1: [],
    time2: [],
    time3: []
};

async function listar() {

    let res = await fetch("/jogadores");

    let dados = await res.json();

    let lista = document.getElementById("listaJogadores");

    lista.innerHTML = "";

    dados.forEach(j => {

        lista.innerHTML += `
        <tr>

            <td>
                <input
                    type="checkbox"
                    class="disponivel"
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
    });

    carregarRankingTimes();

    carregarDashboard();
}

async function addJogador() {

    let nome = document.getElementById("nome").value;

    let nota = document.getElementById("nota").value;

    let posicao = document.getElementById("posicao").value;

    await fetch("/jogadores", {
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            nome,
            nota,
            posicao
        })
    });

    listar();
}

async function gol(id){

    await fetch("/gol",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({id})
    });

    listar();
}

async function removerGol(id){

    await fetch("/remover-gol",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({id})
    });

    listar();
}

async function excluirJogador(id){

    await fetch("/excluir-jogador",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({id})
    });

    listar();
}

async function editarJogador(id,nomeAtual,posicaoAtual,notaAtual){

    let nome = prompt("Nome:",nomeAtual);

    let posicao = prompt("Posição:",posicaoAtual);

    let nota = prompt("Nota:",notaAtual);

    await fetch("/editar-jogador",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            id,
            nome,
            posicao,
            nota
        })
    });

    listar();
}

function sortear(){

    let selecionados = document.querySelectorAll(".disponivel:checked");

    let jogadores = [];

    selecionados.forEach(x=>{

        jogadores.push({
            id:x.dataset.id,
            nome:x.dataset.nome,
            nota:x.dataset.nota,
            posicao:x.dataset.posicao
        });

    });

    TIMES.time1 = [];
    TIMES.time2 = [];
    TIMES.time3 = [];

    jogadores.forEach((j,index)=>{

        if(index % 3 === 0){
            TIMES.time1.push(j);
        }

        if(index % 3 === 1){
            TIMES.time2.push(j);
        }

        if(index % 3 === 2){
            TIMES.time3.push(j);
        }

    });

    renderizarTodos();
}

function criarJogador(j,top,left,campo){

    let div = document.createElement("div");

    div.className = "jogador-campo";

    div.style.top = top;

    div.style.left = left;

    let icone = "⚽";

    if(j.posicao === "G"){
        icone = "🧤";
    }

    if(j.posicao === "Z"){
        icone = "🛡️";
    }

    if(j.posicao === "M"){
        icone = "🎯";
    }

    if(j.posicao === "A"){
        icone = "🔥";
    }

    div.innerHTML = `
        <div class="icone-jogador">${icone}</div>
        <div class="nome-jogador">${j.nome}</div>
    `;

    campo.appendChild(div);
}

function renderizarTime(id,jogadores){

    let campo = document.getElementById(id);

    campo.innerHTML = "";

    jogadores.forEach((j,index)=>{

        criarJogador(
            j,
            `${20 + (index * 8)}%`,
            `${20 + (index * 10)}%`,
            campo
        );

    });

}

function renderizarTodos(){

    renderizarTime("time1",TIMES.time1);

    renderizarTime("time2",TIMES.time2);

    renderizarTime("time3",TIMES.time3);
}

async function registrarJogos(){

    let ids = [];

    Object.values(TIMES).forEach(time=>{

        time.forEach(j=>{

            ids.push(j.id);

        });

    });

    await fetch("/registrar-jogo",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            jogadores:ids
        })
    });

    alert("Jogos registrados!");

    listar();
}

async function salvarVitoria(nomeTime){

    await fetch("/salvar-partida",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            nome_time:nomeTime
        })
    });

    carregarRankingTimes();
}

async function carregarRankingTimes(){

    let res = await fetch("/ranking-times");

    let dados = await res.json();

    let div = document.getElementById("rankingTimes");

    div.innerHTML = "";

    dados.forEach(t=>{

        div.innerHTML += `
            <div class="card-ranking">
                🏆 ${t.nome_time} - ${t.vitorias}
            </div>
        `;

    });

}

async function carregarDashboard(){

    let res = await fetch("/dashboard");

    let dados = await res.json();

    let artilharia = document.getElementById("topArtilharia");

    artilharia.innerHTML = "";

    dados.artilharia.forEach(j=>{

        artilharia.innerHTML += `
            <div class="card-ranking">
                ⚽ ${j.nome} - ${j.gols}
            </div>
        `;

    });

    let goleiro = document.getElementById("topGoleiro");

    goleiro.innerHTML = `
        <div class="card-ranking">
            🧤 ${dados.goleiro.nome} - ${dados.goleiro.gols}
        </div>
    `;
}

function copiarTimes(){

    let texto = "";

    Object.entries(TIMES).forEach(([nome,jogadores])=>{

        texto += `${nome}\n`;

        jogadores.forEach(j=>{

            texto += `- ${j.nome}\n`;

        });

        texto += `\n`;

    });

    navigator.clipboard.writeText(texto);

    alert("Copiado!");
}

function baixarImagem(){

    html2canvas(document.getElementById("time1")).then(canvas=>{

        let link = document.createElement("a");

        link.download = "time.png";

        link.href = canvas.toDataURL();

        link.click();

    });

}

listar();