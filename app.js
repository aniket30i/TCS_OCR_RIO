// Imports
const express=require("express");
const session = require('express-session');
const app=express();
const fs=require("fs");
const multer = require("multer");
const { TesseractWorker }=require("tesseract.js");
const worker = new TesseractWorker();
app.use('/static',express.static('static'))
const storage = multer.diskStorage({
    destination:(req,file,cb)=>
    {
        cb(null,"./uploads")
    },
    filename:(req,file,cb)=>{
        cb(null,file.originalname);
    }
});
const upload = multer({storage: storage}).single("avatar");
app.set("view engine", "ejs");
app.use(session({
    secret: '904950495405940954',
    resave: true,
    saveUninitialized: true
}))

//Routes
app.get('/',(req,res)=>{
    res.render('index');
});
app.post("/upload",(req,res)=>{
    upload(req,res,err=>{
        fs.readFile(`./uploads/${req.file.originalname}`,(err,data)=>{
            if(err) return console.log('this is your error',err);
            worker
            .recognize(data,"eng",{tessjs_create_pdf:'1'})
            .progress(function  (p) { console.log('progress', p)  })
            .catch(err => console.error(err))
            .then(function (result) {
            req.session.result_text =  result.text
            req.session.file_name = req.file.originalname
            res.redirect('/view_result')
            })
        });
    });
});


app.get('/view_result',(req,res)=>
{
    var result_text = req.session.result_text
    res.render('view_result', {results:result_text});
}
);

app.get('/download',(req,res)=>
{
    
    data = req.query.result_data
    file_name = req.session.file_name.replace(/[^a-zA-Z0-9]/g, '');
    new_file_name = file_name+'.txt'
    fs.writeFile(new_file_name, data,'utf8', (err) => {
        if (err)
          console.log(err);
        else {
            console.log("File written successfully\n");
            const file =`${__dirname}/`+new_file_name;
            req.session.destroy(function(error){
            console.log("Session Destroyed")
            })
            res.download(file);
        }
      });
    
});

//start the server
app.listen(process.env.PORT || 3000, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });



