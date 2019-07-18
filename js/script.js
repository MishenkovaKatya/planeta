var Params = {};
var Targets = {};

// ref: http://stackoverflow.com/a/1293163/2343
// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.
function CSVToArray( strData, strDelimiter ){
	// Check to see if the delimiter is defined. If not,
	// then default to comma.
	strDelimiter = (strDelimiter || ",");

	// Create a regular expression to parse the CSV values.
	var objPattern = new RegExp(
		(
			// Delimiters.
			"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

			// Quoted fields.
			"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

			// Standard fields.
			"([^\"\\" + strDelimiter + "\\r\\n]*))"
		),
		"gi"
		);


	// Create an array to hold our data. Give the array
	// a default empty first row.
	var arrData = [[]];

	// Create an array to hold our individual pattern
	// matching groups.
	var arrMatches = null;


	// Keep looping over the regular expression matches
	// until we can no longer find a match.
	while (arrMatches = objPattern.exec( strData )){

		// Get the delimiter that was found.
		var strMatchedDelimiter = arrMatches[ 1 ];

		// Check to see if the given delimiter has a length
		// (is not the start of string) and if it matches
		// field delimiter. If id does not, then we know
		// that this delimiter is a row delimiter.
		if (
			strMatchedDelimiter.length &&
			strMatchedDelimiter !== strDelimiter
			){

			// Since we have reached a new row of data,
			// add an empty row to our data array.
			arrData.push( [] );

		}

		var strMatchedValue;

		// Now that we have our delimiter out of the way,
		// let's check to see which kind of value we
		// captured (quoted or unquoted).
		if (arrMatches[ 2 ]){

			// We found a quoted value. When we capture
			// this value, unescape any double quotes.
			strMatchedValue = arrMatches[ 2 ].replace(
				new RegExp( "\"\"", "g" ),
				"\""
				);

		} else {

			// We found a non-quoted value.
			strMatchedValue = arrMatches[ 3 ];

		}


		// Now that we have our value string, let's add
		// it to the data array.
		arrData[ arrData.length - 1 ].push( strMatchedValue );
	}

	// Return the parsed data.
	return( arrData );
}

function stringToFloat(elem) {
	return parseFloat(elem.toString().replace(",", "."));
}

// https://developer.mozilla.org/en-US/docs/Web/API/FileReader
// https://developer.mozilla.org/en-US/docs/Web/API/FileReader/onload
// Data CSV -> Params
function dataFileLoad(e) {
	var files = e.target.files[0]; // FileList object

	var reader = new FileReader();

	reader.onload = function(e) {
		var contentsArr = CSVToArray(e.target.result,';');
		var width = contentsArr[0].length;
		var height = contentsArr.length;
		for (var i = 2; i < width; i++) {
			let name = contentsArr[0][i];
			Params[name] = {};
			for (var j = 1; j < height; j++) {
				if (Params[name][contentsArr[j][0]] == null) {
					Params[name][contentsArr[j][0]] = {};
				}
				Params[name][contentsArr[j][0]][contentsArr[j][1]] = stringToFloat(contentsArr[j][i]);
			}
		}
		console.log(Params);

		document.getElementById("loadData").style.display="none";
		document.getElementById("loadDataSuc").style.display="block";
		document.getElementById("loadBSC").style.display="block";

		// funcAfterFilesLoad();
	};

	reader.readAsText(files);	
}

// BSC CSV -> Targets
function bscFileLoad(e) {
	var files = e.target.files[0]; // FileList object

	var reader = new FileReader();

	reader.onload = function(e) {
		var contentsArr = CSVToArray(e.target.result,';');
		var width = contentsArr[0].length;
		var height = contentsArr.length;

		// запомнили все цели без подцелей
		for (var i = 1; i < width; i++) {
			let name = contentsArr[0][i];
			Targets[name] = {};
			for (var j = 1; j < 5; j++) {
				Targets[name][contentsArr[j][0]] = contentsArr[j][i];
			}
			Targets[name]["min normal"] = stringToFloat(Targets[name]["min normal"]);
			Targets[name]["min good"] = stringToFloat(Targets[name]["min good"]);
		}

		// сохраняем подцели
		for (var i = 1; i < width; i++) {
			let name = contentsArr[0][i];
			for (var j = 5; j < height; j++) {
				if (contentsArr[j][0] == "subtarget name") {
					if (contentsArr[j][i] != "") {
						if (Targets[name].subTargets == null) {
							Targets[name].subTargets = {};
						}
						if (Targets[name]["subTargets"][contentsArr[j][i]] == null) {
							Targets[name]["subTargets"][contentsArr[j][i]] = {};
						}
						Targets[name]["subTargets"][contentsArr[j][i]]["name"] = contentsArr[j][i];
						Targets[name]["subTargets"][contentsArr[j][i]]["type"] = contentsArr[j+1][i];
						Targets[name]["subTargets"][contentsArr[j][i]]["id"] = contentsArr[j+2][i];
						if (Targets[name]["subTargets"][contentsArr[j][i]]["type"] === "Param") {
							Targets[name]["subTargets"][contentsArr[j][i]]["subTargetsDirection"] = contentsArr[j+3][i];
							Targets[name]["subTargets"][contentsArr[j][i]]["paramTarget"] = stringToFloat(contentsArr[j+4][i]);
						}
						Targets[name]["subTargets"][contentsArr[j][i]]["weight"] = stringToFloat(contentsArr[j+5][i]);
					}
				}
			}
		}

		for (var name in Targets) {
			objBypassForGettingResult(Targets[name]);
		}

		document.getElementById("loadBSC").style.display="none";
		document.getElementById("loadDataSuc").style.display="none";

		funcAfterFilesLoad();

		console.log(Targets);
	};

	reader.readAsText(files);	
}

