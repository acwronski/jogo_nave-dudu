(function(){
    // canvas
    var cnv = document.querySelector('canvas');
    // contexto de rendenizacoa 2d
    var ctx = cnv.getContext('2d')

    // meus recurcos do jogo
    // Arrays
    var sprites = [];
    var assetsTuLoad = [];
    var missiles = [];
    var aliens = [];
    var messages = [];

    //variaveis uteis
    var alienFrequency = 100;
    var alienTimer = 0;
    var shots = 0;
    var hits = 0;
    var acuracy = 0;
    var scoreToWin = 70;
    var FIRE = 0, EXPLOSION = 1;

    // sprites
    //cenario
    var background = new Sprite(0, 56, 320, 480, 0, 0);
    sprites.push(background);
    //nave
    var defender = new Sprite(0, 0, 30, 50, 145, 430);
    sprites.push(defender);

    //mensagem tela inicial
    var startMessage = new ObjectMessage(cnv.height / 2,
        "Ta querendo jogar?(Aperte Enter)", "#ffff00");
    messages.push(startMessage);

    //mensagem paused
    var pausedMessage = new ObjectMessage(cnv.height / 2, "Vai Fuma Um Né", "#f00");
    pausedMessage.visible = false;
    messages.push(pausedMessage)

    //menssagen de game over
    var gameOverMessage = new ObjectMessage(cnv.height / 2, "", "#f00");
    gameOverMessage.visible = false;
    messages.push(gameOverMessage);

    //placar
    var scoreMessage = new ObjectMessage(10, "", "#0f0");
    scoreMessage.font = "normal bold 15px font";
    updateScore();
    messages.push(scoreMessage);

    // imagens
    var img = new Image();
    img.addEventListener('load', loadHandler, false);
    img.src = "img/img.png";
    assetsTuLoad.push(img);

    // contador de recursos
    var loadAssets = 0;

    //entradas
    var LEFT = 37, RIGHT = 39, ENTER = 13, SPACE = 32;
    //açoes
    var mvLeft = mvRight =  shoot = spaceIsDown = false  ;
    //estados do jogo
    var LOADING = 0, PLAYING = 1, PAUSED = 2, OVER = 3;
    var gameState = LOADING;

    //listeners   pressiona a tecla
    window.addEventListener('keydown', function(e){
        var key = e.keyCode;
        switch(key){
            case LEFT:
                mvLeft = true;
                break;
            case RIGHT:
                mvRight = true;
                break;
            case SPACE:
                if(! spaceIsDown){
                    shoot = true;
                    spaceIsDown = true;
                }
                break;
            


        }

        
    }, false);
// solta a tecla
    window.addEventListener('keyup', function(e){
        var key = e.keyCode;
        switch(key){
            case LEFT:
                mvLeft = false;
                break;
            case RIGHT:
                mvRight = false;
                break;
            case ENTER:
                if(gameState !== OVER){
                    if(gameState !== PLAYING){
                        gameState = PLAYING;
                        startMessage.visible = false;
                        pausedMessage.visible = false;
                    
                    }else{
                        gameState = PAUSED;
                        pausedMessage.visible = true;
                    }

                    }
                break;
            case SPACE:
                spaceIsDown = false;
                break;
            
        }

        
    }, false);


    //funcoes

    function loadHandler(){
        loadAssets++;
        if(loadAssets === assetsTuLoad.length){
            img.removeEventListener('load', loadHandler, false);
            // inicia o jogo
            gameState = PAUSED;
        }
    }

    //motor do jogo
    function loop(){
        requestAnimationFrame(loop, cnv);
        // define as acoes com base no estado do jogo
        switch(gameState){
            case LOADING:
                console.log('TENTANDO ACHAR o DUDU da NAVE...');
                break;
            case PLAYING:
                update();
                break;
            case OVER:
                endGame();
                break;
        }
        render();
    }
    //atualiza o game frame a frame


    function update(){
        //move esquerda
        if(mvLeft && !mvRight){
            defender.vx = -5;

        }//move direita
        if(mvRight && !mvLeft){
            defender.vx = 5;

        }//para a nave
        if(!mvLeft && !mvRight){
            defender.vx = 0;
        }
        // disparo canhao
        if(shoot){
            fireMissile();
            shoot = false;
        }


        //atualiza position

        defender.x = Math.max(0, Math.min(cnv.width - defender.width, defender.x + 
            defender.vx));

        //atualiza posicao dos misseis
        for(var i in missiles){
            var missile = missiles[i];
            missile.y += missile.vy;
            if(missile.y < -missile.height){
                removeObjects(missile, missiles);
                removeObjects(missile, sprites);
                updateScore();
                i--;
            }

        }
        // encremento d0 alienTimer
        alienTimer++;

        //criacao do aliem caso o timer se iguale a frequencia

        if(alienTimer === alienFrequency){
            makeAlien();
            alienTimer = 0;
            //ajuste na frequencia de criacao de aliens
            if(alienFrequency > 2){
                alienFrequency--;
            }
        }

        // move os as aliens
        for(var i in aliens){
            var alien = aliens[i];
            if(alien.state !== alien.EXPLODED){
                alien.y += alien.vy;
                if(alien.state === alien.CRAZY){
                    if(alien.x > cnv.width - alien.width || 
                        alien.x < 0){
                            alien.vx *= -1
                    }
                    alien.x += alien.vx;    
                }
            }
            //confere se algun alien chegou a terra
            if(alien.y > cnv.height + alien.height){
                gameState = OVER;
            }

            // confere se algun alien colidiu com minha nave

            if(collide(alien, defender)){
                destroyAlien(alien);
                removeObjects(defender, sprites);
                gameState = OVER;
                const gamelose = document.getElementById('gamelose')
                gamelose.play()
            }

            //confere se algum alien foi destruido

            for(var j in missiles){
                var missile = missiles[j];
                if(collide(missile, alien) && alien.state !== alien.EXPLODED){
                    destroyAlien(alien);

                    hits++;
                    updateScore();
                    // condicao para vitoria
                    if(parseInt(hits) === scoreToWin){
                        gameState = OVER;

                        const gamewin = document.getElementById('gamewin')
                        gamewin.play()

                        //vare os aliens todos
                        for(var k in aliens){
                        var alienK = aliens[k];
                        destroyAlien(alienK);
                    }
                    }
                    removeObjects(missile, missiles);
                    removeObjects(missile, sprites);
                    j--;
                    i--;
                }
            }
            }//fim movimentacao dos aliens
        
        
    }

    //criacao dos missele
    function fireMissile(){
        var  missile = new Sprite(136, 12, 8, 13, defender.centerX() - 4,
        defender.y - 13);
        missile.vy = -8;
        sprites.push(missile);
        missiles.push(missile);
        playSound(FIRE)

        shots++;
    }

    // criacao de aliens bunitinhos
    function makeAlien(){
        //cria um valor aleatorio emtre 0 e 7 => largura do canvas / largura alien 
        //divide o canvas em 6 colunas com aliens
        var alienPosition = (Math.floor(Math.random() * 6)) * 50;

        var alien = new Alien(30, 0, 50, 50, alienPosition, -50);
        alien.vy = 1;
        // otimiza alien inteligencia do alien
        if(Math.floor(Math.random() * 11) > 7 ){
            alien.state = alien.CRAZY;
            alien.vx = 2;
        }
        if(Math.floor(Math.random() * 11) > 5){
            alien.vy = 2;
        }

        sprites.push(alien);
        aliens.push(alien);
    }

    //destroy(elimina da tela) aliens ja destruidos
    function destroyAlien(alien){
        alien.state = alien.EXPLODED;
        alien.explode();
        playSound(EXPLOSION);
        setTimeout(function(){
            removeObjects(alien, aliens);
            removeObjects(alien, sprites);
        }, 800);
    }

    // remove objetos missile e outros do jogo
    function removeObjects(objectToRemove, array){
        var i = array.indexOf(objectToRemove);
        if(i !== -1){
            array.splice(i, 1);
        }
    }

    //atualizacao do placar
    function updateScore(){
        //calculo aproveitamento
        if(shots === 0){
            acuracy = 100;
        }else{
            acuracy = Math.floor(hits/shots * 100);
        }
        //ajuste no texto aproveitamento
        if(acuracy < 100){
            acuracy = acuracy.toString();
            if(acuracy.length < 2){
                acuracy = "  " + acuracy;
            }else{
                acuracy = " " + acuracy;
            }
        }

        //ajuste  no texto hits
        hits = hits.toString();
        if(hits.length < 2){
            hits = "0" + hits;
        }

        scoreMessage.text = "ACERTOS:  " + hits + "  -  APROVEITAMENTO:  " + acuracy + "%";
    }

    //funcao de game over
    function endGame(){
        if(hits < scoreToWin){
            gameOverMessage.text = "PEGAREM SUA RETAGUARDA!!!";
            //colei aki
            const gameover = document.getElementById('gameover')
                gameover.play()
        }else{
            gameOverMessage.text = "A terra esta Salva!!"
            gameOverMessage.color = "#00f";
        }
        gameOverMessage.visible = true;
        setTimeout(function(){
            location.reload();
        }, 4000);
    }

    // efeitos sonoros
    function playSound(soundType){
        var sound = document.createElement("audio");
        if(soundType === EXPLOSION){
            sound.src = "songs/small_explosion.wav";
        }else{
            sound.src ="songs/missile.wav";
        }
        sound.addEventListener("canplaythrough", function(){
            sound.play();
        }, false);
    }

    // dezenha os objetos do jogo na tela
    function render(){
        ctx.clearRect(0, 0 , cnv.width, cnv.height);
        // exibe os sprites
        if(sprites.length !== 0 ){
            for(var i in sprites){
                var spr = sprites[i];
                ctx.drawImage(img, spr.sourceX, spr.sourceY, spr.width,
                    spr.height, Math.floor (spr.x), Math.floor( spr.y), spr.width, spr.height);
            }
        }
        //exibe os textos 
        if(messages.length !== 0){
            for(var i in messages){
                var message = messages[i];
                if(message.visible){
                    ctx.font = message.font;
                    ctx.fillStyle = message.color;
                    ctx.textBaseline = message.baseline;
                    message.x = (cnv.width - ctx.measureText(message.text).width) / 2;
                    ctx.fillText(message.text, message.x, message.y);
                }
            }
        }

    }
    loop();
}());