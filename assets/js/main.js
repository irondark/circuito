$(document).ready(function () {
  function reorient(e) {
    var portrait = (window.orientation % 180 == 0);
    $("body > div").css("-webkit-transform", !portrait ? "rotate(-90deg)" : "");
  }
  window.onorientationchange = reorient;
  window.setTimeout(reorient, 0);
});

const canvasContainer = document.querySelector('#canvas-container');
const barraHerramientas = document.querySelector('#barra-herramientas');
const botonesBarraHerramientas = document.querySelectorAll('#barra-herramientas button');
const stage = new Konva.Stage({
  container: 'canvas-container',
  width: canvasContainer.offsetWidth,
  height: canvasContainer.offsetHeight,
});
const capaNodos = new Konva.Layer();
const capaAristas = new Konva.Layer();
const capaFondo = new Konva.Layer();
const fondoColor = new Konva.Rect({
  x: 0,
  y: 0,
  width: canvasContainer.offsetWidth,
  height: canvasContainer.offsetHeight,
  fill: '#fff',
});
const snapping = Snapping(stage, capaNodos);
let accion = 'sin-accion';
let estadoObjeto;
let contadorNodos = 0;
let contadorAristas = 0;
let relaciones = [];
let ultimoNodoSeleccionado;
let nodoAEliminar;
let menuNode = document.getElementById('menu');
const estados = {
  linea: {
    TRANSMISION_SIN_LLAVE: 0,
    TRANSMISION_CON_LLAVE_CERRADA: 1,
    TRANSMISION_CON_LLAVE_ABIERTA: 2,
  },
  nodo: {
    BARRA_PRINCIPAL_SUBESTACION: 0,
    CARGA: 1,
  }
};
const config = {
  circulo: {
    radio: 10,
  },
  barra: {
    ancho: 20,
    alto: 60
  },
  capas: {
    fondo: {
      zIndex: 0,
    },
    grid: {
      zIndex: 1,
    },
    arista: {
      zIndex: 2,
    },
    nodo: {
      zIndex: 3,
    },
  }
};
const grid = Grid({
  width: canvasContainer.offsetWidth,
  height: canvasContainer.offsetHeight,
  blockSnapSize: config.barra.ancho,
  zIndex: config.capas.grid.zIndex,
});

capaFondo.add(fondoColor);
stage.add(capaFondo);
stage.add(grid.getLayer());
stage.add(capaAristas);
stage.add(capaNodos);

//////////// codigos de RDRD  ///////////
localStorage.clear();
let historial_id = null;
let historial_posicion = null;
localStorage.setItem('historial_id', historial_id);
localStorage.setItem('historial_posicion', historial_posicion);
var historial = [];
let seleccion = 0;
////////// FIN

stage.on('click tap', (event) => {
  let posCursor = stage.getPointerPosition();
  let target = event.target;

  if (accion === 'crear-nodo') {
    let nombre = 'n' + contadorNodos;
    let nodo = crearNodo({
      id: nombre,
      idx: contadorNodos,
      nombre,
      x: posCursor.x,
      y: estadoObjeto === estados.linea.TRANSMISION_SIN_LLAVE
        ? posCursor.y - (config.barra.alto / 2)
        : posCursor.y,
      estado: estadoObjeto,
    })

    nodo.on('dragend', manejarDragend);
    capaNodos.add(nodo);
    capaNodos.batchDraw();
    contadorNodos++;
    Historial();

  } else if (accion === 'crear-linea') {
    if (target.attrs.type !== 'nodo') {
      return;
    }

    if (ultimoNodoSeleccionado) {
      if (target.attrs.id === ultimoNodoSeleccionado.attrs.id) {
        return;
      }
      let nombre = 'a' + contadorAristas;
      let arista = crearArista({
        nodo1: ultimoNodoSeleccionado,
        nodo2: target,
        id: nombre,
        estado: estadoObjeto,
        nombre,
      });

      guardarRelacion(arista, ultimoNodoSeleccionado, target);
      graficarArista(arista);
      Historial();
      contadorAristas++;
    }

    ultimoNodoSeleccionado = target;

  }

});

window.addEventListener('click', (e) => {
  // Esconder menu
  menuNode.style.display = 'none';
});

