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
var q1 = localStorage.getItem(user + 'temppasq1') || localStorage.getItem(user + 'pasq1') || '0';
$('select[name="q1"]').val(q1);
var q3 = localStorage.getItem(user + 'temppasq3') || localStorage.getItem(user + 'pasq3') || '';
$('input[name="q3"]').val(q3); 
if ((q1 && q1 !== '') || (q3 && q3 !== '')) {
	q_url = '&q1=' + String(q1) + '&q3=' + String(q3);
}

function search() {
	q_url = '&q1=' + $('select[name="q1"]').val() + '&q3=' + $('input[name="q3"]').val();
	localStorage.setItem(user + 'temppasq1', $('select[name="q1"]').val());
	localStorage.setItem(user + 'temppasq3', $('input[name="q3"]').val());
	location.assign('pas.html?usr=' + user + q_url);
}


// build sql
var sql = 'SELECT pur.id, whouse.name, pur.number, pur.status, pur.date, pur.receive, pur.maker, \
	pur.amount, item.code, item.detail, pur.qty, pur.price, pur.user FROM pur \
	LEFT JOIN whouse ON pur.whouse = whouse.id \
	LEFT JOIN item ON pur.item = item.id \
	WHERE pur.number LIKE ? \
	AND pur.status = "CONFIRMED"';

sql += (q1 && q1 !== '0') ? 'AND whouse.id = ' + q1 + ' ' : '';
//sql += (q2 && q2 !== '0') ? 'AND sales.status LIKE ' + q2 + ' ' : '';

// send query
var stocks = alasql(sql, [ '%' + q3 + '%' ]);

// build html table
var tbody = $('#tbody-stocks');
for (var i = 0; i < stocks.length; i++) {
	var stock = stocks[i];
	var tr = $('<tr data-href="detail-pur.html?id=' + stock.id + '"></tr>');
	if (set.has(stock.number)) {
		tr.append('<td></td>');
	} else {
		tr.append('<td data-href="pas.html"><button class="btn btn-success pick" id="' + stock.id + '">Receive</button></td>');
	}
	//if (!stock.name) stock.name = '';
	tr.append('<td>' + stock.name + '</td>');
	tr.append('<td>' + "PO-0000" + stock.number + '</td>');
	tr.append('<td>' + stock.date + '</td>');
	tr.append('<td>' + stock.maker + '</td>');
	tr.append('<td>[' + stock.code + '] ' + stock.detail + '</td>');
	tr.append('<td style="text-align: right;">' + numberWithCommas(stock.qty) + '</td>');
	tr.appendTo(tbody);
}

// click event
/*$('tbody > tr').css('cursor', 'pointer').on('click', function() {
	window.location = $(this).attr('data-href');
});*/

function signout() {
	if (confirm('Are you sure you want to logout?')) {
		localStorage.removeItem('username');
		localStorage.removeItem(user + 'temppasq1');
		localStorage.removeItem(user + 'temppasq3');
	}
}

function save() {
	localStorage.setItem(user + 'pasq1', q1);
	localStorage.setItem(user + 'pasq3', q3);
}

function newPAS() {
	location.assign("new-pas.html?usr=" + user);
}

$('.pick').click(function() {
	var id = parseInt(this.id), date = new Date().toDateInputValue();
	var rows = alasql('SELECT * FROM pur WHERE id = ? ', [ id ]);
	var set = new Set(), orders = [];
	alasql('UPDATE pur SET status = "RECEIVED", receive = ? WHERE number = ? ', [ date, rows[0].number ]);
	for (var i = 0; rows && i < rows.length; i++) {
		var row = rows[i];
		var data = alasql('SELECT FROM stock WHERE whouse = ? AND item = ? ', [ row.whouse, row.item ])[0];
		alasql('UPDATE stock SET incoming = incoming - ?, hold_in = hold_in - ?, hold_prod = hold_prod + ?, balance = balance + ? WHERE whouse = ? AND item = ?', 
				[ row.qty, Math.min(row.qty, data.hold_in), Math.min(row.qty, data.hold_in), row.qty - Math.min(row.qty, data.hold_in), row.whouse, row.item ]);
		var num = Math.min(row.qty, data.hold_in);
		var picks = alasql('SELECT * FROM pickp WHERE component = ? AND whouse = ? ', [ row.item, row.whouse ]);
		while (picks && picks.length > 0 && num > 0) {
			var pick = picks.shift(), new_num = Math.min(num, pick.hold);
			alasql('UPDATE pickp SET hold = hold + ?, balance = balance - ? WHERE id = ? ', [ new_num, new_num, pick.id ]);
			num -= new_num;
			var picks2 = alasql('SELECT * FROM pickp WHERE sales_no = ? AND item = ? ', [ pick.sales_no, pick.item ]);
			var min = -1;
			for (var i = 0; picks2 && i < picks2.length; i++) {
				var pick2 = picks2[i];
				if (i === 0) {
					min = pick2.hold;
				} else {
					min = Math.min(min, pick2.hold);
				}
			}
			alasql('UPDATE pickp SET qty = ? WHERE sales_no = ? AND item = ? ', [ min, pick.sales_no, pick.item ]);
		}
	}
	location.reload();
});

Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
});