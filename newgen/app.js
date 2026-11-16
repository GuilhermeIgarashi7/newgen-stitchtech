const controleProduto = new ControleProduto();

// Estado da aplicação
let produtosCache = [];      // todos os produtos carregados do banco
let produtoEmEdicao = null;  // null = cadastro novo
let movimentoAtual = null;   // { produto, tipo } usado pelo modal
let fotoAtual = "";          // foto em base64 no formulário

// Elementos da tela
const telaInicio = document.getElementById("telaInicio");
const telaCadastro = document.getElementById("telaCadastro");
const inputBusca = document.getElementById("inputBusca");
const listaProdutosEl = document.getElementById("listaProdutos");
const resumoTotal = document.getElementById("resumoTotal");
const resumoBaixo = document.getElementById("resumoBaixo");
const resumoVencendo = document.getElementById("resumoVencendo");

const tituloCadastro = document.getElementById("tituloCadastro");
const inputCodigoBarras = document.getElementById("inputCodigoBarras");
const inputFotoCamera = document.getElementById("inputFotoCamera");
const inputFotoArquivo = document.getElementById("inputFotoArquivo");
const previewFoto = document.getElementById("previewFoto");
const btnRemoverFoto = document.getElementById("btnRemoverFoto");
const inputNome = document.getElementById("inputNome");
const selectUnidade = document.getElementById("selectUnidade");
const inputEstoqueMinimo = document.getElementById("inputEstoqueMinimo");
const chkControlaLote = document.getElementById("chkControlaLote");
const inputQuantidadeInicial = document.getElementById("inputQuantidadeInicial");
const hintQuantidade = document.getElementById("hintQuantidade");
const btnSalvarProduto = document.getElementById("btnSalvarProduto");
const btnExcluir = document.getElementById("btnExcluir");

const modalMovimento = document.getElementById("modalMovimento");
const modalTitulo = document.getElementById("modalTitulo");
const modalProduto = document.getElementById("modalProduto");
const inputQuantidadeMov = document.getElementById("inputQuantidadeMov");
const inputObsMov = document.getElementById("inputObsMov");
const btnConfirmarMov = document.getElementById("btnConfirmarMov");

// Textos e classes de cada status
const STATUS = {
    OK: { texto: "EM ESTOQUE", classe: "ok" },
    BAIXO: { texto: "BAIXO", classe: "baixo" },
    CRITICO: { texto: "CRÍTICO", classe: "critico" }
};

// ================= INICIALIZAÇÃO =================

document.addEventListener("DOMContentLoaded", iniciar);

function iniciar() {
    // Início
    document.getElementById("btnNovoProduto").addEventListener("click", () => abrirCadastro(null));
    inputBusca.addEventListener("input", aplicarBusca);
    listaProdutosEl.addEventListener("click", onCliqueNaLista);

    // Cabeçalho
    document.getElementById("btnScanner").addEventListener("click", () =>
        alert("O leitor de código de barras será adicionado na próxima etapa."));
    document.getElementById("btnSair").addEventListener("click", () =>
        alert("Login ainda não implementado."));

    // Cadastro
    document.getElementById("btnFotoCamera").addEventListener("click", () => inputFotoCamera.click());
    document.getElementById("btnFotoArquivo").addEventListener("click", () => inputFotoArquivo.click());
    inputFotoCamera.addEventListener("change", onFotoSelecionada);
    inputFotoArquivo.addEventListener("change", onFotoSelecionada);
    btnRemoverFoto.addEventListener("click", removerFoto);
    document.getElementById("btnCancelarCadastro").addEventListener("click", () => mostrarTela("inicio"));
    btnSalvarProduto.addEventListener("click", onSalvarProduto);
    btnExcluir.addEventListener("click", onExcluirProduto);

    // Modal
    document.getElementById("btnCancelarMov").addEventListener("click", fecharModal);
    btnConfirmarMov.addEventListener("click", onConfirmarMovimento);

    // Navegação inferior
    document.querySelectorAll("[data-nav]").forEach((botao) =>
        botao.addEventListener("click", () => onNavegar(botao.dataset.nav)));

    carregarInicio();
}

// ================= NAVEGAÇÃO ENTRE TELAS =================

function mostrarTela(nome) {
    telaInicio.classList.toggle("oculto", nome !== "inicio");
    telaCadastro.classList.toggle("oculto", nome !== "cadastro");
    document.querySelectorAll("[data-nav]").forEach((botao) =>
        botao.classList.toggle("ativo", nome === "inicio" && botao.dataset.nav === "inicio"));
    window.scrollTo(0, 0);
}

