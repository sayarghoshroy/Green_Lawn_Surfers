/// <reference path="webgl.d.ts" />

let Player = class 
{
    constructor(gl, pos)
    {
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

        this.reduce = 0.01;
        this.crouch = 0;
        this.speed = 0.25
        this.accelerate = 0.001;

        this.positions = [
             // Front face
             -1.0, -1.0, 1.0 * this.reduce,
             1.0, -1.0, 1.0 * this.reduce,
             1.0, 1.0, 1.0 * this.reduce,
             -1.0, 1.0, 1.0 * this.reduce,
             //Back Face
             -1.0, -1.0, -1.0 * this.reduce,
             1.0, -1.0, -1.0 * this.reduce,
             1.0, 1.0, -1.0 * this.reduce,
             -1.0, 1.0, -1.0 * this.reduce,
             //Top Face
             -1.0, 1.0, -1.0 * this.reduce,
             1.0, 1.0, -1.0 * this.reduce,
             1.0, 1.0, 1.0 * this.reduce,
             -1.0, 1.0, 1.0 * this.reduce,
             //Bottom Face
             -1.0, -1.0, -1.0 * this.reduce,
             1.0, -1.0, -1.0 * this.reduce,
             1.0, -1.0, 1.0 * this.reduce,
             -1.0, -1.0, 1.0 * this.reduce,
             //Left Face
             -1.0, -1.0, -1.0 * this.reduce,
             -1.0, 1.0, -1.0 * this.reduce,
             -1.0, 1.0, 1.0 * this.reduce,
             -1.0, -1.0, 1.0 * this.reduce,
             //Right Face
             1.0, -1.0, -1.0 * this.reduce,
             1.0, 1.0, -1.0 * this.reduce,
             1.0, 1.0, 1.0 * this.reduce,
             1.0, -1.0, 1.0 * this.reduce,
        ];

        this.jump_increase = 1;
        this.rotation = 0;
        this.y_velocity = 0;
        this.position = pos;
        this.jumping = 0;
        this.present_track = 0;
        this.current_height = 0;

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positions), gl.STATIC_DRAW);
        
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // This array defines each face as two triangles, using the
        // indices into the vertex array to specify each triangle's
        // position.

        const indices = [
            0, 1, 2,    0, 2, 3, // front
            4, 5, 6,    4, 6, 7,
            8, 9, 10,   8, 10, 11,
            12, 13, 14, 12, 14, 15,
            16, 17, 18, 16, 18, 19,
            20, 21, 22, 20, 22, 23, 
        ];

        // Now send the element array to GL

        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(indices), gl.STATIC_DRAW);

        const textureCoordBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

                const textureCoordinates = [
                    // Front
                    0.0,  0.0,
                    1.0,  0.0,
                    1.0,  1.0,
                    0.0,  1.0,
                    // Back
                    0.0,  0.0,
                    1.0,  0.0,
                    1.0,  1.0,
                    0.0,  1.0,
                    // Top
                    0.0,  0.0,
                    1.0,  0.0,
                    1.0,  1.0,
                    0.0,  1.0,
                    // Bottom
                    0.0,  0.0,
                    1.0,  0.0,
                    1.0,  1.0,
                    0.0,  1.0,
                    // Right
                    0.0,  0.0,
                    1.0,  0.0,
                    1.0,  1.0,
                    0.0,  1.0,
                    // Left
                    0.0,  0.0,
                    1.0,  0.0,
                    1.0,  1.0,
                    0.0,  1.0,
                  ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                            gl.STATIC_DRAW);

        this.texture = loadTexture(gl, "./icons/player_n.png");

        this.buffer = {
            position: this.positionBuffer,
            textureCoord: textureCoordBuffer,
            indices: indexBuffer,
        }

    }

    drawPlayer(gl, projectionMatrix, programInfo, deltaTime, is_flying, can_jump_high)
    {
        if(this.speed < 0.25)
        {
            this.speed += this.accelerate;
        }
        if(this.crouch == 1)
        {
            this.rotation = - 3.14 / 2;
        }
        else
        {
            this.rotation = 0;
        }

        if(can_jump_high > 1)
        {
            this.jump_increase = 2;
        }
        else
        {
            this.jump_increase = 1;
        }

        if(is_flying <= 0 && this.position[1] + this.y_velocity - 0.15 < 0)
        {
            //console.log("stopped");
            this.position[1] = 0;
            this.jumping = 0;
            this.y_velocity = 0;
        }

        //track change
        if(this.present_track == 0)
        {
            if(this.position[0] > -0.1 && this.position[0] < 0.1)
            {
                this.position[0] = 0;
            }
            else if(this.position[0] < 0)
            {
                this.position[0] += 0.2;
            }
            else
            {
                this.position[0] -= 0.2;
            }
        }

        else if(this.present_track == 1)
        {
            if(this.position[0] > 4.9)
            {
                this.position[0] = 5;
            }
            else
            {
                this.position[0] += 0.2
            }
        }

        else if(this.present_track == -1)
        {
            if(this.position[0] < -4.9)
            {
                this.position[0] = -5;
            }
            else
            {
                this.position[0] -= 0.2
            }
        }

        //move forward
        this.position[2] = this.position[2] - this.speed

        //jump
        if(is_flying <= 0)
        {
            if(this.position[1] >= 0)
            {
                if(this.position[1] + this.y_velocity <= 0)
                {
                    this.y_velocity = 0;
                    this.position[1] = 0;
                    this.jumping = 0;
                }

                else
                {
                    if(this.position[1] + this.y_velocity > 0.15)
                    {
                        this.position[1] += this.y_velocity;
                    }
                    this.y_velocity -= 0.15;
                }
            }
        }

        if(is_flying > 0)
        {
            this.position[1] = 5;
        }

        const modelViewMatrix = mat4.create();
        mat4.translate(
            modelViewMatrix,
            modelViewMatrix,
            this.position
        );
        mat4.rotate(modelViewMatrix,
            modelViewMatrix,
            this.rotation,
            [1, 0, 0]);

        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.position);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexPosition);
        }
        // tell webgl how to pull out the texture coordinates from buffer
        {
            const num = 2; // every coordinate composed of 2 values
            const type = gl.FLOAT; // the data in the buffer is 32 bit float
            const normalize = false; // don't normalize
            const stride = 0; // how many bytes to get from one set to the next
            const offset = 0; // how many bytes inside the buffer to start from
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.textureCoord);
            gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, num, type, normalize, stride, offset);
            gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
        }
        // Tell WebGL which indices to use to index the vertices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer.indices);

        // Tell WebGL to use our program when drawing

        gl.useProgram(programInfo.program);

        // Set the shader uniforms

        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix);
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix);

          // Tell WebGL we want to affect texture unit 0
          gl.activeTexture(gl.TEXTURE0);

          // Bind the texture to texture unit 0
          gl.bindTexture(gl.TEXTURE_2D, this.texture);

          // Tell the shader we bound the texture to texture unit 0
          gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

        {
            const vertexCount = 36;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }

    }

    jump()
    {
        if(this.position[1] == 0 && this.jumping == 0)
        {
            console.log("Jumped");
            this.y_velocity = 1.25 * this.jump_increase;
            this.jumping = 1;
        }
    }
    shift_left()
    {
        if(this.present_track == 0 || this.present_track == 1)
        {
            this.present_track -= 1;
        }
    }
    shift_right()
    {
        if(this.present_track == 0 || this.present_track == -1)
        {
            this.present_track += 1;
        }
    }

    crouchDown()
    {
        this.crouch = 1;
    }

    getUp()
    {
        this.crouch = 0;
    }

    get_info()
    {
        return {
            x : this.position[0],
            y : this.position[1],
            z : this.position[2],
            height : 2,
            width : 2,
            depth : 2
        }
    }

    slow_down()
    {
        this.speed = 0.03;
    }
};