// Eventos relacionados con el manejo de archivos
document.addEventListener('DOMContentLoaded', (evt) => {
  const fileMenu = document.querySelector('#file-menu');
  const fileMenuDropwon = fileMenu.querySelector('#file-menu-dropdown');
  const fileInput = fileMenuDropwon.querySelector('#file-menu-input');
  const fileOpen = fileMenuDropwon.querySelector('a.dropdown-item--open');
  const fileNew = fileMenuDropwon.querySelector('a.dropdown-item--new');
  const fileSave = fileMenuDropwon.querySelector('a.dropdown-item--save');
  let fileExport = fileMenuDropwon.querySelector('a.dropdown-item--export');
  const nombreArchivoSpan = document.querySelector("#nombre-archivo-span");

  // Menú de acceso rápido (quick access)
  let quickAccessOpen = document.querySelector('#quick-access--open');
  let quickAccessSave = document.querySelector('#quick-access--save');

  const newFileModal = modals.NewFile();
  const saveFileModal = modals.SaveFile();

  fileOpen.addEventListener('click', (evt) => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (evt) => {
    let fileObj = fileInput.files[0];

    if (typeof fileObj === 'undefined') {
      return;
    }

    nombreArchivoSpan.innerHTML = "- " + fileObj.name;

    fileObj
      .text()
      .then(parse)
      .then((parsed) => {
        limpiarLienzo();
        graficarCircuito(parsed);
        fileInput.value = '';
      });
  });

  fileNew.addEventListener('click', (evt) => {
    newFileModal.open();
  });

  newFileModal.onClick('yes', (evt) => {
    saveFileModal.openForSave();
    // Cuando se da click en el botón de guardar (save), ejecutar el callback que limpia
    // el canvas y cierra el modal de guardar, pero sólo una vez con la opción {once: true}
    saveFileModal.onClick('save', (evt) => {
      limpiarLienzo();
      saveFileModal.close();
    }, {once: true});
  });

  newFileModal.onClick('no', (evt) => {
    limpiarLienzo();
  });

  fileSave.addEventListener('click', (evt) => {
    saveFileModal.openForSave();
  });

  fileExport.addEventListener('click', (evt) => {
   saveFileModal.openForExport();
  });

  quickAccessOpen.addEventListener('click', (evt) => {
    fileInput.click();
  });

  quickAccessSave.addEventListener('click', (evt) => {
    saveFileModal.openForSave();
  });

  saveFileModal.onClick('save', (evt) => {
    let contenidoTexto = prepararGRF();
    let uri = `data:text/html;charset=utf-8,${encodeURIComponent(contenidoTexto)}`;
    let nombre = `${saveFileModal.getFilename()}.grf`;
    downloadURI(uri, nombre);
  });

  saveFileModal.onClick('export', (evt) => {
    let formato = saveFileModal.getSelectedFormat();
    let nombreArchivo = saveFileModal.getFilename();
    let dataURL = stage.toDataURL({
      mimeType: `image/${formato}`,
      quality: 1,
    });
    if (formato === '') {
      M.toast({ html: 'Debe seleccionar un formato' })
      return;
    }
    downloadURI(dataURL, `${nombreArchivo}.${formato}`);
  });
});

