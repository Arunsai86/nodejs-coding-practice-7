const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayersDataToResponseData = (playerObj) => {
  return {
    playerId: playerObj.player_id,
    playerName: playerObj.player_name,
  };
};
const convertMatchDetailsToResponseData = (obj) => {
  return {
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
  };
};

const convertTotalDataToResponseData = (each) => {
  return {
    playerId: each.player_id,
    playerName: each.player_name,
    totalScore: each.total_score,
    totalFours: each.total_fours,
    totalSixes: each.total_sixes,
  };
};

//API 1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT * FROM player_details;
    `;
  const players = await db.all(getPlayersQuery);
  response.send(
    players.map((eachPlayer) => convertPlayersDataToResponseData(eachPlayer))
  );
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
  SELECT * FROM player_details WHERE player_id = ${playerId};
  `;
  const player = await db.get(getPlayerQuery);
  response.send(convertPlayersDataToResponseData(player));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const addPlayerDetailsQuery = `
    UPDATE player_details SET player_name = '${playerName}' 
    WHERE player_id = ${playerId};
    `;
  await db.run(addPlayerDetailsQuery);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    SELECT * FROM match_details WHERE match_id = ${matchId};
    `;
  const match = await db.get(getMatchDetailsQuery);
  response.send(convertMatchDetailsToResponseData(match));
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchByPlayerQuery = `
    SELECT * FROM match_details JOIN player_match_score ON 
    match_details.match_id = player_match_score.match_id
    WHERE player_match_score.player_id = ${playerId};
    `;
  const getMatches = await db.all(getMatchByPlayerQuery);
  response.send(
    getMatches.map((each) => convertMatchDetailsToResponseData(each))
  );
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT * FROM player_details JOIN player_match_score ON 
    player_details.player_id = player_match_score.player_id
    WHERE player_match_score.match_id = ${matchId};
    `;
  const getMatches = await db.all(getMatchPlayersQuery);
  response.send(
    getMatches.map((each) => convertPlayersDataToResponseData(each))
  );
});
//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getTotalScoresQuery = `
    SELECT
    player_details.player_id AS player_id,
    player_details.player_name AS player_name,
    SUM(player_match_score.score) AS total_score,
    SUM(fours) AS total_fours,
    SUM(sixes) AS total_sixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const getTotalPlayer = await db.get(getTotalScoresQuery);
  response.send(convertTotalDataToResponseData(getTotalPlayer));
});

module.exports = app;
