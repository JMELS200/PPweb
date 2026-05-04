// ===============================
// REFERENCIAS AL DOM
// ===============================
const canvas = document.getElementById("dibujo");
const ctx = canvas.getContext("2d");

// Controles de estilo
const colorInput = document.getElementById("color");
const grosorInput = document.getElementById("grosor");
const opacidadInput = document.getElementById("opacidad");
const fillInput = document.getElementById("fill");

// Valores visibles
const grosorValue = document.getElementById("grosorValue");
const opacidadValue = document.getElementById("opacidadValue");

// Botones principales
const btnGuardar = document.getElementById("guardar");
const btnCargar = document.getElementById("cargar");
const btnDeshacer = document.getElementById("deshacer");
const btnRehacer = document.getElementById("rehacer");
const btnTema = document.getElementById("tema");

// Dropdown de formas
const btnFormas = document.getElementById("btnFormas");
const dropdownFormas = btnFormas.parentElement;

// Panel de capas
const btnNuevaCapa = document.getElementById("nuevaCapa");
const listaCapas = document.getElementById("listaCapas");

// ===============================
// SISTEMA DE CAPAS
// ===============================
let capas = [
    { tipo: "imagen", imagen: null, opacidad: 1, visible: true, miniatura: null },
    { tipo: "dibujo", historial: [], opacidad: 1, visible: true, miniatura: null }
];

let capaActiva = 1;

function historialActual() {
    const capa = capas[capaActiva];
    if (!capa || capa.tipo !== "dibujo") return null;
    return capa.historial;
}

let redoStack = [];

// ===============================
// ESTADO DEL PROGRAMA
// ===============================
let dibujando = false;
let herramientaActual = "pencil";
let puntos = [];
let shiftPresionado = false;

// ===============================
// ACTUALIZACIÓN DE VALORES VISUALES
// ===============================
grosorInput.addEventListener("input", () => {
    grosorValue.textContent = grosorInput.value + "px";
});

opacidadInput.addEventListener("input", () => {
    opacidadValue.textContent = opacidadInput.value + "%";
});

// ===============================
// COORDENADAS RELATIVAS AL CANVAS
// ===============================
function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x, y };
}

// ===============================
// INICIO DEL DIBUJO
// ===============================
function startDrawing(e) {
    e.preventDefault();
    if (!capas[capaActiva] || capas[capaActiva].tipo !== "dibujo") return;
    dibujando = true;
    puntos = [getCoords(e)];
}

// ===============================
// DIBUJAR MIENTRAS SE MUEVE
// ===============================
function drawing(e) {
    if (!dibujando) return;
    e.preventDefault();

    const p = getCoords(e);
    puntos.push(p);

    if (["pencil", "pincel", "eraser"].includes(herramientaActual)) {
        const prev = puntos[puntos.length - 2];

        ctx.lineWidth = grosorInput.value;
        ctx.globalAlpha = opacidadInput.value / 100;
        ctx.lineCap = "round";

        if (herramientaActual === "eraser") {
            ctx.save();
            ctx.globalCompositeOperation = "destination-out";
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            ctx.restore();
        } else {
            ctx.strokeStyle = colorInput.value;
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
        }
    } else {
        redibujar();
        dibujarFiguraTemporal();
    }
}

// ===============================
// FIN DEL DIBUJO
// ===============================
function stopDrawing(e) {
    if (!dibujando) return;
    e && e.preventDefault();
    dibujando = false;

    const hist = historialActual();
    if (!hist) return;

    hist.push({
        herramienta: herramientaActual,
        puntos: [...puntos],
        color: colorInput.value,
        grosor: grosorInput.value,
        opacidad: opacidadInput.value,
        fill: fillInput.checked
    });

    redoStack = [];
    redibujar();
    actualizarMiniatura(capaActiva);
    actualizarPanelCapas();
}