document.addEventListener('DOMContentLoaded', function () {
  let dropdownTriggers = document.querySelectorAll('.dropdown-trigger');
  let dropdownInstances = M.Dropdown.init(dropdownTriggers);

  let selects = document.querySelectorAll('select');
  let selectInstances = M.FormSelect.init(selects);

  let btnCerrarCambio = document.querySelector('#modal-cambio #btn-cerrar-cambio');
  let btnGuardarCambio = document.querySelector('#modal-cambio #btn-guardar-cambio');
  let modalCambio = document.querySelector('#modal-cambio');
  let nombreNodoInput = document.querySelector('#modal-cambio #nombre-nodo-input');

  let btnCerrarLinea = document.querySelector('#modal-linea #btn-cerrar-linea');

  nombreNodoInput.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) { // enter
      event.preventDefault();
      btnGuardarCambio.click();
    }
  });

  let modalCambioInstance = M.Modal.init(modalCambio, {
    onOpenEnd: (event) => {
      nombreNodoInput.value = '';
      nombreNodoInput.focus();
    },
    onCloseEnd: (event) => {
      btnCerrarCambio.classList.add('hide');
      btnGuardarCambio.classList.add('hide');
    }
  });
  btnCerrarCambio.addEventListener('click', (event) => {
    var modal = document.getElementById("modal-cambio");
    nombreNodoInput.value = "";
    modal.style = "display: none;"
  });

  btnCerrarLinea.addEventListener('click', (event) => {
    var modal = document.getElementById("modal-linea");
    modal.style = "display: none;"
  });

  btnGuardarCambio.addEventListener('click', (event) => {
    let nombre = `${nombreNodoInput.value}`;
    if (currentShape.attrs.type == 'nodo') {
      for (let rel of capaNodos.find('Group')) {
        if (rel.children[0].attrs.id == currentShape.attrs.id) {
          rel.children[1].textArr[0].text = nombre;
        }
      }
      currentShape.attrs.etiqueta = nombre;
      currentShape.attrs.name = nombre;
      capaNodos.draw();
      capaNodos.batchDraw();
    } else {
      for (let rel of capaAristas.find('Line')) {
        if (currentShape.attrs.id == rel.attrs.id) {
          rel.attrs.name = nombre;
          // console.log(rel);
        }
      }
      for (let rel of capaAristas.find('Text')) {
        if (currentShape.attrs.id == rel.attrs.id) {
          rel.attrs.text = nombre;
        }
      }
      currentShape.textArr[0].text = nombre;
      console.log(currentShape);
      capaAristas.batchDraw();
    }
    var modal = document.getElementById("modal-cambio");
    modal.style = "display: none;"
    nombreNodoInput.value = "";
    Historial();
  });
});

stage.on('contextmenu', function (e) {
  e.evt.preventDefault();

  if (e.target === stage || (e.target.attrs.type !== 'nodo' && e.target.attrs.type !== 'arista')) {
    return;
  }

  if (e.target.attrs.type == 'nodo') {
    document.getElementById('change-button').classList.add('hide');
  } else {
    document.getElementById('change-button').classList.remove('hide');
  }

  currentShape = e.target;
  menuNode.style.display = 'initial';

  let containerRect = stage.container().getBoundingClientRect();
  menuNode.style.top = containerRect.top + stage.getPointerPosition().y + 4 + 'px';
  menuNode.style.left = containerRect.left + stage.getPointerPosition().x + 4 + 'px';
});

document.getElementById('delete-button').addEventListener('click', (e) => {
  if (currentShape.attrs.type == 'nodo') {
    let relaciones = getRelaciones(currentShape);
    currentShape.parent.destroy();
    for (let rel of relaciones) {
      rel.arista.destroy();
      rel.arista.attrs.etiqueta.destroy();
    }
    capaNodos.batchDraw();
    capaAristas.batchDraw();
  } else {
    for (let rel of capaAristas.find('Line')) {
      if (currentShape.attrs.id == rel.attrs.id) {
        rel.destroy();
      }
    }
    for (let rel of capaAristas.find('Text')) {
      if (currentShape.attrs.id == rel.attrs.id) {
        rel.destroy();
      }
    }
    currentShape.destroy();
    capaAristas.batchDraw();
  }
  Historial();
});


document.getElementById('edit-button').addEventListener('click', (e) => {
  var modal = document.getElementById("modal-cambio");
  if (currentShape.attrs.type == 'nodo') {
    document.getElementById("titleModal").innerText = "Nombre del nodo:";
  } else {
    document.getElementById("titleModal").innerText = "Nombre de la arista:";
  }
  modal.style = "z-index: 1003; display: block; opacity: 1; top: 10%; transform: scaleX(1) scaleY(1);";
  nombreNodoInput.focus();
});

document.getElementById('change-button').addEventListener('click', (e) => {
  var modal = document.getElementById("modal-linea");
  modal.style = "z-index: 1003; display: block; opacity: 1; top: 10%; transform: scaleX(1) scaleY(1);";
});


botonesBarraHerramientas.forEach(item => {
  item.addEventListener('click', event => {
    // Si no tiene acción ignorar el botón.
    if (! event.target.dataset.accion) {
      return;
    }

    accion = event.target.dataset.accion;
    estadoObjeto = parseInt(event.target.dataset.estado);
    ultimoNodoSeleccionado = null;
  });
});