// пробегаем по целям и высчитываем %
function objBypassForGettingResult(obj) {
	if (typeof obj.result === "undefined") {
		obj["result"] = 0;
		for (var subTargetName in obj["subTargets"]) {
			if (typeof obj["subTargets"][subTargetName]["result"] === "undefined") {
				if (obj["subTargets"][subTargetName]["type"] === "Target") {
					objBypassForGettingResult(Targets[obj["subTargets"][subTargetName]["id"]]);
				}
				else {
					let temp = getLastValOfParam(obj["subTargets"][subTargetName]["id"]);
					obj["subTargets"][subTargetName]["result"] = temp/obj["subTargets"][subTargetName]["paramTarget"];
					if (obj["subTargets"][subTargetName]["subTargetsDirection"] === "-") {
						obj["subTargets"][subTargetName]["result"] = 1/obj["subTargets"][subTargetName]["result"];
					}
					// ограничение до 100%
					// if (obj["subTargets"][subTargetName]["result"] > 1) {
					// 	obj["subTargets"][subTargetName]["result"] = 1;
					// }
				}
			}
			if (obj["subTargets"][subTargetName]["type"] === "Target") {
				obj["result"] += obj["subTargets"][subTargetName]["weight"]*Targets[obj["subTargets"][subTargetName]["id"]]["result"];
			}
			else {
				obj["result"] += obj["subTargets"][subTargetName]["weight"]*obj["subTargets"][subTargetName]["result"];
			}
		}
		// ограничение до 100%
		// if (obj["result"] > 1) {
		// 	obj["result"] = 1;
		// }
	}
	else if (obj["result"] == 0) {
		alert("Получен ноль! Возможна рекурсия!");
	}
}

function funcAfterFilesLoad() {
	var isHiddenLoadBSC = (document.getElementById("loadBSC").style.display == "none");
	var isHiddenLoadData = (document.getElementById("loadData").style.display == "none");
	if (isHiddenLoadBSC && isHiddenLoadData) {
		turnOnStrategeMap();
	}
}

function changeBlock(val) {
	for (var i = 0; i < document.getElementById("header").childNodes.length; i++) {
		let child = document.getElementById("header").childNodes[i];
		if (typeof child.id !== "undefined") {
			if (child.id !== val+"-header") {
				child.style.display = "none";
			}
			else {
				child.style.display = "block";
			}
		}
	}
	for (var i = 0; i < document.getElementById("base").childNodes.length; i++) {
		let child = document.getElementById("base").childNodes[i];
		if (typeof child.id !== "undefined") {
			if (child.id !== val) {
				child.style.display = "none";
			}
			else {
				child.style.display = "block";
			}
		}
	}
}

function reset(val) {
	if (val == "stratege-map") {
		let content =	'<div class="level" id="Finance"><h2>Finance</h2></div>'+
						'<div class="level" id="Customers"><h2>Customers</h2></div>'+
						'<div class="level" id="Process"><h2>Process</h2></div>'+
						'<div class="level" id="Development"><h2>Development</h2></div>';
		document.getElementById("stratege-map").innerHTML =	content;
	}
	else if (val == "bsc") {
		document.getElementById("bsc").innerHTML =  '<header>'+
														'<span class="name"></span>'+
														'<span class="weight">Вес</span>'+
														'<span class="resultPercent">Процент выполнения</span>'+
														'<span class="fact">Факт</span>'+
														'<span class="plan">План</span>'+
														'<span class="indicator"></span>'+
													'</header>';
	}
	else if (val == "graph") {
		document.getElementById("graph").innerHTML = '';
	}
	else if (val == "data-table") {
		document.getElementById("data-table").innerHTML = '';
	}
}

