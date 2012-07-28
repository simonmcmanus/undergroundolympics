var twitter = require('ntwitter');
var analyze = require('Sentimental').analyze;
var positivity = require('Sentimental').positivity;
var negativity = require('Sentimental').negativity;
var express = require('express');
var app = express.createServer();
var ejs = require('ejs');
var redis = require("redis");
var rClient = redis.createClient();

var config = require('./config.js');

var twit = new twitter(config.twitter);

rClient.get("score"+event, function(d) {
    console.log(d);
});



var events = { // of the underground olympic variety.
        'Jubilee': 0,
    'Bakerloo':0,
    'Central':0,
    'Circle':0,
    'District':0,
    'DLR':0,
    'Hamersmith & City':0,
    'Metropolitan':0,
    'Northern':0,
    'Overground':0,
    'Piccadilly':0,
    'Victoria':0,
    'Waterloo & City':0  
};


for(var event in events) {
    rClient.get("score_"+event, function(event , e, d) {
        if(d===null){
            events[event] = '0';
        }else {
            events[event] = d;
        }
    }.bind(this, event) )
} 


var lines = {
    'London': 0,
    'Olympics': 0,
    'Roads':0,
};


// fetch stro




twit.stream('statuses/sample', function(stream) {
    var changed = false;
    var checkIsInt =function(val) {
        if(typeof val === 'number') {
            return val;
        }else if(typeof val === 'string') {
            return parseInt(val, 10);
        }
    };

    stream.on('data', function (data) {
        console.log(0);
        for(var event in events) {
            if(data.text.indexOf(event) != -1 ) {
                console.log(1);
                var score = analyze(data.text).score;
                console.log(2);
                events[event] = checkIsInt(events[event]) + score;
                console.log(3);
                rClient.set("score_"+event, events[event], redis.print);
                console.log(4);
                data.score = score;
                console.log(5);
                rClient.hset("tweet_"+event, JSON.stringify(data), data.id,  redis.print);
                console.log(6);
                changed = true;
            }
        }
        if(changed) {    
            //console.log(events);
            changed = false;
        }
    });

    stream.on('error', function() {
        console.log('error', arguments);
    });
});


app.engine('.ejs', ejs, function() {});
app.get('/', function(req, res, next) {
    res.render('olympics.ejs', {
        events: events,
        lines: lines
    });
});


app.get('/lines/:line', function(req, res, next) {
    rClient.hkeys('tweet_'+req.params.line, function(err, data) {
        res.render('tweets.ejs', {
            tweets: data,
            JSON: JSON
        });
    });
});


app.get('/b', function(req, res, next) {
    res.render('index.ejs', {
        layout: false,
        events: events
    });
});


app.use('/public', express['static'](__dirname + '/public/'));
app.listen(8004);