document.addEventListener('keydown', (event) => {
  //console.log(event);
  switch (event.code) {
    case 'KeyV':
    case 'Escape':
      accion = 'sin-accion';
      estadoObjeto = undefined;
      break;
    case 'KeyB':
      accion = 'crear-nodo';
      estadoObjeto = estados.nodo.BARRA_PRINCIPAL_SUBESTACION;
      break;
    case 'KeyC':
      accion = 'crear-nodo';
      estadoObjeto = estados.nodo.CARGA;
      break;
    case 'KeyN':
      accion = 'crear-linea';
      estadoObjeto = estados.linea.TRANSMISION_SIN_LLAVE;
      break;
    case 'KeyR':
      accion = 'crear-linea';
      estadoObjeto = estados.linea.TRANSMISION_CON_LLAVE_CERRADA;
      break;
    case 'KeyA':
      accion = 'crear-linea';
      estadoObjeto = estados.linea.TRANSMISION_CON_LLAVE_ABIERTA;
      break;
    default:
      break;
  }
});

function crearNodo({ id, idx, nombre, x, y, estado }) {
  // Grupo que contendrá un shape (círculo o barra) y un texto como etiqueta
  let grupo = new Konva.Group({
    x,
    y,
    estado,
    draggable: true,
  });
  let shape, xTexto, yTexto;

  if (estado === estados.nodo.CARGA) {
    shape = crearCirculo({ x: 0, y: 0, id, idx, nombre });
    xTexto = config.circulo.radio;
    yTexto = config.circulo.radio;
  } else if (estado === estados.nodo.BARRA_PRINCIPAL_SUBESTACION) {
    shape = crearBarra({ x: 0, y: 0, id, idx, nombre });
    xTexto = config.barra.ancho;
    yTexto = config.barra.alto;
  } else {
    throwEstadoNoValido();
  }

  let texto = crearTexto({ x: xTexto, y: yTexto, texto: nombre, tipo: 'nodo' });
  shape.attrs.etiqueta = texto;

  grupo.add(shape);
  grupo.add(texto);

  return grupo;
}

function crearArista({ nodo1, nodo2, id, nombre, estado }) {
  let linea = crearLinea(nodo1, nodo2, { nombre, id, estado });
  let centro = getCenter(linea);
  let p1 = getCenter(nodo1);
  let p2 = getCenter(nodo2);
  let angulo = calcAngulo(
    ...getDireccionRotacion(p1, p2)
  );
  let anguloPositivo = Math.abs(angulo);
  let attrsTexto = {
    x: centro.x,
    y: centro.y,
    texto: nombre,
    tipo: "arista"
  };

  if (anguloPositivo !== 0 && (anguloPositivo < 70 || anguloPositivo > 90)) {
    attrsTexto.rotacion = angulo;
  }

  let texto = crearTexto(attrsTexto);
  linea.attrs.etiqueta = texto;

  return linea;
}

function crearLinea(nodo1, nodo2, { id, nombre, estado }) {
  const centroNodo1 = getCenter(nodo1);
  const centroNodo2 = getCenter(nodo2);
  let attrs = {
    points: [centroNodo1.x, centroNodo1.y, centroNodo2.x, centroNodo2.y],
    strokeWidth: 2,
    lineCap: 'square',
    lineJoin: 'miter',
    type: 'arista',
    stroke: getColorLineaSegunEstado(estado),
    name: nombre,
    id,
    estado,
  };

  if (estado === estados.linea.TRANSMISION_CON_LLAVE_ABIERTA) {
    attrs.dash = [10, 5];
  }

  return new Konva.Line(attrs);
}

function crearCirculo({ id, idx, nombre, x, y }) {
  const nodo = new Konva.Circle({
    x: x,
    y: y,
    radius: config.circulo.radio,
    fill: '#0000ff',
    type: 'nodo',
    name: nombre,
    id,
    idx,
  });

  nodo.on('click', function () {
    if (accion == 'sin-accion') {
      var fill = this.fill() == 'red' ? '#0000ff' : 'red';
      this.fill(fill);
      capaNodos.draw();
    }
  });

  return nodo;
}

