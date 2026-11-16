const controleCliente = new ControleCliente();
let clienteAtual = null;

// Referências dos elementos da tela (equivalente aos x:Name do XAML)
const telaCadastro = document.getElementById("telaCadastro");
const telaLista = document.getElementById("telaLista");
const listaClientesEl = document.getElementById("listaClientes");

const idLabel = document.getElementById("IdLabel");
const entryNomeCliente = document.getElementById("EntryNomeCliente");
const entryCPFCliente = document.getElementById("EntryCPFCliente");
const entryTelefoneCliente = document.getElementById("EntryTelefoneCliente");
const entryEmailCliente = document.getElementById("EntryEmailCliente");

// Eventos de clique (equivalente ao Clicked="..." do XAML)
document.getElementById("btnSalvar").addEventListener("click", onSalvarDadosClienteClicked);
document.getElementById("btnExcluir").addEventListener("click", onApagarClienteClicked);
document.getElementById("btnVoltar").addEventListener("click", onVoltarCadastroClienteClicked);
document.getElementById("btnNovoCliente").addEventListener("click", () => abrirTelaCadastro(null));

// Equivalente ao OnAppearing()
function abrirTelaCadastro(cliente) {
    clienteAtual = cliente;
    telaLista.classList.add("oculto");
    telaCadastro.classList.remove("oculto");

    if (clienteAtual != null) {
        idLabel.textContent = clienteAtual.id.toString();
        entryNomeCliente.value = clienteAtual.nome;
        entryEmailCliente.value = clienteAtual.email;
        entryTelefoneCliente.value = clienteAtual.telefone;
        entryCPFCliente.value = clienteAtual.cpf;
    } else {
        limparCampos();
    }
}

function limparCampos() {
    idLabel.textContent = "";
    entryNomeCliente.value = "";
    entryEmailCliente.value = "";
    entryTelefoneCliente.value = "";
    entryCPFCliente.value = "";
}

function verificaSeDadosEstaoCorretos() {
    if (!entryNomeCliente.value.trim()) {
        alert("O campo Nome é obrigatório");
        return false;
    } else if (!entryEmailCliente.value.trim()) {
        alert("O campo Email é obrigatório");
        return false;
    } else if (!entryTelefoneCliente.value.trim()) {
        alert("O campo Telefone é obrigatório");
        return false;
    }
    return true;
}

async function onSalvarDadosClienteClicked() {
    if (!verificaSeDadosEstaoCorretos()) return;

    try {
        const cliente = new Cliente();

        if (idLabel.textContent.trim() !== "") {
            cliente.id = parseInt(idLabel.textContent, 10);
        } else {
            cliente.id = 0;
        }

        cliente.nome = entryNomeCliente.value.trim();
        cliente.email = entryEmailCliente.value.trim();
        cliente.telefone = entryTelefoneCliente.value.trim();
        cliente.cpf = entryCPFCliente.value.trim();

        const idSalvo = await controleCliente.criarOuAtualizar(cliente);

        // Atualiza o ID na tela caso seja um cliente recém-criado
        cliente.id = idSalvo;
        clienteAtual = cliente;
        idLabel.textContent = idSalvo.toString();

        alert("Dados salvos com sucesso!");
    } catch (erro) {
        alert("Erro ao salvar cliente: " + erro);
    }
}

async function onApagarClienteClicked() {
    if (clienteAtual == null || clienteAtual.id < 1) {
        alert("Nenhum cliente para excluir");
    } else if (confirm("Tem certeza que deseja excluir esse cliente?")) {
        try {
            await controleCliente.apagar(clienteAtual.id);
            onVoltarCadastroClienteClicked();
        } catch (erro) {
            alert("Erro ao excluir cliente: " + erro);
        }
    }
}

async function onVoltarCadastroClienteClicked() {
    telaCadastro.classList.add("oculto");
    telaLista.classList.remove("oculto");
    await carregarListaClientes();
}

async function carregarListaClientes() {
    const clientes = await controleCliente.lerTodos();
    listaClientesEl.innerHTML = "";

    if (clientes.length === 0) {
        const aviso = document.createElement("li");
        aviso.className = "lista-vazia";
        aviso.textContent = "Nenhum cliente cadastrado ainda.";
        listaClientesEl.appendChild(aviso);
        return;
    }

    clientes.forEach((c) => {
        const li = document.createElement("li");
        li.className = "item-cliente";

        const titulo = document.createElement("strong");
        titulo.textContent = `#${c.id} - ${c.nome}`;

        const detalhes = document.createElement("small");
        detalhes.textContent = `${c.email} | Tel: ${c.telefone}`;

        li.appendChild(titulo);
        li.appendChild(detalhes);

        // Ao clicar em um cliente da lista, abre o cadastro preenchido para editar/excluir
        li.addEventListener("click", () => abrirTelaCadastro(c));
        listaClientesEl.appendChild(li);
    });
}