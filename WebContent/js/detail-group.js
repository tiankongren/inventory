'use strict';

var 
	color_red = '#DC143C',
	bool_item = false,
	bool_qty = true,
	item_num = 1,
	wh_num = 1,
	bool_add = true,
	bool_addwh = false,
	idSet = new Set(),
	map = new Map(),
	whSet = new Set(),
	whMap  = new Map();

//get id
var id = parseInt($.url().param('id'));

//read item data
var sql = 'SELECT * \
	FROM stock \
	LEFT JOIN whouse ON whouse.id = stock.whouse \
	LEFT JOIN item ON item.id = stock.item \
	LEFT JOIN kind ON kind.id = item.kind \
	WHERE stock.id = ?';
var row = alasql(sql, [ id ])[0];
//$('#image').attr('src', 'img/' + row.id + '.jpg');
//$('#whouse').text(row.name);
var row2s = alasql('SELECT * FROM kind WHERE type LIKE "Homemade";');
for (var i = 0; i < row2s.length; i++) {
	var row2 = row2s[i];
	var option = $('<option>');
	option.attr('value', row2.id);
	option.text(row2.text);
	$('#kind').append(option);
}
$('#kind').val(row.kind);
$('#code').val(row.code);
$('#name').val(row.detail);
var maker = row.maker.split('+');
var item_code = row.code;
var item_id = row.item;
var item_kind = row.kind;
while (maker.length > 0) {make()}
	
function make() {
	var component = maker.shift(), num = String(item_num), it = "item" + num, r = "remove" + num;
	if (component.indexOf('*') === -1) {
		var qty = parseInt(1), code = component;
	} else {
		var qty = parseInt(component.split('*')[1]), code = component.split('*')[0];
	}
	$('#insert').append('<div class="form-group"> \
			<div class="col-sm-offset-2 col-sm-5"> \
				<select class="form-control" id=' + it + ' disabled> \
				</select> \
			</div> \
			<div class="col-sm-offset-1 col-sm-2"> \
				<input type="number" class="form-control" name="qty" value="" min="0" disabled> \
			</div> \
			<div class="edit" hidden="true"> \
				<a href="#" id=' + r + '><i class="fa fa-trash-o fa-lg" style="color:#DC143C"></i></a> \
			</div> \
		</div>');
	var row3s = alasql('SELECT item.id, item.code, item.detail FROM item JOIN kind ON kind.id = item.kind WHERE kind.type LIKE "Imported";');
	for (var i = 0; i < row3s.length; i++) {
		var row3 = row3s[i];
		if (idSet.has(String(row3.id))) {
			continue;
		}
		var option = $('<option>');
		option.attr('value', row3.id);
		option.text('[' + row3.code + '] ' + row3.detail);
		$('#' + it).append(option);
		//console.log(row3.id, row3.code);
	}
	$('#' + it).change(function(event){
		console.log(num);
		checkItemName();
		updateCost();
		checkAdd();
		if (map.has(num)) {
			console.log('here');
			idSet.delete(map.get(num));
		}
		idSet.add(String($(this).val()));
		map.set(num, String($(this).val()));
		updateList();
	});
	$('#' + it).val(parseInt(code));
	$('#' + it).parent().next().find('input').val(qty);
	$('#' + r).on('click', function() {
		$(this).parent().parent().remove();
		checkItemName();
		checkItemQty();
		updateCost();
		checkAdd();
		if (map.has(num)) {
			idSet.delete(map.get(num));
		}
		map.delete(num);
		updateList();
	});
	$('input[name="qty"]').change(function(event){
		checkItemQty();
		updateCost();
	});
	if (map.has(num)) {
		idSet.delete(map.get(num));
	}
	idSet.add(String($('#'+it).val()));
	map.set(num, String($('#'+it).val()));
	updateList();
	item_num++;
}
$('#price').val(row.price);
$('#unit').val(row.unit);
updateCost();
var item_id = row.item;
var rows = alasql('SELECT * FROM it_his WHERE memo2 LIKE "Create" AND item2 = ?;', [ parseInt(item_id) ]);
$('#date').val(rows[0].date2);

var rows = alasql('SELECT * FROM stock WHERE item = ?;', [ parseInt(item_id) ]);
while (rows.length > 0) {makewh()}

