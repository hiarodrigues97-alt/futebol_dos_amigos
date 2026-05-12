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

    if (jogadores.length < 6) {

        alert("Selecione mais jogadores");

        return;
    }

    // =========================
    // DEFINIR QUANTIDADE DE TIMES
    // =========================

    const jogadoresPorTime = 7;

    const qtdTimes = Math.ceil(jogadores.length / jogadoresPorTime);

    let times = [];

    for (let i = 0; i < qtdTimes; i++) {

        times.push({
            jogadores: [],
            soma: 0
        });
    }

    // =========================
    // SEPARAR POSIÇÕES
    // =========================

    let goleiros = jogadores.filter(j => j.posicao === "G");

    let atacantes = jogadores.filter(j => j.posicao === "A");

    let meias = jogadores.filter(j => j.posicao === "M");

    let zagueiros = jogadores.filter(j => j.posicao === "Z");

    // =========================
    // EMBARALHAR
    // =========================

    embaralhar(goleiros);

    embaralhar(atacantes);

    embaralhar(meias);

    embaralhar(zagueiros);

    // =========================
    // DISTRIBUIR GOLEIROS
    // =========================

    goleiros.forEach((j, i) => {

        let time = times[i % qtdTimes];

        adicionarNoTime(time, j);
    });

    // =========================
    // DISTRIBUIR ATACANTES
    // =========================

    atacantes.forEach((j, i) => {

        let candidatos = times.filter(t => {

            let qtdA = t.jogadores.filter(x => x.posicao === "A").length;

            return qtdA === 0 &&
                   t.jogadores.length < jogadoresPorTime;
        });

        if (candidatos.length === 0) {

            candidatos = times.filter(t =>
                t.jogadores.length < jogadoresPorTime
            );
        }

        candidatos.sort((a, b) => a.soma - b.soma);

        adicionarNoTime(candidatos[0], j);
    });

    // =========================
    // DISTRIBUIR MEIAS
    // =========================

    meias.forEach(j => {

        let candidatos = times.filter(t =>
            t.jogadores.length < jogadoresPorTime
        );

        candidatos.sort((a, b) => a.soma - b.soma);

        adicionarNoTime(candidatos[0], j);
    });

    // =========================
    // DISTRIBUIR ZAGUEIROS
    // =========================

    zagueiros.forEach(j => {

        let candidatos = times.filter(t =>
            t.jogadores.length < jogadoresPorTime
        );

        candidatos.sort((a, b) => a.soma - b.soma);

        adicionarNoTime(candidatos[0], j);
    });

    // =========================
    // BALANCEAMENTO FINAL
    // =========================

    times.forEach(time => {

        time.jogadores.sort((a, b) => b.nota - a.nota);
    });

    // =========================
    // RENDER
    // =========================

    for (let i = 0; i < qtdTimes; i++) {

        renderizarTime(`time${i + 1}`, times[i]);
    }

    // LIMPAR TIMES SOBRANDO
    for (let i = qtdTimes + 1; i <= 5; i++) {

        let el = document.getElementById(`time${i}`);

        if (el) {

            el.innerHTML = "";
        }
    }
}