import * as visualizer from "./visualizer.js"
var DomTreeCopy = $('body').clone(true,true);
/*

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./visualizer.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}


*/



window['data'] = {};
window['csv_result'] = {}

function printPapaObject(papa) {
	var header = "";
	var tbody = "";
	for (var p in papa.meta.fields) {
		header += `<th> ${papa.meta.fields[p]} </th>`;
	}
	var error_indices = _.pluck(papa.errors, 'row');
	var rows = papa.data;
	for (var i = 0; i < rows.length && !_.contains(error_indices, i); i++) {
		var row = "";
		for (var z in rows[i]) {
			row += `<td> ${rows[i][z]} </td>`;
		}
		tbody += `<tr> ${row} </tr>`;
	}
	//build a table
	$("output").html(
		`<div style='overflow:auto; height:400px;'>
			<table class='pure'>
				<thead>${header}</thead>
				<tbody>${tbody}</tbody>
			</table>
		</div>`
	);
}
var sparse_columns = [];
var value_count = 0;
var result, result0, nodes, nodes_indexes, links, links2, input, graph, max_count;

var i = 0;
if (sessionStorage)
    sessionStorage.setItem("window", window);


function move(current) {
	var elem = document.getElementById("myBar");
	if (current < 0) {
		elem.style.width = 100;
		elem.style.backgroundColor = "red";
		elem.innerHTML = 'Processing took too much time!';
		return
	}
	var previous = current - 10;
	var id = setInterval(frame, 10);
	function frame() {
		if (previous >= current) {
			clearInterval(id);
			i = 0;
		} else {
			previous++;
      elem.style.width = previous + "%";
      if(previous==100)
        {elem.innerHTML = previous + '% Upload Completed!';}
      else
        {elem.innerHTML = previous + "%";}
		}
	}

}

