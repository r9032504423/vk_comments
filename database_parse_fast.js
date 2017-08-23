var nosql = require("nosql")

var fs = require('fs');

var sorted;
const config = require('./config');
var db = nosql.load("./" + (-config.public_id).toString()  + '/comments');

function compare(a, b) {
  if (a.id < b.id) {
    return -1;
  }
  if (a.id > b.id) {
    return 1;
  } 
  // a должно быть равным b
  return 0;
}

function replaceAll(str, search, replace){
  return str.split(search).join(replace);
}

function _find(x) {
	let left = 0, right = sorted.length;

	while(right - left > 1) {
		let mid = Math.floor((left + right) / 2);
		if(x <= sorted[mid].id) {
			right = mid;
		}
		else {
			left = mid;
		}
	}

	return sorted[right];
}


console.log("started");
db.find().make(function(builder) {
    builder.callback(function(err, response) {
    	if(err) 
    	{
	       	console.log(err);
	       	return;
	    }
	    //console.log(response);
	    console.log("get " + response.length + " items");

	    sorted = response.sort(compare);
	    //console.log(sorted);

	    for(let i = 0; i < sorted.length; i++) {
	    	let item = sorted[i];

	    	if(!item.reply_to)
	    		continue;

	    	let reply_to = _find(item.reply_to);
	    	if(i % 10000 == 0) {
	    		console.log('\033[2A');
	    		console.log((i) + " out of " + sorted.length + ". It's about " + Math.floor(i / sorted.length * 100) + "%");
	    	}
	    	
	    	if(reply_to && item.reply_to == reply_to.id) {
	    		fs.appendFileSync("./" + (-config.public_id).toString()  + '/replies.csv', '"' + replaceAll(replaceAll(reply_to.text, '"', '“'), '\n', '\\n') + '", "' + replaceAll(replaceAll(item.text, '"', '“'), '\n', '\\n') + '" \n');
	    	}
	    }

		console.log('DONE');
	});
});