// ===============================
// SHIFT - FORMAS PERFECTAS
// ===============================
function aplicarShift(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lado = Math.min(Math.abs(dx), Math.abs(dy));
    return {
        x: a.x + Math.sign(dx) * lado,
        y: a.y + Math.sign(dy) * lado
    };
}

// ===============================
// PREVIEW DE FIGURA TEMPORAL
// ===============================
function dibujarFiguraTemporal() {
    if (puntos.length < 2) return;
    const obj = {
        herramienta: herramientaActual,
        puntos: puntos,
        color: colorInput.value,
        grosor: grosorInput.value,
        opacidad: opacidadInput.value,
        fill: fillInput.checked
    };
    dibujarFigura(obj);
}

// ===============================
// DIBUJAR FIGURA
// ===============================
function dibujarFigura(obj, contexto = ctx) {
    const pts = obj.puntos;
    let a = pts[0];
    let b = pts[pts.length - 1];

    if (shiftPresionado && ["rect", "circle", "triangle"].includes(obj.herramienta)) {
        b = aplicarShift(a, b);
    }

    contexto.lineWidth = obj.grosor;
    contexto.globalAlpha = obj.opacidad / 100;
    contexto.lineCap = "round";

    if (obj.herramienta === "eraser") {
        contexto.save();
        contexto.globalCompositeOperation = "destination-out";
        contexto.beginPath();
        contexto.moveTo(a.x, a.y);
        pts.forEach(p => contexto.lineTo(p.x, p.y));
        contexto.stroke();
        contexto.restore();
        return;
    }

    contexto.strokeStyle = obj.color;
    contexto.fillStyle = obj.color;

    switch (obj.herramienta) {
        case "pencil":
        case "pincel":
            contexto.beginPath();
            contexto.moveTo(a.x, a.y);
            pts.forEach(p => contexto.lineTo(p.x, p.y));
            contexto.stroke();
            break;

        case "rect":
            const w = b.x - a.x;
            const h = b.y - a.y;
            if (obj.fill) contexto.fillRect(a.x, a.y, w, h);
            contexto.strokeRect(a.x, a.y, w, h);
            break;

        case "circle":
            const r = Math.hypot(b.x - a.x, b.y - a.y);
            contexto.beginPath();
            contexto.arc(a.x, a.y, r, 0, Math.PI * 2);
            if (obj.fill) contexto.fill();
            contexto.stroke();
            break;

        case "triangle":
            contexto.beginPath();
            contexto.moveTo(a.x, b.y);
            contexto.lineTo((a.x + b.x) / 2, a.y);
            contexto.lineTo(b.x, b.y);
            contexto.closePath();
            if (obj.fill) contexto.fill();
            contexto.stroke();
            break;

        case "arrow":
            contexto.beginPath();
            contexto.moveTo(a.x, a.y);
            contexto.lineTo(b.x, b.y);
            contexto.stroke();
            break;
    }
}

// ===============================
// REDIBUJAR TODAS LAS CAPAS
// ===============================
function redibujar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    capas.forEach(capa => {
        if (!capa.visible) return;

        ctx.save();
        ctx.globalAlpha = capa.opacidad;

        if (capa.tipo === "imagen" && capa.imagen) {
            ctx.drawImage(capa.imagen, 0, 0, canvas.width, canvas.height);
        }

        if (capa.tipo === "dibujo") {
            capa.historial.forEach(obj => dibujarFigura(obj));
        }

        ctx.restore();
    });
}

// ===============================
// MINIATURAS EN TIEMPO REAL
// ===============================
function actualizarMiniatura(index) {
    const capa = capas[index];
    if (!capa) return;

    const temp = document.createElement("canvas");
    temp.width = 160;
    temp.height = 80;
    const tctx = temp.getContext("2d");

    tctx.save();
    tctx.globalAlpha = capa.opacidad;

    if (capa.tipo === "imagen" && capa.imagen) {
        tctx.drawImage(capa.imagen, 0, 0, temp.width, temp.height);
    }

    if (capa.tipo === "dibujo") {
        capa.historial.forEach(obj => dibujarFigura(obj, tctx));
    }

    tctx.restore();

    capa.miniatura = temp.toDataURL();
}

