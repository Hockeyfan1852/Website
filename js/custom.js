$(document).ready(function(){
	$("#message-box").keyup(function(event){
	    if(event.keyCode == 13) {
	        sendMessage();
	    }
	});
});

var socket = io.connect('74.63.213.142:8000');
var my_items = 0;
var my_total = 0;
var potTotal = 0;
socket.on('connect', function() {
	console.log('Connected!');
	socket.emit('init', sessionid);
});

socket.on('users', function(users) {
	$('#online-number').html(users);
});
	
socket.on('message', function(messages) {
	console.log('got message' + JSON.stringify(messages) + ' : ' + messages.avatar);
	if (messages != null && messages.length > 0) {
		for (var i = messages.length - 1; i >= 0; i--) {
			var message = messages[i];
			var msg = "";
			var rank = message.rank == 4 ? "admin" : message.rank == 3 ? "support" : message.rank == 2 ? "moderator" : message.rank == 1 ? "streamer" : "";

			message.message = message.message.replace(/PJSalt/g, '<img src = "pjsalt.png" style = "width: 32px;" alt = "PJSalt"/>');
			message.message = message.message.replace(/RIP/g, '<img src = "rip.png" style = "width: 32px;" alt = "RIP"/>');
			message.message = message.message.replace(/SNIPED/g, '<img src = "snipe.png" style = "width: 32px;" alt = "SNIPED"/>');
			message.message = message.message.replace(/FAILSNIPE/g, '<img src = "failsnipe.png" style = "width: 32px;" alt = "FAILSNIPE"/>');
			
			if (message.rank == 1)
				msg = '<img src = "' + message.avatar + '" /> <a href="http://twitch.tv/' + message.twitch +'"><i class="fa fa-twitch"></i></a> <span class = "' + rank + '"><span id = "tip' + message.id + '">' + decodeEntities(message.personaname) + '</span></span>: ' + message.message;
			else
				msg = '<a href="http://steamcommunity.com/profiles/' +message.steamid+ '"><img src = "' + message.avatar + '" /></a> <span class = "' + rank + '"><span id = "tip' + message.id + '">' + decodeEntities(message.personaname) + '</span></span>: ' + message.message;
			
			
			var tip = $('<p id = "msg' + message.id + '">' + msg + '</p>');
			try {
			$('#message-container').append(tip);
			var chat = $('#message-container');
			var height = chat[0].scrollHeight;
			chat.scrollTop(height);
			if (message.admin) {
				console.log('admin');
				tip.tooltip({
			        show: null, // show immediately 
			        items: "span",
			        position: { my: "right top", at: "left bottom" },
			        content: decodeEntities(message.personaname) + '<br /><a onclick = "deleteMessage(\''+message.id+'\')">Delete Message</a><br /><a onclick = "muteUser(\''+message.steamid+'\')">Mute</a>', //from params
			        hide: { effect: "" }, //fadeOut
			        close: function(event, ui){
			            ui.tooltip.hover(
			                function () {
			                    $(this).stop(true).fadeTo(400, 1);
			                },
			                function () {
			                    $(this).fadeOut("400", function(){
			                        $(this).remove(); 
			                    });
			                }
			            );
			        }  
			    });

				tip.hover(function() {
     				tip.tooltip("enable");
    			}, function() {
     				tip.tooltip("disable");
    			});


			}
		}catch(err) {

		}
		}
	}
});

function getSorted(selector, attrName) {
    return $($(selector).toArray().sort(function(a, b){
        var aVal = parseInt(a.getAttribute(attrName)),
            bVal = parseInt(b.getAttribute(attrName));
        return aVal - bVal;
    }));
}

var decodeEntities = (function() {
  // this prevents any overhead from creating the object each time
  var element = document.createElement('div');

  function decodeHTMLEntities (str) {
    if(str && typeof str === 'string') {
      // strip script/html tags
      str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
      str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
      element.innerHTML = str;
      str = element.textContent;
      element.textContent = '';
    }

    return str;
  }

  return decodeHTMLEntities;
})();