function onNavegar(destino) {
    if (destino === "inicio" || destino === "produtos") {
        mostrarTela("inicio");
        carregarInicio();
    } else {
        alert("Esta área ainda será implementada.");
    }
}

// ================= TELA INÍCIO =================

async function carregarInicio() {
    try {
        produtosCache = await controleProduto.lerTodos();
        atualizarResumo();
        aplicarBusca();
    } catch (erro) {
        alert("Erro ao carregar produtos: " + (erro?.message ?? erro));
    }
}

function atualizarResumo() {
    const comAlerta = produtosCache.filter((p) => Produto.calcularStatus(p) !== "OK").length;

    resumoTotal.textContent = produtosCache.length;
    resumoBaixo.textContent = comAlerta;
    resumoVencendo.textContent = 0; // será calculado quando os lotes com validade existirem
}

function aplicarBusca() {
    const termo = inputBusca.value.trim().toLowerCase();

    const filtrados = produtosCache.filter((p) =>
        p.nome.toLowerCase().includes(termo) ||
        (p.codigoBarras || "").includes(termo));

    renderizarLista(filtrados);
}

function renderizarLista(lista) {
    if (lista.length === 0) {
        listaProdutosEl.innerHTML = `<p class="lista-vazia">Nenhum produto encontrado.</p>`;
        return;
    }
    listaProdutosEl.innerHTML = lista.map(criarCardHTML).join("");
}

function criarCardHTML(p) {
    const status = STATUS[Produto.calcularStatus(p)];
    const icone = p.foto ? `<img src="${p.foto}" alt="">` : "📦";
    const lotes = p.controlaLote ? ` · ${(p.lotes || []).length} lote(s)` : "";

    return `
        <article class="card-produto">
            <div class="card-topo">
                <div class="card-icone">${icone}</div>
                <div class="card-info">
                    <h3>${escapeHtml(p.nome)}</h3>
                    <span class="codigo">${escapeHtml(p.codigoBarras || "Sem código de barras")}</span>
                </div>
                <span class="badge badge-${status.classe}">${status.texto}</span>
            </div>

            <p class="card-estoque">
                Estoque: <strong class="qtd-${status.classe}">${p.quantidade} ${escapeHtml(p.unidade)}</strong>${lotes}
            </p>

            <div class="card-acoes">
                <button class="btn-entrada" data-acao="entrada" data-id="${p.id}">+ Entrada</button>
                <button class="btn-baixa" data-acao="baixa" data-id="${p.id}">− Baixa</button>
                <button class="btn-editar" data-acao="editar" data-id="${p.id}">✎ Editar</button>
            </div>
        </article>`;
}

function onCliqueNaLista(evento) {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;

    const id = Number(botao.dataset.id);
    const produto = produtosCache.find((p) => p.id === id);
    if (!produto) return;

    const acao = botao.dataset.acao;
    if (acao === "editar") {
        abrirCadastro(produto);
    } else {
        abrirModalMovimento(produto, acao === "entrada" ? "ENTRADA" : "BAIXA");
    }
}

// ================= MODAL DE MOVIMENTAÇÃO =================

function abrirModalMovimento(produto, tipo) {
    movimentoAtual = { produto, tipo };
    const ehEntrada = tipo === "ENTRADA";

    modalTitulo.textContent = ehEntrada ? "Registrar entrada" : "Registrar baixa";
    modalProduto.textContent = `${produto.nome} — saldo atual: ${produto.quantidade} ${produto.unidade}`;
    inputQuantidadeMov.value = "";
    inputObsMov.value = "";

    btnConfirmarMov.className = "btn-principal " + (ehEntrada ? "btn-entrada" : "btn-baixa");
    btnConfirmarMov.textContent = ehEntrada ? "+ Confirmar entrada" : "− Confirmar baixa";

    modalMovimento.classList.remove("oculto");
    inputQuantidadeMov.focus();
}

function fecharModal() {
    modalMovimento.classList.add("oculto");
    movimentoAtual = null;
}

async function onConfirmarMovimento() {
    const quantidade = Number(inputQuantidadeMov.value);

    if (!quantidade || quantidade <= 0) {
        alert("Informe uma quantidade maior que zero.");
        return;
    }

    try {
        await controleProduto.movimentar(
            movimentoAtual.produto.id,
            movimentoAtual.tipo,
            quantidade,
            inputObsMov.value.trim()
        );
        fecharModal();
        await carregarInicio();
    } catch (erro) {
        alert(erro?.message ?? erro);
    }
}

