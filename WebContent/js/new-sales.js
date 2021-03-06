'use strict';

var 
	color_red = '#DC143C',
	bool_item = false,
	bool_qty = true,
	item_num = 1,
	wh_num = 1,
	bool_add = false,
	bool_addwh = false,
	idSet = new Set(),
	map = new Map(),
	whSet = new Set(),
	whMap  = new Map(),
	types = ["Standard", "Customized", "Upgrade"];

var sales_num = alasql('SELECT MAX(number) + 1 as number FROM sales')[0].number;
var number = "SO-0000" + String(sales_num);
$('#number').val(number);

$('#customer').change(function(event) {
	var customer = $('#customer').val();
	if (customer && customer.trim() !== '') {
		$('#customer').parent().prev().css("color", "black");
	} else {
		$('#customer').parent().prev().css("color", color_red);
	}
})

var rows = alasql('SELECT * FROM whouse');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option = $('<option>');
	option.attr('value', row.id);
	option.text(row.name);
	$('#warehouse').append(option);
}

var user = localStorage.getItem("username");
$('#salesman').val(user);

$('#warehouse').change(function(event) {
	$('label[for="warehouse"]').css('color', 'black');
	$('.newinsert').remove();
	$('#item1').empty();
	var option = $('<option>');
	option.attr('value', '');
	option.text('Select your option');
	option.prop('disabled', true);
	option.prop('selected', true);
	$('#item1').append(option);
	$('#item1').parent().next().find('input').val(0).attr("disabled", true);
	
	$('#item1').removeAttr("disabled");
	
	map.clear(); idSet.clear();
	
	var rows = alasql('SELECT * FROM stock LEFT JOIN item ON stock.item = item.id \
			LEFT JOIN kind ON item.kind = kind.id \
			WHERE kind.type LIKE "Homemade" AND stock.whouse = ? AND stock.state LIKE "Active";', [ parseInt($('#warehouse').val()) ]);
	for (var i = 0; rows && i < rows.length; i++) {
		var row = rows[i];
		var option = $('<option>');
		option.attr('value', row.item);
		option.text('[' + row.code + '] ' + row.detail);
		$('#item1').append(option);
	}
	
	$('input[name="qty"]').change(function(event){
		checkItemQty();
		updateCost();
	});
	
	checkItemName();
	checkItemQty();
});

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
		$(this).parent().next().find('input').removeAttr("disabled");
});

