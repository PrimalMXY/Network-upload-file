var http = require('http');
var express = require('express');
var app = express();
var session= require('express-session')

var fs = require('fs');
var Datastore =require("nedb")
var db =new Datastore({filename:"data.db", autoload:true});
var nedbstore = require('nedb-session-store')(session)
var multer = require('multer')
var upload =multer({dest:'public/uploads/'})
var dbuser = new Datastore({filename:'users.db',autoload:true})
var bcrypt = require('bcrypt-nodejs')
const uuidV1 = require('uuid/v1');



app.use(express.static('public'));
app.set('view engine', 'ejs');


var bodyParser=require("body-parser")
var urlencodedParser=bodyParser.urlencoded({extended:true})
app.use(urlencodedParser)



//Loginserver cookie
app.use(
	session(
		{
			secret: 'secret',
			cookie: {
				 maxAge: 365 * 24 * 60 * 60 * 1000   // e.g. 1 year
				},
			store: new nedbstore({
			filename: 'sessions.db'
			})
		}
	)
);

//

function generateHash(password) {
	return bcrypt.hashSync(password);
}

function compareHash(password, hash) {
    return bcrypt.compareSync(password, hash);
}





//main page
app.get("/",function(req,res){
  console.log(req.session.username);

  if (!req.session.username) {
    res.render('login.ejs', {});
  } else {







  res.redirect("display.ejs",req.session)}
})


app.get('/registration', function(req, res) {
	res.render('registration.ejs', {});
});

app.post('/register', function(req, res) {
	var passwordHash = generateHash(req.body.password);
	var registration = {
		"username": req.body.username,
		"password": passwordHash
	};

	dbuser.insert(registration);
	console.log("inserted " + registration);
	res.send("Registered <a href=\"/\">Sign In</a>" );

});
app.get('/logout', function(req, res) {
	delete req.session.username;
	res.redirect('/');
});




//post from loginpage
app.post('/login', function(req, res) {

	// Check username and password in database
	dbuser.findOne({"username": req.body.username},
		function(err, doc) {
			if (doc != null) {

				// Found user, check password
				if (compareHash(req.body.password, doc.password)) {
					// Set the session variable
					req.session.username = doc.username;

					// Put some other data in there
					req.session.lastlogin = Date.now();

					res.redirect('/');

				} else {

					res.send("Invalid <a href=\"/\">Try again</a>");

				}
			}
		}
	);


});





var alldatas=[];

app.post("/submit", upload.single('thefile'), function(req,res){

  console.log(req.file);
  console.log("uploaded: " + req.file);
//  res.send('uploaded:'+req.file)

if (req.file.mimetype != "image/jpeg") {
     fs.unlinkSync(req.file.path);
     console.log('deleting file');
   } else {
     fs.renameSync(req.file.path, req.file.path + ".jpg");
   }




   /* { fieldname: 'thefile',
           originalname: 'bikes.jpg',
           encoding: '7bit',
           mimetype: 'image/jpeg',
           destination: 'public/uploads/',
           filename: 'dce214488dfd49fdf412ecda306dae2d',
           path: 'public/uploads/dce214488dfd49fdf412ecda306dae2d',
           size: 28055 }
       */



  var data={
    authorname:req.body.authorname,
    posttype:req.body.posttype,
    title:req.body.title,
    content:req.body.content,
    timestamp: Date.now(),
    file:req.file.filename+'.jpg'
  };
  // console.log(data.authorname)
  // console.log(data.posttype)
  // console.log(data.title)
  // console.log(data.content)

  db.insert(data,function(err,newDocs){
    console.log("err:"+err)
    console.log("newDocs:"+newDocs)
  })
  res.redirect("/display")
});






app.get("/individual", function(req,res){
  var id = req.query.id;
  console.log('test', id)
  db.find({_id: id}, function(err, docs) {
    console.log(docs);

    // Should go to an EJS
  //  res.send(docs);

    var datatopass = {data:docs};

    res.render("individual.ejs",datatopass
    );
  });

})



app.get('/display', function(req, res) {

  var sort = req.query.sort;
  if (sort == "") {
    sort = "timestamp";
  }

  if (sort == "timestamp") {
    sort = {timestamp: 1};
  } else if (sort == "authorname") {
    sort = {authorname: 1};
  } else if (sort == "posttype"){
    sort = {posttype: 1};
  }

  db.find({}).sort(sort).exec(function (err, docs) {
    //db.find({}).sort({ timestamp: 1 }).exec(function (err, docs) {
    //db.find({}, function(err, docs) {
      console.log(docs);
      //res.send(docs);

      for (var i = 0; i < docs.length; i++) {
        //docs[i].timestamp
        var humanDate = new Date(docs[i].timestamp);
        docs[i].timestamp = humanDate.toString();
      }


      var datatopass = {data:docs};
      res.render("display.ejs",datatopass);
    });
});

app.get('/data',function(req,res){

    db.find({}).sort({ timestamp: 1 }).exec(function (err, docs) {
    //db.find({}, function(err, docs) {
      console.log(docs);
      res.send({thedata:docs});

    //  for (var i = 0; i < docs.length; i++) {
        //docs[i].timestamp
      //  var humanDate = new Date(docs[i].timestamp);
        //docs[i].timestamp = humanDate.toString();
      //}


    //  var datatopass = {data:docs};
      //res.render("display.ejs",datatopass);
    //});
});

});






app.listen(80, function () {
  console.log('Example app listening on port 80@@@@@@@!')
});







//document.querySelector('.img__btn').addEventListener('click', function() {
// document.querySelector('.content').classList.toggle('s--signup')
//})
