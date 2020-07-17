import ThreeMainScene from "./ThreeMainScene.js"
import UIComponent from "./UIComponent.js"


import textures from "../data/textures.json"
import models from "../data/models.json"

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

import * as THREE from 'three';

import {gsap, TweenLite, Power3} from 'gsap';

gsap.registerPlugin();


class LoadingComponent {
    constructor() {
        this._setup();
    }

    _setup() {
        this._promises = [];
        this.textures = {};
        this.models = {};    
        
        this._tweenObject = {
            value: 0
        }

        this._isFinished = false;

        this._ui = {
            mainContainer: document.querySelector(".js-container"),
            loader: document.querySelector(".js-loader"),
            textLoader: document.querySelector(".js-progress-loader")
        }

        this._ui.loader.style.visibility = "visible";


        this._loadAssets().then(() => this._assetsLoadedHandler());
    }

    _loadAssets() {
        let totalItems = textures.length;
        let textureLoader = new THREE.TextureLoader();
        
        let dracoLoader = new DRACOLoader();
        let gltfLoader = new GLTFLoader()
        dracoLoader.setDecoderPath('assets/draco/');
        gltfLoader.setDRACOLoader(dracoLoader);


        for (let i = 0; i < textures.length; i++) {
            let promise = new Promise(resolve => {
                textureLoader.load(textures[i].url, resolve);
                this.textures[`${textures[i].name}`] = {};
            })
                .then(result => {
                    this._loadingHandler(textures.length/totalItems * 100);
                    this.textures[`${textures[i].name}`] = result;
                    // this.components.textureLoader.updateProgress(this._modelsLoaded / totalItems * 100);
                });
            this._promises.push(promise);
        }

        for (let i = 0; i < models.length; i++) {
            let promise = new Promise(resolve => {
                gltfLoader.load(models[i].url, resolve);
                this.models[`${models[i].name}`] = {};
            })
                .then(result => {
                    this.models[`${models[i].name}`] = result;
                    this._modelsLoaded += 1;
                    // this.components.textureLoader.updateProgress(this._modelsLoaded / totalItems * 100);
                });
            this._promises.push(promise);
        }
        // Promise.all(this._promises).then(() => this._loadHandler())

        return Promise.all(this._promises);
    }

    _loadingHandler(progress) {
        TweenLite.to(this._tweenObject, .5, { value: progress, onUpdate: () => {
            this._ui.textLoader.innerHTML = Math.floor(this._tweenObject.value)
            if (this._tweenObject.value === 100) {
                this._loaderAnimationCompleted();
            }
        } })
    }

    _loaderAnimationCompleted() {
        if(!this._isFinished) {
            this._isFinished = true;
            TweenLite.to(this._ui.textLoader, 0.5, {y: "-50%", ease: Power3.easeIn, autoAlpha: 0, delay: 0.5 })

            TweenLite.to(this._ui.loader, 1, {height: 0, ease: Power3.easeInOut, display: "none", delay: 1, onComplete: () => this._threeScene.firstSlideAnimation()})
            this._ui.mainContainer.style.visibility = "visible";
        }
    }

    _assetsLoadedHandler() {
        this._threeScene = new ThreeMainScene(this.textures, this.models);
        new UIComponent();

    }

}

export default LoadingComponent;