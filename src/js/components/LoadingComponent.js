import ThreeMainScene from "./ThreeMainScene.js"

import textures from "../textures/textures.json"

import * as THREE from 'three';

class LoadingComponent {
    constructor() {
        this._setup();
    }

    _setup() {
        this._promises = [];
        this.textures = {};

        this._loadAssets().then(() => this._assetsLoadedHandler());
    }

    _loadAssets() {
        let totalItems = textures.length;
        let textureLoader = new THREE.TextureLoader();

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

        // Promise.all(this._promises).then(() => this._loadHandler())

        return Promise.all(this._promises);
    }

    _assetsLoadedHandler() {
        new ThreeMainScene(this.textures);
    }

}

export default LoadingComponent;