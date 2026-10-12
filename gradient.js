/* =========================================================
   Interstellar Gradient Background — Pure WebGL
   ========================================================= */
(function () {
  const canvas = document.getElementById("gradient-bg");
  if (!canvas) return;

  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (!gl) { canvas.style.display = "none"; return; }

  const vs = `attribute vec2 a_position; void main(){ gl_Position = vec4(a_position,0.0,1.0); }`;

  const fs = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;
    vec3 cDeep  = vec3(0.10,0.04,0.20);
    vec3 cBlack = vec3(0.01,0.01,0.04);
    vec3 cSky   = vec3(0.20,0.55,0.95);
    vec3 cViolet= vec3(0.45,0.25,0.75);
    vec3 cNebula= vec3(0.55,0.30,0.90);
    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){
      vec2 i=floor(p), f=fract(p);
      vec2 u=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),
                 mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
    }
    float fbm(vec2 p){
      float v=0.0,a=0.5;
      for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.0; a*=0.5; }
      return v;
    }
    void main(){
      vec2 uv = gl_FragCoord.xy/u_resolution.xy;
      vec2 p = uv*2.0-1.0;
      p.x *= u_resolution.x/u_resolution.y;
      float t = u_time*0.12;
      float n1 = fbm(p*1.4 + vec2(t,-t*0.7));
      float n2 = fbm(p*2.2 + vec2(-t*0.5,t*0.9) + n1*1.5);
      float n3 = fbm(p*3.5 + vec2(t*0.3,t*0.2) + n2);
      float dist = length(p);
      float radial = smoothstep(1.6,0.0,dist);
      vec3 col = cBlack;
      col = mix(col,cDeep, radial*0.9);
      col = mix(col,cViolet, smoothstep(0.3,0.9,n1)*0.7);
      col = mix(col,cNebula, smoothstep(0.5,1.0,n2)*0.5);
      col = mix(col,cSky,   smoothstep(0.65,1.0,n3)*0.45);
      float stars = hash(floor(uv*u_resolution.xy/3.0));
      stars = step(0.9985, stars);
      float tw = 0.5+0.5*sin(u_time*3.0 + hash(uv)*30.0);
      col += stars * tw * 0.9;
      gl_FragColor = vec4(col,1.0);
    }
  `;

  function sh(type, src){
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(prog, "a_position");
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "u_resolution");
  const uTime = gl.getUniformLocation(prog, "u_time");

  function resize(){
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + "px";
    canvas.style.height = window.innerHeight + "px";
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener("resize", resize);
  resize();

  const start = performance.now();
  function loop(){
    const t = (performance.now() - start) / 1000;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, t);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(loop);
  }
  loop();
})();