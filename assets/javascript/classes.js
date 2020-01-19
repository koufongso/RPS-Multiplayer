class Player{
    constructor(name){
        this.name=name;
        this.win = 0;
        this.lose = 0;
        this.draw = 0;
        this.ready = false;
    }
}


class Message{
    constructor(id,sender,time,msg){
        this.sender_id = id
        this.sender_name = sender;
        this.msg = msg;
        this.time = time;
    }
}

