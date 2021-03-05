// PARA CARGAR EL ARCHIVO POR DEFECTO EN EL SERVIDOR
// PARAMETRO EL NOMBRE DEL ID DEL CANVAS
function circuito_electrico_archivo_servidor(id) {

	var xmlhttp;
	if (window.XMLHttpRequest) {
		xmlhttp = new XMLHttpRequest();               
	}           
	else {               
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");               
	}
	xmlhttp.onreadystatechange = function () {               
		if (xmlhttp.readyState == 4) {                   
			var lines = xmlhttp.responseText;
			intoArray(id, lines);              
		}               
	}
	xmlhttp.open("GET", "LISTADO.txt", true);
	xmlhttp.send();    


	return canvas;
}


// PARA CARGAR EL ARCHIVO SELECCIONADO POR EL CLIENTE
// PARAMETRO EL NOMBRE DEL ID DEL CANVAS, Y EL ARCHIVO SELECCIONADO
function circuito_electrico_archivo_cliente(id, contenido) {
	intoArray(id, contenido);  
	return canvas;
}



function intoArray (id, lines) {
	var canvas = document.getElementById(id);
	canvas = canvas.getContext("2d");
	canvas.clearRect(0, 0, 1200, 700);

	var lineArr = lines.split('\n'); 
	let arrPrincipal = [];
	for (let value of lineArr) {
		value += 1;
		if(value.charAt(0) != '#'){
			if(value.charAt(0) == 'N'){
				var tabs = value.split('\t');
				arrPrincipal.push(tabs);
			}
		}
	}

	/// PARA LAS LETRAS EN NEGRO DE LOS NODOS
	for (let value of lineArr) {
		value += 1;
		if(value.charAt(0) != '#'){
			if(value.charAt(0) == 'N'){
				var tabs = value.split('\t');
				var cod	= tabs[0];
				var idx	= tabs[1];
				var XPos = tabs[2]
				var yPos = tabs[3];
				var Key = tabs[4];
				var Nombre = tabs[5];
				var Estado = tabs[6];
				var Bloque =  tabs[7];
				
				var xletra = parseInt(XPos) + 8;
				var yletra = parseInt(yPos)  + 15;

				canvas.beginPath();
				canvas.fillStyle = 'black';
				canvas.font = '10px Arial';
				if (Nombre.length > 0) {
					canvas.fillText( "(" + Nombre + ")", xletra, yletra);
				}else{
					if (Key.length > 0) {
						canvas.fillText( "(" + Key + ")", xletra, yletra);
					}else{
						canvas.fillText( "(" + idx + ")", xletra, yletra);
					}
				}
			}
		}
	}

	// PARA EL TITULO Y SUB TITULO SI TIENE
	for (let value of lineArr) {
		value += 1;
		if(value.slice(0, 8).toUpperCase()  == '#TITULO:'){
			var tabs = value.split(':');

			canvas.beginPath();
			canvas.fillStyle = 'black';
			canvas.font = '14px Arial';
			canvas.fillText(  tabs[1].slice(0, -1), 20, 10);

		}
		if(value.slice(0, 12).toUpperCase()  == '#SUB-TITULO:'){
			var tabs = value.split(':');

			canvas.beginPath();
			canvas.fillStyle = 'black';
			canvas.font = '12px Arial';
			canvas.fillText(  tabs[1].slice(0, -1), 20, 30);

		}
	}

	// PARA LAS LINEAS
	for (let value of lineArr) {
		value += 1;
		if(value.charAt(0) != '#'){
			if(value.charAt(0) == 'A'){
				var tabs = value.split('\t');
				var cod	= tabs[0];
				var idx	= tabs[1];
				var Nodol	= tabs[2]
				var Nodo2	= tabs[3];
				var Estado	= tabs[4];
				var Key	= tabs[5];
				var Reducion	= tabs[6];
				var Bloque	= tabs[7];
				var NodlKey	= tabs[8];
				var Nod2Key	= tabs[9];

				canvas.beginPath();
				canvas.moveTo(arrPrincipal[parseInt(Nodol)][2], arrPrincipal[parseInt(Nodol)][3]);
				canvas.lineTo(arrPrincipal[parseInt(Nodo2)][2], arrPrincipal[parseInt(Nodo2)][3]);
				
				canvas.lineWidth = 2;

				if(Estado == 0){
					canvas.setLineDash([5, 5]);
					canvas.strokeStyle = "yellow";
				}

				if(Estado == 1){
					canvas.setLineDash([0, 0]);
					canvas.strokeStyle = "red";
				}

				if(Estado == 2){
					canvas.setLineDash([0, 0]);
					canvas.strokeStyle = "black";
				}
				
				
				canvas.stroke();
				canvas.font = '10px Arial';
				canvas.fillText(Key, ( parseInt(arrPrincipal[parseInt(Nodol)][2]) + parseInt(arrPrincipal[parseInt(Nodo2)][2]))/2, (( parseInt(arrPrincipal[parseInt(Nodol)][3]) + parseInt(arrPrincipal[parseInt(Nodo2)][3])) + 20)/2);
			}
		}
	}

	// PARA MOSTRAR LOS NODOS
	for (let value of lineArr) {
		value += 1;
		if(value.charAt(0) != '#'){
			if(value.charAt(0) == 'N'){
				var tabs = value.split('\t');
				var cod	= tabs[0];
				var idx	= tabs[1];
				var XPos = tabs[2]
				var yPos = tabs[3];
				var Key = tabs[4];
				var Nombre = tabs[5];
				var Estado = tabs[6];
				var Bloque =  tabs[7];

				var radio = 7;
				canvas.beginPath();
				if(Estado == 0){
					canvas.rect(XPos, parseInt(yPos) - 20, 10, 40);
				}else{
					canvas.arc(XPos, yPos, radio, 0 , 2 * Math.PI, true);
				}
				canvas.fillStyle = 'blue';
				canvas.lineWidth = 2;
				canvas.strokeStyle = "#003300";
				canvas.setLineDash([0, 0]);
				canvas.stroke();
				canvas.fill();
			}
		}
	}

	var ratio = canvas.width / canvas.height;
	var canvas_height = window.innerHeight;
	var canvas_width = canvas_height * ratio;
	if(canvas_width>window.innerWidth){
		canvas_width=window.innerWidth;
		canvas_height=canvas_width/ratio;
	}

	canvas.style.width = canvas_width + 'px';
	canvas.style.height = canvas_height + 'px';

}

