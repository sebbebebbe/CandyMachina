
var secrets = require(secrets.json);
var twitterapi = require('twitter');

var Twitter = function(){
    var client = new twitterapi({
        consumer_key: secrets.consumer_key,
        consumer_secret: secrets.consumer_secret,
        access_token_key: secrets.access_token_key,
        access_token_secret: secrets.access_token_secret
    });
};

Twitter.prototype = {
    postStatus: function() {
        client.post('statuses/update', status,  function(error, tweet, response) {
            if(error) throw error;
            console.log(tweet);  // Tweet body.
            console.log(response);  // Raw response object.
        });
    },
    postImage: function(message, tags) {
        client.post('media/upload', {media: data},  function(error, media, response) {
            if (!error) {

                // If successful, a media object will be returned.
                console.log(media);

                // Lets tweet it
                var status = {
                    status: message + '\n' + tags,
                    media_ids: media.media_id_string // Pass the media id string
                };
                postStatus(status);
            }
        });
    }
};

module.exports  = new Twitter();