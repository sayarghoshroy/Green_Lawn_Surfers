var cubeRotation = 0.0;

fsSource_wallflash = `
   varying highp vec2 vTextureCoord;

    uniform sampler2D uSampler;

    void main(void) {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
      gl_FragColor.r -= 0.5;
      gl_FragColor.g -= 0.5;
      gl_FragColor.b -= 0.5;
    }
  `;

vsSource_wallflash = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
    }
  `;

const canvas = document.querySelector('#glcanvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
shaderProgram_wallflash = initShaderProgram(gl, vsSource_wallflash, fsSource_wallflash);

programInfo_wallflash = {
    program: shaderProgram_wallflash,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram_wallflash, 'aVertexPosition'),
      vertexNormal: gl.getAttribLocation(shaderProgram_wallflash, 'aVertexNormal'),
      textureCoord: gl.getAttribLocation(shaderProgram_wallflash, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram_wallflash, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram_wallflash, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderProgram_wallflash, 'uNormalMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram_wallflash, 'uSampler'),
      flash_on: gl.getUniformLocation(shaderProgram_wallflash, 'flash_on'),
    },
  };

var init_time = new Date();
var time_now;
var is_greyscale;

var player;
var police;
var dog;
var score;

var is_crouching;

all_tiles = []

bricks = []
invalid_brick = []

barricades = []
invalid_barricades = []

thorns = []
invalid_thorns = []

fly_ups = []
invalid_fly_ups =[]

boots = []
invalid_boots = []

shields = []
invalid_shields = []

var wall_left
var wall_right

coins = []
invalid_coin = []

var police_close = 1;
var police_timer = 600;

flames = []
invalid_flames = []

missiles = []
invalid_missiles = []

var fly_time = 0;
var shield_time = 0;
var boot_time = 0;

var flash_time = 0;
var flash_state = 0;

main(all_tiles);

function main(tiles)
{
  // init_time = new Date();
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  
  player = new Player(gl, [0.0, 0.0, -3.0]);
  wall_left = new Wall(gl, [-6.0, 0.0, 0.0])
  wall_right = new Wall(gl, [6.0, 0.0, 0.0])
  score = 0;
  police_close = 1;
  police_timer = 600;

  is_crouching = 0;
  is_greyscale = 0;

  police = new Police(gl, [0.5, 0.0, 0.0]);
  dog = new Dog(gl, [0.65 / 2, 0.0, 0.0]);

  for(var i = 0; i < 600; i++)
  {
    for(var j = 0; j < 3; j++)
    {
      one_tile = new Tile(gl, [j * 5 - 5, 0, i * (-5) + 10]);
      tiles.push(one_tile);
    }
  }

  type = 0;

  for(var i = 100; i < 1000; i = i + 20)
  {
    lane = Math.floor(Math.random() * 3) - 1;

    if(type == 0)
    {
      brick = new Brick(gl, [lane * 5, 0.0, -i]);
      bricks.push(brick);
      invalid_brick.push(0);
    }

    if(type == 1)
    {
      thorn = new Thorn(gl, [lane * 5, 0.0, -i]);
      thorns.push(thorn);
      invalid_thorns.push(0);
    }

    if(type == 2)
    {
      barricade = new Barricade(gl, [lane * 5, 0.0, -i]);
      barricades.push(barricade);
      invalid_barricades.push(0);
    }

    type++;
    type %= 3;
  }

  type = 0;

  for(var i = 130; i < 1000; i = i + 100)
  {
    lane = Math.floor(Math.random() * 3) - 1;

    if(type == 0)
    {
      flier = new Fly(gl, [lane * 5, 0.2, -i]);
      fly_ups.push(flier);
      invalid_fly_ups.push(0);
    }

    else if(type == 1)
    {
      boot = new Jump(gl, [lane * 5, 0.25, -i]);
      boots.push(boot);
      invalid_boots.push(0);
    }
    else if(type == 2)
    {
      protect = new Shield(gl, [lane * 5, 0.18, -i]);
      shields.push(protect);
      invalid_shields.push(0);
    }

    type = type + 1;
    type %= 3;
  }

  for(var i = 0; i < 1000; i = i + 2)
  {
    lane = Math.floor(Math.random() * 3) - 1;
    coin = new Coin(gl, [lane * 5, 1.4, -i]);
    coins.push(coin);
    invalid_coin.push(0);
  }

  for(var i = 200; i < 2000; i = i + 50)
  {
    lane = Math.floor(Math.random() * 3) - 1;
    flame = new Flame(gl, [lane * 5, 0.1, -i]);
    flames.push(flame);
    invalid_flames.push(0);
  }

  for(var i = 225; i < 2000; i = i + 50)
  {
    lane = Math.floor(Math.random() * 3) - 1;
    missile = new Missile(gl, [lane * 5, 0.1, -i]);
    missiles.push(missile);
    invalid_missiles.push(0);
  }


  // If we don't have a GL context, give up now

  if (!gl)
  {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  // Vertex shader program
  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
    }
  `;

  // Fragment shader program
  const fsSource = `
    varying highp vec2 vTextureCoord;

    uniform sampler2D uSampler;

    void main(void) {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
  `;

  const fsSource_grey = `
   precision mediump float;
   varying highp vec2 vTextureCoord;

   uniform sampler2D uSampler;
    
    void main(void) {
        vec4 color = texture2D(uSampler, vTextureCoord);
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        gl_FragColor = vec4(vec3(gray), 1.0);
    }
  `;
  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  const shaderProgram_grey = initShaderProgram(gl, vsSource, fsSource_grey);

  //const wall_texture = loadtexture(gl, 'wall_tex.jpg')

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVevrtexColor and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
    },
  };

  const programInfo_grey = {
    program: shaderProgram_grey,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram_grey, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram_grey, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram_grey, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram_grey, 'uModelViewMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram_grey, 'uSampler'),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  //const buffers

  var then = 0;

  // Draw the scene repeatedly
  function render(now)
  {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;

    if(is_greyscale == 0)
      drawScene(gl, programInfo, deltaTime);
    else
      drawScene(gl, programInfo_grey, deltaTime);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

//
// Draw the scene.
//
function drawScene(gl, programInfo, deltaTime)
{
  ++flash_time;
  if(flash_time == 100)
  {
    flash_state ^= 1;
    flash_time = 0;
  }
  //time_now = new Date();
  // flash_state = ((time_now - init_time)/1000)% 2;

  //gl.uniform1i(programInfo_wallflash.uniformLocations.flash_on, Math.floor(((new Date() - init_time)/1000)% 2));

  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
    var cameraMatrix = mat4.create();
    mat4.translate(cameraMatrix, cameraMatrix, [0.0, 9.5, player.position[2] + 15.5]);
    var cameraPosition = [
      cameraMatrix[12],
      cameraMatrix[13],
      cameraMatrix[14],
    ];

    var look_at = [0.0, 0.0, player.position[2]]
    var up = [0, 1, 0];

    mat4.lookAt(cameraMatrix, cameraPosition, look_at, up);

    var viewMatrix = cameraMatrix;//mat4.create();

    //mat4.invert(viewMatrix, cameraMatrix);

    var viewProjectionMatrix = mat4.create();

    mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

  if(player.position[2] < -1050)
  {
    gameOver(1);
  }
  
  if(police_close == 1 && police_timer == 0)
  {
    police_close = 0;
  }

  if(police_timer > 0)
  {
    --police_timer;
    if(police_timer == 0)
    {
      console.log("The Police fell behind");
      police_close = 0;
    }
  }

  if(boot_time > 0)
  {
    --boot_time;
  }

  if(fly_time > 0)
  {
    --fly_time;
  }

  if(shield_time > 0)
  {
    --shield_time;
  }

  if(flash_state == 0 && is_greyscale == 0)
  {
    wall_left.drawWall(gl, viewProjectionMatrix, programInfo_wallflash, deltaTime);
    wall_right.drawWall(gl, viewProjectionMatrix, programInfo_wallflash, deltaTime);
  }
  else
  {
    wall_left.drawWall(gl, viewProjectionMatrix, programInfo, deltaTime);
    wall_right.drawWall(gl, viewProjectionMatrix, programInfo, deltaTime);
  }

  draw_location = []
  draw_location.push(player.position[0]);
  draw_location.push(0.675 / 2);
  draw_location.push(player.position[2] + 3.5);

  //c1.drawCube(gl, projectionMatrix, programInfo, deltaTime);
  for(var i = 0; i < all_tiles.length; i++)
  {
    if(all_tiles[i].pos[2] < player.position[2] + 10 && all_tiles[i].pos[2] > player.position[2] - 100)
      all_tiles[i].drawTile(gl, viewProjectionMatrix, programInfo, deltaTime);
  }



  for(var i = 0; i < bricks.length; i++)
  {
    if(invalid_brick[i] == 1)
    {
      continue;
    }
    if(shield_time <= 0 && check_collision(bricks[i].get_info(), player.get_info()))
    {
      invalid_brick[i] = 1;
      score = score - 1000;
      if(police_close == 1)
      {
        console.log("Game Over :(")
        console.log("Score = ", score)
        gameOver();
      }
      else
      {
        console.log("You Hit a Brick. Be Careful");
        player.slow_down();
        police_close = 1;
        police_timer = 600;
        continue;
      }
    }
    if(shield_time > 0 && check_collision(bricks[i].get_info(), player.get_info()))
    {
      console.log("You broke a Brick");
      invalid_brick[i] = 1;
      score += 200;
      continue;
    }
    if(bricks[i].pos[2] < player.position[2] + 10 && bricks[i].pos[2] > player.position[2] - 100)
      bricks[i].drawBrick(gl, viewProjectionMatrix, programInfo, deltaTime);
  }



  for(var i = 0; i < flames.length; i++)
  {
    if(invalid_flames[i] == 1)
      continue;
    if(shield_time <= 0 && check_collision(flames[i].get_info(), player.get_info()))
    {
      console.log("Game Over :(");
      gameOver();
    }
    else if(shield_time > 0 && check_collision(flames[i].get_info(), player.get_info()))
    {
      console.log("You Extinguished a Fireball")
      score += 200;
      invalid_flames[i] = 1;
    }
    if(flames[i].pos[2] < player.position[2] + 10 && flames[i].pos[2] > player.position[2] - 100)
      flames[i].drawFlame(gl, viewProjectionMatrix, programInfo, deltaTime);
  }



  for(var i = 0; i < thorns.length; i++)
  {
    if(invalid_thorns[i] == 1)
      continue;
    if(shield_time <= 0 && check_collision(thorns[i].get_info(), player.get_info()))
    {
      console.log("Game Over :(");
      gameOver();
    }
    else if(shield_time > 0 && check_collision(thorns[i].get_info(), player.get_info()))
    {
      invalid_thorns[i] = 1;
      console.log("You Extinguished a Bonfire");
      score += 100;
      continue;
    }
    if(thorns[i].pos[2] < player.position[2] + 10 && thorns[i].pos[2] > player.position[2] - 100)
      thorns[i].drawThorn(gl, viewProjectionMatrix, programInfo, deltaTime);
  }

  for(var i = 0; i < boots.length; i++)
  {
    if(invalid_boots[i] == 1)
    {
      continue;
    }
    if(check_collision(boots[i].get_info(), player.get_info()))
    {
      invalid_boots[i] = 1;
      console.log("You can jump higher for a while");
      boot_time = 300;
    }
    if(boots[i].pos[2] < player.position[2] + 10 && boots[i].pos[2] > player.position[2] - 100)
      boots[i].drawJump(gl, viewProjectionMatrix, programInfo, deltaTime);
  }

  for(var i = 0; i < fly_ups.length; i++)
  {
    if(invalid_fly_ups[i] == 1)
    {
      continue;
    }
    if(check_collision(fly_ups[i].get_info(), player.get_info()))
    {
      invalid_fly_ups[i] = 1;
      console.log("Lets Fly");
      fly_time = 400;
    }
    if(fly_ups[i].pos[2] < player.position[2] + 10 && fly_ups[i].pos[2] > player.position[2] - 100)
      fly_ups[i].drawFly(gl, viewProjectionMatrix, programInfo, deltaTime);
  }

  for(var i = 0; i < shields.length; i++)
  {
    if(invalid_shields[i] == 1)
    {
      continue;
    }
    if(check_collision(shields[i].get_info(), player.get_info()))
    {
      invalid_shields[i] = 1;
      console.log("You have been shielded");
      shield_time = 500;
    }
    if(shields[i].pos[2] < player.position[2] + 10 && shields[i].pos[2] > player.position[2] - 100)
      shields[i].drawShield(gl, viewProjectionMatrix, programInfo, deltaTime);
  }

  for(var i = 0; i < coins.length; i++)
  {
    if(invalid_coin[i] == 1)
    {
      continue;
    }
    if(check_collision(coins[i].get_info(), player.get_info()))
    {
      score = score + 50;
      console.log("You Got a Coin");
      invalid_coin[i] = 1;
      continue;
    }
    if(coins[i].pos[2] < player.position[2] + 10 && coins[i].pos[2] > player.position[2] - 100)
      coins[i].drawCoin(gl, viewProjectionMatrix, programInfo, deltaTime);
  }

  for(var i = 0; i < barricades.length; i++)
  {
    if(invalid_barricades[i] == 1)
    {
      continue;
    }
    if(shield_time <= 0 && is_crouching == 0 && check_collision(barricades[i].get_info(), player.get_info()))
    {
      invalid_barricades[i] = 1;
      score = score - 1000;
      if(police_close == 1)
      {
        console.log("Game Over :(")
        console.log("Score = ", score)
        gameOver();
      }
      else
      {
        console.log("You Hit a Barricade. Be Careful");
        player.slow_down();
        police_close = 1;
        police_timer = 600;
        continue;
      }
    }
    if(shield_time > 0 && check_collision(barricades[i].get_info(), player.get_info()))
    {
      score += 300;
      console.log("You Broke a Barricade");
      invalid_barricades[i] = 1;
      continue;
    }
    if(barricades[i].pos[2] < player.position[2] + 10 && barricades[i].pos[2] > player.position[2] - 100)
      barricades[i].drawBarricade(gl, viewProjectionMatrix, programInfo, deltaTime);
  }

  for(var i = 0; i < missiles.length; i++)
  {
    if(invalid_missiles[i] == 1)
      continue;
    if(shield_time <= 0 && check_collision(missiles[i].get_info(), player.get_info()))
    {
      invalid_missiles[i] = 1;
      score = score - 1000;
      if(police_close == 1)
      {
        console.log("Game Over :(")
        console.log("Score = ", score)
        gameOver();
      }
      else
      {
        console.log("A Missile hit you. Be Careful");
        player.slow_down();
        police_close = 1;
        police_timer = 600;
        continue;
      }
    }
    else if(shield_time > 0 && check_collision(missiles[i].get_info(), player.get_info()))
    {
      console.log("You Sabotaged a Missile");
      score += 150;
      invalid_missiles[i] = 1;
      continue;
    }
    if(missiles[i].pos[2] < player.position[2] + 10 && missiles[i].pos[2] > player.position[2] - 100)
      missiles[i].drawMissile(gl, viewProjectionMatrix, programInfo, deltaTime);
  }

  dog.drawDog(gl, viewProjectionMatrix, programInfo, deltaTime, draw_location);

  if(police_timer > 0)
  {
    draw_location[1] = 0.675 / 2;
    draw_location[2] += 4.25;
    if(police_timer > 500)
      draw_location[2] += (2.2 * ((police_timer - 500) / 100));
    else if(police_timer < 100)
      draw_location[2] += (2.2 * ((100 - police_timer) / 100));
    police.drawPolice(gl, viewProjectionMatrix, programInfo, deltaTime, draw_location);
  }

  player.drawPlayer(gl, viewProjectionMatrix, programInfo, deltaTime, fly_time, boot_time);
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource)
{
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source)
{
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function check_collision(obj1, obj2)
{
  //check x axis
  if(Math.abs(obj1['x'] - obj2['x']) * 2 < obj1['width'] + obj2['width'])
   {
      //check the Y axis
      if(Math.abs(obj1['y'] - obj2['y']) * 2 < obj1['height'] + obj2['height'])
      {
        //check the Z axis
        if(Math.abs(obj1['z'] - obj2['z']) * 2< obj1['depth'] + obj2['depth'])
        {
          return true;
        }
      }
   }

   return false;
}

document.addEventListener('keydown', function(event)
{
  console.log(event.keyCode);
  if(event.keyCode == 37)
  {
    console.log("Moving Left");
    player.shift_left(); 
  }
  else if(event.keyCode == 39)
  {
    console.log("Moving right");
    player.shift_right();
  }
  else if(event.keyCode == 32)
  {
    player.jump();
    console.log("Jump");
  }
  else if(event.keyCode == 40)
  {
    is_crouching = 1;
    player.crouchDown();
    console.log("Crouching");
  }
  else if(event.keyCode == 71)
  {
    is_greyscale ^= 1;
    console.log("Changing to Greyscale");
  }
}, true);

document.addEventListener('keyup', function(event)
{
  if(event.keyCode == 40)
  {
    is_crouching = 0;
    player.getUp();
    console.log("Getting Up");
  }
}, true);

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url)
{
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn off mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value)
{
  return (value & (value - 1)) == 0;
}

function gameOver(value)
{
  if(value == 1)
  {
    alert("You Won.\n Score :" + score);
  }
  else
  {
    alert("You Died.\n Score :" + score);
  }
}