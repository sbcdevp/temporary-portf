import ThreeMainScene from "./ThreeMainScene.js"

import textures from "../data/textures.json"
import models from "../data/models.json"

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

import * as THREE from 'three';

class LoadingComponent {
    constructor() {
        this._setup();
    }

    _setup() {
        this._promises = [];
        this.textures = {};
        this.models = {};        

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
                    this.textures[`${textures[i].name}`] = result;
                    this._texturesLoaded += 1;
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

    _assetsLoadedHandler() {
        new ThreeMainScene(this.textures, this.models);
    }

}

export default LoadingComponent;