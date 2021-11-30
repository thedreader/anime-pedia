const express= require("express")
const https= require("https")

const app= express()

app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))

app.set('view engine', 'ejs')

let routeName= ""
let topAnimeRes= []
let sch= []
let upcoming= []

app.get('/', function (req,res){
    routeName = req.route.path

    const topUrl="https://api.jikan.moe/v3/top/anime/1"
    https.get(topUrl, function(response){
        console.log(response.statusCode)
        
        let chunks = [];

        response.on("data", function(data){
            chunks.push(data)
        }).on('end', function(){

            let data= Buffer.concat(chunks);
            let topAnime= JSON.parse(data);
            topAnimeRes= topAnime.top

            let title= [];
            let pic= [];
            let score = [];

            for(let i=0; i<20; i++)
            {
                title[i]= topAnimeRes[i].title
                pic[i]= topAnimeRes[i].image_url
                score[i]= topAnimeRes[i].score
            }
            
            res.render("index", {pic: pic, title: title, score: score})
        })
    })
    
})

app.post('/', function(req,res){
    const q= req.body.search
    if(q == "")
    {
        res.redirect("/")
    }
    else {
        const url= "https://api.jikan.moe/v3/search/anime?q="+ q +"&page=1"

        https.get(url, function(response){
            console.log(response.statusCode)
    
            let chunks = [];
    
            response.on("data", function(data){
                chunks.push(data)
            }).on('end', function(){
    
                let data= Buffer.concat(chunks);
                let anime= JSON.parse(data);
                let results= anime.results
               
                req.app.locals.nameOfYourArr = results;
    
                res.redirect('/results')
            })
        })
    }
    
})

app.get('/results', function(req,res){
    routeName = req.route.path

    let arr= req.app.locals.nameOfYourArr
    let resultLen= arr.length 
    let imgUrl= []
    let title= []
    for(let i=0; i<resultLen; i++)
    {
        title[i]= arr[i].title
        imgUrl[i]= arr[i].image_url
    }
    res.render("results", {url: imgUrl, name: title})
})



app.get('/schedule', function(req, res) {  //make ejs
    routeName = req.route.path
    const d = new Date();

    const weekday = new Array(7);
    weekday[0] = "Sunday";
    weekday[1] = "monday";
    weekday[2] = "Tuesday";
    weekday[3] = "Wednesday";
    weekday[4] = "Thursday";
    weekday[5] = "Friday";
    weekday[6] = "Saturday";

    let day = weekday[d.getDay()];

    const url= "https://api.jikan.moe/v3/schedule/" + day

    https.get(url, function(response){
        console.log(response.statusCode)

        let chunks = [];

        response.on("data", function(data){
            chunks.push(data)
        }).on('end', function(){

            let data= Buffer.concat(chunks);
            let anime= JSON.parse(data);
            
            if(d.getDay() === 0)
            {
                sch= anime.sunday;
            }
            else if(d.getDay() === 1)
            {
                sch= anime.monday;
            }
            else if(d.getDay() === 2)
            {
                sch= anime.tuesday;
            }
            else if(d.getDay() === 3)
            {
                sch= anime.wednesday;
            }
            else if(d.getDay() === 4)
            {
                sch= anime.thursday;
            }
            else if(d.getDay() === 5)
            {
                sch= anime.friday;
            }
            else if(d.getDay() === 6)
            {
                sch= anime.saturday;
            }
            

            let imgUrl= []
            let title= []

            for(let i=0; i<sch.length; i++) {
                title[i]= sch[i].title
                imgUrl[i]= sch[i].image_url
            }

            res.render("schedule", {title: title, imgUrl: imgUrl, day: day})
        })
    })
})

app.get('/upcoming', function (req, res) { //make ejs
    routeName = req.route.path
    const url = "https://api.jikan.moe/v3/season/later"

    https.get(url, function(response){
        console.log(response.statusCode)

        let chunks = [];

        response.on("data", function(data){
            chunks.push(data)
        }).on('end', function(){

            let data= Buffer.concat(chunks);
            let upAnime= JSON.parse(data);
            upcoming= upAnime.anime  

            let imgUrl= []
            let title= []

            for(let i=0; i<100; i++) {
                title[i]= upcoming[i].title
                imgUrl[i]= upcoming[i].image_url
            }

            res.render("upcoming", {title: title, imgUrl: imgUrl})
            
        })
    })
})

app.get('/error', function(req,res){
    res.send("<h1>Oops! Something went wrong. Try again please.</h1>")
})

app.get("/:animeName", function(req, res) {
    console.log(routeName)
    let imgUrl, airing, synopsis, type, episodes, score
    const animeName = req.params.animeName

    if(routeName === "/results"){
        const arr= req.app.locals.nameOfYourArr

        let i
    
        for(i=0; i<arr.length; i++) 
        {
            if(arr[i].title === animeName)
            {
                imgUrl= arr[i].image_url
                airing= arr[i].airing
                synopsis= arr[i].synopsis
                type= arr[i].type
                episodes= arr[i].episodes
                score= arr[i].score
                break
            }
        }
        res.render("info", {title: animeName, imgUrl: imgUrl, airing: airing, synopsis: synopsis, type: type, episodes: episodes, score: score})
    }
    else if(routeName === "/schedule")
    {
        let i
        for(i=0; i<sch.length; i++)
        {
            if(sch[i].title === animeName)
            {
                imgUrl= sch[i].image_url
                airing= sch[i].airing_start
                synopsis= sch[i].synopsis
                type= sch[i].type
                episodes= sch[i].episodes
                score= sch[i].score
                break
            }
        }
        res.render("info", {title: animeName, imgUrl: imgUrl, airing: airing, synopsis: synopsis, type: type, episodes: episodes, score: score})

    }
    else if(routeName === "/upcoming")
    {
        let i
        for(i=0; i<100; i++)
        {
            if(upcoming[i].title === animeName)
            {
                imgUrl= upcoming[i].image_url
                airing= "Upcoming"
                synopsis= upcoming[i].synopsis
                type= upcoming[i].type
                episodes= 0
                score= "N/A"
                break
            }
        }
        res.render("info", {title: animeName, imgUrl: imgUrl, airing: airing, synopsis: synopsis, type: type, episodes: episodes, score: score})
    }
    else if(routeName === "/")
    {
        const url= "https://api.jikan.moe/v3/search/anime?q="+ animeName +"&page=1"

        https.get(url, function(response){
            console.log(response.statusCode)
    
            let chunks = [];
    
            response.on("data", function(data){
                chunks.push(data)
            }).on('end', function(){
    
                let data= Buffer.concat(chunks);
                let topAnimes= JSON.parse(data);

                airing= topAnimes.results[0].airing
                imgUrl= topAnimes.results[0].image_url
                synopsis= topAnimes.results[0].synopsis
                type= topAnimes.results[0].type
                episodes= topAnimes.results[0].episodes
                score= topAnimes.results[0].score

                setTimeout((() => {
                    res.render("info", {title: animeName, imgUrl: imgUrl, airing: airing, synopsis: synopsis, type: type, episodes: episodes, score: score})
                }), 2500)

                
            })

        })
        
    }
    
})


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000");
});

