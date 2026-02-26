window.addEventListener("load", (event) => {
    console.log("PÁGINA CARGADA");
    iniciarprograma();
});

function asignarColor(pintura) {
    let r = Math.floor(Math.random() * 255);
    let g = Math.floor(Math.random() * 255);
    let b = Math.floor(Math.random() * 255);
    pintura.style.backgroundColor = "rgb(" + r + "," + g + "," + b + ")";
}

function asignarPosicion(pintura) {
    let x = Math.floor(Math.random() * 400);
    let y = Math.floor(Math.random() * 400);
    pintura.style.left = x + "px";
    pintura.style.top = y + "px";
}

function asignarTamaño(pintura) {
    let ancho = Math.floor(Math.random() * 200);
    let alto = Math.floor(Math.random() * 200);
    pintura.style.width = ancho + "px";
    pintura.style.height = alto + "px";
}

function Grosor(pintura) {
    let grosor = Math.floor(Math.random() * 10);
    pintura.style.border = grosor + "px solid black";
}

let contadorPinturas = 0;

function crearPintura() {
    let pintura = document.createElement("div");
    pintura.className = "Pintura";
    asignarColor(pintura);
    asignarPosicion(pintura);
    asignarTamaño(pintura);
    Grosor(pintura);
    document.querySelector(".Cuadro").appendChild(pintura);
    contadorPinturas++;
    pintura.innerHTML = contadorPinturas;
}

function iniciarprograma() {
    let inicio = document.getElementById("iniciar");
    let borrarcuadro = document.getElementById("borrar");
    let cuadros = document.getElementById("numerocuadros").value;
    if (cuadros > 0) {
        for (let i = 0; i < cuadros; i++) {
            setTimeout(crearPintura, 400 * i);
        }
    }
    contadorPinturas = 0;
    borrarcuadro.addEventListener("click", function () {
        contadorPinturas = 0;
        document.querySelector(".Cuadro").innerHTML = "";
    });
    inicio.addEventListener("click", iniciarprograma);
}

