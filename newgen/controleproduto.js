class ControleProduto extends ControleBase {
    constructor() {
        super("Produtos");
    }

    // Equivalente ao FindOne
    async ler(id) {
        const db = await this.abrirBanco();
        return new Promise((resolve, reject) => {
            const store = db.transaction(this.nomeDaTabela, "readonly").objectStore(this.nomeDaTabela);
            const request = store.get(Number(id));
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    // Equivalente ao FindAll().OrderBy(d => d.Nome)
    async lerTodos() {
        const db = await this.abrirBanco();
        return new Promise((resolve, reject) => {
            const store = db.transaction(this.nomeDaTabela, "readonly").objectStore(this.nomeDaTabela);
            const request = store.getAll();
            request.onsuccess = () => {
                const lista = request.result.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
                resolve(lista);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Cadastro e edição. A quantidade NÃO muda aqui: ela só muda por entrada/baixa.
    async salvar(produto) {
        const db = await this.abrirBanco();
        return new Promise((resolve, reject) => {
            const store = db.transaction(this.nomeDaTabela, "readwrite").objectStore(this.nomeDaTabela);
            const dados = { ...produto, estoqueMinimo: Number(produto.estoqueMinimo) || 0 };

            if (!dados.id) {
                // NOVO PRODUTO: sem id, para o banco gerar. Começa com saldo zero.
                delete dados.id;
                dados.quantidade = 0;
                dados.lotes = [];

                const request = store.put(dados);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } else {
                // EDIÇÃO: busca o registro atual para preservar saldo e lotes
                const getRequest = store.get(Number(dados.id));

                getRequest.onsuccess = () => {
                    const atual = getRequest.result;
                    if (!atual) {
                        reject(new Error("Produto não encontrado"));
                        return;
                    }

                    dados.id = Number(dados.id);
                    dados.quantidade = atual.quantidade;
                    dados.lotes = atual.lotes || [];

                    const putRequest = store.put(dados);
                    putRequest.onsuccess = () => resolve(putRequest.result);
                    putRequest.onerror = () => reject(putRequest.error);
                };
                getRequest.onerror = () => reject(getRequest.error);
            }
        });
    }

    // Equivalente ao Delete
    async apagar(id) {
        const db = await this.abrirBanco();
        return new Promise((resolve, reject) => {
            const store = db.transaction(this.nomeDaTabela, "readwrite").objectStore(this.nomeDaTabela);
            const request = store.delete(Number(id));
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ENTRADA ou BAIXA. Atualiza o saldo e grava o histórico NA MESMA transação.
    async movimentar(produtoId, tipo, quantidade, observacao = "") {
        const qtd = Number(quantidade);
        if (!qtd || qtd <= 0) {
            throw new Error("A quantidade deve ser maior que zero");
        }

        const db = await this.abrirBanco();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(["Produtos", "Movimentacoes"], "readwrite");
            const storeProdutos = tx.objectStore("Produtos");
            const storeMov = tx.objectStore("Movimentacoes");

            let novoSaldo = 0;
            let erroNegocio = null;

            const request = storeProdutos.get(Number(produtoId));

            request.onsuccess = () => {
                const produto = request.result;

                if (!produto) {
                    erroNegocio = "Produto não encontrado";
                    tx.abort();
                    return;
                }

                if (tipo === "BAIXA" && qtd > produto.quantidade) {
                    erroNegocio = `Saldo insuficiente. Disponível: ${produto.quantidade} ${produto.unidade}`;
                    tx.abort();
                    return;
                }

                novoSaldo = tipo === "ENTRADA"
                    ? produto.quantidade + qtd
                    : produto.quantidade - qtd;

                produto.quantidade = novoSaldo;
                storeProdutos.put(produto);

                storeMov.add(new Movimentacao({
                    produtoId: Number(produtoId),
                    tipo,
                    quantidade: qtd,
                    saldoApos: novoSaldo,
                    observacao
                }));
            };

            tx.oncomplete = () => resolve(novoSaldo);
            tx.onabort = () => reject(new Error(erroNegocio || (tx.error && tx.error.message) || "Operação cancelada"));
            tx.onerror = () => reject(tx.error);
        });
    }
}