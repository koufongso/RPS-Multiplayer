
// Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyByS1B6EVf_7geXVie6zhWU0L7Lv3G7IF8",
    authDomain: "rps-multiplayer-cff9d.firebaseapp.com",
    databaseURL: "https://rps-multiplayer-cff9d.firebaseio.com",
    projectId: "rps-multiplayer-cff9d",
    storageBucket: "rps-multiplayer-cff9d.appspot.com",
    messagingSenderId: "562162466254",
    appId: "1:562162466254:web:ed28645fb707bcf813ff9f",
    measurementId: "G-PP71LSX69G"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// database references
const database = firebase.database();
const playersRef = database.ref("players");
const totalRef = database.ref("total");
const inputRef = database.ref("input");


var me = null// store this player object
var myKey = undefined;
// add this player to the database
$(document).on("click", "#join", () => { logIn(event) });
$(window).on("beforeunload", logOut);

function logIn(event) {
    event.preventDefault();
    // check the current players
    totalRef.once('value').then(function (snap) {
        var total = snap.val();
        // only add this player when the total # of players is less than 2
        if (total < 2) {
            var name = $('#input-name').val();            // get player's name
            me = new Player(name);                  // create player
            var newPlayer = playersRef.push(me);    // add "me" to the database 
            myKey = newPlayer.key;                  // store the key in the database
            totalRef.set(++total);                  // update total players
            waitingPage();
        } else {
            alert("the room is currently full!");
        }
    });
}

function logOut() {
    if (me != null) {
        totalRef.once('value').then(function (snap) {
            var total = snap.val();
            // only add this player when the total # of players is less than 2
            playersRef.child(myKey).remove();
            totalRef.set(--total);
        });
    }
    return "log out";
}

/* display a new page for waiting opponent
   when both player pressed a "ready" button, start a new game
*/
function waitingPage() {
    $('#main_panel').empty();
    $('#main_panel').html(`<div class="clear_fix" id="main_content">
                                <div class="player" id="me">
                                    <div class="state">Not Ready</div>
                                    <div class="name">(You) ${me.name}</div>
                                    <button class="btn btn-ready">Ready</button>
                                </div>
                                <div id="info"><h1 id="vs">VS</h1></div>
                                <div class="player" id="opponent">
                                    <div class="state">Not Ready</div>
                                    <div class="name">Waiting...</div>
                                </div>
                            </div>`);
    
    // chatBox
    $('#main_panel').append(`<div id="chatBox">Chat<div id="chatWindow"></div>
                                <form>
                                    <input id="chat-input" type="text" placeholder="Message">
                                    <input id="chat-send" type="submit" value="Send">
                                </form>
                            </div>`);

    // waiting for opponent
    playersRef.on("child_added", function (childSnapshot) {
        // console.log(childSnapshot);
        // console.log(childSnapshot.val());
        if (childSnapshot.key != myKey) {
            $(`#opponent .name`).html(childSnapshot.val().name);
            if (childSnapshot.val().ready) {
                $('#opponent .state').html("Ready");
            }
        }
    });
}

$(document).on("click", ".btn-ready", getReady);
$(document).on("click", ".btn-cancel-ready", notReady);

/* change the this player's ready state to true and synchornize the database
*/
function getReady() {
    me.ready = true;
    update("ready", true);
    $('#me .state').html("Ready");
    $('#me .btn-ready').html("Cancel");
    $('#me .btn-ready').addClass("btn-cancel-ready");
    $('#me .btn-ready').removeClass("btn-ready");
}


function notReady() {
    me.ready = false;
    update("ready", false);
    $('#me .state').html("Not Ready");
    $('#me .btn-cancel-ready').html("Ready");
    $('#me .btn-cancel-ready').addClass("btn-ready");
    $('#me .btn-cancel-ready').removeClass("btn-cancel-ready");
}

var readyCount = 0;

/* synchornize the ready state to all the players' web page
*/
playersRef.on("child_changed", function (childSnapshot) {
    //console.log(childSnapshot);
    //console.log(childSnapshot.val());
    if (childSnapshot.val().ready) {
        readyCount++;
    } else {
        readyCount--;
    }

    if (childSnapshot.key != myKey) {
        if (childSnapshot.val().ready) {
            $(`#opponent .state`).html("Ready");
        } else {
            $(`#opponent .state`).html("Not Ready");
        }
    }

    if (readyCount == 2) {
        playersRef.off();       //turn off database event listener
        newGame();
    }
});

