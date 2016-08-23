var DB = {};

DB.init = function() {
	if (window.confirm('are you sure to initialize database?')) {
		DB.load();
	}
};

DB.load = function() {
	alasql.options.joinstar = 'overwrite';
	
	// Classes
	alasql('DROP TABLE IF EXISTS kind;');
	alasql('CREATE TABLE kind(id INT IDENTITY, text STRING, type STRING);');
	var pkind = alasql.promise('SELECT MATRIX * FROM CSV("data/KIND-KIND.csv", {headers: true})').then(function(kinds) {
		for (var i = 0; i < kinds.length; i++) {
			var kind = kinds[i];
			alasql('INSERT INTO kind VALUES(?,?,?);', kind);
		}
	});
	
	// Items
	alasql('DROP TABLE IF EXISTS item;');
	alasql('CREATE TABLE item(id INT IDENTITY, code STRING, kind INT, detail STRING, maker STRING, price INT, cost INT, unit STRING, state STRING);');
	var pitem = alasql.promise('SELECT MATRIX * FROM CSV("data/ITEM-ITEM.csv", {headers: true})').then(function(items) {
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			alasql('INSERT INTO item VALUES(?,?,?,?,?,?,?,?,?);', item);
		}
	});
	
	// Warehouses
	alasql('DROP TABLE IF EXISTS whouse;');
	alasql('CREATE TABLE whouse(id INT IDENTITY, name STRING, addr STRING, tel STRING);');
	var pwhouse = alasql.promise('SELECT MATRIX * FROM CSV("data/WHOUSE-WHOUSE.csv", {headers: true})').then(
			function(whouses) {
				for (var i = 0; i < whouses.length; i++) {
					var whouse = whouses[i];
					alasql('INSERT INTO whouse VALUES(?,?,?,?);', whouse);
				}
			});
	
	// Inventories
	alasql('DROP TABLE IF EXISTS stock;');
	alasql('CREATE TABLE stock(id INT IDENTITY, item INT, whouse INT, balance INT, state STRING, hold_ship INT, incoming INT, hold_in INT, prod INT, hold_prod INT, hold_forprod INT, needed INT, memo_sales STRING, memo_pur STRING);');
	var pstock = alasql.promise('SELECT MATRIX * FROM CSV("data/STOCK-STOCK.csv", {headers: true})').then(
			function(stocks) {
				for (var i = 0; i < stocks.length; i++) {
					var stock = stocks[i];
					alasql('INSERT INTO stock VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?);', stock);
				}
			});

	// Transaction
	alasql('DROP TABLE IF EXISTS trans;');
	alasql('CREATE TABLE trans(id INT IDENTITY, stock INT, date DATE, qty INT, balance INT, memo STRING, user STRING);');
	var ptrans = alasql.promise('SELECT MATRIX * FROM CSV("data/TRANS-TRANS.csv", {headers: true})').then(
			function(transs) {
				for (var i = 0; i < transs.length; i++) {
					var trans = transs[i];
					alasql('INSERT INTO trans VALUES(?,?,?,?,?,?,?);', trans);
				}
			});
	
	// Users
	alasql('DROP TABLE IF EXISTS user;');
	alasql('CREATE TABLE user(id INT IDENTITY, emp INT, usr STRING, pwd STRING, grp STRING);');
	var puser = alasql.promise('SELECT MATRIX * FROM CSV("data/USER-USER.csv", {headers: true})').then(
		function(users) {
			for (var i = 0; i < users.length; i++) {
				var user = users[i];
				alasql('INSERT INTO user VALUES(?,?,?,?,?);', user);
			}
		});
	
	alasql('DROP TABLE IF EXISTS it_his;');
	alasql('CREATE TABLE it_his(id INT IDENTITY, item2 INT, date2 DATE, memo2 STRING, user2 STRING);');
	var pit_his = alasql.promise('SELECT MATRIX * FROM CSV("data/ITEM-HISTORY.csv", {headers: true})').then(
			function(it_hiss) {
				for (var i = 0; i < it_hiss.length; i++) {
					var it_his = it_hiss[i];
					alasql('INSERT INTO it_his VALUES(?,?,?,?,?);', it_his);
				}
			});
	
	alasql('DROP TABLE IF EXISTS sales;');
	alasql('CREATE TABLE sales(id INT IDENTITY, date DATE, number INT, type STRING, customer STRING, status STRING, whouse INT, amount INT, item INT, qty INT, user STRING);');
	var psales = alasql.promise('SELECT MATRIX * FROM CSV("data/SALES-SALES.csv", {headers: true})').then(
			function(saless) {
				for (var i = 0; i < saless.length; i++) {
					var sales = saless[i];
					alasql('INSERT INTO sales VALUES(?,?,?,?,?,?,?,?,?,?,?);', sales);
				}
			});
	
	alasql('DROP TABLE IF EXISTS pur;');
	alasql('CREATE TABLE pur(id INT IDENTITY, date DATE, number INT, maker STRING, status STRING, whouse INT, amount INT, item INT, qty INT, price INT, user STRING, receive DATE);');
	var ppur = alasql.promise('SELECT MATRIX * FROM CSV("data/PUR-PUR.csv", {headers: true})').then(
			function(purs) {
				for (var i = 0; i < purs.length; i++) {
					var pur = purs[i];
					alasql('INSERT INTO pur VALUES(?,?,?,?,?,?,?,?,?,?,?,?);', pur);
				}
			});
	
	alasql('DROP TABLE IF EXISTS pick;');
	alasql('CREATE TABLE pick(id INT IDENTITY, type STRING, sales_no INT, whouse INT, item INT, qty INT);');
	var ppick = alasql.promise('SELECT MATRIX * FROM CSV("data/PICK-PEND.csv", {headers: true})').then(
			function(picks) {
				for (var i = 0; i < picks.length; i++) {
					var pick = picks[i];
					alasql('INSERT INTO pick VALUES(?,?,?,?,?,?);', pick);
				}
			});
	
	alasql('DROP TABLE IF EXISTS pickp;');
	alasql('CREATE TABLE pickp(id INT IDENTITY, type STRING, sales_no INT, whouse INT, item INT, component INT, qty INT, hold INT, balance INT);');
	var ppickp = alasql.promise('SELECT MATRIX * FROM CSV("data/PICK-PROD.csv", {headers: true})').then(
			function(pickps) {
				for (var i = 0; i < pickps.length; i++) {
					var pickp = pickps[i];
					alasql('INSERT INTO pickp VALUES(?,?,?,?,?,?,?,?,?);', pickp);
				}
			});
	
	// Reload page
	Promise.all([ pkind, pitem, pwhouse, pstock, ptrans, puser, pit_his, psales, ppur, ppick, ppickp ]).then(function() {
		window.location.reload(true);
	});
};

DB.remove = function() {
	if (window.confirm('are you sure to delete dababase?')) {
		alasql('DROP localStorage DATABASE STK')
	}
};

// add commas to number
function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// DO NOT CHANGE!
alasql.promise = function(sql, params) {
	return new Promise(function(resolve, reject) {
		alasql(sql, params, function(data, err) {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});
};

// connect to database
try {
	alasql('ATTACH localStorage DATABASE STK;');
	alasql('USE STK;');
} catch (e) {
	alasql('CREATE localStorage DATABASE STK;');
	alasql('ATTACH localStorage DATABASE STK;');
	alasql('USE STK;');
	DB.load();
}
