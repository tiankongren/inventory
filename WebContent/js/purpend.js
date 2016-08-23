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
var rows = alasql('SELECT * FROM kind WHERE type = "Imported";');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option = $('<option>');
	option.attr('value', row.id);
	option.text(row.text);
	$('select[name="q2"]').append(option);
}

// get search params
var q1 = localStorage.getItem(user + 'temppurpq1') || localStorage.getItem(user + 'purpq1') || '0';
$('select[name="q1"]').val(q1);
var q2 = localStorage.getItem(user + 'temppurpq2') || localStorage.getItem(user + 'purpq2') || '0';
$('select[name="q2"]').val(q2);
var q3 = localStorage.getItem(user + 'temppurpq3') || localStorage.getItem(user + 'purpq3') || '';
$('input[name="q3"]').val(q3); 
if ((q1 && q1 !== '') || (q2 && q2 !== '') || (q3 && q3 !== '')) {
	q_url = '&q1=' + String(q1) + '&q2=' + String(q2) + '&q3=' + String(q3);
}

function search() {
	q_url = '&q1=' + $('select[name="q1"]').val() + '&q2=' + $('select[name="q2"]').val() + '&q3=' + $('input[name="q3"]').val();
	localStorage.setItem(user + 'temppurpq1', $('select[name="q1"]').val());
	localStorage.setItem(user + 'temppurpq2', $('select[name="q2"]').val());
	localStorage.setItem(user + 'temppurpq3', $('input[name="q3"]').val());
	location.assign('purpend.html?usr=' + user + q_url);
}

/*var rows = alasql('SELECT * FROM pickp');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	console.log(row.component, row.qty, row.hold, row.balance);
}*/

// build sql
var sql = 'SELECT item.maker, stock.id, whouse.name, item.maker, kind.text, item.code, item.detail, stock.needed, item.cost, item.price FROM stock \
	LEFT JOIN whouse ON stock.whouse = whouse.id \
	LEFT JOIN item ON stock.item = item.id \
	LEFT JOIN kind ON item.kind = kind.id \
	WHERE item.code LIKE ? AND kind.type = "Imported" AND stock.needed > 0 ';
	
sql += (q1 && q1 !== '0') ? 'AND whouse.id = ' + q1 + ' ' : '';
sql += (q2 && q2 !== '0') ? 'AND kind.id = ' + q2 + ' ' : '';

// send query
var stocks = alasql(sql, [ '%' + q3 + '%' ]);

// build html table
var tbody = $('#tbody-stocks');
for (var i = 0; i < stocks.length; i++) {
	var stock = stocks[i];
	var tr = $('<tr id="' + stock.id + '"></tr>');
	if (set.has(stock.maker)) {
		tr.append('<td></td>');
	} else {
		tr.append('<td data-href="purpend.html"><button class="btn btn-success pick" stock="' + stock.id + '">Purchase</button></td>');
	}
	set.add(stock.maker);
	tr.append('<td>' + stock.name + '</td>');
	tr.append('<td class="maker" stock="' + stock.id + '">' + stock.maker + '</td>');
	tr.append('<td>' + stock.text + '</td>');
	tr.append('<td>' + stock.code + '</td>');
	tr.append('<td>' + stock.detail + '</td>');
	tr.append('<td style="text-align: right;">' + numberWithCommas(stock.needed) + '</td>');
	tr.append('<td style="text-align: right;"><input class="qty" type="number" min="0" value="' + stock.needed + '"></td>');
	tr.append('<td style="text-align: right;">' + numberWithCommas(stock.cost) + '</td>');
	tr.append('<td style="text-align: right;">' + numberWithCommas(stock.price) + '</td>');
	tr.append('<td style="text-align: right;"><input class="price" type="number" min="0" value="' + stock.cost + '"></td>');
	tr.appendTo(tbody);
}

// click event
//$('tbody > tr > td').css('cursor', 'pointer').on('click', function() {
	//window.location = $(this).attr('data-href');
//});

function signout() {
	if (confirm('Are you sure you want to logout?')) {
		localStorage.removeItem('username');
		localStorage.removeItem(user + 'temppurpq1');
		localStorage.removeItem(user + 'temppurpq2');
		localStorage.removeItem(user + 'temppurpq3');
	}
}

function save() {
	localStorage.setItem(user + 'purpq1', q1);
	localStorage.setItem(user + 'purpq1', q2);
	localStorage.setItem(user + 'purpq3', q3);
}

function newPur() {
	location.assign("new-pur.html?usr=" + user);
}

$('.pick').click(function() {
	var id = parseInt($(this).attr('stock')), qtys = [], prices = [], stocks = [];
	var row = alasql('SELECT * FROM stock LEFT JOIN item ON stock.item = item.id WHERE stock.id = ? ', [ id ])[0];
	var maker = row.maker;
	$('.maker').each(function( i ) {
		if ($(this).text() === maker) {
			qtys.push(parseInt($(this).parent().find('.qty').val()));
			prices.push(parseInt($(this).parent().find('.price').val()));
			stocks.push(parseInt($(this).attr('stock')));
		}
	});
	var pur_number = alasql('SELECT MAX(number) + 1 as number FROM pur')[0].number;
	var date = new Date().toDateInputValue(), amount = 0;
	for (var i = 0; qtys && i < qtys.length; i++) {
		var qty = qtys[i], price = prices[i], stock = stocks[i];
		var pur_id = alasql('SELECT MAX(id) + 1 as id FROM pur')[0].id;
		var data = alasql('SELECT * FROM stock WHERE id = ? ', [ stock ])[0];
		amount += qty * price;
		alasql('INSERT INTO pur VALUES(?,?,?,?,?,?,?,?,?,?,?,?)', [ pur_id, date, pur_number, maker, "CONFIRMED", data.whouse, amount, data.item, qty, price, user, '']);
		alasql('UPDATE stock SET incoming = incoming + ?, needed = needed - ?, hold_in = hold_in + ? WHERE id = ? ', [ qty, Math.min(data.needed, qty), Math.min(data.needed, qty), stock ]);
	}
	if (qtys && qtys.length > 1) {
		alasql('UPDATE pur SET amount = ? WHERE number = ? ', [ amount, pur_number ]);
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

Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
});