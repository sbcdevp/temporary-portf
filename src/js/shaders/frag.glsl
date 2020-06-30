varying vec3 vNormal;
varying vec2 vUv;
uniform vec3 color;
uniform float scrollProgress;
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform vec2 u_res;
uniform float textureRatio;
uniform float screenRatio;



float when_fgt(float x, float y) {
 return max(sign(x - y), 0.0);
}


vec2 correctRatio(vec2 inUv, float baseratio, float asp){
	return mix(
		vec2(
			inUv.x,
			inUv.y * baseratio / asp + .5 * ( 1. - baseratio / asp )
		),
		vec2(
			inUv.x * asp / baseratio + .5 * ( 1. - asp / baseratio),
			inUv.y
		)
		,when_fgt(baseratio, asp)
	);
}

void main(){
    vec4 texel0, texel1, resultColor;
    vec2 nRes = normalize(u_res);
    vec2 newUV = correctRatio(vUv, textureRatio, screenRatio);
    vec2 p = newUV;
    float x = scrollProgress;

    float colorProgress = scrollProgress * 1. - p.y * 1. * scrollProgress * p.x  + 1.;

    x = smoothstep(.0, 1., ( x * colorProgress + p.x - 1.0 ));

    texel0 = texture2D(texture1, (p-.5) * (1.-x) + .5);
    texel1 = texture2D(texture2, (p-.5) * x + .5);

    resultColor = mix(texel0, texel1, x);

    gl_FragColor = resultColor;
}