// ================= TELA DE CADASTRO =================

function abrirCadastro(produto) {
    produtoEmEdicao = produto;
    const editando = produto !== null;

    tituloCadastro.textContent = editando ? "Editar produto" : "Novo produto";
    btnSalvarProduto.textContent = editando ? "Salvar alterações" : "Cadastrar produto";
    btnExcluir.classList.toggle("oculto", !editando);

    if (editando) {
        inputCodigoBarras.value = produto.codigoBarras || "";
        inputNome.value = produto.nome;
        selectUnidade.value = produto.unidade;
        inputEstoqueMinimo.value = produto.estoqueMinimo;
        chkControlaLote.checked = produto.controlaLote;
        inputQuantidadeInicial.value = produto.quantidade;
        inputQuantidadeInicial.disabled = true; // saldo só muda por entrada/baixa
        fotoAtual = produto.foto || "";
        hintQuantidade.textContent = "Para alterar o saldo, use Entrada ou Baixa na tela inicial.";
    } else {
        limparFormulario();
        hintQuantidade.textContent = "Saldo inicial do estoque (será registrado como entrada).";
    }

    atualizarPreviewFoto();
    mostrarTela("cadastro");
}

function limparFormulario() {
    inputCodigoBarras.value = "";
    inputNome.value = "";
    selectUnidade.value = "un";
    inputEstoqueMinimo.value = "";
    chkControlaLote.checked = false;
    inputQuantidadeInicial.value = "";
    inputQuantidadeInicial.disabled = false;
    inputFotoCamera.value = "";
    inputFotoArquivo.value = "";
    fotoAtual = "";
}

// ================= FOTO =================

function onFotoSelecionada(evento) {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = () => {
        fotoAtual = leitor.result; // data URL (base64)
        atualizarPreviewFoto();
    };
    leitor.readAsDataURL(arquivo);
}

function removerFoto() {
    fotoAtual = "";
    inputFotoCamera.value = "";
    inputFotoArquivo.value = "";
    atualizarPreviewFoto();
}

function atualizarPreviewFoto() {
    const temFoto = fotoAtual !== "";
    previewFoto.src = temFoto ? fotoAtual : "";
    previewFoto.classList.toggle("oculto", !temFoto);
    btnRemoverFoto.classList.toggle("oculto", !temFoto);
}

// ================= SALVAR / EXCLUIR =================

async function onSalvarProduto() {
    const nome = inputNome.value.trim();
    const estoqueMinimo = Number(inputEstoqueMinimo.value || 0);
    const qtdInicial = Number(inputQuantidadeInicial.value || 0);

    if (!nome) {
        alert("Informe o nome do produto.");
        inputNome.focus();
        return;
    }
    if (estoqueMinimo < 0) {
        alert("O estoque mínimo não pode ser negativo.");
        return;
    }
    if (!produtoEmEdicao && qtdInicial < 0) {
        alert("A quantidade inicial não pode ser negativa.");
        return;
    }

    const produto = new Produto({
        id: produtoEmEdicao ? produtoEmEdicao.id : 0,
        nome,
        codigoBarras: inputCodigoBarras.value.trim(),
        foto: fotoAtual,
        unidade: selectUnidade.value,
        estoqueMinimo,
        controlaLote: chkControlaLote.checked
    });

    try {
        const id = await controleProduto.salvar(produto);

        // Só no cadastro novo: o saldo inicial vira uma ENTRADA no histórico
        if (!produtoEmEdicao && qtdInicial > 0) {
            await controleProduto.movimentar(id, "ENTRADA", qtdInicial, "Saldo inicial");
        }

        alert("Produto salvo com sucesso!");
        mostrarTela("inicio");
        await carregarInicio();
    } catch (erro) {
        alert("Erro ao salvar produto: " + (erro?.message ?? erro));
    }
}

async function onExcluirProduto() {
    if (!produtoEmEdicao) return;

    if (!confirm(`Tem certeza que deseja excluir "${produtoEmEdicao.nome}"?`)) return;

    try {
        await controleProduto.apagar(produtoEmEdicao.id);
        mostrarTela("inicio");
        await carregarInicio();
    } catch (erro) {
        alert("Erro ao excluir produto: " + (erro?.message ?? erro));
    }
}

// ================= UTILIDADES =================

// Evita que textos digitados pelo usuário quebrem o HTML (ou injetem código)
function escapeHtml(texto) {
    return String(texto).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}