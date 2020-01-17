
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
            var name = $('#name').val();            // get player's name
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
    $('#main_panel').html(`<div class="player" id="me">
                                <div class="state">Not Ready</div>
                                <div class="name">(You) ${me.name}</div>
                                <button class="btn btn-ready">Ready</button>
                            </div>
                            <div class="img-vs"></div>
                            <div class="player" id="opponent">
                                <div class="state">Not Ready</div>
                                <div class="name">Waiting...</div>
                                
                            </div>`);

    // waiting for opponent
    playersRef.on("child_added", function (childSnapshot) {
        // console.log(childSnapshot);
        // console.log(childSnapshot.val());
        if (childSnapshot.key != myKey) {
            $(`#opponent .name`).html(childSnapshot.val().name);
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




/*helper function
  update field in database
*/
function update(field, val) {
    playersRef.child(myKey + "/" + field).set(val);
}