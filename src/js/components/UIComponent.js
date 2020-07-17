import { gsap, TimelineLite, Power3, TweenLite } from "gsap";

gsap.registerPlugin();

class UIComponent {
    constructor() {
        this._mouse = {x: 0, y: 0};
        this._container = document.querySelector('.js-container');

        this._ui = {
            head: this._container.querySelector('.js-head'),
            leftEye: this._container.querySelector('.js-head .js-left'),
            rightEye: this._container.querySelector('.js-head .js-right')

        }
        this._setupEvents();
    }

    _setupEvents() {
        document.addEventListener("mousemove", () => this._mouseMoveHandler())
    }

    _mouseMoveHandler() {
        this._mouse = {x: event.pageX, y: event.pageY}
        this._moveHeadEyes();
    }

    _moveHeadEyes() {
        TweenLite.to(this._ui.leftEye, 0.5, {x: this._mouse.x * 0.007, y: this._mouse.y * 0.01})
        TweenLite.to(this._ui.rightEye, 0.5, {x: this._mouse.x * 0.007, y: this._mouse.y * 0.01})
    }
}
export default UIComponent;