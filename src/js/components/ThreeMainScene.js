import * as THREE from 'three';
import { gsap, TimelineLite, Power3, TweenLite } from "gsap";
import * as dat from 'dat.gui';

import vertexShader from '../shaders/vert.glsl'
import fragmentShader from '../shaders/frag.glsl'

import mod from '../utils/mod'

import textures from '../textures/textures.json'

gsap.registerPlugin();

const SETTINGS = {
    position : {
        x: 0,
        y: 0,
        z: 0
    }
}

class ThreeMainScene {
    constructor(textures) {

        this._textures = textures;

        this._canvas = document.querySelector('.js-canvas');

        this._slider = document.querySelector('.js-slider');
        this._container = document.querySelector('.js-container');

        this._ui = {
            slide: this._slider.querySelectorAll('.js-slide'),
            aboutContainer: this._container.querySelector('.js-about'),
            infoBtn: this._container.querySelector('.js-info-btn')
        }
        this._setup();

        // const gui = new dat.GUI();

        // let cameraView = gui.addFolder('cameraView');
        // cameraView.add(SETTINGS.position, 'x').min(-500).max(300).step(0.01).onChange(() => this._cameraSettingsChangedHandler())
        // cameraView.add(SETTINGS.position, 'y').min(-500).max(300).step(0.01).onChange(() => this._cameraSettingsChangedHandler())
        // cameraView.add(SETTINGS.position, 'z').min(-500).max(300).step(0.01).onChange(() => this._cameraSettingsChangedHandler())
    }

    _setup() {
        this._setupRenderer();

        this._setupValues();
        this._setupScene();
        
        this._animate();

        this._setupListeners();
        this._resize();
    }

    _setupListeners() {
        window.addEventListener('resize', () => this._resizeHandler());

        window.addEventListener("wheel", () => this._scrollHandler(), false);
        window.addEventListener("mousewheel", () => this._scrollHandler(), false);
        window.addEventListener("DOMMouseScroll", () => this._scrollHandler(), false);

        this._ui.infoBtn.addEventListener("click", () => this._openInfoContainer(), false)
    }

    _setupValues() {
        this._time = 0;
        this._currentSlide = 0
        this._lastSlide = 0
        this._sens = "-"
        this._isScrollEnabled = true
        this._wheelSensibility = 20

        this._slides = [this._textures.whole, this._textures.dfts, this._textures.louvre, this._textures.mirror];
    }

    _setupRenderer() {
        this._renderer = new THREE.WebGLRenderer({
            canvas: this._canvas,
            antialias: true,
            // alpha: true,
        });

        this._renderer.setPixelRatio(3);
    }

    _setupScene() {
        this._canvasSize = this._canvas.getBoundingClientRect();

        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(60, this._canvasSize.width/ this._canvasSize.height, 1, 1000);
        this._camera.position.set(SETTINGS.position.x, SETTINGS.position.y, SETTINGS.position.z);

        this._raycaster = new THREE.Raycaster();
        this._mouse = new THREE.Vector2();
        this._pointOfIntersection = new THREE.Vector3();

        this._setupSceneObjects();
    }

    _setupSceneObjects() {
        this._setupLights();
        this._setupPlane();
        // this._setupHeadObject();
    }

    _setupPlane() {
        let meshPositionZ = -1;

        let distance = this._camera.position.z - meshPositionZ + 1 ;
        let aspect = this._canvas.width / this._canvas.height;
        let vFov = this._camera.fov * Math.PI / 180;
        let planeHeightAtDistance = 2 * Math.atan(vFov / 2) * distance;
        let planeWidthAtDistance = planeHeightAtDistance * aspect;

        let geometry = new THREE.PlaneBufferGeometry( planeWidthAtDistance, planeHeightAtDistance);

        let uniforms = {
            color: { value: new THREE.Color( 0xffffff ) },
            scrollProgress: { value: 0 },
            texture1: { value: this._textures.whole },
            texture2: { value: this._textures.dfts }
        };

        this._shaderMaterial = new THREE.ShaderMaterial({
            uniforms: uniforms,
            fragmentShader: fragmentShader,
            vertexShader: vertexShader
        });
        this._sliderPlane = new THREE.Mesh( geometry, this._shaderMaterial );
        this._sliderPlane.position.set(0, 0, meshPositionZ);

        this._scene.add( this._sliderPlane );
    }

    _setupLights() {
        let ambientLight = new THREE.AmbientLight(0x404040, 19)
        this._scene.add(ambientLight);
    }

