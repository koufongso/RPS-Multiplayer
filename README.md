# RPS-Multiplayer

* Application link: https://koufongso.github.io/RPS-Multiplayer/

* Description:
    * This is a course project to implement firebase real-time database in a multiplayer version of rock,paper,scissors game applicaiton.
    * To reduce the complexity, there will only 2 players allowed to play at the same time.
    * There will be a chat box for real-time communication.
    * After the players enter a player name to log in, they can change their ready state by clicking a ready/cancel button.
    * The game will start only after both players are ready.
    * Game process is liek normal rock, paper, scissors game. And there will be a board to show the both players' score.

* Issue
    * Currently, the key process is controlled by reading opponent's data/states to trigger the functions, which means the game is actually performed locally and individually. And due to database async behavior, modifying/reading data to control the game process is actually dangerous. 
    * During testing, when players made the decision rapidly, there exist rare case where the socre apperase differently.
    * On the other hand, when players paly slowly, everything works fine.   