function makewh() {
	var component = rows.shift(), num = String(wh_num), it = "wh" + num, r = "removewh" + num;
	var qty = parseInt(component.balance), code = component.whouse;
	$('#insert2').append('<div class="form-group"> \
			<div class="col-sm-offset-2 col-sm-3"> \
				<select class="form-control" id=' + it + ' disabled> \
				</select> \
			</div> \
			<div class="col-sm-offset-1 col-sm-2"> \
				<input type="number" class="form-control" name="qty" value="" min="0" disabled> \
			</div> \
			<div class="edit" hidden="true"> \
				<a href="#" id=' + r + '><i class="fa fa-trash-o fa-lg" style="color:#DC143C"></i></a> \
			</div> \
		</div>');
	var row3s = alasql('SELECT * FROM whouse;');
	for (var i = 0; i < row3s.length; i++) {
		var row3 = row3s[i];
		if (whSet.has(String(row3.id))) {
			continue;
		}
		var option = $('<option>');
		option.attr('value', row3.id);
		option.text(row3.name);
		$('#' + it).append(option);
	}
	if (code && code !== '') {
		$('#' + it).val(code);
	} else {
		var option = $('<option>');
		option.attr('value', '');
		option.text('Select your option');
		option.attr('disabled', true);
		$('#' + it).append(option);
		$('#' + it).val('');
	}
	$('#' + it).parent().next().find('input').val(qty);
	$('#' + r).on('click', function() {
		$(this).parent().parent().remove();
		checkWhAdd();
		if (whMap.has(num)) {
			whSet.delete(whMap.get(num));
		}
		whMap.delete(num);
		updateWhList();
	});
	
	$('#' + it).change(function(event){
		checkWhAdd();
		if (whMap.has(num)) {
			whSet.delete(whMap.get(num));
		}
		whSet.add(String($(this).val()));
		whMap.set(num, String($(this).val()));
		updateWhList();
		var rows = alasql('SELECT * FROM stock WHERE stock.item = ? AND stock.whouse = ?', [ parseInt(item_id), parseInt($(this).val()) ]);
		if (rows.length > 0) {
			var row = rows[0];
			$(this).parent().next().find('input[name="qty"]').val(row.balance);
			$(this).parent().next().find('input[name="qty"]').attr("disabled", "true");
		} else {
			$(this).parent().next().find('input[name="qty"]').val('0');
			$(this).parent().next().find('input[name="qty"]').removeAttr("disabled");
		}
	});
	checkWhAdd();
	if (whMap.has(num)) {
		whSet.delete(whMap.get(num));
	}
	whSet.add(String($('#' + it).val()));
	whMap.set(num, String($('#' + it).val()));
	updateWhList();
	
	wh_num++;
}


$('#kind').change(function(event) {
	var kind = parseInt($('#kind').val());
	if (kind === parseInt(item_kind)) {
		$('#code').val(item_code);
		return;
	}
	var rows = alasql('SELECT * FROM item WHERE kind = ?;', [ kind ]);
	var code = rows[0].code.substring(0,3) + ((rows.length + 1) < 10 ? '0' : '') + String(rows.length + 1);
	$('#code').val(code);
	$('#kind').parent().prev().css("color", "black");
})

$('#name').change(function(event) {
	var name = $('#name').val();
	if (name && name.trim() !== '') {
		$('#name').parent().prev().css("color", "black");
	} else {
		$('#name').parent().prev().css("color", color_red);
	}
})

function checkItemName() {
	var bool = false;
	$('#insert').find('select').each(function( i ) {
		if ( $(this).val() && $(this).val() !== '') {
			bool = true;
		}
	});
	bool_item = bool;
	if (bool === true) {
		$('#item').next().css("color", "black");
		if (bool_qty === true) {
			$('#item').css("color", "black");
		}
	} else {
		$('#item').next().css("color", color_red);
		$('#item').css("color", color_red);
	}
}

function checkItemQty(event) {
	var bool = false;
	$('#insert input[name="qty"]').each(function( i ) {
		if ( $(this).val() && parseInt($(this).val()) > 0) {
			bool = true;
		}
	});
	bool_qty = bool;
	if (bool === true) {
		$('#item').next().next().css("color", "black");
		if (bool_item === true) {
			$('#item').css("color", "black");
		}
	} else {
		$('#item').next().next().css("color", color_red);
		$('#item').css("color", color_red);
	}
}

