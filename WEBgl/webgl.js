let gl; // Global variabel til WebGL-konteksten
let shaderProgram; // Global variabel til shader-programmet

function main() {
    // Henter canvas-elementet fra HTML
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) {
        console.error("Canvas-elementet blev ikke fundet!");
        return;
    }

    // Initialiserer WebGL-konteksten
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
        alert('WebGL kunne ikke initialiseres. Din browser eller computer understøtter det måske ikke.');
        return;
    }

    // Sørger for, at canvas har den rigtige størrelse
    resizeCanvasToDisplaySize(gl.canvas);

    // Sætter viewporten til at matche canvas-størrelsen
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Initialiserer farver og dybdeindstillinger
    initViewportAndClearSettings(gl);

    // Initialiserer shaders og linker dem til et program
    shaderProgram = initShaders(gl);
    if (!shaderProgram) {
        console.error("Kunne ikke initialisere shaders.");
        return;
    }

    // Aktiverer shader-programmet
    gl.useProgram(shaderProgram);

    // Opsætter trekantens geometri og farver
    setupGeometry(gl, shaderProgram);

    // Tegner trekanten
    render(gl);

    console.log("WebGL trekant er klar.");
}

function resizeCanvasToDisplaySize(canvas) {
    // Tjekker om canvas-størrelsen skal opdateres
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        console.log(`Canvas blev ændret til ${displayWidth}x${displayHeight}`);
        return true;
    }
    return false;
}

function initViewportAndClearSettings(gl) {
    // Sætter baggrundsfarven til blå
    gl.clearColor(0.0, 0.4, 0.6, 1.0);

    // Aktiverer dybdetest for at håndtere 3D-objekter korrekt
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Aktiverer culling for at ignorere bagsiden af objekter
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
}

function initShaders(gl) {
    // Henter shader-koden fra HTML
    const vsElement = document.getElementById('vertex-shader');
    const fsElement = document.getElementById('fragment-shader');
    if (!vsElement || !fsElement) {
        console.error("Shader-elementet blev ikke fundet!");
        return null;
    }

    // Læser shader-koden
    const vsSource = vsElement.textContent;
    const fsSource = fsElement.textContent;
    if (!vsSource || !fsSource || vsSource.trim() === '' || fsSource.trim() === '') {
        console.error("Shader-koden er tom eller ugyldig!");
        return null;
    }

    // Kompilerer vertex og fragment shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) {
        return null;
    }

    // Linker shaders til et program
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return null;
    }

    // Validerer programmet
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('Fejl ved validering af shader-program:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return null;
    }

    return program;
}

function createShader(gl, type, source) {
    // Opretter og kompilerer en shader
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // Tjekker om kompilationen lykkedes
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    console.error(`Fejl ved kompilation af ${type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'} shader:`, gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
}

function createProgram(gl, vertexShader, fragmentShader) {
    // Opretter et shader-program og linker shaders
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    // Tjekker om linkningen lykkedes
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    console.error('Fejl ved linkning af shader-program:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
}

function setupGeometry(gl, program) {
    // Definerer trekantens positioner og farver
    const vertices = [
        0.0, 0.5, 0.0, 1.0, 0.0, 0.0, // Top (rød)
        -0.5, -0.5, 0.0, 0.0, 1.0, 0.0, // Venstre (grøn)
        0.5, -0.5, 0.0, 0.0, 0.0, 1.0 // Højre (blå)
    ];

    // Opretter en buffer og sender data til GPU'en
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Henter attribut-lokationer fra shader-programmet
    const posAttribLocation = gl.getAttribLocation(program, 'Pos');
    const colorAttribLocation = gl.getAttribLocation(program, 'Color');
    if (posAttribLocation === -1 || colorAttribLocation === -1) {
        console.error("Attribut-lokation blev ikke fundet.");
        return;
    }

    // Aktiverer og konfigurerer attributterne
    gl.enableVertexAttribArray(posAttribLocation);
    gl.enableVertexAttribArray(colorAttribLocation);

    const posSize = 3; // 3 værdier pr. position (x, y, z)
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 6 * Float32Array.BYTES_PER_ELEMENT; // 6 værdier pr. vertex
    const posOffset = 0;
    gl.vertexAttribPointer(posAttribLocation, posSize, type, normalize, stride, posOffset);

    const colorSize = 3; // 3 værdier pr. farve (r, g, b)
    const colorOffset = 3 * Float32Array.BYTES_PER_ELEMENT; // Farve starter efter position
    gl.vertexAttribPointer(colorAttribLocation, colorSize, type, normalize, stride, colorOffset);
}

function render(gl) {
    // Rydder canvas og tegner trekanten
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const primitiveType = gl.TRIANGLES;
    const offset = 0;
    const count = 3; // Tegner 3 punkter (en trekant)
    gl.drawArrays(primitiveType, offset, count);
}