function crearBarra({ id, idx, nombre, x, y }) {
  const barra = new Konva.Rect({
    x: x,
    y: y,
    width: config.barra.ancho,
    height: config.barra.alto,
    fill: '#0000ff',
    strokeWidth: 4,
    type: 'nodo',
    name: nombre,
    id,
    idx,
  });

  return barra;
}

function limpiarLienzo() {
  // Eliminar nodos (grupo conformado por un círculo y su etiqueta o texto)
  capaNodos.find('Group').destroy();
  // Eliminar líneas
  capaAristas.find('Line').destroy();
  // Eliminar etiquetas de las líneas
  capaAristas.find('Text').destroy();
  // Redibujar todo
  capaNodos.draw();
  capaAristas.draw();
  relaciones = [];
  // Reiniciar contadores
  contadorNodos = 0;
  contadorAristas = 0;
}

function graficarArista(arista) {
  capaAristas.add(arista);
  capaAristas.add(arista.attrs.etiqueta);
  capaAristas.batchDraw();
  capaAristas.zIndex(config.capas.arista.zIndex);
}

function getRelaciones(nodo) {
  return relaciones.filter(relacion =>
    relacion.nodo1.attrs.id === nodo.attrs.id || relacion.nodo2.attrs.id === nodo.attrs.id
  );
}

function guardarRelacion(arista, nodo1, nodo2) {
  relaciones.push({ arista, nodo1, nodo2, });
}

function getColorLineaSegunEstado(estado) {
  switch (estado) {
    case estados.linea.TRANSMISION_SIN_LLAVE: return '#000000';
    case estados.linea.TRANSMISION_CON_LLAVE_CERRADA: return '#ff0000';
    case estados.linea.TRANSMISION_CON_LLAVE_ABIERTA: return '#ffe000ff';
    default: throwEstadoNoValido();
  }
}

function getDireccionRotacion(p1, p2) {
  return [p1.x < p2.x ? p1 : p2, p2.x > p1.x ? p2 : p1];
}

function crearTexto({ x, y, rotacion, texto, tipo }) {
  if (tipo != "arista") {
    tipo = '';
  }

  return new Konva.Text({
    x,
    y,
    text: texto,
    fontSize: 10,
    fontFamily: 'Arial',
    fill: '#000000',
    rotation: rotacion,
    id: texto,
    type: tipo
  });

}

function manejarDragend(event) {
  Historial();
  // event.target es el grupo que contiene el texto y el nodo.
  // Buscar un nodo en el grupo por su clase, ya sea círculo (Circle) o barra (Rect).
  let nodoActual = event.target.findOne('Rect') || event.target.findOne('Circle');
  let relacionesNodo = getRelaciones(nodoActual);

  if (relacionesNodo.length === 0) {
    return;
  }

  for (let rel of relacionesNodo) {
    let nodo2;

    if (nodoActual.attrs.id === rel.nodo1.attrs.id) {
      nodo2 = rel.nodo2;
    } else {
      nodo2 = rel.nodo1;
    }

    let pos1 = getCenter(nodoActual);
    let pos2 = getCenter(nodo2);

    rel.arista.setPoints([pos1.x, pos1.y, pos2.x, pos2.y]);

    capaAristas.batchDraw();

    let centroArista = getCenter(rel.arista);

    rel.arista.attrs.etiqueta.x(centroArista.x);
    rel.arista.attrs.etiqueta.y(centroArista.y);
    rel.arista.attrs.etiqueta.rotation(
      calcAngulo(
        ...getDireccionRotacion(pos1, pos2)
      )
    );

    capaAristas.batchDraw();

  }
}

function calcAngulo(p1, p2) {
  let deltaX = p2.x - p1.x;
  let deltaY = p2.y - p1.y;
  let rad = Math.atan2(deltaY, deltaX);
  let deg = rad * (180 / Math.PI);

  return deg;
}

function getCenter(shape) {
  const box = shape.getClientRect();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  return { x, y };
}

function throwEstadoNoValido() {
  throw new Error('Estado no válido');
}

function throwAccionNoValida() {
  throw new Error('Acción no válida');
}

function throwTipoNoValido() {
  throw new Error('Tipo de objeto no válido');
}


/***************** Subida de archivo .grf ********************/

