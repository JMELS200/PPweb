// ------------------------------------------------------
// ELEMENTOS
// ------------------------------------------------------
const editor = document.getElementById("editorVisual");
const textarea = document.getElementById("areatexto");
const estado = document.getElementById("status");
const inputArchivo = document.getElementById("insertar");
const aplicarBtn = document.getElementById("aplicarCambios");

let nombreArchivo = "Documento.txt";
let hayCambios = false;

// ------------------------------------------------------
// ESTADO DEL DOCUMENTO 
// ------------------------------------------------------
function actualizarEstado() {
    estado.textContent = hayCambios
        ? `${nombreArchivo} (Sin guardar)`
        : `${nombreArchivo} (Guardado)`;
}

editor.addEventListener("input", () => {
    hayCambios = true;
    actualizarEstado();
});

// ------------------------------------------------------
// APLICAR CAMBIOS AL ARCHIVO (editor → textarea)
// ------------------------------------------------------
function aplicarCambios() {
    textarea.value = editor.innerText;
    hayCambios = true;
    actualizarEstado();
}

aplicarBtn.addEventListener("click", aplicarCambios);

// ------------------------------------------------------
// CONFIRMACIÓN AL SALIR
// ------------------------------------------------------
window.addEventListener("beforeunload", e => {
    if (hayCambios) {
        e.preventDefault();
        e.returnValue = "";
    }
});

// ------------------------------------------------------
// ABRIR ARCHIVO
// ------------------------------------------------------
function abrirArchivo() {
    if (hayCambios && !confirm("Hay cambios sin guardar. ¿Continuar?")) return;
    inputArchivo.value = "";
    inputArchivo.click();
}

inputArchivo.addEventListener("change", async e => {
    const file = e.target.files[0];
    if (!file) return;

    const texto = await file.text();
    editor.innerText = texto;
    textarea.value = texto;

    nombreArchivo = file.name;
    hayCambios = false;
    actualizarEstado();
});

// ------------------------------------------------------
// GUARDAR ARCHIVO
// ------------------------------------------------------
function guardarComo() {
    aplicarCambios();

    const blob = new Blob([textarea.value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo;
    a.click();

    URL.revokeObjectURL(url);

    hayCambios = false;
    actualizarEstado();
}

function guardar() {
    guardarComo();
}

// ------------------------------------------------------
// MENÚ SUPERIOR
// ------------------------------------------------------
document.getElementById("abrir").onclick = abrirArchivo;
document.getElementById("guardar").onclick = guardar;

document.getElementById("temaclarooscuro").onclick = () => {
    document.body.classList.toggle("dark-mode");
};

// ------------------------------------------------------
// COPIAR / CORTAR / PEGAR
// ------------------------------------------------------
function focusEditor() {
    editor.focus();
}

// COPIAR
document.getElementById("copiar").onclick = () => {
    focusEditor();
    const sel = window.getSelection();
    if (!sel || sel.toString() === "") return;
    navigator.clipboard.writeText(sel.toString());
};

// CORTAR
document.getElementById("cortar").onclick = () => {
    focusEditor();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    navigator.clipboard.writeText(sel.toString());
    sel.deleteFromDocument();

    hayCambios = true;
    actualizarEstado();
};

// PEGAR
document.getElementById("pegar").onclick = () => {
    focusEditor();
    navigator.clipboard.readText().then(texto => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(texto));

        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);

        hayCambios = true;
        actualizarEstado();
    });
};

// ------------------------------------------------------
// (NEGRITA, CURSIVA, ETC.)
// ------------------------------------------------------
function cmd(comando, valor = null) {
    focusEditor();
    document.execCommand(comando, false, valor);
    hayCambios = true;
    actualizarEstado();
}

document.getElementById("negrita").onclick = () => cmd("bold");
document.getElementById("cursiva").onclick = () => cmd("italic");
document.getElementById("subrayado").onclick = () => cmd("underline");
document.getElementById("tachado").onclick = () => cmd("strikeThrough");

document.getElementById("alinearIzq").onclick = () => cmd("justifyLeft");
document.getElementById("alinearCentro").onclick = () => cmd("justifyCenter");
document.getElementById("alinearDer").onclick = () => cmd("justifyRight");

document.getElementById("listado").onclick = () => cmd("insertUnorderedList");
document.getElementById("numerado").onclick = () => cmd("insertOrderedList");

// COLOR
document.getElementById("colorTexto").addEventListener("change", e => {
    cmd("foreColor", e.target.value);
});

// FUENTE
document.getElementById("fuente").addEventListener("change", e => {
    cmd("fontName", e.target.value);
});

// TAMAÑO
document.getElementById("tamano").addEventListener("change", e => {
    cmd("fontSize", e.target.value);
});

// ------------------------------------------------------
// DRAG & DROP
// ------------------------------------------------------
editor.addEventListener("dragover", e => e.preventDefault());

editor.addEventListener("drop", async e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const texto = await file.text();
    editor.innerText = texto;
    textarea.value = texto;

    nombreArchivo = file.name;
    hayCambios = false;
    actualizarEstado();
});

// ------------------------------------------------------
// ATAJOS DE TECLADO
// ------------------------------------------------------
document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        guardar();
    }
    if (e.ctrlKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        abrirArchivo();
    }
});
// ------------------------------------------------------
// TAB / SHIFT+TAB
// ------------------------------------------------------
editor.addEventListener("keydown", e => {
    if (e.key === "Tab") {
        e.preventDefault();

        const sel = window.getSelection();
        if (!sel.rangeCount) return;

        const range = sel.getRangeAt(0);

        if (e.shiftKey) {
            // Quitar tabulación si existe
            const node = range.startContainer;
            const pos = range.startOffset;

            if (node.nodeType === 3) {
                const text = node.textContent;
                if (text.substring(pos - 1, pos) === "\t") {
                    node.textContent = text.substring(0, pos - 1) + text.substring(pos);
                    range.setStart(node, pos - 1);
                    range.setEnd(node, pos - 1);
                }
            }
        } else {
            // Insertar tabulación
            const tabNode = document.createTextNode("\t");
            range.insertNode(tabNode);

            // Colocar cursor después del tab
            range.setStartAfter(tabNode);
            range.setEndAfter(tabNode);
        }

        sel.removeAllRanges();
        sel.addRange(range);

        hayCambios = true;
        actualizarEstado();
    }
});
// ------------------------------------------------------
// PREFERENCIAS DE FUENTE Y TAMAÑO (localStorage)
// ------------------------------------------------------

// Cargar preferencias al iniciar
window.addEventListener("DOMContentLoaded", () => {
    const fuenteGuardada = localStorage.getItem("fuente");
    const tamanoGuardado = localStorage.getItem("tamano");

    if (fuenteGuardada) {
        document.getElementById("fuente").value = fuenteGuardada;
        cmd("fontName", fuenteGuardada);
    }

    if (tamanoGuardado) {
        document.getElementById("tamano").value = tamanoGuardado;
        cmd("fontSize", tamanoGuardado);
    }
});

// Guardar fuente
document.getElementById("fuente").addEventListener("change", e => {
    localStorage.setItem("fuente", e.target.value);
});

// Guardar tamaño
document.getElementById("tamano").addEventListener("change", e => {
    localStorage.setItem("tamano", e.target.value);
});

// Estado de inicio
actualizarEstado();