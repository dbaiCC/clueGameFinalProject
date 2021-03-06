var sql = require('sqlite3');
var db = new sql.Database('players.sqlite');

function checkNewPlayerHelper( param, callback ) {
    db.all( 'SELECT ip FROM Users', function( err, rows )
        {
            for(var i = 0; i < rows.length; i++)
            {
              if (rows[i].ip == param)
              {
                  callback( false )
                  return;
              }
            }
            callback( true );
        } );
}

//edge case: constant selection (for updating client) can conflict with trying to update player position
function getPlayersFromTable(callback)
{
  var returnArray = [];
  db.all( "SELECT * FROM UsersPlaying",
            function (err, rows)
            {
                if(err)
                {
                  console.log(err);
                  return;
                }
                for(var i = 0; i < rows.length; i++)
                {
                  var item = new Object();
                  item.xpos = rows[i].xpos;
                  item.ypos = rows[i].ypos;
                  item.playerName = rows[i].playerName;
                  item.dead = rows[i].deadBool;
                  returnArray.push(item);
                }
                callback(returnArray);
            } );
}

function getFormValuesFromURL( url )
{
    var kvs = {};
    var parts = url.split( "?" );
    if( parts.length === 2 )
    {
        var key_value_pairs = parts[1].split( "&" );
        for( var i = 0; i < key_value_pairs.length; i++ )
        {
            var key_value = key_value_pairs[i].split( "=" );
            kvs[ key_value[0] ] = key_value[1];
        }
    }
    return kvs
}


function initializeGame()
{
  var gameMap = generateMap(5); //change to accomdate number of players later
  initializePlayers(gameMap);
}

function generateMap(size)
{
    var map = [];
    for (var i=0; i<size; i++)
    {
      map.push([]);
      for (var a=0; a<size; a++)
      {
        map[i][a] = "";
        //map[i].push("");   //does the above work? I think it wouldn't because the empty array doesn't have any valid indices
      }
    }
    var items = Math.floor(size * size/5);
    //right now, this may introduce overlap
    //could fix it by creating array of possible locations, then randomly selecting an index, using that position, then splicing that position out of possible locations
    for (var t=0; t<items; t++)
    {
      x = getRandomInt(0, size)
      y = getRandomInt(0, size)
      map[x][y] = "xXx";
    }
    return map;
}

//what does this function do? -DB
function initializePlayers(map)
{
  var center = Math.floor(map.length/2);
  db.all("UPDATE UsersPlaying SET xpos=" + center + ", ypos=" + center);
  //how to update random row?
  //db.all("UPDATE UsersPlaying ORDER BY RANDOM() LIMIT 1 SET murdererBool='true'");
  db.all("SELECT * FROM UsersPlaying ORDER BY RANDOM() LIMIT 1", function(err, rows)
  {
    db.run("UPDATE UsersPlaying SET murdererBool='true' WHERE playerName='" + rows[0].playerName + "'");
  });
}

function getRandomInt(min, max)
{
  return Math.floor(Math.random() * (max-min))+min;
}

function parseCookies( headers )
{
    var cookies = {};
    var hc = headers.cookie;
    //console.log( 'cookies ', hc )
    hc && hc.split( ';' ).forEach(
        function( cookie )
        {
            var parts = cookie.split( '=' );
            cookies[ parts.shift().trim() ] =
                decodeURI( parts.join( '=' ) );
        } );

    return cookies;
}
function getKiller( name, callback)
{
  db.all( "SELECT murdererBool FROM UsersPlaying WHERE playerName='" +name + "'",
            function (err, rows)
            {
                if(err)
                {
                  console.log(err);
                  return;
                }
                var killer = (rows[0].murdererBool=="true")
                console.log("murderer?" + killer);
                callback(killer);
            }
        );
}

function kill(killer, killed, callback)
{
  db.all("UPDATE UsersPlaying SET deadBool='true' WHERE playerName='" + killed + "'");
  db.all("SELECT murdererBool FROM UsersPlaying WHERE playerName='" + killed + "' OR playerName='" + killer + "'",
  function(err, rows)
  {
    if (rows[0].murdererBool != "true" && rows[1].murdererBool != "true")
    {
      console.log("OOOPS! You killed an innocent. That makes you a murderer, huh. Guess you'd better get killing.");
      db.run("UPDATE UsersPlaying SET murdererBool='true' WHERE playerName='" + killer + "'");
    }
  } );
  db.all("SELECT deadBool, murdererBool FROM UsersPlaying WHERE deadBool IS NOT 'true'",
  function(err, rows)
  {
    if(err)
    {
      console.log(err);
      return;
    }
    var killers = 0;
    var innocents = 0;
    for (i=0; i<rows.length; i++)
    {
      if (rows[i].murdererBool=="true")
      {
        killers++;
      }
      else
      {
        innocents++;
      }
    }
    //console.log("killers and innocents: " + killers + " " + innocents);
    var messageString = "";
    var winCondition = -1;
    if (killers == 0 )
    {
      if (innocents == 0)
      {
        messageString = "EVERYONE IS DEAD! EVERYONE LOSES!";
        console.log(messageString);
        winCondition = 0;
      }
      else
      {
        messageString = "THE MURDERER IS DEAD! THE INNOCENTS WIN!";
        console.log(messageString);
        winCondition = 1;
      }
    }
    else if (innocents == 0 && killers == 1)
    {
      messageString = "THE INNOCENTS ARE DEAD! THE MURDERER WINS!"
      console.log(messageString);
      winCondition = 2;
    }
    callback(winCondition);
  } );
}

exports.kill=kill;
exports.getKiller = getKiller;
exports.checkNewPlayerHelper = checkNewPlayerHelper;
exports.getPlayersFromTable = getPlayersFromTable;
exports.initializeGame = initializeGame;
exports.generateMap = generateMap;
exports.initializePlayers = initializePlayers;
exports.getRandomInt = getRandomInt;
exports.parseCookies = parseCookies;
