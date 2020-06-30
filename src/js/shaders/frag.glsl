varying vec3 vNormal;
varying vec2 vUv;
uniform vec3 color;
uniform float scrollProgress;
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform vec2 u_res;

void main(){
    vec4 texel0, texel1, resultColor;
    vec2 nRes = normalize(u_res);
    vec2 newUV = (vUv - vec2(0.5)) * vec2(1. , 1. ) + vec2(0.5);
    vec2 p = newUV;
    float x = scrollProgress;

    float colorProgress = scrollProgress * 1. - p.y * 1. * scrollProgress * p.x  + 1.;

    x = smoothstep(.0, 1., ( x * colorProgress + p.x - 1.0 ));

    texel0 = texture2D(texture1, (p-.5) * (1.-x) + .5);
    texel1 = texture2D(texture2, (p-.5) * x + .5);

    resultColor = mix(texel0, texel1, x);

    gl_FragColor = resultColor;
}