var sql = require('sqlite3');

function checkNewPlayerHelper( param, callback ) {
    var db = new sql.Database('players.sqlite');
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

function getPlayersFromTable(callback)
{
  var db = new sql.Database( 'players.sqlite' );
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
                  returnArray.push(item);
                }
                callback(returnArray);
            } );
}

function addUser( req, res )
{
    var kvs = getFormValuesFromURL( req.url );
    var db = new sql.Database( 'players.sqlite' );
    var name = kvs[ 'name_input' ];
    var ipAddress = req.connection.remoteAddress;
    //console.log(ipAddress);
    db.run( "INSERT INTO Users(ip, playerName) VALUES ( ?, ? ) ", ipAddress, name,
              function (err)
              {
                  if(err)
                  {
                    console.log(err);
                  }
              } );
    players++;
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
  var db = new sql.Database( 'players.sqlite' );
  db.all("UPDATE UsersPlaying SET xpos=" + center + ", ypos=" + center);
  //how to update random row?
  db.all("UPDATE UsersPlaying ORDER BY RANDOM() LIMIT 1 SET murdererBool='true'");
  // db.all("UPDATE UsersPlaying SET murdererBool='true' WHERE playerID"+ "=" + randomInt);
}

function updatePlayerLocation(map, x, y, ipAddress)
{
  var db = new sql.Database( 'players.sqlite' );
  db.all("UPDATE UsersPlaying SET xpos=" + x
  + ", ypos=" + y + " WHERE ip=" + ipAddress);
  db.all("SELECT * FROM Users",
    function( err, rows ) {
      if (err != null)
      {
        console.log(err);
        return;
      }
      for( var i = 0; i < rows; i++ )
      {
        var x = rows[i].xpos;
        var y = rows[i].ypos
        map[x][y].player.push(rows[i].playerName);  //changed field name because 'name' may be reserved -DB

        //maybe add a field to map[x][y] (AKA a cell) to indicate player and items
        //instead of JUST being represented by a string -DB
      }
  } );
}

function getRandomInt(min, max)
{
  return Math.floor(Math.random() * (max-min))+min;
}

exports.checkNewPlayerHelper = checkNewPlayerHelper;
exports.getPlayersFromTable = getPlayersFromTable;
exports.addUser = addUser;
exports.initializeGame = initializeGame;
exports.generateMap = generateMap;
exports.initializePlayers = initializePlayers;
exports.updatePlayerLocation = updatePlayerLocation;
exports.getRandomInt = getRandomInt;