function turnOnLoad() {
	changeBlock("load");
	reset("stratege-map");
	reset("bsc");
	reset("data-table");
	for (var i = 0; i < document.getElementById("load").childNodes.length; i++) {
		let child = document.getElementById("load").childNodes[i];
		if (typeof child.id !== "undefined") {
			if (child.id == "loadData") {
				child.style.display = "block";
			}
			if (typeof child.getElementsByTagName("input")[0] !== "undefined") {
				child.getElementsByTagName("input")[0].value = "";
			}
		}
	}
	// document.getElementById("loadData").style.display="block";
	// document.getElementById("loadDataSuc").style.display="none";
	// document.getElementById("loadBSC").style.display="none";
}

function turnOnStrategeMap() {
 // отрисовка меню и главного блока
 changeBlock("stratege-map");
 //проверка, не построена ли уже карта, путем подсчета количества элементов
 let count = 0;
 for (var i = document.getElementById("stratege-map").getElementsByTagName("div").length - 1; i >= 0; i--) {
  count += document.getElementById("stratege-map").getElementsByTagName("div")[i].getElementsByTagName("div").length;
 }
 if (count === 0) {
  for (var name in Targets) {
   let subBlock = document.getElementById(Targets[name].type);
   let div = document.createElement('div');
   //div.innerHTML = "<span>"+(Targets[name].result/Targets[name]["min good"]*100).toFixed(2)+"%</span>";
   div.innerHTML = "<span>"+(Targets[name].result*100).toFixed(2)+"%</span>";
   div.innerHTML += "<p>"+name+"</p>";
   if (Targets[name].result > Targets[name]["min good"]) {
    div.setAttribute('class', 'good');
   }
   else if (Targets[name].result > Targets[name]["min normal"]) {
    div.setAttribute('class', 'normal');
   }
   else {
    div.setAttribute('class', 'bad');
   }

   subBlock.appendChild(div);
  }
 }
}

// https://www.w3schools.com/howto/howto_js_treeview.asp
function turnOnBSC() {
	// отображение блока ССП
	changeBlock("bsc");

	if (typeof document.getElementById("bsc").childNodes[3] === "undefined") {
		// получениt главной цели
		var mainTarget = searchMainTarget();
		
		// построение дерева
		var tree = "<ul>"+recursiveTreeBuilding(mainTarget, "-")+"</ul>";
		document.getElementById("bsc").innerHTML = document.getElementById("bsc").innerHTML+tree;
		document.getElementById("bsc").innerHTML += '<button name="button" style="margin-left:40px;width:300x;height:35px;color:#255F8F;border-color:#909DA2;font-weight:bold">Добавить цель</button>';
		document.getElementById("bsc").innerHTML += '<button name="button" style="width:300x;height:35px;color:#255F8F;border-color:#909DA2;font-weight:bold">Добавить параметр</button>';

		var paramsInBSC = document.getElementById('bsc').getElementsByClassName("param");
		for (var i = paramsInBSC.length - 1; i >= 0; i--) {
			// console.log(unescape(paramsInBSC[i].id));
			paramsInBSC[i].addEventListener('click', function(){turnOnGraph(unescape(this.id),this.parentNode.getElementsByClassName('plan')[0].innerHTML)}, false);}

		// реализация раскрывающегося списка
		var toggler = document.getElementsByClassName("caret");
		for (var i = 0; i < toggler.length; i++) {
			toggler[i].addEventListener("click", function() {
				this.parentElement.querySelector(".nested").classList.toggle("active");
				this.classList.toggle("caret-down");
			});
		}
	}
}

function turnOnGraph(paramID, plan) {
	changeBlock("graph");
	// document.getElementById("graph").innerHTML = paramID;
	document.getElementById('graph-header-graphName').innerHTML = paramID;
	drawGraf(1,paramID,plan);
	document.getElementById('drawGraf-2').addEventListener('click', function(){drawGraf(2,paramID,plan)}, false);
	}