function parse(str) {
  let nodos = [];
  let aristas = [];
  let lineas = str.split('\n');

  for (let linea of lineas) {
    let partes = linea.split('\t');

    if (partes[0] === 'N') {
      nodos.push({
        idx: parseInt(partes[1]),
        x: parseInt(partes[2]),
        y: parseInt(partes[3]),
        key: partes[4],
        nombre: partes[5],
        estado: parseInt(partes[6]),
        bloque: partes[7],
      });
    } else if (partes[0] === 'A') {
      aristas.push({
        idx: parseInt(partes[1]),
        nodo1: partes[2],
        nodo2: partes[3],
        estado: parseInt(partes[4]),
        key: partes[5],
        type: 'arista',
      });
    }
  }

  return { nodos, aristas };
}

function graficarCircuito(datos) {
  // Graficar primeramente los nodos
  for (let nodo of datos.nodos) {
    let nodoShape = crearNodo({
      id: 'n' + nodo.idx,
      idx: nodo.idx,
      nombre: nodo.nombre || nodo.key,
      x: nodo.x,
      y: nodo.estado === estados.nodo.BARRA_PRINCIPAL_SUBESTACION
        ? nodo.y - (config.barra.alto / 2)
        : nodo.y,
      estado: nodo.estado,
    });

    nodoShape.on('dragend', manejarDragend);
    capaNodos.add(nodoShape);
    contadorNodos++;
  }

  capaNodos.batchDraw();

  // Graficar las líneas
  for (let arista of datos.aristas) {
    let nodo1 = capaNodos.findOne('#n' + arista.nodo1);
    let nodo2 = capaNodos.findOne('#n' + arista.nodo2);
    let aristaShape = crearArista({
      nodo1,
      nodo2,
      nombre: arista.key,
      id: 'a' + arista.idx,
      estado: arista.estado,
      type: 'arista',
    });

    guardarRelacion(aristaShape, nodo1, nodo2);
    graficarArista(aristaShape);
    contadorAristas++;
  }
}

// function from https://stackoverflow.com/a/15832662/512042
function downloadURI(uri, name) {
  var link = document.createElement('a');
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  delete link;
}

function prepararGRF() {
  // Preparar nodos
  let nodos = capaNodos.find('Group').reduce((acc, currVal) => {
    let linea = [
      'N',
      currVal.children[0].attrs.idx,
      currVal.attrs.x,
      currVal.attrs.estado == 0 ? currVal.attrs.y + (config.barra.alto / 2) : currVal.attrs.y,
      currVal.children[0].attrs.id,
      currVal.children[0].attrs.name,
      currVal.attrs.estado,
    ].join('\t');

    return acc + linea + '\n';
  }, '');

  let aristas = relaciones.reduce((acc, currVal, idx) => {
    let linea = [
      'A',
      idx,
      currVal.nodo1.attrs.idx,
      currVal.nodo2.attrs.idx,
      currVal.arista.attrs.estado,
      currVal.arista.attrs.name,
    ].join('\t');

    return acc + linea + '\n';
  }, '');

  return nodos + aristas;
}


//////////// codigos de RDRD  ///////////
function undo() {
  var id = localStorage.getItem('historial_posicion');
  if (id != 0) {
    id--;
    localStorage.setItem('historial_posicion', id);
    limpiarLienzo();
    if (id > 0) {
      var datos = historial[(id - 1)][1];
      var parsed = parse(datos);
      graficarCircuito(parsed);
      historial_posicion = historial[(id - 1)][0] + 1;
      localStorage.setItem('historial_posicion', historial_posicion);
    }
  }
}

function redo() {
  var id = localStorage.getItem('historial_posicion');
  if (id < historial_id) {
    id++;
    localStorage.setItem('historial_posicion', id);
    limpiarLienzo();
    if (id > 0) {
      var datos = historial[(id - 1)][1];
      var parsed = parse(datos);
      graficarCircuito(parsed);
      localStorage.setItem('historial_posicion', id);
    }
  }
}

document.getElementById('undo').addEventListener('click', undo);
document.getElementById('redo').addEventListener('click', redo);