//update database
$('#update').on('click', function() {
	var whouses = [], qtys_wh = [];

	$('#insert2').find('select').each(function(i) {
		whouses.push($(this).val());
		qtys_wh.push(parseInt($(this).parent().next().find('input').val()));
	});

	var items = [], qtys = [];
	$('#insert').find('select').each(function(i) {
		items.push($(this).val());
		qtys.push(parseInt($(this).parent().next().find('input').val()));
	});
	var date = $('#date').val();
	var code = $('#code').val();
	var kind = $('#kind').val();
	var name = $('#name').val();
	var maker = '';
	for (var i = 0; i < items.length; i++) {
		var item = items[i], qty = qtys[i];
		if (item && item !== '' && qty > 0) {
			maker += '+' + String(item) + (qty > 1 ? ('*' + String(qty)) : '');
		}
	}
	maker = maker.substring(1, maker.length);
	var price = parseInt($('#price').val());
	var price = parseInt($('#cost').val());
	var unit = $('#unit').val();
	
	alasql('DELETE FROM item WHERE id = ?', [ item_id ]);
	alasql('INSERT INTO item VALUES(?,?,?,?,?,?,?,?,?)', [ item_id, code, kind, name, maker, price, cost, unit, "Active" ]);
	
	/*var rows = alasql('SELECT FROM stock WHERE item = ?', [ item_id ]);
	if (rows.length === 0 || (rows.length === 1 && rows[0].whouse === '')) {
		
	} else {
		if (whouses.length === 0 || (whouses.length === 1 && whouses[0] === '')){
			alasql('DELETE FROM stock WHERE item = ?', [ item_id ]);
			var stock_id = alasql('SELECT MAX(id) + 1 as id FROM stock')[0].id;
			alasql('INSERT INTO stock VALUES(?,?,?,?)', [ stock_id, item_id, '' , 0 ]);;
		}
	}
	
	while (whouses.length > 0) {
		var whouse = whouses.shift(), qty_wh = qtys_wh.shift();
		var rows = alasql('SELECT * FROM stock WHERE item = ? AND whouse = ?', [ item_id, parseInt(whouse) ]);
		if (whouse && whouse !== '' && rows.length > 0) {
			var stock_id = alasql('SELECT MAX(id) + 1 as id FROM stock')[0].id;
			alasql('INSERT INTO stock VALUES(?,?,?,?)', [ stock_id, item_id, parseInt(whouse), qty_wh ]);
			var trans_id = alasql('SELECT MAX(id) + 1 as id FROM trans')[0].id;
			alasql('INSERT INTO trans VALUES(?,?,?,?,?,?,?)', [ trans_id, stock_id, date, qty_wh, qty_wh, "Initial Stock", localStorage.getItem('username') ]);
		}
	}*/
	
	alasql('DELETE FROM stock WHERE item = ?', [ item_id ]);
	if (whouses.length === 0 || (whouses.length === 1 && whouses[0] === '')){
		var stock_id = alasql('SELECT MAX(id) + 1 as id FROM stock')[0].id;
		alasql('INSERT INTO stock VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [ stock_id, item_id, '' , 0, 'Active', 0, 0, 0, 0, 0, 0, 0, '+', "+" ]);;
	}
	
	while (whouses.length > 0) {
		var whouse = whouses.shift(), qty_wh = qtys_wh.shift();
		if (whouse && whouse !== '') {
			var stock_id = alasql('SELECT MAX(id) + 1 as id FROM stock')[0].id;
			alasql('INSERT INTO stock VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [ stock_id, item_id, parseInt(whouse), qty_wh, "Active", 0, 0, 0, 0, 0, 0, 0, '+', "+" ]);
			//var trans_id = alasql('SELECT MAX(id) + 1 as id FROM trans')[0].id;
			//alasql('INSERT INTO trans VALUES(?,?,?,?,?,?,?)', [ trans_id, stock_id, date, qty_wh, qty_wh, "Initial Stock", localStorage.getItem('username') ]);
			for (var i = 0; i < items.length; i++) {
				if (typeof alasql('SELECT * FROM stock WHERE item = ? AND whouse = ?', [ parseInt(items[i]), parseInt(whouse) ]) === 'undefined') {
					var stock_id = alasql('SELECT MAX(id) + 1 as id FROM stock')[0].id;
					alasql('INSERT INTO stock VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [ stock_id, parseInt(items[i]), parseInt(whouse), 0, "Active", 0, 0, 0, 0, 0, 0, 0, '+', "+" ]);
				}
			}
		}
	}
	
	var ithis_id = alasql('SELECT MAX(id) + 1 as id FROM it_his')[0].id;
	alasql('INSERT INTO it_his VALUES(?,?,?,?,?)', [ ithis_id, item_id, date, "Modify", localStorage.getItem('username') ]);
	
	location.assign('groups.html');
	// update stock record
	/*var rows = alasql('SELECT id, balance FROM stock WHERE whouse = ? AND item = ?', [ whouse, item ]);
	var stock_id, balance = 0;
	if (rows.length > 0) {
		stock_id = rows[0].id;
		balance = rows[0].balance;
		alasql('UPDATE stock SET balance = ? WHERE id = ?', [ balance + qty, stock_id ]);
	} else {
		stock_id = alasql('SELECT MAX(id) + 1 as id FROM stock')[0].id;
		alasql('INSERT INTO stock VALUES(?,?,?,?)', [ stock_id, item, whouse, balance + qty ]);
	}
	// add trans record
	var trans_id = alasql('SELECT MAX(id) + 1 as id FROM trans')[0].id;
	alasql('INSERT INTO trans VALUES(?,?,?,?,?,?)', [ trans_id, stock_id, date, qty, balance + qty, memo ]);
	// reload page
	window.location.assign('stock.html?id=' + stock_id);*/
});

$(function() {
	/*$('#remove1').on('click', function() {
		$(this).parent().parent().remove();
		checkItemName();
		checkItemQty();
		updateCost();
		checkAdd();
		if (map.has('1')) {
			idSet.delete(map.get('1'));
		}
		map.delete('1');
		updateList();
	});
	
	var rows = alasql('SELECT * FROM item JOIN kind ON kind.id = item.kind WHERE kind.type LIKE "Imported";');
	for (var i = 0; i < rows.length; i++) {
		var row = rows[i];
		var option = $('<option>');
		option.attr('value', row.id);
		option.text('[' + row.code + '] ' + row.detail);
		$('#item1').append(option);
	}
	
	$('#item1').change(function(event){
		checkItemName();
		updateCost();
		checkAdd();
		if (map.has('1')) {
			idSet.delete(map.get('1'));
		}
		idSet.add(String($(this).val()));
		map.set('1', String($(this).val()));
		updateList();
	});
	$('input[name="qty"]').change(function(event){
		checkItemQty();
		updateCost();
	});*/
	
	/*var rows = alasql('SELECT * FROM whouse;');
	for (var i = 0; i < rows.length; i++) {
		var row = rows[i];
		var option = $('<option>');
		option.attr('value', row.id);
		option.text(row.name);
		$('#wh1').append(option);
	}
	
	$('#removewh1').on('click', function() {
		$(this).parent().parent().remove();
		checkWhAdd();
		if (whMap.has('1')) {
			whSet.delete(whMap.get('1'));
		}
		whMap.delete('1');
		updateWhList();
	});
	
	$('#wh1').change(function(event){
		checkWhAdd();
		if (whMap.has('1')) {
			whSet.delete(map.get('1'));
		}
		whSet.add(String($(this).val()));
		whMap.set('1', String($(this).val()));
		updateWhList();
	});*/
});

$('.addwh').on('click', function() {
	if (!bool_addwh) {
		return;
	}
	bool_addwh = false;
	$('.addwh').removeAttr("href");
	wh_num++;
	var it = "wh" + String(wh_num), r = "removewh" + String(wh_num), num = String(wh_num);
	$('#insert2').append('<div class="form-group"> \
					<div class="col-sm-offset-2 col-sm-3"> \
						<select class="form-control" id=' + it + '> \
						<option value="" disabled selected>Select your option</option></select> \
					</div> \
					<div class="col-sm-offset-1 col-sm-2"> \
						<input type="number" class="form-control" name="qty" value="0" min="0" disabled> \
					</div> \
					<div class=""> \
						<a href="#" id=' + r + '><i class="fa fa-trash-o fa-lg" style="color:#DC143C"></i></a> \
					</div> \
				</div>');
	
	var rows = alasql('SELECT * FROM whouse');
	for (var i = 0; i < rows.length; i++) {
		var row = rows[i];
		if (whSet.has(String(row.id))) {
			continue;
		}
		var option = $('<option>');
		option.attr('value', row.id);
		option.text(row.name);
		$('#' + it).append(option);
	}
	
	$('#' + r).on('click', function() {
		$(this).parent().parent().remove();
		checkWhAdd();
		if (whMap.has(num)) {
			whSet.delete(whMap.get(num));
		}
		whMap.delete(num);
		updateWhList();
	});
	
	$('#' + it).change(function(event){
		checkWhAdd();
		if (whMap.has(num)) {
			whSet.delete(whMap.get(num));
		}
		whSet.add(String($(this).val()));
		whMap.set(num, String($(this).val()));
		updateWhList();
		var rows = alasql('SELECT * FROM stock WHERE stock.item = ? AND stock.whouse = ?', [ parseInt(item_id), parseInt($(this).val()) ]);
		if (rows.length > 0) {
			var row = rows[0];
			$(this).parent().next().find('input[name="qty"]').val(row.balance);
			$(this).parent().next().find('input[name="qty"]').attr("disabled", "true");
		} else {
			$(this).parent().next().find('input[name="qty"]').val('0');
			$(this).parent().next().find('input[name="qty"]').removeAttr("disabled");
		}
	});
})

$('.add').on('click', function() {
	if (!bool_add) {
		return;
	}
	bool_add = false;
	$('.add').removeAttr("href");
	item_num++;
	var it = "item" + String(item_num), r = "remove" + String(item_num), num = String(item_num);
	$('#insert').append('<div class="form-group"> \
					<div class="col-sm-offset-2 col-sm-5"> \
						<select class="form-control" id=' + it + '> \
						<option value="" disabled selected>Select your option</option></select> \
					</div> \
					<div class="col-sm-offset-1 col-sm-2"> \
						<input type="number" class="form-control" name="qty" value="1" min="0"> \
					</div> \
					<div class=""> \
						<a href="#" id=' + r + '><i class="fa fa-trash-o fa-lg" style="color:#DC143C"></i></a> \
					</div> \
				</div>');
	
	var rows = alasql('SELECT * FROM item JOIN kind ON kind.id = item.kind WHERE kind.type LIKE "Imported";');
	for (var i = 0; i < rows.length; i++) {
		var row = rows[i];
		if (idSet.has(String(row.id))) {
			continue;
		}
		var option = $('<option>');
		option.attr('value', row.id);
		option.text('[' + row.code + '] ' + row.detail);
		$('#' + it).append(option);
	}
	
	$('#' + r).on('click', function() {
		$(this).parent().parent().remove();
		checkItemName();
		checkItemQty();
		updateCost();
		checkAdd();
		if (map.has(num)) {
			idSet.delete(map.get(num));
		}
		map.delete(num);
		updateList();
	});
	
	$('#' + it).change(function(event){
		checkItemName();
		updateCost();
		checkAdd();
		if (map.has(num)) {
			idSet.delete(map.get(num));
		}
		idSet.add(String($(this).val()));
		map.set(num, String($(this).val()));
		updateList();
	});
	$('input[name="qty"]').change(function(event){
		checkItemQty();
		updateCost();
	});
	
	checkItemName();
	checkItemQty();
})

function updateCost() {
	var cost = 0;
	$('#insert').find('select').each(function( i ) {
		var item = $(this).val();
		var qty = $(this).parent().next().find("input").val();
		if (item && item !== '' && qty > 0) {
			var rows = alasql('SELECT * FROM item WHERE id = ?', [ parseInt(item) ]);
			cost += parseInt(rows[0].cost) * parseInt(qty);
		}
	});
	$('#cost').val(cost);
	var price = parseInt($('#price').val());
	if (price > cost) {
		$('#price').parent().prev().css("color", "black");
	} else {
		$('#price').parent().prev().css("color", color_red);
	}
}

$('#price').change(function(event) {
	var cost = parseInt($('#cost').val());
	var price = parseInt($('#price').val());
	if (price > cost) {
		$('#price').parent().prev().css("color", "black");
	} else {
		$('#price').parent().prev().css("color", color_red);
	}
})

$('#unit').change(function(event) {
	var unit = $('#unit').val();
	if (unit && unit.trim() !== '') {
		$('#unit').parent().prev().css("color", "black");
	} else {
		$('#unit').parent().prev().css("color", color_red);
	}
})

function checkAdd() {
	var bool = true;
	$('#insert').find('select').each(function( i ) {
		var item = $(this).val();
		if (item && item !== '') {
		} else {
			bool = false;
		}
	});
	bool_add = bool;
	if (bool) {
		$('.add').attr("href", "#");
	} else {
		$('.add').removeAttr("href");
	}
}

function checkWhAdd() {
	var bool = true, cnt = 0;
	$('#insert2').find('select').each(function( i ) {
		var item = $(this).val();
		if (item && item !== '') {
			cnt++;
		} else {
			bool = false;
		}
	});
	var rows = alasql('SELECT * FROM whouse');
	if (String(cnt) === String(rows.length)) {
		bool = false;
	}
	bool_addwh = bool;
	if (bool) {
		$('.addwh').attr("href", "#");
	} else {
		$('.addwh').removeAttr("href");
	}
}

function updateList() {
	$('#insert').find('select').each(function( i ) {
		var value = $(this).val();
		$(this).empty();
		if (!value || String(value) === '') {
		var option = $('<option>');
		option.attr('value', '');
		option.text('Select your option');
		option.prop('disabled', true);
		option.prop('selected', true);
		$(this).append(option);
		}
		var rows = alasql('SELECT item.id, item.code, item.detail FROM item JOIN kind ON kind.id = item.kind WHERE kind.type LIKE "Imported";');
		for (var i = 0; i < rows.length; i++) {
			var row = rows[i];
			if (idSet.has(String(row.id)) && String(row.id) !== String(value)) {
				continue;
			}
			var option = $('<option>');
			option.attr('value', row.id);
			option.text('[' + row.code + '] ' + row.detail);
			if (String(value) === String(row.id)) {
				option.prop('selected', true);
			}
			$(this).append(option);
		}
	});
}

function updateWhList() {
	$('#insert2').find('select').each(function( i ) {
		var value = $(this).val();
		$(this).empty();
		if (!value || String(value) === '') {
		var option = $('<option>');
		option.attr('value', '');
		option.text('Select your option');
		option.prop('disabled', true);
		option.prop('selected', true);
		$(this).append(option);	
		}
		var rows = alasql('SELECT * FROM whouse');
		for (var i = 0; i < rows.length; i++) {
			var row = rows[i];
			if (whSet.has(String(row.id)) && String(row.id) !== String(value)) {
				continue;
			}
			var option = $('<option>');
			option.attr('value', row.id);
			option.text(row.name);
			if (String(value) === String(row.id)) {
				option.prop('selected', true);
			}
			$(this).append(option);
		}
	});
}

$('#check').change(function(event) {
	if($(this).prop('checked')) {
		$('.toggle, #link').removeAttr("hidden");
	} else {
		$('.toggle, #link').attr("hidden", "true");
	}
});

Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
});
/*$(function(){
	$('#date').val(new Date().toDateInputValue());
});*/ 

function edit() {
	$('#update, #cancel').css("display", "inline");
	$('.view').attr("hidden", "true").css("display", "none");
	$('.edit').removeAttr("hidden");
	$('form').find('input, select').removeAttr('disabled');
	$('#code, #cost, #date').attr('disabled', true);
	$('#insert2 input[name="qty"]').attr('disabled', true);
	checkAdd();
	checkWhAdd();
	$('label[for="date"]').text('Modified Date');
	$('#date').val(new Date().toDateInputValue());
}

function cancel() {
	location.assign('detail-group.html?id=' + id);
}

function remove() {
	alasql('UPDATE item SET state = "Inactive" WHERE id = ?', [ item_id ]);
	var ithis_id = alasql('SELECT MAX(id) + 1 as id FROM it_his')[0].id;
	alasql('INSERT INTO it_his VALUES(?,?,?,?,?)', [ ithis_id, item_id, new Date().toDateInputValue(), "Delete", localStorage.getItem('username') ]);
	alasql('UPDATE stock SET state = "Inactive" WHERE item = ?', [ item_id ]);
	var rows = alasql('SELECT * FROM stock WHERE item = ?', [ item_id ]);
	while (rows.length > 0) {
		var row = rows.shift();
		if (!row.whouse || row.whouse === '') break;
		var trans_id = alasql('SELECT MAX(id) + 1 as id FROM trans')[0].id;
		alasql('INSERT INTO trans VALUES(?,?,?,?,?,?,?)', [ trans_id, row.id, new Date().toDateInputValue(), 0, row.balance, "Delete", localStorage.getItem('username') ]);
	}
	location.assign("groups.html");
}