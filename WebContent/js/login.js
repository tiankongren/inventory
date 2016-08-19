'use strict';

$(function() {
	var username = localStorage.getItem("useronthisPC");
	if (username && username !== '') {
		$('input[name="usr"]').val(username).parent().addClass("has-success");
		$('input[name="password"]').focus();
		$('input[name="remember"]').prop('checked', true);
	}
});

$('#signin-form').submit(function( event ) {
	$('#err-msg').remove();
	$('input[name="usr"], input[name="password"]').parent().removeClass("has-success has-error");
	try {
		var usr = alasql('SELECT * FROM user WHERE usr = ?', [ $('#username').val() ]);
		if (!$('#username').val()) {
			$('.panel-heading').append("<p style='color: red' id='err-msg'>Please enter your username.</p>");
			$('input[name="usr"]').focus().parent().addClass("has-error");
		} else if ($.isEmptyObject(usr)) {
			$('.panel-heading').append("<p style='color: red' id='err-msg'>Sorry, can't recognize that username.</p>");
			$('input[name="usr"]').focus().parent().addClass("has-error");
		} else if (usr[0].pwd === $('#password').val()) {
			localStorage.setItem('login', 'y');
			localStorage.setItem('username', $('#username').val());
			if ($('input[name="remember"]').is(":checked")) {
				localStorage.setItem("useronthisPC", $('#username').val());
			} else {
				localStorage.removeItem("useronthisPC");
			}
			location.assign('index.html?usr=' + $('#username').val());
		} else if (!$('#password').val()) {
			$('.panel-heading').append("<p style='color: red' id='err-msg'>Please enter your password.</p>");
			$('input[name="password"]').focus().parent().addClass("has-error");
			$('input[name="usr"]').parent().addClass("has-success");
		} else {
			$('.panel-heading').append("<p style='color: red' id='err-msg'>The username and password you entered don't match.</p>");
			$('input[name="password"]').focus().parent().addClass("has-error");
			$('input[name="usr"]').parent().addClass("has-success");
		}
	}
	catch(err) {
		console.log(err.message);
	}
	event.preventDefault();
});
