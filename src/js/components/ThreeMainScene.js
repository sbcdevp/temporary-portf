import * as THREE from 'three';
import { gsap, TimelineLite, Power3, TweenLite } from "gsap";
import * as dat from 'dat.gui';

import vertexShader from '../shaders/vert.glsl'
import fragmentShader from '../shaders/frag.glsl'

import mod from '../utils/mod'

import SplitText from '../vendors/SplitText.js';
import Hammer from 'hammerjs';


gsap.registerPlugin();

const SETTINGS = {
    position : {
        x: 0,
        y: 0,
        z: 3
    }
}

class ThreeMainScene {
    constructor(textures, models) {

        this._textures = textures;
        this._models = models;

        this._canvas = document.querySelector('.js-canvas');

        this._slider = document.querySelector('.js-slider');
        this._container = document.querySelector('.js-container');

        this._ui = {
            slide: this._slider.querySelectorAll('.js-slide'),
            aboutContainer: this._container.querySelector('.js-about'),
            infoBtn: this._container.querySelector('.js-info-btn'),
            infoDescription: this._container.querySelector('.js-description'),
            socialLink: this._container.querySelectorAll('.js-social')
        }
        this._setup();

        // const gui = new dat.GUI();

        // let cameraView = gui.addFolder('cameraView');
        // cameraView.add(SETTINGS.position, 'x').min(-10).max(10).step(0.001).onChange(() => this._cameraSettingsChangedHandler())
        // cameraView.add(SETTINGS.position, 'y').min(-10).max(10).step(0.001).onChange(() => this._cameraSettingsChangedHandler())
        // cameraView.add(SETTINGS.position, 'z').min(-10).max(1000).step(0.001).onChange(() => this._cameraSettingsChangedHandler())
    }

    _setup() {
        this._setupValues();
        this._setupSplitText();
        this._setupHammer();

        this._setupRenderer();
        this._setupScene();
        this._animate();

        this._setupListeners();
        this._resize();
    }

    _setupHammer() {
        this.options = {
            direction: Hammer.DIRECTION_ALL
        }
        this.hammer = new Hammer(this._container, this.options);
        this.hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
    }

    _setupListeners() {
        window.addEventListener('resize', () => this._resizeHandler());

        window.addEventListener("wheel", () => this._scrollHandler(), false);
        window.addEventListener("mousewheel", () => this._scrollHandler(), false);
        window.addEventListener("DOMMouseScroll", () => this._scrollHandler(), false);

        this.hammer.on('swipeleft', (event) => this._swipeHandler(event))
        // this.hammer.on('panleft', (event) => this._swipeHandler(event))
        // this.hammer.on('panright', (event) => this._swipeHandler(event))
        this.hammer.on('swiperight', (event) => this._swipeHandler(event))

        document.addEventListener('mousemove', () => this._mouseMoveHandler());

        this._ui.infoBtn.addEventListener("click", () => this._toggleInfoContainer(), false)
    }


    _setupValues() {
        this._time = 0;
        this._currentSlide = 0
        this._lastSlide = 0
        this._sens = "-"
        this._isScrollEnabled = true
        this._wheelSensibility = 20
        this._isInfoEnabled = true
        this._slides = [this._textures.whole, this._textures.dfts, this._textures.louvre, this._textures.mirror, this._textures.jahneration];
    }

     _setupSplitText() {
        this._splitedInfoContent = new SplitText(this._ui.infoDescription, {
            type: 'words',
            wordsClass:"word++"
        });
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
        this._camera = new THREE.PerspectiveCamera(60, this._canvasSize.width/ this._canvasSize.height, 1, 5000);
        this._camera.position.set(SETTINGS.position.x, SETTINGS.position.y, SETTINGS.position.z);

        this._raycaster = new THREE.Raycaster();
        this._mouse = new THREE.Vector2();
        this._pointOfIntersection = new THREE.Vector3();

        this._mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -1);