// ===============================
// PANEL DE CAPAS
// ===============================
function actualizarPanelCapas() {
    listaCapas.innerHTML = "";

    capas.forEach((capa, index) => {
        const div = document.createElement("div");
        div.className = "layer";
        div.dataset.layer = index;

        // Seleccionar capa clicando en el cuadro
        div.addEventListener("click", () => {
            capaActiva = index;
            actualizarPanelCapas();
        });

        if (index === capaActiva) {
            div.classList.add("activa");
        }

        const thumb = document.createElement("div");
        thumb.className = "layer-thumbnail";
        if (capa.miniatura) {
            thumb.style.backgroundImage = `url(${capa.miniatura})`;
        }

        const nombre = document.createElement("span");
        nombre.textContent = capa.tipo === "imagen" ? "Imagen" : `Capa ${index}`;

        // SLIDER OPACIDAD
        const opacidad = document.createElement("input");
        opacidad.type = "range";
        opacidad.min = 0;
        opacidad.max = 100;
        opacidad.value = capa.opacidad * 100;
        opacidad.className = "layer-opacity";

        opacidad.addEventListener("mousedown", e => e.stopPropagation());
        opacidad.addEventListener("touchstart", e => e.stopPropagation());
        opacidad.addEventListener("click", e => e.stopPropagation());


        opacidad.addEventListener("input", e => {
            capa.opacidad = e.target.value / 100;
            redibujar();
            actualizarMiniatura(index);
        });


        opacidad.addEventListener("change", () => {
            actualizarPanelCapas();
        });



        // CHECK VISIBILIDAD
        const visible = document.createElement("input");
        visible.type = "checkbox";
        visible.checked = capa.visible;
        visible.className = "layer-visible";

        visible.addEventListener("mousedown", e => e.stopPropagation());
        visible.addEventListener("touchstart", e => e.stopPropagation());
        visible.addEventListener("click", e => e.stopPropagation());

        visible.addEventListener("change", e => {
            capa.visible = e.target.checked;
            redibujar();
            actualizarMiniatura(index);
            actualizarPanelCapas();
        });

        // BOTÓN ELIMINAR
        const btnEliminar = document.createElement("button");
        btnEliminar.textContent = "Eliminar";
        btnEliminar.className = "delete-layer-btn";

        btnEliminar.addEventListener("mousedown", e => e.stopPropagation());
        btnEliminar.addEventListener("touchstart", e => e.stopPropagation());
        btnEliminar.addEventListener("click", e => {
            e.stopPropagation();
            if (index === 0) return; // no borrar capa imagen base
            capas.splice(index, 1);
            if (capaActiva >= capas.length) capaActiva = capas.length - 1;
            redibujar();
            actualizarPanelCapas();
        });

        div.appendChild(thumb);
        div.appendChild(nombre);
        div.appendChild(opacidad);
        div.appendChild(visible);
        div.appendChild(btnEliminar);

        listaCapas.appendChild(div);
    });
}

btnNuevaCapa.addEventListener("click", () => {
    capas.push({
        tipo: "dibujo",
        historial: [],
        opacidad: 1,
        visible: true,
        miniatura: null
    });
    capaActiva = capas.length - 1;
    actualizarMiniatura(capaActiva);
    actualizarPanelCapas();
});

// ===============================
// EVENTOS DEL CANVAS
// ===============================
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", drawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);

canvas.addEventListener("touchstart", startDrawing, { passive: false });
canvas.addEventListener("touchmove", drawing, { passive: false });
canvas.addEventListener("touchend", stopDrawing, { passive: false });

// Drag & drop imagen / json
canvas.addEventListener("dragover", e => e.preventDefault());
canvas.addEventListener("drop", e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    cargarArchivoDirecto(file);
});