socket.on('new_bet', function(bet) {
	var total = 0;
	var itemHtml = '';
	for (var i in bet.items) {
		total += bet.items[i].price;
		potTotal += bet.items[i].price;
		var item = bet.items[i];
		$('#items').prepend('<div style = "color: white; border-bottom: 1px solid gray"><img style = "width: 150px; margin-left:auto; margin-right:auto; display:block;" price = "' + item['price'] + '" title = "' + item['market_hash_name'] + ' : $' + item['price'] + '" src = "https://steamcommunity-a.akamaihd.net/economy/image/class/730/' + item['classid'] + '/128fx128f" alt = "" /><img style = "position: relative; left: 10px; top: -10px;" title = "' + decodeEntities(bet.personaname) + '" src = "' + bet.avatar + '" /><span style = "position: relative; bottom: 10px; padding-left: 15px;">' + item['market_hash_name'] + ' ($' + item['price'] + ')</span></div>');
		itemHtml += '<img price = "' + item['price'] + '" title = "' + item['market_hash_name'] + ' : $' + item['price'] + '" style = "width: 32px; float:left;" src = "https://steamcommunity-a.akamaihd.net/economy/image/class/730/' + item['classid'] + '/128fx128f" alt = "" />';
	}

	$('#round' + bet.id).prepend('<p style = "clear:both;"><img src="' + bet.avatar + '" alt=""> ' + decodeEntities(bet.personaname) + ' placed ' + (bet.items.length == 1 ? '1 skin ' : bet.items.length + ' skins ') + ' valued at $' + total.toFixed(2) + '.</p><p style = "float:left; margin-left: 32px; padding-bottom: 10px;">' + itemHtml + '</p>');
	getSorted('#itemimg', 'price');
	console.log(JSON.stringify(bet));
	progress(bet.percentage, bet.skins, bet.total_pot);
	setPercentage();
});

function setPercentage() {
	$('#my_items').html(my_items);
	$('#my_percent').html(my_total == 0 ? 0 : ((my_total / potTotal) * 100).toFixed(2));
}

socket.on('my_bet', function(items, total) {
	my_items = items;
	my_total = total;

	setPercentage();
	$('#create-modal').modal('hide');
});

socket.on('winner', function(winner) {
	$('#bet-panel').prepend('<div id="round' + winner.id + '" class="panel-body"></div><div class="panel-heading"><b></b></div><div class = "panel panel-default"><div style = "background-color: #3f464b; border-left: 3px solid #009BC9; text-align: center;" class="panel-heading"><b>NEW ROUND</b><br />Round hash: ' + winner.hash + '</div><div class="panel-heading"><b></b></div><div class = "panel-body red"><p>Winning ticket found at ' + winner.win_percent * 100 + '% with secret ' + winner.secret + '</p><span><img src = "' + winner.avatar + '" alt = "" /> ' + decodeEntities(winner.personaname) + ' has won this round valued at $' + winner.total.toFixed(2) + '!</span></div></div>');
	$('#items').html('');
	progress(0, 0, 0);
	potTotal = 0;
	my_total = 0;
	my_items = 0;
	setPercentage();
	$('#modal-message').html('');
});

socket.on('error', function(err) {
	console.log(err);
});

socket.on('delete_message', function (id) {
	$('#msg' + id).remove();
});

socket.on('delay', function(){
	var tip = $('<p id = "msg-tryagain"> Please try again in 4 seconds. </p>');
	$('#chat').append(tip);

	setTimeout(function(){
		$('#msg-tryagain').remove();
	}, 3000);
});

socket.on('trade_offer', function(message) {
	$('#create-modal').modal('show');
	$('#modal-message').html(message);
});

socket.on('win_offer', function(message) {
	$('#create-modal').modal('show');
	$('#modal-message').html($('#modal-message').html() + '<br />' + message);
});

function sendMessage() {
	if($('#message-box').val() != '' && $('#message-box').val() != null) {
		socket.emit('message', $('#message-box').val(), sessionid);
		$('#message-box').val('');
	}
}

function muteUser(user) {
	var timer = prompt("Enter mute time in minutes:", 5);
	console.log(timer);
	socket.emit('mute_user', user, timer, sessionid);
}

function deleteMessage(msg) {
	socket.emit('delete_message', msg, sessionid);
}

function progress(x, y, z) {
    $('.radial-progress').attr('data-progress', (Math.min(parseFloat(x), 100)).toFixed(0));
	$('.percentage').html(y);
	$('.money').html('$' + parseFloat(z).toFixed(2));
}

function resend(id) {
	socket.emit('resend', id, sessionid);
}

function cancelDeposit(id) {
	socket.emit('cancel_deposit', id, sessionid);
}

function cancelWinnings(id) {
	socket.emit('cancel_winnings', id, sessionid);
}