    _openInfoContainer() {
        let timeline = new TimelineLite();
        timeline
        .to(this._ui.infoBtn, 0.5, {y: "-100%", ease: Power3.easeIn, onComplete: () => {
            this._ui.infoBtn.innerHTML = "close";
        }})
        .fromTo(this._ui.infoBtn, 0.5, {y: "100%"}, {y: "0%", color: "#000", ease: Power3.easeOut})

        this._ui.aboutContainer.classList.add('active');
        this._shaderMaterial.uniforms.texture1.value = this._slides[this._currentSlide];
        this._shaderMaterial.uniforms.texture2.value = this._textures.about;
        TweenLite.to(this._shaderMaterial.uniforms.scrollProgress, 1.5, { value: 1 })
    }

    _animateSlideOnScroll(delta) {
        if (this._isScrollEnabled) {
            this._lastSlide = this._currentSlide;
            this._sens = delta === 1 ? '-' : '+'
            this._isScrollEnabled = false
            this._slideChange()
        }
    }

    _slideChange() {
        if (this._sens === "+") {
            this._currentSlide = mod(this._currentSlide += 1, this._slides.length);
            this._shaderMaterial.uniforms.texture2.value = this._slides[this._currentSlide];

            this._setSlideOutAnimation()
        } else {
            this._currentSlide = mod(this._currentSlide -= 1,this._slides.length);
            this._shaderMaterial.uniforms.texture2.value = this._slides[this._lastSlide - 1];

            this._setSlideOutAnimation()
        }
    }

    _setSlideOutAnimation(){
        let slideTitle = this._ui.slide[this._lastSlide].querySelector('.js-title');
        let slideSubtitle = this._ui.slide[this._lastSlide].querySelector('.js-subtitle');
        let timeline = new TimelineLite();
        
        timeline.fromTo(slideTitle, 0.3, {y: 0, autoAlpha: 1}, {y: "-100%", autoAlpha: 0, ease: Power3.easeIn});
        timeline.fromTo(slideSubtitle, 0.3, {y: 0, autoAlpha: 1}, {y: "-100%", autoAlpha: 0, ease: Power3.easeIn}, 0.1);

        TweenLite.to(this._shaderMaterial.uniforms.scrollProgress, 1.5, { value: 1,  onComplete: () => {
            this._ui.slide[this._lastSlide].classList.remove('active')
            this._setSlideEnterAnimation();
        }});
    }

    _setSlideEnterAnimation(){
        let slideTitle = this._ui.slide[this._currentSlide].querySelector('.js-title');
        let slideSubtitle = this._ui.slide[this._currentSlide].querySelector('.js-subtitle');

        let timeline = new TimelineLite();

        this._ui.slide[this._currentSlide].classList.add('active')
        
        timeline.fromTo(slideTitle, 1, {y: "100%", autoAlpha: 0 }, { y: "0%", autoAlpha: 1, ease: Power3.easeOut });
        timeline.fromTo(slideSubtitle, 1, {autoAlpha: 0, ease: Power3.easeOut }, { y: 0, autoAlpha: 1, ease: Power3.easeOut, onComplete: () => {
            this._updateSlideBackground();
            this._endScroll();
        }}, 0.2);

    }

    _updateSlideBackground() {
        this._shaderMaterial.uniforms.texture1.value = this._slides[this._currentSlide];
        this._shaderMaterial.uniforms.scrollProgress.value = 0
    }

    _endScroll() {
        this._isScrollEnabled = true;
    }

    _resize() {
        this._width = window.innerWidth;
        this._height = window.innerHeight;
        this._devicePixelRatio = window.devicePixelRatio;

        this._renderer.setSize(this._width, this._height);
        this._renderer.setPixelRatio(this._devicePixelRatio);

        this._camera.aspect = this._width/this._height;
        this._camera.updateProjectionMatrix();
    }

    _animate() {
        window.requestAnimationFrame(() => this._animate());
        this._render();
    }

    _render() {
        this._renderer.render(this._scene, this._camera)
    }

    _resizeHandler() {
        this._resize();
    }
    
    _scrollHandler() {
        let delta = Math.max(-1, Math.min(1, event.wheelDelta || -event.detail))
        this._animateSlideOnScroll(delta);
    }
    
    _clickHandler() {

    }

    _cameraSettingsChangedHandler() {
        this._camera.position.set(
            SETTINGS.position.x,
            SETTINGS.position.y,
            SETTINGS.position.z,
        );
    }
}

export default ThreeMainScene;