function Historial() {
  var id = localStorage.getItem('historial_posicion');
  if (historial_id != null) {
    if (id != historial_id) {
      var miObjeto = [];
      historial_id++;
      historial_posicion = historial[(id - 1)][0] + 1;
      localStorage.setItem('historial_posicion', historial_posicion);
      miObjeto.push((historial_posicion));
      if (id == 0) {
        miObjeto.push({});
      } else {
        miObjeto.push(historial[(id - 1)][1]);
      }
      historial.push(miObjeto);
      localStorage.setItem('historial_id', historial_id);
      historial_posicion = id;
    }
  }
  let nodos = capaNodos.find('Group').reduce((acc, currVal) => {
    let linea = [
      'N',
      currVal.children[0].attrs.idx,
      currVal.attrs.x,
      currVal.attrs.y,
      currVal.children[0].attrs.id,
      currVal.children[0].attrs.name,
      currVal.attrs.estado,
    ].join('\t');
    return acc + linea + '\n';
  }, '');

  let aristas = relaciones.reduce((acc, currVal, idx) => {
    let linea = [
      'A',
      idx,
      currVal.nodo1.attrs.idx,
      currVal.nodo2.attrs.idx,
      currVal.arista.attrs.estado,
      currVal.arista.attrs.name,
    ].join('\t');
    return acc + linea + '\n';
  }, '');

  var miObjeto = [];
  miObjeto.push(historial_id);
  miObjeto.push(nodos + '\n' + aristas);
  historial.push(miObjeto);
  historial_id++;
  localStorage.setItem('historial_id', historial_id);
  localStorage.setItem('historial_posicion', historial_id);
}


document.getElementById('linea-nodo1').addEventListener('click', (event) => {
  for (let rel of capaAristas.find('Line')) {
    if (currentShape.attrs.id == rel.attrs.id) {
      rel.attrs.estado = estados.linea.TRANSMISION_SIN_LLAVE;
      rel.attrs.stroke = getColorLineaSegunEstado(estados.linea.TRANSMISION_SIN_LLAVE);
      rel.attrs.dash = [0, 0];
    }
  }
  capaAristas.batchDraw();
  capaAristas.moveDown();
  document.getElementById("modal-linea").style = "display: none;";
  Historial();
});

document.getElementById('linea-nodo2').addEventListener('click', (event) => {
  for (let rel of capaAristas.find('Line')) {
    if (currentShape.attrs.id == rel.attrs.id) {
      rel.attrs.estado = estados.linea.TRANSMISION_CON_LLAVE_CERRADA;
      rel.attrs.stroke = getColorLineaSegunEstado(estados.linea.TRANSMISION_CON_LLAVE_CERRADA);
      rel.attrs.dash = [0, 0];
    }
  }
  capaAristas.batchDraw();
  capaAristas.moveDown();
  document.getElementById("modal-linea").style = "display: none;";
  Historial();
});

document.getElementById('linea-nodo3').addEventListener('click', (event) => {
  for (let rel of capaAristas.find('Line')) {
    if (currentShape.attrs.id == rel.attrs.id) {
      rel.attrs.estado = estados.linea.TRANSMISION_CON_LLAVE_ABIERTA;
      rel.attrs.stroke = getColorLineaSegunEstado(estados.linea.TRANSMISION_CON_LLAVE_ABIERTA);
      rel.attrs.dash = [10, 5];
    }
  }
  capaAristas.batchDraw();
  capaAristas.moveDown();
  document.getElementById("modal-linea").style = "display: none;";
  Historial();
});


/////////////// fin /////////////////////////

// Acticar o desactivar las guías
const toggleGuides = (() => {
  let active = false;

  return (e) => {
    active = !active;

    if (active) {
      capaNodos.on('dragmove.drawGuides', snapping.drawGuides);
      capaNodos.on('dragend.drawGuides', snapping.clearGuides);
    } else {
      capaNodos.off('dragmove.drawGuides');
      capaNodos.off('dragend.drawGuides');
    }
  }
})();

barraHerramientas.querySelector('#guides-btn').addEventListener('click', toggleGuides);

// Acticar o desactivar la grilla
const toggleGrid = (() => {
  let active = false;

  return (e) => {
    active = !active;

    if (active) {
      grid.draw();
    } else {
      grid.clear();
    }
  }
})();

barraHerramientas.querySelector('#grid-btn').addEventListener('click', toggleGrid);