function checkItemName() {
	var bool = false;
	$('#insert, #insert2, #insert3').find('select').each(function( i ) {
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
	$('#insert input[name="qty"], #insert2 input[name="qty"], #insert3 input[name="qty"]').each(function( i ) {
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

// update database
$('#update').on('click', function() {
	var customer = $('#customer').val(), number = sales_num, wh = parseInt($('#warehouse').val());
	var del_date = $('#del_date').val(), date = $('#date').val(), price = $('#price').val();
	var cost = $('#cost').val(), items = [], qtys = [], detail = '';

	$('#insert').find('.item').each(function(i) {
		var item = $(this).val();
		var qty = $(this).parent().next().find('input[name="qty"]').val();
		var sales_id = alasql('SELECT MAX(id) + 1 as id FROM sales')[0].id;
		alasql('INSERT INTO sales VALUES(?,?,?,?,?,?,?,?,?,?,?)', [ sales_id, date, number, "STANDARD", customer, "CONFIRMED", wh, price, item, qty, user ]);
		items.push(item), qtys.push(qty);
		//detail += "+" + String(item) + "*" + String(qty);
	});
	//detail = detail.substring(1, detail.length);
	
	while (items && items.length > 0) {
		var item = parseInt(items.shift()), qty = parseInt(qtys.shift());
		var stocks = alasql('SELECT * FROM stock WHERE stock.whouse = ? AND stock.item = ?', [ wh, item ]);
		var stock = stocks[0];
		alasql('UPDATE stock SET stock.memo_sales = ? WHERE whouse = ? AND item = ?', [ stock.memo_sales + String(number) + '+', wh, item ]);
		if (stock.balance >= qty) {
			alasql('UPDATE stock SET balance = ?, hold_ship = ? WHERE whouse = ? AND item = ?', [ stock.balance - qty, stock.hold_ship + qty, wh, item ]);
			alasql('UPDATE sales SET status = ? WHERE number = ? AND item = ? ', [ 'READY', number, item ]);
		} else {
			var balance = qty - stock.balance;
			alasql('UPDATE stock SET balance = ?, hold_ship = ? WHERE whouse = ? AND item = ?', [ 0, stock.hold_ship + stock.balance, wh, item ]);
			if (stock.hold_prod < stock.prod) {
				var change = Math.min(balance, stock.prod - stock.hold_prod);
				balance -= change;
				alasql('UPDATE stock SET hold_prod = ? WHERE whouse = ? AND item = ?', [ stock.hold_prod + change, wh, item ]);
				if (balance === 0) {
					alasql('UPDATE sales SET status = ? WHERE number = ? AND item = ? ', [ 'IN PRODUCTION', number, item ]);
					continue;
				}
			}
			if (stock.hold_in < stock.incoming) {
				var change = Math.min(balance, stock.incoming - stock.hold_in);
				balance -= change;
				alasql('UPDATE stock SET hold_in = ? WHERE whouse = ? AND item = ?', [ stock.hold_in + change, stock.hold_prod + change, wh, item ]);
				if (balance === 0) {
					continue;
				}
			}
			alasql('UPDATE stock SET stock.needed = ? WHERE whouse = ? AND item = ?', [ stock.needed + balance, wh, item ]);
			var maker = alasql('SELECT * FROM item WHERE id = ?', [ item ])[0].maker.split('+');
			var min = -1;
			for (var j = 0; maker && j < maker.length; j++) {
				var component = maker[j];
				if (component.indexOf('*') === -1) {
					var qty_item = parseInt(1), code = component;
				} else {
					var qty_item = parseInt(component.split('*')[1]), code = component.split('*')[0];
				}
				var num = updateStock(parseInt(code), balance * qty_item, wh, item, number);
				if (min === -1) {
					min = num;
				} else {
					min = Math.min(min, num);
				}
			}
			alasql('UPDATE pickp SET qty = ? WHERE sales_no = ? AND item = ? ', [ min, number, item ]);
			/*var rows = alasql('SELECT * FROM pickp WHERE sales_no = ? AND item = ? ', [ number, item ]);
			for (var i = 0; i < rows.length; i++) {
				var row = rows[i];
				console.log(row.component, row.qty, row.hold, row.balance);
			}*/
		}
	}
	checkStatus(number);
	location.assign('sales.html');
});

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


function updateStock(itemNum, qty, wh, item, number) {
	var stocks = alasql('SELECT * FROM stock WHERE stock.whouse = ? AND stock.item = ?', [ parseInt(wh), parseInt(itemNum) ]);
	var stock = stocks[0], pickp_id = alasql('SELECT MAX(id) + 1 as id FROM pickp')[0].id;
	//alasql('UPDATE stock SET stock.memo_sales = ? WHERE whouse = ? AND item = ?', [ stock.memo_sales + String(number) + '+', wh, itemNum ]);
	if (stock.balance >= qty) {
		alasql('UPDATE stock SET balance = ?, hold_prod = ? WHERE whouse = ? AND item = ?', [ stock.balance - qty, stock.hold_prod + qty, wh, itemNum ]);
		alasql('INSERT INTO pickp VALUES(?,?,?,?,?,?,?,?,?)', [ pickp_id, "PRODUCTION", number, wh, item, itemNum, 0, qty, 0]);
		return qty;
	} else {
		var balance = qty - stock.balance;
		alasql('UPDATE stock SET balance = ?, hold_prod = ? WHERE whouse = ? AND item = ?', [ 0, stock.hold_prod + stock.balance, wh, itemNum ]);
		if (stock.hold_in < stock.incoming) {
			var change = Math.min(balance, stock.incoming - stock.hold_in);
			balance -= change;
			alasql('UPDATE stock SET hold_in = ? WHERE whouse = ? AND item = ?', [ stock.hold_in + change, stock.hold_prod + change, wh, itemNum ]);
			if (balance === 0) {
				return;
			}
		}
		alasql('UPDATE stock SET stock.needed = ? WHERE whouse = ? AND item = ?', [ stock.needed + balance, wh, itemNum ]);
		alasql('INSERT INTO pickp VALUES(?,?,?,?,?,?,?,?,?)', [ pickp_id, "PRODUCTION", number, wh, item, itemNum, 0, stock.balance, qty - stock.balance]);
		return stock.balance;
	}
} 

$(function() {
	$('#remove1').on('click', function() {
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
						<input type="number" class="form-control" name="qty" value="0" min="0"> \
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
	});
	updateWhList();
})

$('.add').on('click', function() {
	if (!bool_add) {
		return;
	}
	bool_add = false;
	$('.add').removeAttr("href");
	item_num++;
	var it = "item" + String(item_num), r = "remove" + String(item_num), num = String(item_num);
	$('#insert').append('<div class="form-group newinsert"> \
					<div class="col-sm-offset-1 col-sm-2"> \
						<select class="form-control" disabled> \
						<option value="" selected>Standard</option></select></div> \
					<div class="col-sm-4"> \
						<select class="form-control item" id=' + it + '> \
						<option value="" disabled selected>Select your option</option></select> \
					</div> \
					<div class="col-sm-2"> \
						<input type="number" class="form-control" name="qty" value="0" min="0" disabled style="text-align: right;"> \
					</div> \
					<div class=""> \
						<a href="#" id=' + r + '><i class="fa fa-trash-o fa-lg" style="color:#DC143C"></i></a> \
					</div> \
				</div>');
	var rows = alasql('SELECT * FROM stock LEFT JOIN item ON stock.item = item.id \
			LEFT JOIN kind ON item.kind = kind.id \
			WHERE kind.type LIKE "Homemade" AND stock.whouse = ? AND stock.state LIKE "Active";', [ parseInt($('#warehouse').val()) ]);
	for (var i = 0; i < rows.length; i++) {
		var row = rows[i];
		if (idSet.has(String(row.id))) {
			continue;
		}
		var option = $('<option>');
		option.attr('value', row.item);
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
		
		$(this).parent().next().find('input').removeAttr("disabled");
	});
	$('input[name="qty"]').change(function(event){
		checkItemQty();
		updateCost();
	});
	updateList();
	checkItemName();
	checkItemQty();
})

function updateCost() {
	var cost = 0;
	$('#insert').find('.item').each(function( i ) {
		var item = $(this).val();
		var qty = $(this).parent().next().find("input").val();
		if (item && item !== '' && qty > 0) {
			var rows = alasql('SELECT * FROM item WHERE id = ?', [ parseInt(item) ]);
			cost += parseInt(rows[0].cost) * parseInt(qty);
		}
	});
	$('#cost').val(cost);
	var cost = 0;
	$('#insert').find('.item').each(function( i ) {
		var item = $(this).val();
		var qty = $(this).parent().next().find("input").val();
		if (item && item !== '' && qty > 0) {
			var rows = alasql('SELECT * FROM item WHERE id = ?', [ parseInt(item) ]);
			cost += parseInt(rows[0].price) * parseInt(qty);
		}
	});
	$('#price2').val(cost);
	var price = parseInt($('#price').val());
	if (price > $('#cost').val()) {
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
	var bool = true, cnt = 0;
	$('#insert').find('.item').each(function( i ) {
		var item = $(this).val();
		if (item && item !== '') {
			cnt++;
		} else {
			bool = false;
		}
	});
	var rows = alasql('SELECT * FROM stock LEFT JOIN item ON stock.item = item.id \
			LEFT JOIN kind ON item.kind = kind.id \
			WHERE kind.type LIKE "Homemade" AND stock.whouse = ? AND stock.state LIKE "Active";', [ parseInt($('#warehouse').val()) ]);
	if (String(cnt) === String(rows.length)) {
		bool = false;
	}
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
	//console.log("function");
	$('#insert').find('.item').each(function( i ) {
		var value = $(this).val();
		//console.log(value);	
		$(this).empty();
		var option = $('<option>');
		option.attr('value', '');
		option.text('Select your option');
		option.prop('disabled', true);
		if (!value || String(value) === '') {
			option.prop('selected', true);
		}
		$(this).append(option);
		var rows = alasql('SELECT * FROM stock LEFT JOIN item ON stock.item = item.id \
				LEFT JOIN kind ON item.kind = kind.id \
				WHERE kind.type LIKE "Homemade" AND stock.whouse = ? AND stock.state LIKE "Active";', [ parseInt($('#warehouse').val()) ]);
		for (var i = 0; i < rows.length; i++) {
			var row = rows[i];
			//console.log(row);
			if (idSet.has(String(row.item)) && String(row.item) !== String(value)) {
				continue;
			}
			var option = $('<option>');
			option.attr('value', row.item);
			option.text('[' + row.code + '] ' + row.detail);
			if (String(value) === String(row.item)) {
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
		var option = $('<option>');
		option.attr('value', '');
		option.text('Select your option');
		option.prop('disabled', true);
		if (!value || String(value) === '') {
			option.prop('selected', true);
		}
		$(this).append(option);
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
$(function(){
	$('#date').val(new Date().toDateInputValue());
});
