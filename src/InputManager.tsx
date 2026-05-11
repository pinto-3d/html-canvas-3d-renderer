import { Vector2 } from "./2D"
import { Vector3 } from "./3D"

export interface EventMouseMove{
    position: Vector2;
    delta: Vector2;
}
export interface EventKeyMove{
    vector: Vector3;
}

export class InputManager {
    keys: Set<string> = new Set()
    key2eventMap: Map<string, string> = new Map<string, string>()
    mouseButtons: Set<number> = new Set()

    mouseX: number = 0
    mouseY: number = 0
    mouseDX: number = 0
    mouseDY: number = 0
    mouseWheelDelta: number = 0

    MOUSE_KEY_SPEED: number = 100

    moveVector: Vector3 = new Vector3()
    mouseVector: Vector2 = new Vector2()
    mouseDiffVector: Vector2 = new Vector2()

    keyMoveForward: string = "KeyW"
    keyMoveBack: string = "KeyS"
    keyMoveLeft: string = "KeyA"
    keyMoveRight: string = "KeyD"
    keyMoveUp: string = "Space"
    keyMoveDown: string = "ShiftLeft"

    keyLookForward: string = "ArrowUp"
    keyLookBack: string = "ArrowDown"
    keyLookLeft: string = "ArrowLeft"
    keyLookRight: string = "ArrowRight"

    keyEscape: string = "Escape"

    keyOpenFilePicker: string = "KeyF"

    static strELockMouse = 'lockMouse'
    static strEOpenFilePicker = 'openFilePicker'
    static strEMoveMouseKeysPressed = 'moveMouseKeysPressed'

    
    // Define the type for the mouse move event detail
    eventMouseMove: CustomEvent<EventMouseMove> = new CustomEvent('inputMouseMove', { detail: { position: new Vector2(), delta: new Vector2() } });
    eventKeyMove: CustomEvent<EventKeyMove> = new CustomEvent('inputKeyMove', { detail: { vector: new Vector3()} });

    constructor(){
        window.addEventListener('keydown', (e) => {
            this.addKey(e.code)
            e.stopPropagation()
        })

        window.addEventListener('keyup', (e) => {
            this.removeKey(e.code)
        })

        window.addEventListener('mousedown', (e) => {
            this.mouseButtons.add(e.button)
            if(!document.pointerLockElement){
                // document.dispatchEvent(new Event('lockMouse'))
                // this.useMouse = true
            }
        })

        window.addEventListener('mouseup', (e) => {
            this.mouseButtons.delete(e.button)
        })

        window.addEventListener('mousemove', (e) => {
            this.mouseVector.x = e.clientX
            this.mouseVector.y = e.clientY

            this.mouseDiffVector.x += e.movementX
            this.mouseDiffVector.y += e.movementY
            // console.log(this.mouseVector.toString())
            this.eventMouseMove.detail.position = new Vector2(this.mouseVector.x, this.mouseVector.y)
            this.eventMouseMove.detail.delta = new Vector2(e.movementX, e.movementY)
            document.dispatchEvent(this.eventMouseMove)
        })

        window.addEventListener('wheel', (e) => {
            this.mouseWheelDelta = e.deltaY
        })

        this.key2eventMap.set(this.keyOpenFilePicker, 'openFilePicker')
    }

    addKey(code: string){
        if(this.keys.has(code)){
            return
        }
        this.keys.add(code)
        for(let key of this.keys){
            console.log(key)
        }
        if(code === this.keyMoveForward || code === this.keyMoveBack || code === this.keyMoveLeft || code === this.keyMoveRight || code === this.keyMoveUp || code === this.keyMoveDown){
            this.updateMoveInput(code)
        }
        else{
            if(this.key2eventMap.has(code)){
                document.dispatchEvent(new Event(this.key2eventMap.get(code)!))
            }
        }
        if(code === this.keyLookForward || code === this.keyLookBack || code === this.keyLookLeft || code === this.keyLookRight){
            this.updateMouseKeyInput(code)
        }
    }
    removeKey(code: string){
        this.keys.delete(code)
        if(code === this.keyMoveForward || code === this.keyMoveBack || code === this.keyMoveLeft || code === this.keyMoveRight || code === this.keyMoveUp || code === this.keyMoveDown){
            this.updateMoveInput(code)
        }
        
        if(code === this.keyLookForward || code === this.keyLookBack || code === this.keyLookLeft || code === this.keyLookRight){
            this.updateMouseKeyInput(code)
        }
        // else if(code == this.keyEscape){
        //     document.
        // }
    }

    isKeyPressed(code: string){
        return this.keys.has(code)
    }

    getMouseVector(){
        let vector = structuredClone(this.mouseDiffVector)
        this.mouseDiffVector.setZero()
        return vector
    }

    updateMoveInput(input: string){
        let isPressed: boolean = false
        if(this.keys.has(input)){
            isPressed = true
        }
        switch(input){
            case this.keyMoveForward:
                this.moveVector.z = isPressed ? 1 : 0
                break
            case this.keyMoveBack:
                this.moveVector.z = isPressed ? -1 : 0
                break
            case this.keyMoveLeft:
                this.moveVectorOpposingKeys(this.keyMoveRight, -1, isPressed, true, this.moveVector)
                break
            case this.keyMoveRight:
                this.moveVectorOpposingKeys(this.keyMoveLeft, 1, isPressed, true, this.moveVector)
                break
            case this.keyMoveUp:
                this.moveVectorOpposingKeys(this.keyMoveBack, 1, isPressed, false, this.moveVector)
                break
            case this.keyMoveDown:
                this.moveVectorOpposingKeys(this.keyMoveForward, -1, isPressed, false, this.moveVector)
                break
        }

        this.eventKeyMove.detail.vector = this.moveVector
        document.dispatchEvent(this.eventKeyMove)
    }

    updateMouseKeyInput(input: string){
        let isPressed: boolean = false
        if(this.keys.has(input)){
            isPressed = true
        }
        switch(input){
            case this.keyLookForward:
                this.moveVectorOpposingKeys(this.keyLookBack, 1, isPressed, false, this.mouseDiffVector)
                break
            case this.keyLookBack:
                this.moveVectorOpposingKeys(this.keyLookForward, -1, isPressed, false, this.mouseDiffVector)
                break
            case this.keyLookLeft:
                this.moveVectorOpposingKeys(this.keyLookRight, -1, isPressed, true, this.mouseDiffVector)
                break
            case this.keyLookRight:
                this.moveVectorOpposingKeys(this.keyLookLeft, 1, isPressed, true, this.mouseDiffVector)
                break
        }
        this.mouseDiffVector.multiply(this.MOUSE_KEY_SPEED)
        document.dispatchEvent(new Event(InputManager.strEMoveMouseKeysPressed))
    }

    moveVectorOpposingKeys(oppKey: string, curNum: number, isPressed: boolean, isX: boolean, curVector: Vector2 | Vector3){
        if(isPressed){
            if(isX){
                curVector.x = curNum
            }
            else{
                curVector.y = curNum
            }
            if(this.isKeyPressed(oppKey)){
                if(isX){
                    curVector.x = 0
                }
                else{
                    curVector.y = 0
                }
            }
        }
        else{
            if(isX){
                curVector.x = 0
            }
            else{
                curVector.y = 0
            }
            if(this.isKeyPressed(oppKey)){
                if(isX){
                    curVector.x = -curNum
                }
                else{
                    curVector.y = -curNum
                }
            }
        }
    }

    endFrame(){
        this.mouseDX = 0
        this.mouseDY = 0
        this.mouseWheelDelta = 0
    }

}