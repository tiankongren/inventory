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

var rows = ["CONFIRMED", "SHIPPED", "RECEIVED", "VOID"];
var map = new Map();
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option = $('<option>');
	option.attr('value', row);
	option.text(row);
	$('select[name="q2"]').append(option);
}

// get search params
var q1 = localStorage.getItem(user + 'temppurq1') || localStorage.getItem(user + 'purq1') || '0';
$('select[name="q1"]').val(q1);
var q2 = localStorage.getItem(user + 'temppurq2') || localStorage.getItem(user + 'purq2') || '';
$('select[name="q2"]').val(q2);
var q3 = localStorage.getItem(user + 'temppurq3') || localStorage.getItem(user + 'purq3') || '';
$('input[name="q3"]').val(q3); 
if ((q1 && q1 !== '') || (q2 && q2 !== '') || (q3 && q3 !== '')) {
	q_url = '&q1=' + String(q1) + '&q2=' + String(q2) + '&q3=' + String(q3);
}

function search() {
	q_url = '&q1=' + $('select[name="q1"]').val() + '&q2=' + $('select[name="q2"]').val() + '&q3=' + $('input[name="q3"]').val();
	localStorage.setItem(user + 'temppurq1', $('select[name="q1"]').val());
	localStorage.setItem(user + 'temppurq2', $('select[name="q2"]').val());
	localStorage.setItem(user + 'temppurq3', $('input[name="q3"]').val());
	location.assign('purchase.html?usr=' + user + q_url);
}

// build sql
var sql = 'SELECT pur.id, whouse.name, pur.number, pur.status, pur.date, pur.receive, pur.maker, \
	pur.amount, item.code, item.detail, pur.qty, pur.price, pur.user FROM pur \
	LEFT JOIN whouse ON pur.whouse = whouse.id \
	LEFT JOIN item ON pur.item = item.id \
	WHERE pur.number LIKE ? \
	AND pur.status LIKE ? ';
	
sql += (q1 && q1 !== '0') ? 'AND whouse.id = ' + q1 + ' ' : '';
//sql += (q2 && q2 !== '0') ? 'AND sales.status LIKE ' + q2 + ' ' : '';

// send query
var stocks = alasql(sql, [ '%' + q3 + '%', '%' + q2 + '%' ]);

// build html table
var tbody = $('#tbody-stocks');
for (var i = 0; i < stocks.length; i++) {
	var stock = stocks[i];
	var tr = $('<tr data-href="detail-pur.html?id=' + stock.id + '"></tr>');
	//if (!stock.name) stock.name = '';
	tr.append('<td>' + stock.name + '</td>');
	tr.append('<td>' + "PO-0000" + stock.number + '</td>');
	tr.append('<td>' + stock.status + '</td>');
	tr.append('<td>' + stock.date + '</td>');
	tr.append('<td>' + (stock.receive || '') + '</td>');
	tr.append('<td>' + stock.maker + '</td>');
	tr.append('<td style="text-align: right;">' + numberWithCommas(stock.amount) + '</td>');
	tr.append('<td>[' + stock.code + '] ' + stock.detail + '</td>');
	tr.append('<td style="text-align: right;">' + numberWithCommas(stock.qty) + '</td>');
	tr.append('<td style="text-align: right;">' + numberWithCommas(stock.price) + '</td>');
	tr.append('<td>' + stock.user + '</td>');
	tr.appendTo(tbody);
}

// click event
$('tbody > tr').css('cursor', 'pointer').on('click', function() {
	window.location = $(this).attr('data-href');
});

function signout() {
	if (confirm('Are you sure you want to logout?')) {
		localStorage.removeItem('username');
		localStorage.removeItem(user + 'temppurq1');
		localStorage.removeItem(user + 'temppurq2');
		localStorage.removeItem(user + 'temppurq3');
	}
}

function save() {
	localStorage.setItem(user + 'purq1', q1);
	localStorage.setItem(user + 'purq2', q2);
	localStorage.setItem(user + 'purq3', q3);
}

function newPur() {
	location.assign("new-pur.html?usr=" + user);
}