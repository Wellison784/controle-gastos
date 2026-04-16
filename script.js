let salario = localStorage.getItem("salario") || 0;
let gastos = JSON.parse(localStorage.getItem("gastos")) || [];

// 🔹 Variável global do gráfico
let grafico = null;

// 🔹 Categorias
let categoriasPersonalizadas = JSON.parse(localStorage.getItem("categorias")) || [
    "Alimentação",
    "Transporte",
    "Saúde",
    "Educação",
    "Lazer",
    "Outros"
];
// 🔹 Trocar telas
function trocarTela(id) {
    document.querySelectorAll(".tela").forEach(t => t.classList.remove("ativa"));
    document.getElementById(id).classList.add("ativa");

    // 🔥 Atualiza gráfico quando abre
    if (id === "tela-grafico") {
        setTimeout(() => {
            atualizarGrafico();
        }, 300);
    }
}

// 🔹 Carregar categorias
function carregarCategorias() {
    let select = document.getElementById("categoria");
    select.innerHTML = "";

    categoriasPersonalizadas.forEach(cat => {
        let opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
    });
}

function editarCategorias() {
    let novas = prompt("Edite as categorias separadas por vírgula:\n" + categoriasPersonalizadas.join(", "));

    if (!novas) return;

    categoriasPersonalizadas = novas.split(",").map(c => c.trim());

    localStorage.setItem("categorias", JSON.stringify(categoriasPersonalizadas));

    carregarCategorias();
}

// 🔹 Definir salário
function definirSalario() {
    salario = parseFloat(document.getElementById("salario").value) || 0;
    localStorage.setItem("salario", salario);
    atualizarInterface();
}

// 🔹 Adicionar gasto
function adicionarGasto() {
    let descricao = document.getElementById("descricao").value;
    let valor = parseFloat(document.getElementById("valor").value);
    let categoria = document.getElementById("categoria").value;
    let mes = document.getElementById("mes").value;
    let ano = document.getElementById("ano").value;

    if (!descricao || !valor || !ano) {
        alert("Preencha tudo!");
        return;
    }

    gastos.push({ descricao, valor, categoria, mes, ano });
    localStorage.setItem("gastos", JSON.stringify(gastos));

    atualizarInterface();
}

// 🔹 Limpar dados
function limparDados() {
    if (confirm("Deseja apagar tudo?")) {
        localStorage.clear();
        location.reload();
    }
}

// 🔹 Atualizar interface
function atualizarInterface() {
    let total = gastos.reduce((sum, g) => sum + g.valor, 0);

    document.getElementById("total-gastos").textContent = total.toFixed(2);
    document.getElementById("saldo").textContent = (salario - total).toFixed(2);

    let lista = document.getElementById("lista-gastos");
    lista.innerHTML = "";

    gastos.forEach(g => {
        let li = document.createElement("li");
        li.textContent = `${g.descricao} - R$ ${g.valor} (${g.mes}/${g.ano})`;
        lista.appendChild(li);
    });

    atualizarMaiorGasto();
}

// 🔥 FUNÇÃO DO GRÁFICO (CORRIGIDA DE VERDADE)
function atualizarGrafico() {
    const canvas = document.getElementById("grafico");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // 🔥 destrói corretamente
    if (grafico && typeof grafico.destroy === "function") {
        grafico.destroy();
        grafico = null;
    }

    // 🔴 sem dados
    if (gastos.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "16px Arial";
        ctx.fillText("Sem dados ainda", 50, 100);
        return;
    }

    // 🔹 agrupar categorias
    let categorias = {};
    gastos.forEach(g => {
        categorias[g.categoria] = (categorias[g.categoria] || 0) + g.valor;
    });

    let labels = Object.keys(categorias);
    let valores = Object.values(categorias);

    let cores = labels.map(() =>
        `hsl(${Math.random()*360},70%,60%)`
    );

    // 🔥 cria gráfico
    grafico = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: cores
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// 🔹 Maior gasto
function atualizarMaiorGasto() {
    if (gastos.length === 0) {
        document.getElementById("maior-gasto").textContent = "Nenhum gasto";
        return;
    }

    let maior = gastos.reduce((a, b) => a.valor > b.valor ? a : b);

    document.getElementById("maior-gasto").textContent =
        `Maior gasto: ${maior.descricao} - R$ ${maior.valor}`;
}


function imprimirRelatorio() {
    let total = document.getElementById("total-gastos").textContent;
    let saldo = document.getElementById("saldo").textContent;
    let lista = document.getElementById("lista-gastos").innerHTML;

    let janela = window.open('', '', 'width=800,height=600');

    janela.document.write(`
        <html>
        <head>
            <title>Relatório</title>
            <style>
                body { font-family: Arial; padding: 20px; }
                h1 { text-align: center; }
                ul { list-style: none; padding: 0; }
                li { margin: 5px 0; }
            </style>
        </head>
        <body>
            <h1>📊 Relatório de Gastos</h1>

            <p><strong>Total gasto:</strong> R$ ${total}</p>
            <p><strong>Saldo:</strong> R$ ${saldo}</p>

            <h3>Lista de gastos:</h3>
            <ul>${lista}</ul>
        </body>
        </html>
    `);

    janela.document.close();
    janela.print();
}



async function exportarPDF() {
    const { jsPDF } = window.jspdf;

    let total = document.getElementById("total-gastos").textContent;
    let saldo = document.getElementById("saldo").textContent;
    let lista = document.getElementById("lista-gastos").innerText;

    let canvas = document.getElementById("grafico");

    // 🔥 captura o gráfico como imagem
    let imagemGrafico = await html2canvas(canvas);

    let imgData = imagemGrafico.toDataURL("image/png");

    let pdf = new jsPDF();

    // TÍTULO
    pdf.setFontSize(16);
    pdf.text("Relatório Financeiro", 20, 20);

    // DADOS
    pdf.setFontSize(12);
    pdf.text(`Total gasto: R$ ${total}`, 20, 40);
    pdf.text(`Saldo: R$ ${saldo}`, 20, 50);

    // LISTA (quebra linha automática)
    let linhas = pdf.splitTextToSize(lista, 170);
    pdf.text("Gastos:", 20, 65);
    pdf.text(linhas, 20, 75);

    // GRÁFICO
    pdf.addImage(imgData, "PNG", 20, 120, 160, 80);

    // SALVAR
    pdf.save("relatorio-gastos.pdf");
}
function toggleMenu() {
    document.getElementById("menu-opcoes").classList.toggle("ativo");
}
document.addEventListener("click", function(e) {
    let menu = document.getElementById("menu-opcoes");
    let botao = document.querySelector(".menu-btn");

    if (!menu.contains(e.target) && !botao.contains(e.target)) {
        menu.classList.remove("ativo");
    }
});

// 🔹 Inicialização
window.onload = () => {
    carregarCategorias();
    atualizarInterface();
};