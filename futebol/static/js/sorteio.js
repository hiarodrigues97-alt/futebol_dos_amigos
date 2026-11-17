// Lógica pura do sorteio (sem DOM e sem banco), fácil de testar.
export const POSICOES = ["G", "Z", "M", "A"];
export const MINIMO_JOGADORES = 21;

export function embaralhar(lista, aleatorio = Math.random) {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(aleatorio() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

function menorTime(times, posicao, equilibrarNotas, aleatorio) {
    // Prioridade: menos jogadores nessa posição > menos jogadores no total > (opcional) menor nota.
    // Os times são embaralhados antes, então empates são decididos no sorteio.
    const chave = (t) => [t.porPosicao[posicao] || 0, t.jogadores.length, equilibrarNotas ? t.nota : 0];
    const menor = (a, b) => {
        const ca = chave(a), cb = chave(b);
        for (let i = 0; i < ca.length; i++) if (ca[i] !== cb[i]) return ca[i] < cb[i] ? a : b;
        return a;
    };
    return embaralhar(times, aleatorio).reduce(menor);
}

/**
 * Divide os jogadores em `numTimes` times.
 * Corrige o sorteio antigo, que sempre começava pelo Time 1 em cada posição e deixava
 * os times com tamanhos diferentes (ex.: 8, 7 e 6 jogadores com 21 selecionados).
 *
 * @param jogadores [{id, nome, posicao, nota}]
 * @param equilibrarNotas false = aleatório por posição (como antes); true = também iguala a soma das notas
 * @returns array com `numTimes` listas de jogadores
 */
export function distribuirTimes(jogadores, { numTimes = 3, equilibrarNotas = false, aleatorio = Math.random } = {}) {
    const times = Array.from({ length: numTimes }, () => ({ jogadores: [], nota: 0, porPosicao: {} }));

    for (const posicao of POSICOES) {
        const grupo = embaralhar(jogadores.filter((j) => j.posicao === posicao), aleatorio);
        if (equilibrarNotas) grupo.sort((a, b) => (Number(b.nota) || 0) - (Number(a.nota) || 0));

        for (const jogador of grupo) {
            const time = menorTime(times, posicao, equilibrarNotas, aleatorio);
            time.jogadores.push(jogador);
            time.nota += Number(jogador.nota) || 0;
            time.porPosicao[posicao] = (time.porPosicao[posicao] || 0) + 1;
        }
    }
    return times.map((t) => t.jogadores);
}

export function contarPosicao(jogadores, posicao) {
    return jogadores.filter((j) => j.posicao === posicao).length;
}