function turnOnDataTable() {
	changeBlock("data-table");
	var block = document.getElementById("data-table");
	if (block.innerHTML == '') {
		block.innerHTML = '<h2 id="target"></h2>';
		block.innerHTML += '<table id="table"></table><p></p>';
		block.innerHTML += '<button name="button" id="addRow" style="width:300x;height:35px;color:#255F8F;border-color:#909DA2;font-weight:bold">Добавить значения за следующий месяц</button>';
		block.innerHTML += '<button name="button" id="saveChange" style="width:300x;height:35px;color:#255F8F;border-color:#909DA2;font-weight:bold">Сохранить изменения</button>';
		document.getElementById('target').innerHTML = 'Модель данных: ' + searchMainTarget();
		var table = document.getElementById('table');
		var arr = [];
		var arr2 = [];
		var arr3 = [];
		var name,year,month;
		// Запоминаем названия праметров
		for (name in Params){
			arr.push(name);
		}

		// Запоминаем года показатейл
		for (year in Params[name])
		{
			arr2.push(year);
		}

		// Запоминаем месяц
		for (month in Params[name][year])
		{
			arr3.push(month);
		}

		// Заполняем первую строку параметрами
		var tr = document.createElement('tr');
		var td = document.createElement('td');
		td.innerHTML = '/';
		tr.appendChild(td);
		table.appendChild(tr);

		for (var i=0;i<arr.length;i++)
		{
			var td = document.createElement('td');
			td.innerHTML = arr[i];
			tr.appendChild(td);
		}
		table.appendChild(tr);

		var temp = arr2.length*arr3.length;

		for (var i=0;i<arr2.length;i++)
			for (var j=0;j<arr3.length;j++)
			{
				var tr = document.createElement('tr');
				for (var k=0;k<arr.length+1;k++)
				{
					var td = document.createElement('td');
					if (k=='0')
					{
						td.innerHTML = arr2[i]  +'-'+ arr3[j];
					}
					else
					{
						td.innerHTML = Params[arr[k-1]][arr2[i]][arr3[j]];
					}
					tr.appendChild(td);
				}
				table.appendChild(tr);
			}
	}
}

// поиск главного элемента
function searchMainTarget() {
	var financeElems = [];
	for (var name in Targets) {
		if (Targets[name]["type"] == "Finance") {
			financeElems.push(name);
		}
	}
	for (var i = financeElems.length - 1; i >= 0; i--) {
		var j;
		for (j = financeElems.length - 1; j >= 0; j--) {
			for (var subTargetName in Targets[financeElems[j]]["subTargets"]) {
				if (subTargetName == financeElems[i]) {
					j = -100;
					break;
				}
			}
		}
		if (j == -1) {
			return financeElems[i];
		}
	}
	return 0;
}

// возвращает html-код дерева
function recursiveTreeBuilding(targetName, weight) {
	var out = '<li>';
	
	// название
	out += '<span class="name caret">'+targetName+'</span>';
	
	out += '<span class="weight">'+weight+'</span>'; // вес
	out += '<span class="resultPercent">'+(Targets[targetName].result*100).toFixed(2)+'%</span>'; // процент выполнения
	out += '<span class="fact">-</span>'; // факт
	out += '<span class="plan">-</span>'; // план

	// индикатор
	if (Targets[targetName].result > Targets[targetName]["min good"]) {
		out += '<span class="indicator good">good</span>';
	}
	else if (Targets[targetName].result > Targets[targetName]["min normal"]) {
		out += '<span class="indicator normal">norm</span>';
	}
	else {
		out += '<span class="indicator bad">bad</span>';
	}

	// подцели
	out += '<ul class="nested">';
	for (var subTargetName in Targets[targetName]["subTargets"]) {
		if (Targets[targetName]["subTargets"][subTargetName]["type"] === "Param") {
			var tempResult = Targets[targetName]["subTargets"][subTargetName].result;

			out += '<li>';

			out += '<span class="name param" id="'+escape(Targets[targetName]["subTargets"][subTargetName].id)+'">'+subTargetName+'</span>'; // название
			out += '<span class="weight">'+Targets[targetName]["subTargets"][subTargetName]["weight"]+'</span>'; // вес
			out += '<span class="resultPercent">'+(tempResult*100).toFixed(2)+'%</span>'; // процент выполнения
			out += '<span class="fact">'+getLastValOfParam(Targets[targetName]["subTargets"][subTargetName].id)+'</span>'; // факт
			out += '<span class="plan">'+Targets[targetName]["subTargets"][subTargetName]["paramTarget"]+'</span>'; // план

			// индикатор
			if (tempResult > Targets[targetName]["min good"]) {
				out += '<span class="indicator good">good</span>';
			}
			else if (tempResult > Targets[targetName]["min normal"]) {
				out += '<span class="indicator normal">norm</span>';
			}
			else {
				out += '<span class="indicator bad">bad</span>';
			}

			out += '</li>';
		}
		else {
			let tempId = Targets[targetName]["subTargets"][subTargetName]["id"];
			let tempWeight = Targets[targetName]["subTargets"][subTargetName]["weight"];
			out += recursiveTreeBuilding(tempId,tempWeight);
		}
	}

	out += '</ul>';
	out += '</li>';
	return out;
}

