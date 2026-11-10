"use client";

import { useEffect, useRef, useState } from "react";

const vertexSource = `attribute vec2 position; void main(){gl_Position=vec4(position,0.,1.);}`;
const fragmentSource = `
precision highp float;
uniform vec2 resolution;
uniform vec2 pointer;
uniform float time;
uniform float variation;
mat2 rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
float shape(vec3 p){
  p.xz=rot(.35+time*.095+pointer.x*.24)*p.xz;
  p.yz=rot(.65+pointer.y*.18)*p.yz;
  p.xy=rot(-.4+time*.04)*p.xy;
  float a=atan(p.y,p.x);
  float radius=1.02+.10*cos(a*3.+variation);
  vec2 q=vec2(length(p.xy)-radius,p.z);
  float b=atan(q.y,q.x);
  return length(q)-(.37+.045*cos(a*3.+variation))+.004*sin(a*96.+b*3.);
}
vec3 normal(vec3 p){vec2 e=vec2(.0015,0.);return normalize(vec3(shape(p+e.xyy)-shape(p-e.xyy),shape(p+e.yxy)-shape(p-e.yxy),shape(p+e.yyx)-shape(p-e.yyx)));}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*resolution)/min(resolution.x,resolution.y);
  vec3 ro=vec3(0.,0.,4.4),rd=normalize(vec3(uv*3.35,-4.));
  float t=0.;float d=0.;
  for(int i=0;i<80;i++){d=shape(ro+rd*t);if(d<.0016||t>7.)break;t+=d*.72;}
  if(t>7.){gl_FragColor=vec4(0.);return;}
  vec3 p=ro+rd*t,n=normal(p),l=normalize(vec3(-3.,4.,5.));
  float dif=max(dot(n,l),0.);
  float ao=clamp(shape(p+n*.16)/.16,.35,1.);
  float spec=pow(max(dot(reflect(-l,n),-rd),0.),34.);
  float fres=pow(1.-max(dot(n,-rd),0.),3.);
  vec3 blue=vec3(.075,.20,.80);
  vec3 col=blue*(.42+dif*.85)*ao+vec3(.46,.63,1.)*spec*.54+vec3(.18,.32,.6)*fres*.35;
  col=mix(col,vec3(.57,.69,1.),pow(dif,5.)*.23);
  gl_FragColor=vec4(pow(col,vec3(.91)),1.);
}`;

export default function SoftSculpture({ reduced }: { reduced: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const target = useRef({ x: 0, y: 0, variation: 0 });
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const gl = el.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) { setFallback(true); return; }
    const shaders: WebGLShader[] = [];
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
      shaders.push(shader); return shader;
    };
    const vert = compile(gl.VERTEX_SHADER, vertexSource), frag = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vert || !frag) { shaders.forEach(s => gl.deleteShader(s)); setFallback(true); return; }
    const program = gl.createProgram()!;
    gl.attachShader(program, vert); gl.attachShader(program, frag); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { setFallback(true); gl.deleteProgram(program); shaders.forEach(s => gl.deleteShader(s)); return; }
    gl.useProgram(program);
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position"); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    const uniforms = { resolution: gl.getUniformLocation(program,"resolution"), pointer: gl.getUniformLocation(program,"pointer"), time: gl.getUniformLocation(program,"time"), variation: gl.getUniformLocation(program,"variation") };
    let frame = 0, visible = true, last = 0, smoothX = 0, smoothY = 0, variant = 0, rendered = false;
    const resize = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio, 1.25);
      el.width = Math.round(rect.width*dpr); el.height = Math.round(rect.height*dpr);
      gl.viewport(0,0,el.width,el.height);
      rendered = false;
    }); resize.observe(el);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }); observer.observe(el);
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (!visible || document.hidden || now-last<33) return;
      if (reduced && rendered && Math.abs(target.current.variation-variant)<.001) return;
      last = now;
      smoothX += (target.current.x-smoothX)*.06; smoothY += (target.current.y-smoothY)*.06;
      variant += (target.current.variation-variant)*.035;
      gl.uniform2f(uniforms.resolution,el.width,el.height); gl.uniform2f(uniforms.pointer,reduced?0:smoothX,reduced?0:smoothY);
      gl.uniform1f(uniforms.time,reduced?0:now*.001); gl.uniform1f(uniforms.variation,variant);
      gl.drawArrays(gl.TRIANGLES,0,6);
      rendered = true;
    }; frame=requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); resize.disconnect(); observer.disconnect(); gl.deleteBuffer(buffer); gl.deleteProgram(program); shaders.forEach(s=>gl.deleteShader(s)); };
  }, [reduced]);
  return <button className="sculpture" aria-label="让蓝色形体变个样子" onPointerMove={event => { const r=event.currentTarget.getBoundingClientRect(); target.current.x=(event.clientX-r.left)/r.width-.5; target.current.y=(event.clientY-r.top)/r.height-.5; }} onPointerLeave={()=>{target.current.x=0;target.current.y=0;}} onClick={()=>{target.current.variation+=Math.PI;}}>
    <span className="sculpture-orbit orbit-one"/><span className="sculpture-orbit orbit-two"/>
    {fallback ? <span className="sculpture-fallback"/> : <canvas ref={canvas} aria-hidden="true"/>}
    <span className="sculpture-shadow"/><span className="sculpture-hint"><span>↗</span> 好奇的话，碰一下</span>
  </button>;
}
