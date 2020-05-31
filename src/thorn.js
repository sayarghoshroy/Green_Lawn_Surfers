/// <reference path="webgl.d.ts" />

let Thorn = class
{
    constructor(gl, pos)
    {
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

        this.positions = [
            // Front face
            0.0,  3.5,  0.0,
            -1.0, -1.0,  1.0,
            1.0, -1.0,  1.0,
            // Right face
            0.0,  3.5,  0.0,
            1.0, -1.0,  1.0,
            1.0, -1.0, -1.0,
            // Back face
            0.0,  3.5,  0.0,
            1.0, -1.0, -1.0,
            -1.0, -1.0, -1.0,
            // Left face
            0.0,  3.5,  0.0,
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0
        ];

        this.rotation = 0;

        this.pos = pos;

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positions), gl.STATIC_DRAW);

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // This array defines each face as two triangles, using the
        // indices into the vertex array to specify each triangle's
        // position.

        const indices = [
            0, 1, 2,    
            3, 4, 5,
            6, 7, 8,
            9, 10, 11,            
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
				  ];

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
				            gl.STATIC_DRAW);

        this.texture = loadTexture(gl, "./icons/flame.jpeg");

        this.buffer = {
            position: this.positionBuffer,
            textureCoord: textureCoordBuffer,
            indices: indexBuffer,
        }
    }

    drawThorn(gl, projectionMatrix, programInfo, deltaTime) {

        const modelViewMatrix = mat4.create();
        mat4.translate(
            modelViewMatrix,
            modelViewMatrix,
            this.pos
        );
        mat4.rotate(modelViewMatrix,
            modelViewMatrix,
            this.rotation,
            [1, 1, 1]);

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
            const vertexCount = 12;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }
    }

    get_info()
    {
        return {
            x : this.pos[0],
            y : this.pos[1],
            z : this.pos[2],
            height : 2,
            width : 2,
            depth : 2
        }
    }
};