function getLastValOfParam(paramName) {
	var year,month;
	for (year in Params[paramName]);
	for (month in Params[paramName][year]);
	return Params[paramName][year][month];
}

function drawGraf(k,paramID,targetParam){
    var myChart = echarts.init(document.getElementById('main')); 
    var nameParam = paramID; // Параметр
    var dataX = []; // Значения по X
    var dataY = []; // Значения по Y
    var plan = []; // План
    var dataXTemp = [];
    var fcsLen = Number(document.getElementById("forecastLen").value); // Длина прогноза

	var arr = [];
	var arr2 = [];
	var arr3 = [];
	var name,year,month;

	for (name in Params){
		arr.push(name);
	}
	// Запоминаем года показатейл
	for (year in Params[name])
	{
		arr2.push(year);
	}
	// Запоминаем месяц
	for (month in Params[name][year])
	{
		arr3.push(month);
	}

	var kol = 0;
	for (var i=0;i<arr2.length;i++)
		for (var j=0;j<arr3.length;j++)
		{
			dataX[kol] = Params[nameParam][arr2[i]][arr3[j]];
			dataXTemp[kol] = Params[nameParam][arr2[i]][arr3[j]];
			dataY[kol] = arr2[i] + " - " + arr3[j];
			kol++;
		}
		
	var planValue = targetParam;
	for (var i=0;i<dataY.length;i++)
	{
		plan.push(planValue);
	}

    // Если строим просто график (план, факт)
	if (k=='1')
	{
	    var option = {
	    title : {text: '',},
	    tooltip : {trigger: 'axis'},
	    legend: { data:['План','Факт']},
	    toolbox: {
	        show : true,
	        feature : {
	            restore : {show: true},
	            saveAsImage : {show: true}
	        }
	    },
	    calculable : true,
	    xAxis : [
	        {
	            type : 'category',
	            boundaryGap : false,
	            data: dataY
	        }
	    ],
	    yAxis : [
	        {
	            type : 'value',
	            axisLabel : {
	                formatter: '{value}'
	            }
	        }
	    ],
	    series : [
	        {
	            name:'Факт',
	            type:'line',
				color: '#255F8F',
	            data: dataX,
	            markPoint : {
	                data : [
	                    {type : 'max', name: 'max'},
	                    {type : 'min', name: 'min'}
	                ]
	            },
	        },
	        {
	            name:'План',
	            type:'line',
				color: '#F19545',
	            data: plan
	        }
	    ]
		};  
	}
	// Если строим прогноз
	else if (k=='2'){
		for (var i=1; i<fcsLen+1; i++)
		{
			dataY.push('+'+ i);
		}
		var forecast = [];
		// Выбираем метод прогнозирования
	    if(document.getElementById('ss').checked == true){
		forecast = ss(dataXTemp,fcsLen);
		}
		else if(document.getElementById('es').checked == true){
			forecast = es(dataXTemp,fcsLen);
		}
		else if(document.getElementById('mnk').checked == true){
			forecast = nk(dataXTemp,fcsLen);
		}
		// Убираем значения, которые есть в данных
		var len = dataX.length;
		for (var i=0; i<len; i++)
			{
				forecast[i]=null;
			}
		forecast[len-1]=dataX[len-1];
		// Строим график с прогнозом
		var option = {
	    title : {text: '',},
	    tooltip : {trigger: 'axis'},
	    legend: { data:['План','Факт', 'Прогноз']},
	    toolbox: {
	        show : true,
	        feature : {
	            restore : {show: true},
	            saveAsImage : {show: true}
	        }
	    },
	    calculable : true,
	    xAxis : [
	        {
	            type : 'category',
	            boundaryGap : false,
	            data: dataY
	        }
	    ],
	    yAxis : [
	        {
	            type : 'value',
	            axisLabel : {
	                formatter: '{value}'
	            }
	        }
	    ],
	    series : [
	        {
	            name:'Факт',
	            type:'line',
				color: '#255F8F',
	            data: dataX,
	            markPoint : {
	                data : [
	                    {type : 'max', name: 'max'},
	                    {type : 'min', name: 'min'}
	                ]
	            },
	        },
	        {
	            name:'План',
	            type:'line',
				color: '#F19545',
	            data: plan
	        },
	        	        {
	            name:'Прогноз',
	            type:'line',
				color: '#773F9C',
	            data: forecast
	        }
	    ]
		};  
	}

    myChart.setOption(option);    
}  