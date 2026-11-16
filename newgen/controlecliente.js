class ControleCliente extends ControleBase {
    constructor() {
        super("Clientes");
    }

    // Equivalente ao FindOne
    async ler(idCliente) {
        const db = await this.abrirBanco();
        return new Promise((resolve, reject) => {
            const transacao = db.transaction(this.nomeDaTabela, "readonly");
            const collection = transacao.objectStore(this.nomeDaTabela);
            const request = collection.get(Number(idCliente));

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    // Equivalente ao FindAll().OrderBy(d => d.Nome)
    async lerTodos() {
        const db = await this.abrirBanco();
        return new Promise((resolve, reject) => {
            const transacao = db.transaction(this.nomeDaTabela, "readonly");
            const tabela = transacao.objectStore(this.nomeDaTabela);
            const request = tabela.getAll();

            request.onsuccess = () => {
                const listaOrdenada = request.result.sort((a, b) =>
                    a.nome.localeCompare(b.nome, "pt-BR")
                );
                resolve(listaOrdenada);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Equivalente ao Delete
    async apagar(idCliente) {
        const db = await this.abrirBanco();
        return new Promise((resolve, reject) => {
            const transacao = db.transaction(this.nomeDaTabela, "readwrite");
            const collection = transacao.objectStore(this.nomeDaTabela);
            const request = collection.delete(Number(idCliente));

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Equivalente ao Upsert
    async criarOuAtualizar(cliente) {
        const db = await this.abrirBanco();
        return new Promise((resolve, reject) => {
            const transacao = db.transaction(this.nomeDaTabela, "readwrite");
            const collection = transacao.objectStore(this.nomeDaTabela);

            const dados = { ...cliente };

            // Se o ID for 0 ou vazio, removemos a propriedade para o banco gerar o próximo ID
            if (!dados.id || dados.id < 1) {
                delete dados.id;
            } else {
                dados.id = Number(dados.id);
            }

            const request = collection.put(dados);

            request.onsuccess = () => resolve(request.result); // Retorna o ID salvo
            request.onerror = () => reject(request.error);
        });
    }
}