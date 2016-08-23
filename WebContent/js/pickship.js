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

// get search params
var q1 = localStorage.getItem(user + 'temppickq1') || localStorage.getItem(user + 'pickq1') || '0';
$('select[name="q1"]').val(q1);
var q3 = localStorage.getItem(user + 'temppickq3') || localStorage.getItem(user + 'pickq3') || '';
$('input[name="q3"]').val(q3); 
if ((q1 && q1 !== '') || (q3 && q3 !== '')) {
	q_url = '&q1=' + String(q1) + '&q3=' + String(q3);
}

function search() {
	q_url = '&q1=' + $('select[name="q1"]').val() + '&q3=' + $('input[name="q3"]').val();
	localStorage.setItem(user + 'temppickq1', $('select[name="q1"]').val());
	localStorage.setItem(user + 'temppickq3', $('input[name="q3"]').val());
	location.assign('pickship.html?usr=' + user + q_url);
}

// build sql
var sql = 'SELECT * FROM pick \
	LEFT JOIN whouse ON pick.whouse = whouse.id \
	LEFT JOIN item ON pick.item = item.id \
	LEFT JOIN sales ON pick.sales_no = sales.number AND pick.item = sales.item \
	WHERE pick.sales_no LIKE ? ';
	
sql += (q1 && q1 !== '0') ? 'AND whouse.id = ' + q1 + ' ' : '';

// send query
var stocks = alasql(sql, [ '%' + q3 + '%' ]);

// build html table
var tbody = $('#tbody-stocks');
for (var i = 0; i < stocks.length; i++) {
	var stock = stocks[i];
	var tr = $('<tr></tr>');
	if (!stock.name) stock.name = '';
	if (!set.has(stock.sales_no)) {
		tr.append('<td data-href="pick.html"><button class="btn btn-success pick" id="' + stock.sales_no + '">Pick</button></td>');
	} else {
		tr.append('<td></td>');
	}
	tr.append('<td data-href="detail-pick.html?id=' + stock.id + '" class="wh">' + stock.name + '</td>');
	tr.append('<td data-href="detail-pick.html?id=' + stock.id + '" class="type">' + stock.type + '</td>');
	tr.append('<td data-href="detail-pick.html?id=' + stock.id + '" class="sales_no">' + "SO-0000" + stock.sales_no + '</td>');
	tr.append('<td data-href="detail-pick.html?id=' + stock.id + '">' + stock.customer + '</td>');
	tr.append('<td data-href="detail-pick.html?id=' + stock.id + '">[' + stock.code + '] ' + stock.detail + '</td>');
	tr.append('<td style="text-align: right;" data-href="detail-pick.html?id=' + stock.id + '">' + numberWithCommas(stock.qty) + '</td>');
	//tr.append('<td>' + stock.status + '</td>');
	//tr.append('<td style="text-align: right;">' + ((stock.amount && stock.amount !== '') ? numberWithCommas(stock.amount) : '') + '</td>');
	tr.appendTo(tbody);
	set.add(stock.sales_no);
}

// click event
//$('tbody > tr > td').css('cursor', 'pointer').on('click', function() {
	//window.location = $(this).attr('data-href');
//});

function signout() {
	if (confirm('Are you sure you want to logout?')) {
		localStorage.removeItem('username');
		localStorage.removeItem(user + 'temppickq1');
		localStorage.removeItem(user + 'temppickq3');
	}
}

function save() {
	localStorage.setItem(user + 'pickq1', q1);
	localStorage.setItem(user + 'pickq3', q3);
}

function newPick() {
	location.assign("new-pickship.html?usr=" + user);
}

$('.pick').click(function() {
	var id = parseInt(this.id);
	var rows = alasql('SELECT * FROM pick WHERE sales_no = ? ', [ id ]);
	for (var i = 0; i < rows.length; i++) {
		var row = rows[i];
		alasql('UPDATE stock SET hold_ship = hold_ship - ? WHERE whouse = ? AND item = ?', [ row.qty, row.whouse, row.item ]);
		alasql('UPDATE sales SET status = ? WHERE number = ? AND item = ?', [ "SHIPPED", id, row.item ]);
		alasql('DELETE FROM pick WHERE id = ?', [ row.id ]);
	}
	location.reload();
});