        this._setupSceneObjects();
    }

    _setupSceneObjects() {
        this._setupLights();
        this._setupPlane();
        this._setupHeadObject();
    }

    _setupPlane() {
        let meshPositionZ = -1;

        let distance = this._camera.position.z - meshPositionZ + 1 ;
        let aspect = this._canvasSize.width / this._canvasSize.height;
        let vFov = this._camera.fov * Math.PI / 180;
        let planeHeightAtDistance = 2 * Math.atan(vFov / 2) * distance;
        let planeWidthAtDistance = planeHeightAtDistance * aspect;

        this._geometry = new THREE.PlaneBufferGeometry( planeWidthAtDistance, planeHeightAtDistance);

        let uniforms = {
            color: { value: new THREE.Color( 0xffffff ) },
            scrollProgress: { value: 0 },
            texture1: { value: this._textures.whole },
            texture2: { value: this._textures.dfts },
            u_res: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        };

        this._shaderMaterial = new THREE.ShaderMaterial({
            uniforms: uniforms,
            fragmentShader: fragmentShader,
            vertexShader: vertexShader,
            defines: {
                PR: window.devicePixelRatio.toFixed(1)
           }
        });

        this._sliderPlane = new THREE.Mesh( this._geometry, this._shaderMaterial );
        this._sliderPlane.position.set(0, 0, meshPositionZ);

        this._scene.add( this._sliderPlane );
    }

    _setupLights() {
        let ambientLight = new THREE.AmbientLight(0x404040, 19)
        this._scene.add(ambientLight);
    }

    _setupHeadObject() {
        this._head = this._models.head.scene;
        this._head.scale.set(0.1, 0.1, 0.1)
        this._head.position.set(-2.8, 1.25, 0.5)
        this._scene.add(this._head);
    }

    _updateHeadLookAt() {
        this._raycaster.setFromCamera(this._mouse, this._camera);
        this._raycaster.ray.intersectPlane(this._mousePlane, this._pointOfIntersection);
        this._head.lookAt(this._pointOfIntersection);
    }

    _toggleInfoContainer() {
        // this._ui.aboutContainer.classList.toggle('active');
        if(this._ui.infoBtn.innerHTML === "Info") {
            this._openInfoContainer();
        } else {
            this._closeInfoContainer();
        }
    }

    _openInfoContainer() {
        this._isScrollEnabled = false
        
        let timeline = new TimelineLite();
        let slideTitle = this._ui.slide[this._currentSlide].querySelector('.js-title');
        let slideSubtitle = this._ui.slide[this._currentSlide].querySelector('.js-subtitle');
        
        if(!this._isInfoEnabled) return;

        this._ui.aboutContainer.classList.add('active');
        TweenLite.to(this._ui.infoBtn, 0.5, {y: "-100%", ease: Power3.easeIn, onComplete: () => { 
            this._ui.infoBtn.innerHTML = "close";
            TweenLite.fromTo(this._ui.infoBtn, 1.5, {y: "100%"}, {y: "0%", color: "#000", ease: Power3.easeOut})
        }})
        // timeline.timeScale(0.1)
        timeline
        .fromTo(slideTitle, 0.3, {y: 0, autoAlpha: 1}, {y: "-100%", autoAlpha: 0, ease: Power3.easeIn})
        .fromTo(slideSubtitle, 0.3, {y: 0, autoAlpha: 1}, {y: "-100%", autoAlpha: 0, ease: Power3.easeIn, onComplete: () => {this._slider.classList.remove('active') }}, 0.1)
        
        .staggerFromTo(this._splitedInfoContent.words, 1, {y: "100%", autoAlpha: 0}, {y: "0%", autoAlpha: 1, ease: Power3.easeOut}, 0.01, 0.5)
        .staggerFromTo(this._ui.socialLink, 1, {y: "100%", autoAlpha: 0}, {y: "0%", autoAlpha: 1, ease: Power3.easeOut}, 0.2, 0.5)
        
        this._shaderMaterial.uniforms.texture2.value = this._textures.about;
        
        TweenLite.to(this._shaderMaterial.uniforms.scrollProgress, 1.5, { value: 1, onComplete: () => {
            this._splitedInfoContent.revert()
            this._shaderMaterial.uniforms.texture1.value = this._textures.about;
            this._shaderMaterial.uniforms.scrollProgress.value = 0    
            this._isInfoEnabled = true
        }}) 
        this._isInfoEnabled = false

    }

    _closeInfoContainer() {
        let timeline = new TimelineLite();
        let slideTitle = this._ui.slide[this._currentSlide].querySelector('.js-title');
        let slideSubtitle = this._ui.slide[this._currentSlide].querySelector('.js-subtitle');
        this._setupSplitText();


        if(!this._isInfoEnabled) return;

        this._slider.classList.add('active');
        TweenLite.to(this._ui.infoBtn, 0.5, {y: "-100%", ease: Power3.easeIn, onComplete: () => { 
            this._ui.infoBtn.innerHTML = "Info";
            TweenLite.fromTo(this._ui.infoBtn, 1.5, {y: "100%"}, {y: "0%", color: "#FFF", ease: Power3.easeOut})
        }})

        timeline
        .staggerTo(this._splitedInfoContent.words, 0.4, {y: "-100%", autoAlpha: 0, ease: Power3.easeIn}, 0.01, 0.1)
        .staggerTo(this._ui.socialLink, 0.4, {y: "-100%", autoAlpha: 0}, 0.1, 0.2)
        .to(this._shaderMaterial.uniforms.scrollProgress, 1.5, { value: 1, onComplete: () => {
            this._shaderMaterial.uniforms.texture1.value = this._slides[this._currentSlide];
            this._shaderMaterial.uniforms.scrollProgress.value = 0;
            this._ui.aboutContainer.classList.remove('active');
            this._isScrollEnabled = true
            this._isInfoEnabled = true
        } }, 0.3)
        timeline.fromTo(slideTitle, 1, {y: "100%", autoAlpha: 0 }, { y: "0%", autoAlpha: 1, ease: Power3.easeOut}, 0.4);
        timeline.fromTo(slideSubtitle, 1, {autoAlpha: 0, ease: Power3.easeOut }, { y: 0, autoAlpha: 1, ease: Power3.easeOut}, 0.4)        

        this._shaderMaterial.uniforms.texture2.value = this._slides[this._currentSlide];
        this._isInfoEnabled = false
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
            if(this._currentSlide === 3 && this._lastSlide === 0){
                this._shaderMaterial.uniforms.texture2.value = this._slides[this._slides.length -1];
            }else{
                this._shaderMaterial.uniforms.texture2.value = this._slides[this._lastSlide - 1];
            }
            this._setSlideOutAnimation()
        }
    }

    _setSlideOutAnimation(){
        let slideTitle = this._ui.slide[this._lastSlide].querySelector('.js-title');
        let slideSubtitle = this._ui.slide[this._lastSlide].querySelector('.js-subtitle');
        let timeline = new TimelineLite();
        
        timeline.fromTo(slideTitle, 0.3, {y: 0, autoAlpha: 1}, {y: "-100%", autoAlpha: 0, ease: Power3.easeIn})
        .fromTo(slideSubtitle, 0.3, {y: 0, autoAlpha: 1}, {y: "-100%", autoAlpha: 0, ease: Power3.easeIn}, 0.1)
        .to(this._shaderMaterial.uniforms.scrollProgress, 1, { value: 1,  onComplete: () => {
            this._ui.slide[this._lastSlide].classList.remove('active')
            this._setSlideEnterAnimation();
        }}, 0.1);
    }

    _setSlideEnterAnimation(){
        let slideTitle = this._ui.slide[this._currentSlide].querySelector('.js-title');
        let slideSubtitle = this._ui.slide[this._currentSlide].querySelector('.js-subtitle');

        let timeline = new TimelineLite();

        this._ui.slide[this._currentSlide].classList.add('active')
        this._updateSlideBackground();
        
        timeline.fromTo(slideTitle, 1, {y: "100%", autoAlpha: 0 }, { y: "0%", autoAlpha: 1, ease: Power3.easeOut}, 0.05);
        timeline.fromTo(slideSubtitle, 1, {autoAlpha: 0, ease: Power3.easeOut }, { y: 0, autoAlpha: 1, ease: Power3.easeOut, onComplete: () => {
            this._endScroll();
        }}, 0.1);

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
        
        this._canvas.width = this._width;
        this._canvas.height = this._height;
        // this._shaderMaterial.uniforms.u_res.value
        this._shaderMaterial.uniforms.u_res.value.x = this._width;
        this._shaderMaterial.uniforms.u_res.value.y = this._height;

        this._renderer.setSize(this._width, this._height);
        this._renderer.setPixelRatio(this._devicePixelRatio);
        this._renderer.setViewport(0, 0, window.innerWidth, window.innerHeight)
        // this._camera.fov = window.innerHeight / window.innerWidth;
        this._camera.aspect = this._width/this._height;
        this._camera.updateProjectionMatrix();
    }

    _animate() {
        window.requestAnimationFrame(() => this._animate());
        this._render();
    }

    _render() {
        // this._head.rotation.y += 0.015
        this._updateHeadLookAt();

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

    _swipeHandler(swipeEvent) {
        console.log("hello")
        if (this._isScrollEnabled) {
            this._lastSlide = this._currentSlide;
            this._sens = swipeEvent.type === "swiperight" ? '-' : '+';
            this._isScrollEnabled = false
            this._slideChange();
        }
    }

    _mouseMoveHandler() {
        this._mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this._mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
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