// ===============================
// CAMBIAR HERRAMIENTA
// ===============================
document.querySelectorAll("[data-tool]").forEach(btn => {
    btn.addEventListener("click", () => {
        herramientaActual = btn.dataset.tool;

        document.querySelectorAll(".tool-btn").forEach(b =>
            b.classList.remove("active")
        );
        btn.classList.add("active");
    });
});

// ===============================
// DESPLEGABLE DE FORMAS
// ===============================
btnFormas.addEventListener("click", () => {
    dropdownFormas.classList.toggle("open");
});

// ===============================
// GUARDAR COMO PNG
// ===============================
btnGuardar.addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "dibujo.png";
    link.click();
});

// ===============================
// ABRIR ARCHIVO
// ===============================
btnCargar.addEventListener("click", () => {
    document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", e => {
    const file = e.target.files[0];
    cargarArchivoDirecto(file);
});

// ===============================
// CARGAR JSON O IMAGEN
// ===============================
function cargarArchivoDirecto(file) {
    if (!file) return;

    if (file.type === "application/json") {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                if (Array.isArray(data)) {
                    capas[1].historial = data;
                    capaActiva = 1;
                    redoStack = [];
                    redibujar();
                    actualizarMiniatura(1);
                    actualizarPanelCapas();
                }
            } catch (err) {
                console.error("Error al cargar JSON:", err);
            }
        };
        reader.readAsText(file);
    } else if (file.type.startsWith("image/")) {
        const img = new Image();
        img.onload = () => {
            capas[0].imagen = img;
            actualizarMiniatura(0);
            redibujar();
            actualizarPanelCapas();
        };
        img.src = URL.createObjectURL(file);
    }
}

// ===============================
// DESHACER / REHACER
// ===============================
btnDeshacer.addEventListener("click", () => {
    const hist = historialActual();
    if (!hist || hist.length === 0) return;
    const ultimo = hist.pop();
    redoStack.push(ultimo);
    redibujar();
    actualizarMiniatura(capaActiva);
    actualizarPanelCapas();
});

btnRehacer.addEventListener("click", () => {
    const hist = historialActual();
    if (!hist || redoStack.length === 0) return;
    const rec = redoStack.pop();
    hist.push(rec);
    redibujar();
    actualizarMiniatura(capaActiva);
    actualizarPanelCapas();
});

// ===============================
// MODO CLARO / OSCURO
// ===============================
btnTema.addEventListener("click", () => {
    document.body.classList.add("tema-anim");
    document.body.classList.toggle("light");
    setTimeout(() => {
        document.body.classList.remove("tema-anim");
    }, 400);
});

// ===============================
// ATAJOS DE TECLADO
// ===============================
document.addEventListener("keydown", e => {
    if (e.key === "Shift") shiftPresionado = true;

    if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = "dibujo.png";
        link.click();
    }

    if (e.ctrlKey && e.key === "o") {
        e.preventDefault();
        document.getElementById("fileInput").click();
    }

    if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        const hist = historialActual();
        if (hist && hist.length > 0) {
            const ultimo = hist.pop();
            redoStack.push(ultimo);
            redibujar();
            actualizarMiniatura(capaActiva);
            actualizarPanelCapas();
        }
    }

    if (e.ctrlKey && e.key === "Z" && e.shiftKey) {
        e.preventDefault();
        const hist = historialActual();
        if (hist && redoStack.length > 0) {
            const rec = redoStack.pop();
            hist.push(rec);
            redibujar();
            actualizarMiniatura(capaActiva);
            actualizarPanelCapas();
        }
    }
});

document.addEventListener("keyup", e => {
    if (e.key === "Shift") shiftPresionado = false;
});

// ===============================
// INICIALIZACIÓN
// ===============================
actualizarMiniatura(0);
actualizarMiniatura(1);
actualizarPanelCapas();
redibujar();