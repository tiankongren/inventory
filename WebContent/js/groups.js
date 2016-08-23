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

var rows = alasql('SELECT * FROM kind WHERE type like "Homemade";');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option = $('<option>');
	option.attr('value', row.id);
	option.text(row.text);
	$('select[name="q2"]').append(option);
}

// get search params
var q1 = localStorage.getItem(user + 'tempgroupq1') || localStorage.getItem(user + 'groupq1') || '0';
$('select[name="q1"]').val(q1);
var q2 = localStorage.getItem(user + 'tempgroupq2') || localStorage.getItem(user + 'groupq2') || '0';
$('select[name="q2"]').val(q2);
var q3 = localStorage.getItem(user + 'tempgroupq3') || localStorage.getItem(user + 'groupq3') || '';
$('input[name="q3"]').val(q3); 
if ((q1 && q1 !== '') || (q2 && q2 !== '') || (q3 && q3 !== '')) {
	q_url = '&q1=' + String(q1) + '&q2=' + String(q2) + '&q3=' + String(q3);
}

function search() {
	q_url = '&q1=' + $('select[name="q1"]').val() + '&q2=' + $('select[name="q2"]').val() + '&q3=' + $('input[name="q3"]').val();
	localStorage.setItem(user + 'tempgroupq1', $('select[name="q1"]').val());
	localStorage.setItem(user + 'tempgroupq2', $('select[name="q2"]').val());
	localStorage.setItem(user + 'tempgroupq3', $('input[name="q3"]').val());
	location.assign('groups.html?usr=' + user + q_url);
}

// build sql
var sql = 'SELECT stock.id, whouse.name, kind.text, item.code, item.detail, item.price, item.cost, stock.balance, item.unit, \
	stock.hold_ship, stock.incoming, stock.needed, stock.prod, stock.hold_in, stock.hold_prod FROM stock \
	LEFT JOIN whouse ON whouse.id = stock.whouse \
	LEFT JOIN item ON item.id = stock.item \
	LEFT JOIN kind ON kind.id = item.kind \
	WHERE item.code LIKE ? AND kind.type LIKE "Homemade" AND stock.state = "Active"';

sql += (q1 && q1 !== '0') ? 'AND whouse.id = ' + q1 + ' ' : '';
sql += (q2 && q2 !== '0') ? 'AND kind.id = ' + q2 + ' ' : '';

// send query
var stocks = alasql(sql, [ '%' + q3 + '%' ]);
 
// build html table
var tbody = $('#tbody-stocks');
for (var i = 0; i < stocks.length; i++) {
	var stock = stocks[i];
	var tr = $('<tr data-href="detail-group.html?id=' + stock.id + '"></tr>');
	if (!stock.name) stock.name = '';
	tr.append('<td>' + stock.name + '</td>');
	tr.append('<td>' + stock.text + '</td>');
	tr.append('<td>' + stock.code + '</td>');
	tr.append('<td>' + stock.detail + '</td>');
	tr.append('<td style="text-align: right;">' + ((stock.price && stock.price !== '') ? numberWithCommas(stock.price) : '') + '</td>');
	tr.append('<td style="text-align: right;">' + ((stock.cost && stock.cost !== '') ? numberWithCommas(stock.cost) : '') + '</td>');
	tr.append('<td style="text-align: right;">' + stock.balance + '</td>');
	tr.append('<td style="text-align: right;">' + stock.hold_ship + '</td>');
	tr.append('<td style="text-align: right;">' + stock.prod + ' (On hold: ' + stock.hold_prod + ')</td>');
	tr.append('<td style="text-align: right;">' + stock.incoming + ' (On hold: ' + stock.hold_in + ')</td>');
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
		localStorage.removeItem(user + 'tempgroupq1');
		localStorage.removeItem(user + 'tempgroupq2');
		localStorage.removeItem(user + 'tempgroupq3');
	}
}

function save() {
	localStorage.setItem(user + 'groupq1', q1);
	localStorage.setItem(user + 'groupq2', q2);
	localStorage.setItem(user + 'groupq3', q3);
}

function newGroup() {
	location.assign("new-group.html?usr=" + user);
}