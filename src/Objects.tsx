import { ColorRGBA, Vector2 } from "./2D"
import { Billboard, Camera, Object3D, Vector3 } from "./3D"
import { Game } from "./Game"
import type { EventKeyMove, EventMouseMove } from "./InputManager"
import { Cube } from "./Primitives"

export class MouseInteractableObject extends Object3D{
    
    mouseIsHovering: boolean = false
    _oldMouseIsHovering: boolean = false

    tick(deltaTime:number){
        super.tick(deltaTime)
    }

    eventMouseHover(){

    }
    eventMouseBeganHover(){
        this.mouseIsHovering = true
    }
    eventMouseEndHover(){
        this.mouseIsHovering = false
    }

    eventMouseClick(){

    }
}

export class HoveringObject extends MouseInteractableObject{
    MAX_HOVER_SCALE: number = 1.1
    SCALE_SPEED: number = 1
    
    tick(deltaTime:number){
        super.tick(deltaTime)
        if(this.mouseIsHovering){
            // this.setLScale(Vector3.one().multiply(2))
            if(this.getLScale().y < this.MAX_HOVER_SCALE){
                this.scaleL(Vector3.one().multiply(this.SCALE_SPEED*deltaTime))
                // this.RotateL(new Vector3(0, 3, 0).multiply(deltaTime))
            }
            else{
                // this.setLScale(Vector3.one().multiply(this.MAX_HOVER_SCALE))
            }
        }
        else{
            if(this.getLScale().y > 1){
                this.scaleL(Vector3.one().multiply(-this.SCALE_SPEED*deltaTime))
            }
            else{
                this.setLScale(Vector3.one())
            }
        }
    }

    eventMouseEndHover(){
        super.eventMouseEndHover()
        // this.setLScale(Vector3.one())
    }
}

export class CloudBillboard extends Billboard {
    tick(deltaTime: number){
        // this.moveWPosition(new Vector3(0,0,-2).multiply(deltaTime))
    }
}

export class CameraController extends Camera {

    CAM_ROTATION_SPEED: Vector2 = new Vector2(0.1, 0.1) 
    moveVector: Vector3 = Vector3.zero()

    constructor(){
        super()
        document.addEventListener('inputMouseMove', (e) => {
            const event: CustomEvent<EventMouseMove> = e as CustomEvent<EventMouseMove>
            this.mouseMoved(event.detail.position, event.detail.delta)
        })

        document.addEventListener(`inputKeyMove`, (e) => {
            const event: CustomEvent<EventKeyMove> = e as CustomEvent<EventKeyMove>
            this.keyMoved(event.detail.vector)
        })
    }

    oldMoveVector: Vector3 = new Vector3()
    tick(delta:number) {
        this.moveWPosition(Vector3.fromV3(this.moveVector).multiply(delta * 10))
        // console.log(delta,"\t\t", this.moveVector.toString())
        // console.log(this.oldMoveVector.toString(),"\t\t\t",this.moveVector.toString())
        if(this.moveVector.isEqual(Vector3.zero()) && !this.oldMoveVector.isEqual(Vector3.zero())){
        }
        this.oldMoveVector = Vector3.fromV3(this.moveVector)
    }

    resetRotation() {
        super.resetRotation()
        this.moveWPosition(new Vector3(0, 2.45, 4.1))
        // this.moveWPosition(new Vector3(0, 0, 10))
        this.camRotate(new Vector2(-Math.PI, 0.5))
    }

    mouseMoved(position: Vector2, delta: Vector2){
        // this.resetRotation()
        // this.camRotate(new Vector2((position.x/window.innerWidth-0.5)*this.CAM_ROTATION_SPEED.x, (position.y/window.innerHeight-0.5)*this.CAM_ROTATION_SPEED.y))
    }
    keyMoved(vector: Vector3){
        this.moveVector = Vector3.fromV3(vector)
    }
}

export class RotatingCube extends Cube{

    constructor(color: ColorRGBA){
        super(new Vector3(0.5,0.5,-0.5),0.75, color)
    }

    tick(deltaTime:number){
        this.RotateW(new Vector3(0, 5*deltaTime, 0))
    }
}