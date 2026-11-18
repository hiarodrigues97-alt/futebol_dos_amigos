import { api, enviarJson, EVENTO_NAO_AUTORIZADO } from "./api.js";
import { fecharAoClicarFora, mensagem } from "./ui.js";

const estado = { admin: false, protegido: true };

function aplicar() {
    // body.admin liberta tudo que tem a classe .somente-admin (ver style.css)
    document.body.classList.toggle("admin", estado.admin);
    const botaoAuth = document.getElementById("btnAuth");
    botaoAuth.hidden = !estado.protegido;
    botaoAuth.textContent = estado.admin ? "🔓 Sair" : "🔒 Entrar";
    document.getElementById("avisoSemSenha").classList.toggle("d-none", estado.protegido);
}

export async function carregarSessao() {
    try {
        const status = await api("/auth/status");
        estado.admin = status.admin;
        estado.protegido = status.protegido;
    } catch {
        estado.admin = false; // na dúvida, mostra só a visualização
    }
    aplicar();
}

function abrirLogin(aviso = "") {
    const dialogo = document.getElementById("dlgLogin");
    document.getElementById("erroLogin").textContent = aviso;
    document.getElementById("campoSenha").value = "";
    if (!dialogo.open) dialogo.showModal();
    document.getElementById("campoSenha").focus();
}

async function entrar(evento) {
    evento.preventDefault();
    const senha = document.getElementById("campoSenha").value;
    const erro = document.getElementById("erroLogin");
    erro.textContent = "";
    try {
        await enviarJson("/auth/login", "POST", { senha });
        estado.admin = true;
        aplicar();
        document.getElementById("dlgLogin").close();
        mensagem("Login feito. Você pode editar os dados.");
    } catch (e) {
        erro.textContent = e.message;
        document.getElementById("campoSenha").select();
    }
}

async function sair() {
    try { await enviarJson("/auth/logout", "POST", {}); } catch { /* sai mesmo assim */ }
    estado.admin = false;
    aplicar();
    mensagem("Você saiu do modo admin.");
}

export function iniciarAuth() {
    const dialogo = document.getElementById("dlgLogin");
    fecharAoClicarFora(dialogo);
    document.getElementById("formLogin").addEventListener("submit", entrar);
    document.getElementById("btnCancelarLogin").addEventListener("click", () => dialogo.close());
    document.getElementById("btnAuth").addEventListener("click", () => (estado.admin ? sair() : abrirLogin()));

    document.addEventListener(EVENTO_NAO_AUTORIZADO, () => {
        const estavaLogado = estado.admin;
        estado.admin = false;
        aplicar();
        abrirLogin(estavaLogado ? "Sua sessão expirou. Entre novamente." : "Entre como administrador para editar.");
    });
    return carregarSessao();
}
