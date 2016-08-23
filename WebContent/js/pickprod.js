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
var q1 = localStorage.getItem(user + 'temppickpq1') || localStorage.getItem(user + 'pickpq1') || '0';
$('select[name="q1"]').val(q1);
var q3 = localStorage.getItem(user + 'temppickpq3') || localStorage.getItem(user + 'pickpq3') || '';
$('input[name="q3"]').val(q3); 
if ((q1 && q1 !== '') || (q3 && q3 !== '')) {
	q_url = '&q1=' + String(q1) + '&q3=' + String(q3);
}

function search() {
	q_url = '&q1=' + $('select[name="q1"]').val() + '&q3=' + $('input[name="q3"]').val();
	localStorage.setItem(user + 'temppickpq1', $('select[name="q1"]').val());
	localStorage.setItem(user + 'temppickpq3', $('input[name="q3"]').val());
	location.assign('pickprod.html?usr=' + user + q_url);
}

/*var rows = alasql('SELECT * FROM pickp');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	console.log(row.component, row.qty, row.hold, row.balance);
}*/

// build sql
var sql = 'SELECT pickp.id, pickp.sales_no, whouse.name, item.code, item.detail, pickp.qty, pickp.hold, pickp.balance FROM pickp \
	LEFT JOIN whouse ON pickp.whouse = whouse.id \
	LEFT JOIN item ON pickp.item = item.id \
	WHERE pickp.sales_no LIKE ? AND pickp.qty > 0 ';
	
sql += (q1 && q1 !== '0') ? 'AND whouse.id = ' + q1 + ' ' : '';

// send query
var stocks = alasql(sql, [ '%' + q3 + '%' ]);

// build html table
var tbody = $('#tbody-stocks');
for (var i = 0; i < stocks.length; i++) {
	var stock = stocks[i];
	var tr = $('<tr></tr>');
	if (set.has(stock.sales_no)) {
		tr.append('<td></td>');
	} else {
		tr.append('<td data-href="pickprod.html"><button class="btn btn-success pick" id="' + stock.id + '">Pick</button><input type="number" min="0" value="' + stock.qty + '"></td>');
	}
	set.add(stock.sales_no);
	tr.append('<td>' + "SO-0000" + stock.sales_no + '</td>');
	tr.append('<td data-href="detail-pick.html?id=' + stock.id + '" class="wh">' + stock.name + '</td>');
	tr.append('<td data-href="detail-pick.html?id=' + stock.id + '" class="type">[' + stock.code + '] ' + stock.detail + '</td>');
	var component = alasql('SELECT * FROM pickp LEFT JOIN item ON pickp.component = item.id WHERE pickp.id = ? ', [ stock.id ])[0];
	tr.append('<td>[' + component.code + '] ' + component.detail + '</td>')
	tr.append('<td style="text-align: right;" data-href="detail-pick.html?id=' + stock.id + '">' + numberWithCommas(stock.hold) + '</td>');
	var number = alasql('SELECT * FROM pickp LEFT JOIN stock ON pickp.whouse = stock.whouse AND pickp.component = stock.item WHERE pickp.id = ? ', [ stock.id ])[0].balance;
	tr.append('<td style="text-align: right;">' + number + '</td>');
	tr.append('<td style="text-align: right;" data-href="detail-pick.html?id=' + stock.id + '">' + numberWithCommas(stock.balance) + '</td>');
	tr.appendTo(tbody);
}

// click event
//$('tbody > tr > td').css('cursor', 'pointer').on('click', function() {
	//window.location = $(this).attr('data-href');
//});

function signout() {
	if (confirm('Are you sure you want to logout?')) {
		localStorage.removeItem('username');
		localStorage.removeItem(user + 'temppickpq1');
		localStorage.removeItem(user + 'temppickpq3');
	}
}

function save() {
	localStorage.setItem(user + 'pickpq1', q1);
	localStorage.setItem(user + 'pickpq3', q3);
}

function newPick() {
	location.assign("new-pickprod.html?usr=" + user);
}

$('.pick').click(function() {
	var id = this.id;
	var qty = parseInt($(this).next().val());
	var row = alasql('SELECT * FROM pickp WHERE id = ?', [ parseInt(id) ])[0];
	if (qty > row.qty) {
		var num = qty - row.qty;
		var rows2 = alasql('SELECT stock.balance FROM pickp LEFT JOIN stock ON pickp.component = stock.item AND pickp.whouse = stock.whouse WHERE pickp.sales_no = ? AND pickp.item = ? ', [ row.sales_no, row.item ]);
		for (var i = 0; rows2 && i < rows2.length; i++) {
			var row2 = rows2[i];
			if (row2.balance < num) {
				alert('Please pick a value < (On Hold for Production + Available)!');
				return;
			}
		}
	}
	var min = Math.min(qty, row.qty);
	alasql('UPDATE stock SET prod = prod + ?, hold_prod = hold_prod + ?, needed = needed - ? WHERE whouse = ? AND item = ? ', [ qty, min, min, row.whouse, row.item ]);
	var rows = alasql('SELECT * FROM pickp WHERE sales_no = ? AND item = ? ', [ row.sales_no, row.item ]);
	for (var i = 0; rows && i < rows.length; i++) {
		var row = rows[i];
		alasql('UPDATE pickp SET qty = qty - ?, hold = hold - ? WHERE id = ? ', [ Math.min(qty, row.qty), Math.min(qty, row.qty), row.id ]);
		alasql('UPDATE stock SET hold_prod = hold_prod - ? WHERE whouse = ? AND item = ? ', [ Math.min(qty, row.qty), row.whouse, row.component ]);
		if (qty > row.qty) {
			alasql('UPDATE stock SET balance = balance - ? WHERE whouse = ? AND item = ? ', [ qty - row.qty, row.whouse, row.component ]);
		}
	}
	check(rows[0].sales_no, rows[0].item);
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
		alasql('DELETE FROM pickp WHERE sales_no = ? AND item = ? ', [ sales_no, item ]);
	}
}