function handleFileSelect(evt) {
	localStorage.clear();
	// reset dom
	document.getElementById("results").innerHTML = "";
	document.getElementById("keywords").innerHTML = "";
	document.getElementById("adjacency_matrix").innerHTML = "";
	document.getElementById("graph").innerHTML = "";
  var elem = document.getElementById("myBar");
  elem.style.width=0;
  elem.innerHTML = "Loading..";
	if(window.worker){
		window.worker.terminate();
		delete window.worker;
	}
  
	var file = evt.target.files[0];
	Papa.parse(file, {
		header: true,
		dynamicTyping: true,
		worker: true,
		complete: function (results) {
			var header = true;
			var shift = 0;
			_.forEach(results.data, function (row, i) {
				for (var key in row) {
					if (typeof (row[key]) == "number") {
						delete row[key]
						if (header) {
							results.meta.fields.splice(shift, 1);
							shift--
						}
					}
					shift++
				}
				header = false
				if (!row || Object.values(row).some(x => (x == null || x == '')))
					results.data.splice(i, 1);
			});
			var which_column = results.meta.fields;
			window.data = results;
			// ======================== Sanitization ========================
			if (results.errors > 0)
				console.error(results.errors);
			data.meta.fields.map(function (column) {
				value_count = _.countBy(_.pluck(data.data, column))[null];
				if (value_count >= 0 && value_count / data.data.length > 0.8)
					sparse_columns.push(column)
			})
			var error_indices = _.pluck(data.errors, 'row');

			var learning_dataset = _.map(data.data, function (row, idx) {
				if (_.contains(error_indices, idx))
					return
				return _.omit(row, sparse_columns);
			}).filter(function (elem) {
				return elem
			})

			// ======================== Ignore if all values are unique ========================


			// ======================== Compression ========================
			// JSONC.compress(learning_dataset) // removed

			// Format for Apriori
			// header = "\"" + _.values(learning_dataset[0]._).join("\",\"") + "\"\n";
			learning_dataset = _.map(learning_dataset, function (obj) {
				return "\"" + _.values(obj).slice(0, -1).join("\",\"") + "\"\n"
			}).join('');
			// ======================== Mining ========================
			var worker = new Worker('./workers/apriori.js');
			worker.postMessage(learning_dataset);

			var fire_time = new Date().getTime();
			var current_time = new Date().getTime();
			worker.onmessage = function (event) {
				// ======================== tracking progress ========================
				if (!event.data.end) {
					max_count = event.data.max_count;
					// bar.animate((event.data.message / max_count));
					move(Math.ceil((event.data.message / max_count) * 100))
					current_time = new Date().getTime();
					if ((current_time - fire_time) > 120000) {
						worker.terminate();
						move(-1)
						console.log('Processing took too much time')
					}
					return
				}
				result = event.data.message;

				window.csv_result = Papa.unparse(result);

				// ======================== Output HTML formatting ========================
				var rhss = result.map(function (elem) {
					return elem.rhs.join(" && ")
				});

				var lhss = result.map(function (elem) {
					return elem.lhs.join(" && ")
				});
				nodes = Array.from(new Set(_.flatten(_.pluck(result, 'lhs')).concat(_.flatten(_.pluck(result, 'rhs')))))
				$.each(nodes, function (i, w) {
					$("#keywords").append($('<span class="highlight">').text(w));
				});
				var confidences = result.map(function (elem) {
					return elem.confidence
				});
				var couples = lhss.map(function (e, i) {
					return e + " ⇒ " + rhss[i] + "  -- Confidence: " + confidences[i];
				});
				var sentences = document.querySelector('#results');
				var keywords = document.querySelector('#keywords');

				// ======================== Output HTML formatting for keywords highlighting ========================
				keywords.addEventListener('click', function (event) {
					var target = event.target;
					var text = sentences.textContent;
					var regex = new RegExp('(' + target.textContent + ')', 'ig');
					text = text.replace(regex, '<span class="highlight">$1</span>');
					sentences.innerHTML = text;
				}, false);
				document.getElementById("results").innerHTML = couples.join("\n");
				document.getElementById("results").style = "overflow:auto; height:400px;"
				printPapaObject(results);

				// ======================== Input formatting for visualization =============
				result0 = _.clone(result)
				nodes = Array.from(new Set(_.flatten(_.pluck(result0, 'lhs')).concat(_.flatten(_.pluck(result0, 'rhs')))))
				nodes_indexes = _.invert(nodes)
				// links = result0.map(function(elem){return {'source': elem['rhs'][0], 'target': elem['lhs'][0], 'value': elem.confidence}})
				// console.log(links)
				links = result0
					.filter(function (elem) {
						return elem.confidence < 1
					})
					.map(function (elem) {
						return {
							'source': parseInt(nodes_indexes[elem['rhs'][0]]),
							'target': parseInt(nodes_indexes[elem['lhs'][0]]),
							'value': Math.floor(elem.confidence * 10 + 1)
						}
					})
				links2 = result0
					.filter(function (elem) {
						return elem.confidence == 1
					})
					.map(function (elem) {
						return {
							'source': elem['rhs'][0],
							'target': elem['lhs'][0],
							'value': Math.floor(elem.confidence * 10 + 1)
						}
					})
				var which_group = {};

				results.data.map(x => _.invert(x))
					.forEach(function (o) {
						which_group = Object.assign({}, which_group, o);
					})
				nodes = _.map(nodes, function (node) {
					var group = which_group[node] || which_group[node.replace("'", "").replace("'", "")]
					return {
						name: node,
						group: which_column.indexOf(group)
					}
				});

				input = {
					nodes: nodes,
					links: links
				}
				graph = {
					nodes: nodes,
					links: links2
				}

				visualizer.visualize(input, graph);
				move(100);
				worker.terminate()
			};
		}
	});
}

$(document).ready(function () {
	$("#csv-file").change(handleFileSelect);
	// Start file download.
	document.getElementById("dwn-btn").addEventListener("click", function () {
		// Generate download of hello.txt file with some content
		if (!_.isEmpty(window.csv_result)) {
			var text = window.csv_result;
			var filename = "rules.csv";
			download(filename, text);
		}
	}, false);

});

function download(filename, text) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();
	document.body.removeChild(element);
}

$("div.hide").hide();
$("button.hide,h2").click(function () {
	var target = $(this).is('h2') ? $(this).next("div.hide") : $(this).parents("div.hide");
	target.slideToggle("slow");
	var target = $(this).is('h2') ? $(this).next("output.hide") : $(this).parents("output.hide");
	target.slideToggle("slow");
	var target = $(this).is('h2') ? $(this).next("svg.hide") : $(this).parents("svg.hide");
	target.slideToggle("slow");
});

function putTitleToSVG(text, id) {
  var title = document.createElementNS("http://www.w3.org/2000/svg","title")
  title.textContent = text
  document.getElementById(id).appendChild(title)
}
