varying vec3 vNormal;
varying vec2 vUv;
uniform vec3 color;
uniform float scrollProgress;
uniform sampler2D texture1;
uniform sampler2D texture2;


// void main() {
//     gl_FragColor = mix(texture1,texture2, 1.0);
// }

// void main() {
//     vec4 texel0, texel1, texel2, resultColor;

//     float X = 1.;
//     float Y = 0.;
//     float Z = 1.;
//     float W = 1.;


//     texel0 = texture2D(texture1, vUv - fract(vec2(vUv.x * scrollProgress * vUv.y, vUv.y * scrollProgress * vUv.x * 10.) * vec2(scrollProgress * 0.5,scrollProgress)) * scrollProgress * 0.1 );
//     texel1 = texture2D(texture2, vec2(vUv.x, vUv.y));
    
//     float colorProgress = scrollProgress *X - vUv.y * Y + vUv.x *Z + W;

//     resultColor = mix(texel0, texel1, scrollProgress);
//     gl_FragColor = resultColor;
//   }

void main(){
    vec4 texel0, texel1, resultColor;

    vec2 newUV = (vUv - vec2(0.5)) * vec2(1., 1.) + vec2(0.5);
    vec2 p = newUV;
    float x = scrollProgress;

    float colorProgress = scrollProgress * 1.5 - p.y * 1. * scrollProgress * p.x  + 1.;

    x = smoothstep(.0, 1., ( x * colorProgress + p.x - 1.0 ));

    texel0 = texture2D(texture1, (p-.5) * (1.-x) + .5);
    texel1 = texture2D(texture2, (p-.5) * x + .5);

    resultColor = mix(texel0, texel1, x);

    gl_FragColor = resultColor;
}
  
// void main() {
//     vec3 light = vec3( 0.5, 0.2, 1.0 );
//     light = normalize( light );
//     float dProd = dot( vNormal, light ) * 0.5 + 0.5;
//     // vec4 tcolor = texture2D( texture, vUv );
//     vec4 color = vec4( vUv.x , vUv.y , 0., 1.0 );
//     gl_FragColor = color * vec4( vec3( dProd ) * vec3( color ), 1.0 ) ;
// }