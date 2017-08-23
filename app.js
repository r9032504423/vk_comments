const VKApi = require('node-vkapi');
var nosql = require("nosql");
var fs = require('fs');

const config = require('./config');

//var rl = require('readline');
//var i = rl.createInterface(process.sdtin, process.stdout, null);


const VK = new VKApi({
  app: {
    id: 5793760,
    secret: 'mCkpTWB2x2uozp943wHb'
  },
  auth: {
    login: config.login,
    pass: config.password
  }
});

var vk_owner = config.public_id;
var posts_count = config.posts_count;
var posts_per_request = config.posts_per_request;
var request_timeout = config.request_timeout
var small_request_timeout = config.small_request_timeout
var comments_per_request = config.comments_per_request;

var total_comments = 0;

var dir = (-vk_owner).toString();
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

var db = nosql.load(dir + '/comments');

//var comments_reply = [];
//var comments = [];

function getRandomInt(min, max)
{
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCommentById(owner_id, id) {
  for (let i = 0; i < comments.length; i++) {
    if (comments[i].id == id /*&& comments[i].owner_id == owner_id*/)
      return comments[i];
  }
  return null;
}

VK.auth.user({
  scope: ['wall']
}).then(token => {
  console.log("authed");
  console.log("\n \n \n \n");
  var current_count = 0;
  
  (function getPostsLoop(i) {
    setTimeout(function() {

      VK.call('wall.get', {
        owner_id: vk_owner,
        count: posts_per_request,
        offset: Math.floor(current_count),
      }).then(res => {

        if(res.items.length == 0) {
          //console.log("length 0!");
          if (--j > 0) getCommentsLoop(j, item); //  decrement j and call getCommentsLoop again if j > 0
          return;
        }
        else
          current_count += res.items.length;


        for (var v = 0; v < res.items.length; v++) {

          var t_item = res.items[v];

          /*   //реклама, не реклама, один хуй комменты есть
          if (res.items[v].marked_as_ads)
            continue;
          */

          var comments_count_off = 0;
          (function getCommentsLoop(j, item) {
            if(item) {
            setTimeout(function() {
              //console.log(Math.ceil((item.comments.count / comments_per_request)) + ' ' + (j));
              
              console.log('\033[4A');
              console.log("Posts get: " + current_count);
              console.log("Total comments: " + total_comments);
              console.log(Math.floor(current_count / posts_count * 100) + '%');


              VK.call('wall.getComments', {
                owner_id: vk_owner,
                post_id: item.id,
                count: comments_per_request,
                offset: (Math.ceil((item.comments.count / comments_per_request)) - (j)) * comments_per_request, //TODO 
                sort: 'asc',
                preview_length: 0
              }).then(res => {
                
                if (res.items.length == 0) {
                  //console.log("no commments");
                  //console.log(res);
                 // console.log("\n \n \n \n");
                  return;
                }
                else {
                  comments_count_off += res.items.length;
                }

                total_comments += res.items.length;
                for (let k = res.items.length - 1; k >= 0; k--) {
                  let c_item = res.items[k];

                  db.insert({
                    public_id: vk_owner,
                    owner_id: c_item.from_id,
                    post_id: item.id,
                    id: c_item.id,
                    text: c_item.text,
                    reply_to: c_item.reply_to_comment
                  }).callback(function(err) {
                    if(err) {
                      console.log(err);
                      console.log("\n \n \n \n");
                    }
                  });
                }

                if (--j > 0) getCommentsLoop(j, item); //  decrement j and call getCommentsLoop again if j > 0
              }).catch(function(reason) {
                console.log(reason);
                console.log("\n \n \n \n");
                if (--j > 0) getCommentsLoop(j, item); //  decrement j and call getCommentsLoop again if j > 0
              });
            }, small_request_timeout)
          }
        }
          )(Math.ceil(res.items[v].comments.count / comments_per_request), res.items[v]); //  pass the number of iterations as an argument
        }

      //console.log(i);
      if (--i > 0) getPostsLoop(i); //  decrement i and call getPostsLoop again if i > 0  
      else console.log("WTF" + i);
      }).catch(function(reason) {
        console.log(reason);
        console.log(i);
        console.log("\n \n \n \n");
        if (--i > 0) getPostsLoop(i); //  decrement i and call getPostsLoop again if i > 0
        else
          console.log("FUCK YOU");
          console.log("\n \n \n \n");
      });
    }, request_timeout)
  })(Math.ceil(posts_count / posts_per_request));
});
