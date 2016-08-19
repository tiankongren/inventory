'use strict';

var q_url = "";

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

var rows = alasql('SELECT * FROM kind WHERE type like "Imported";');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option = $('<option>');
	option.attr('value', row.id);
	option.text(row.text);
	$('select[name="q2"]').append(option);
}

// get search params
var q1 = localStorage.getItem(user + 'tempq1') || localStorage.getItem(user + 'q1') || '0';
$('select[name="q1"]').val(q1);
var q2 = localStorage.getItem(user + 'tempq2') || localStorage.getItem(user + 'q2') || '0';
$('select[name="q2"]').val(q2);
var q3 = localStorage.getItem(user + 'tempq3') || localStorage.getItem(user + 'q3') || '';
$('input[name="q3"]').val(q3); 
if ((q1 && q1 !== '') || (q2 && q2 !== '') || (q3 && q3 !== '')) {
	q_url = '&q1=' + String(q1) + '&q2=' + String(q2) + '&q3=' + String(q3);
}

function search() {
	localStorage.setItem(user + 'tempPage', 1);
	q_url = '&q1=' + $('select[name="q1"]').val() + '&q2=' + $('select[name="q2"]').val() + '&q3=' + $('input[name="q3"]').val();
	localStorage.setItem(user + 'tempq1', $('select[name="q1"]').val());
	localStorage.setItem(user + 'tempq2', $('select[name="q2"]').val());
	localStorage.setItem(user + 'tempq3', $('input[name="q3"]').val());
	location.assign('items.html?usr=' + user + q_url);
}

// build sql
var sql = 'SELECT stock.id, whouse.name, kind.text, item.code, item.maker, item.detail, item.price, item.cost, stock.balance, item.unit, \
	stock.hold_prod, stock.hold_ship, stock.prod, stock.incoming, stock.needed FROM stock \
	JOIN whouse ON whouse.id = stock.whouse \
	JOIN item ON item.id = stock.item \
	JOIN kind ON kind.id = item.kind \
	WHERE item.code LIKE ? AND kind.type LIKE "Imported"';

sql += (q1 && q1 !== '0') ? 'AND whouse.id = ' + q1 + ' ' : '';
sql += (q2 && q2 !== '0') ? 'AND kind.id = ' + q2 + ' ' : '';

// send query
var stocks = alasql(sql, [ '%' + q3 + '%' ]);
 
// build html table
var tbody = $('#tbody-stocks');
for (var i = 0; i < stocks.length; i++) {
	var stock = stocks[i];
	var tr = $('<tr data-href="stock.html?id=' + stock.id + '"></tr>');
	tr.append('<td>' + stock.name + '</td>');
	tr.append('<td>' + stock.text + '</td>');
	tr.append('<td>' + stock.code + '</td>');
	tr.append('<td>' + stock.maker + '</td>');
	tr.append('<td>' + stock.detail + '</td>');
	tr.append('<td style="text-align: right;">' + numberWithCommas(stock.price) + '</td>');
	tr.append('<td style="text-align: right;">' + numberWithCommas(stock.cost) + '</td>');
	tr.append('<td style="text-align: right;">' + stock.balance + '</td>');
	tr.append('<td style="text-align: right;">' + stock.hold_ship + '</td>');
	tr.append('<td style="text-align: right;">' + stock.hold_prod + '</td>');
	tr.append('<td style="text-align: right;">' + stock.prod + '</td>');
	tr.append('<td style="text-align: right;">' + stock.incoming + '</td>');
	tr.append('<td style="text-align: right;">' + stock.needed + '</td>');
	tr.append('<td>' + stock.unit + '</td>');
	tr.appendTo(tbody);
}

// click event
$('tbody > tr').css('cursor', 'pointer').on('click', function() {
	window.location = $(this).attr('data-href');
});

function signout() {
	if (confirm('Are you sure you want to logout?')) {
		localStorage.removeItem('username');
		localStorage.removeItem(user + 'tempNum');
		localStorage.removeItem(user + 'tempPage');
		localStorage.removeItem(user + 'tempq1');
		localStorage.removeItem(user + 'tempq2');
		localStorage.removeItem(user + 'tempq3');
	}
}

function save() {
	localStorage.setItem(user + 'q1', q1);
	localStorage.setItem(user + 'q2', q2);
	localStorage.setItem(user + 'q3', q3);
	localStorage.setItem(user + 'Num', stockNum);
	localStorage.setItem(user + 'Page', page);
}