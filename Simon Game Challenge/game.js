
var buttonColours = ["red", "blue", "green", "yellow"];
var gamePattern = [];
var userClickedPattern = [];

var start = false;
var level = "Level";
var i  =0;
$(document).keydown(function(event){
        if(start===false)
        {
            $("#level-title").text(level+" "+i);
            newSequence();
            start = true;
        }
});

$(".btn").click(function()
{
    var userChosenColour =  $(this).attr("id");
    userClickedPattern.push(userChosenColour);
    playSound(userChosenColour);
    animatePress(userChosenColour);

    checkAnswer(userClickedPattern.length-1);
});

function newSequence(){
    userClickedPattern=[];

    i++;
    $("#level-title").text(level+" "+i);
     
    var randomNumber = Math.floor(Math.random()*4);
    var randomChosenColour = buttonColours[randomNumber];

    gamePattern.push(randomChosenColour);

    $("#"+randomChosenColour).fadeOut(100).fadeIn(100);

   playSound(randomChosenColour);
   animatePress(randomChosenColour);
   
 
   
}

function playSound(name)
{
    var audio = new Audio("./sounds/"+name+".mp3");
    audio.play();

}

function animatePress(currentColour)
{
    $("."+currentColour).addClass("pressed");
    setTimeout(function()
    {
        $("."+currentColour).removeClass("pressed");
    },100);
    
}

function checkAnswer(currentLevel)
{

    if(userClickedPattern[currentLevel] === gamePattern[currentLevel])
    {
        console.log("success");
        if(userClickedPattern.length == gamePattern.length)
        {
            setTimeout(function()
            {
                newSequence();
            },1000);
        }
    }
    else{
        console.log("Wrong");
        var wr = new Audio("./sounds/wrong.mp3");
        wr.play();

        $("body").addClass("game-over");
        setTimeout(function()
        {
            $("body").removeClass("game-over");
        },200);

        $("#level-title").text("Game Over, Press Any Key to Restart");

         
         startOver();
    }
}

function startOver()
{
    start = false;
    gamePattern = [];
    i=0;
}