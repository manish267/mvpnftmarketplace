const express=require('express');
const app =express();
const multer = require('multer');
const path=require('path');
const fs=require('fs');
const axios = require('axios');
const cors=require("cors");

app.use(cors());

app.get("/",(req,res)=>{
    res.json("server running")
})


require('dotenv').config();

const AWS= require('aws-sdk');

app.use(express.json());
app.use(express.urlencoded({extended:true}))

const s3 = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET,
  })

  const uploadParams = {
    Bucket: 'beryl-nft-marketplace', 
    Key: '', // pass key
    Body: null, // pass file body
};


let storage=multer.diskStorage({
    destination:(req,file,cb)=>cb(null,'uploads/'),
    filename:(req,file,cb)=>{
        const uniqueName=`${Date.now()}- ${Math.round(Math.random()*1E9)}${path.extname(file.originalname)}`
        cb(null,uniqueName);
    }
})

let upload =multer({storage,limits:{fileSize:2048*1024*1024}})

app.post('/uploadimage',upload.single('file'),(req,res) => {
    // console.log(req.body);
    console.log(req.file)

    // return;
    const params = uploadParams;

    // console.log(req.file);

    const imagePath = req.file.path
    const blob = fs.readFileSync(`${imagePath}`)
    // console.log("blob",blob);
    
    // const blob = fs.readFileSync(`/uploads/${imagePath}`)

    // console.log(req.body);

    // return '';

    uploadParams.Key = req.file.originalname;
    uploadParams.Body = blob;

    s3.upload(params, (err, data) => {
        if (err) {
            fs.unlinkSync(imagePath);
            res.status(500).json({error:"Error -> " + err});
        }else{
            fs.unlinkSync(imagePath);
            res.json({message: 'File uploaded successfully','filename': 
            req.file, 'location': data});
        }
    })
})

app.post("/uploadjson",async (req,res)=>{
    // console.log(req.body)
    const params = uploadParams;
    uploadParams.Key = `${req.body.key}`;
    uploadParams.Body = JSON.stringify(req.body);

    s3.upload(params, (err, data) => {
        if (err) {
            res.status(500).json({error:"Error -> " + err});
        }else{

            res.status(200).json({message: 'File uploaded successfully',data:data});
        }
    })
})

const fetchData=async ()=>{
    const res=await axios.get(`https://beryl-nft-marketplace.s3.amazonaws.com/1`);
    // console.log(res.data);

    // let data=await res.json();
    // console.log(data);
}

// fetchData();


app.listen(5002,()=>{
    console.log("server started")
})



