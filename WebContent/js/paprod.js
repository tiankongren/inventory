'use strict';

var q_url = "";
var set = new Set();

var user = localStorage.getItem('username') || '';

// create search box
var rows = alasql('SELECT * FROM whouse;');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option = $('<option>');
	option.attr('value', row.id);
	option.text(row.name);
	$('select[name="q1"]').append(option);
}
var rows = alasql('SELECT * FROM kind WHERE type = "Homemade";');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option = $('<option>');
	option.attr('value', row.id);
	option.text(row.text);
	$('select[name="q2"]').append(option);
}

// get search params
var q1 = localStorage.getItem(user + 'temppapq1') || localStorage.getItem(user + 'papq1') || '0';
$('select[name="q1"]').val(q1);
var q2 = localStorage.getItem(user + 'temppapq2') || localStorage.getItem(user + 'papq2') || '0';
$('select[name="q2"]').val(q2);
var q3 = localStorage.getItem(user + 'temppapq3') || localStorage.getItem(user + 'papq3') || '';
$('input[name="q3"]').val(q3); 
if ((q1 && q1 !== '') || (q2 && q2 !== '') || (q3 && q3 !== '')) {
	q_url = '&q1=' + String(q1) + '&q2=' + String(q2) + '&q3=' + String(q3);
}

function search() {
	q_url = '&q1=' + $('select[name="q1"]').val() + '&q2=' + $('select[name="q2"]').val() + '&q3=' + $('input[name="q3"]').val();
	localStorage.setItem(user + 'temppapq1', $('select[name="q1"]').val());
	localStorage.setItem(user + 'temppapq2', $('select[name="q2"]').val());
	localStorage.setItem(user + 'temppapq3', $('input[name="q3"]').val());
	location.assign('paprod.html?usr=' + user + q_url);
}

/*var rows = alasql('SELECT * FROM pickp');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	console.log(row.component, row.qty, row.hold, row.balance);
}*/

// build sql
var sql = 'SELECT stock.id, stock.prod, whouse.name, kind.text, item.code, item.detail, stock.hold_prod FROM stock \
	LEFT JOIN whouse ON stock.whouse = whouse.id \
	LEFT JOIN item ON stock.item = item.id \
	LEFT JOIN kind ON item.kind = kind.id \
	WHERE item.code LIKE ? AND stock.prod > 0 ';
	
sql += (q1 && q1 !== '0') ? 'AND whouse.id = ' + q1 + ' ' : '';
sql += (q2 && q2 !== '0') ? 'AND kind.id = ' + q2 + ' ' : '';

// send query
var stocks = alasql(sql, [ '%' + q3 + '%' ]);

// build html table
var tbody = $('#tbody-stocks');
for (var i = 0; i < stocks.length; i++) {
	var stock = stocks[i];
	var tr = $('<tr></tr>');
	tr.append('<td data-href="paprod.html"><button class="btn btn-success receive" id="' + stock.id + '">Receive</button><input type="number" min="0" max="' + stock.prod + '"></td>');
	tr.append('<td>' + stock.name + '</td>');
	tr.append('<td>' + stock.text + '</td>');
	tr.append('<td>' + stock.code + '</td>');
	tr.append('<td>' + stock.detail + '</td>');
	tr.append('<td style="text-align: right;">' + numberWithCommas(stock.prod) + " (On Hold: " + numberWithCommas(stock.hold_prod) + ' )</td>');
	tr.appendTo(tbody);
}

// click event
//$('tbody > tr > td').css('cursor', 'pointer').on('click', function() {
	//window.location = $(this).attr('data-href');
//});

function signout() {
	if (confirm('Are you sure you want to logout?')) {
		localStorage.removeItem('username');
		localStorage.removeItem(user + 'temppapq1');
		localStorage.removeItem(user + 'temppapq2');
		localStorage.removeItem(user + 'temppapq3');
	}
}

function save() {
	localStorage.setItem(user + 'papq1', q1);
	localStorage.setItem(user + 'papq2', q2);
	localStorage.setItem(user + 'papq3', q3);
}

function newPAP() {
	location.assign("new-pap.html?usr=" + user);
}

$('.receive').click(function() {
	var id = parseInt(this.id);
	var qty = parseInt($(this).next().val());
	var row = alasql('SELECT * FROM stock WHERE id = ?', [ id ])[0];
	alasql('UPDATE stock SET hold_ship = hold_ship + ?, balance = balance + ?, prod = prod - ?, hold_prod = hold_prod - ? WHERE id = ? ', [ Math.min(qty, row.hold_prod), qty - Math.min(qty, row.hold_prod), qty, Math.min(qty, row.hold_prod), id ]);
	console.log(row.item, row.whouse);
	console.log(alasql('SELECT * FROM sales WHERE item = ? AND whouse = ?', [ row.item, row.whouse ]));
	var data = alasql('SELECT * FROM sales WHERE item = ? AND whouse = ? AND status = "IN PRODUCTION"', [ row.item, row.whouse ])[0];
	var row = alasql('SELECT * FROM stock WHERE id = ?', [ id ])[0];
	if (row.hold_ship >= data.qty) {
		alasql('UPDATE sales SET status = "READY" WHERE id = ? ', [ data.id ]);
		checkStatus(data.number);
	}
	location.reload();
});

function check(sales_no, item) {
	var rows = alasql('SELECT * FROM pickp WHERE sales_no = ? AND item = ? ', [ sales_no, item ]), bool = true;
	for (var i = 0; rows && i < rows.length; i++) {
		var row = rows[i];
		if (row.qty > 0 || row.balance > 0) {
			bool = false; break;
		}
	}
	if (bool) {
		var rows = alasql('UPDATE sales SET status = ? WHERE number = ? AND item = ? ', [ "IN PRODUCTION", sales_no, item ]);
		alasql('DELETE FROM pickp WHERE sales_no = ? AND item =? ', [ sales_no, item ]);
	}
}

function checkStatus(number) {
	if (typeof alasql('SELECT * FROM pick WHERE sales_no = ? ', [ number ])[0] !== 'undefined') return;
	var rows = alasql('SELECT * FROM sales WHERE number = ? ', [ number ]), bool = true;
	for (var i = 0; i < rows.length; i++) {
		var row = rows[i];
		if (row.status !== "READY") {
			bool = false; break;
		}
	}
	if (bool) {
		for (var i = 0; i < rows.length; i++) {
			var id = alasql('SELECT MAX(id) + 1 as id FROM pick')[0].id, row = rows[i];
			alasql('INSERT INTO pick VALUES(?,?,?,?,?,?)', [ id, "SHIPMENT", number, row.whouse, row.item, row.qty ]);
		}
	}
}
