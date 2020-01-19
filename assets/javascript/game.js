
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
const chatBoxRef = database.ref("chatBox");


var me = null// store this player object
var myKey = undefined;
var opponentKey = undefined;

// add this player to the database
$(document).on("click", "#join", () => { logIn(event) });
$(window).on("beforeunload", logOut);

/**
 * if the database has less than 2 people,
 * create a player object (me) and add this object in the database
 * @param {object} event <form> click event object 
 */
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

/**
 * remove this players when the page is about to be closed or refreshed
 */
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


/**
 * display a new page for "waiting room" and for the game
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
        if (childSnapshot.key != myKey) {
            // opponent joined
            opponentKey = childSnapshot.key;
            $(`#opponent .name`).html(childSnapshot.val().name);
            if (childSnapshot.val().ready) {
                $('#opponent .state').html("Ready");
            }

            // now listen the ready state changed in opponent
            playersRef.child(opponentKey + "/ready").on("value", function (snap) {
                // onsole.log("opponent changed ready state!");
                // console.log(snap);
                if (snap.val()) {
                    $(`#opponent .state`).html("Ready");
                    if (me.ready) {
                        newGame();
                    }
                } else {
                    $(`#opponent .state`).html("Not Ready");
                }
            });
        }
    });
}

// ready and cancel ready button for player
$(document).on("click", ".btn-ready", getReady);
$(document).on("click", ".btn-cancel-ready", notReady);

/**
 * change the this player's ready state to true and synchornize the database
 */
function getReady() {
    me.ready = true;
    update("ready", true);
    $('#me .state').html("Ready");
    $('#me .btn-ready').html("Cancel");
    $('#me .btn-ready').addClass("btn-cancel-ready");
    $('#me .btn-ready').removeClass("btn-ready");
    // check if the opponent is ready
    playersRef.child(opponentKey + "/ready").once('value', function (snap) {
        if (snap.val()) {
            newGame();
        }
    });
}

/**
 * change the this player's ready state to false and synchornize the database
 */
function notReady() {
    me.ready = false;
    update("ready", false);
    $('#me .state').html("Not Ready");
    $('#me .btn-cancel-ready').html("Ready");
    $('#me .btn-cancel-ready').addClass("btn-ready");
    $('#me .btn-cancel-ready').removeClass("btn-cancel-ready");
}

var opponentScore = 0;          // a variable to keep track of oppoent's score
var myDecision = undefined;
// click event listener for rock paper scissors input
$(document).on("click", '#me .rps img', myChoice);
var test
function newGame() {
    // console.log("start new game!");
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

    // now listen when the opponent made decision
    playersRef.child(opponentKey + "/rps").on("value", function (snap) {
        var opponentDecision = snap.val();
        if (opponentDecision != null) {
            console.log("opponent made decision!");
            $('#opponent .rps img').css("visibility", "hidden");
            $('#opponent .rps_final').html(`<img class="unknown" src="assets/images/unknown.png">`);
            if (myDecision != undefined) {
                reveal(opponentDecision);
            }
        }
    });
}


/**
 * update this player's rps choice in the database and also display an unknown decision on the opponent's web page
 */
function myChoice() {
    console.log("click!");
    myDecision = $(this).attr("data-val");           // obtain "my" rps decision
    $('#me .rps img').css("visibility", "hidden");  // hide options
    $('#me .rps_final').html(`<img data-val=${myDecision} src="assets/images/${myDecision}.png">`); // show the decision in the display div
    update("rps", myDecision);                           // update database, trigger playerRef child_changed event listener

    // check if opponent made decision
    playersRef.child(opponentKey + "/rps").once('value', function (snap) {
        var opponentDecision = snap.val();
        if (opponentDecision != null) {
            reveal(opponentDecision);
        }
    });
}


/**
 * go to the database and check bath players' rps decision
 * then show the result and start the next game
 */
function reveal(opponentDecision) {
    // console.log("reveal!");
    if (myDecision == opponentDecision) {
        // console.log("draw");
        update("draw", ++me.draw);
    } else if ((myDecision == "rock" && opponentDecision == "scissors") || (myDecision == "paper" && opponentDecision == "rock") || (myDecision == "scissors" && opponentDecision == "paper")) {
        // console.log("win");
        update("win", ++me.win);
        $('#myScore').html(me.win);
    } else {
        // console.log("lost");
        update("lose", ++me.lose);
        $('#opponentScore').html(++opponentScore);
    }
    // show opponent's rps
    $('#opponent .rps_final').html(`<img data-val=${opponentDecision} src="assets/images/${opponentDecision}.png">`);

    setTimeout(reset, 1000);
}

/**
 * it reset every thing to the begining of newGame() 
 */
function reset() {
    // console.log("reset");
    myDecision = undefined;
    playersRef.child(myKey + "/rps").remove()    // remove rps decision in the database, or it won't trigger the child_changed if player made the same decision
        .then(function () {
            $('.rps img').css("visibility", "visible");   // show rps option
            $('.rps_final').empty();                      // remove previous game fianl decision
        });
}




/**
 * helper function that update "my" data in the database
 * @param {string} field field that wants to be modified/update 
 * @param {string/number} val new value 
 */
function update(field, val) {
    // console.log("set " + field + " = " + val);
    playersRef.child(myKey + "/" + field).set(val);
}


/*--------------chatBox-------------------------*/

// send message button event listener
$(document).on("click", "#chat-send", () => { sendMessage(event) });


/**
 * push the text/message to the database "chatBox"
 */
function sendMessage(event) {
    event.preventDefault();
    var msg = $('#chat-input').val();     // get text/message
    if (msg != "") {
        $('#chat-input').val("");             // clear input text
        // console.log(msg);

        // push this message to the database
        chatBoxRef.push(new Message(me.name, Date(), msg));
    }
}

/**
 * chatBox child added event <=> new message was pushed in
 * append the new message to the chatWindow 
 */
chatBoxRef.on("child_added", function (childSnapshot) {
    var obj = childSnapshot.val();
    $('#chatWindow').append(`<p class="chat-msg"><span class="chat-timestamp">${obj.time.split(" ")[4]}</span><span class="chat-name">${obj.name}</span>:<span class="chat-body">${obj.msg}</span></p>`);

    // auto scrolling
    $('#chatWindow').stop().animate({ scrollTop: $('#chatWindow')[0].scrollHeight }, 500);
})