var decisionCount = 0;
var opponentScore = 0;

// img click event listener
$(document).on("click", '#me .rps img', myChoice);

function newGame() {
    console.log("start new game!");
    $('.state').remove();
    $('.btn').remove();
    $('#me').append(`<div class="rps">
                        <img class="rock" data-val="rock" src="assets/images/rock.png">
                        <img class="paper" data-val="paper" src="assets/images/paper.png">
                        <img class="scissors" data-val="scissors" src="assets/images/scissors.png">
                    </div>
                    <div class="rps_final"></div>`);

    $('#opponent').append(`<div class="rps">
                                <img class="unknown" src="assets/images/unknown.png">
                                <img class="unknown" src="assets/images/unknown.png">
                                <img class="unknown" src="assets/images/unknown.png">
                            </div>
                            <div class="rps_final"></div>`);

    $('#info').append(`<h1 id="score_panel"><span id="myScore">0</span>:<span id="opponentScore">${opponentScore}</span></h1>`);

    // when someone made a decision
    playersRef.on("child_changed", function (childSnapshot) {
        console.log("dm!");
        if (childSnapshot.key != myKey) {
            $('#opponent .rps img').css("visibility", "hidden");
            $('#opponent .rps_final').html(`<img class="unknown" src="assets/images/unknown.png">`);
        }

        inputRef.once('value').then(function (snap) {
            var val = snap.val();
            inputRef.set(++val);
        })
    });
}

inputRef.on("value", function (dataSnapshot) {
    if (dataSnapshot.val() == 2) {
        reveal();
    }
});


/* update this player's rps choice
*/
function myChoice() {
    console.log("click!");
    var myrps = $(this).attr("data-val");           // obtain "my" rps decision
    $('#me .rps img').css("visibility", "hidden");  // hide options
    $('#me .rps_final').html(`<img data-val=${myrps} src="assets/images/${myrps}.png">`); // show the decision in the display div
    update("rps", myrps);                           // update database, trigger playerRef child_changed event listener
}


/* go to the database and check bath players' rps decision
   , then show the result and start the next game
*/
function reveal() {
    playersRef.off("child_changed"); // turn off the database event listener
    console.log("reveal!");
    playersRef.once('value').then(function (snap) {
        // get results from the database
        var val = snap.val();
        var keys = Object.keys(val);
        for (var i = 0; i < keys.length; i++) {
            if (keys[i] != myKey) {
                var op_rps = val[keys[i]].rps;
            } else {
                var my_rps = val[keys[i]].rps;
            }
        }
        // show opponent's rps
        $('#opponent .rps_final').html(`<img data-val=${op_rps} src="assets/images/${op_rps}.png">`);

        // calculate result and update database & score_panel
        if (my_rps == op_rps) {
            console.log("draw");
            update("draw", ++me.draw);
        } else if ((my_rps == "rock" && op_rps == "scissors") || (my_rps == "paper" && op_rps == "rock") || (my_rps == "scissors" && op_rps == "paper")) {
            console.log("win");
            update("win", ++me.win);
            $('#myScore').html(me.win);
        } else {
            console.log("lost");
            update("lose", ++me.lose);
            $('#opponentScore').html(++opponentScore);
        }

        // go to next game
        nextGame();
    });
}

function reset() {
    console.log("reset");
    playersRef.off("child_changed");
    $('.rps img').css("visibility", "visible");
    $('.rps_final').empty();
    playersRef.child(myKey + "/rps").remove();
    inputRef.set(0);
}


var after;
function nextGame() {
    console.log("next game!");
    reset();

    playersRef.once('value').then(function (dataSnapshot) {
        playersRef.on("child_changed", function (childSnapshot) {
            console.log("dm!");
            if (childSnapshot.key != myKey) {
                $('#opponent .rps img').css("visibility", "hidden");
                $('#opponent .rps_final').html(`<img class="unknown" src="assets/images/unknown.png">`);
            }
            inputRef.once('value').then(function(snap){
                var val = snap.val();
                inputRef.set(++val);
            })
        });
    })
}


/*helper function
  update field in database
*/
function update(field, val) {
    console.log("set " + field + " = " + val);
    playersRef.child(myKey + "/" + field).set(val);
}


