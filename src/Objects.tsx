import { ColorRGBA, Vector2 } from "./2D"
import { Billboard, Camera, Mesh, Object3D, Vector3 } from "./3D"
import { InputManager, type EventKeyMove, type EventMouseMove } from "./InputManager"
import { Cube } from "./Primitives"

export class MouseInteractableObject extends Object3D{
    
    mouseIsHovering: boolean = false
    _oldMouseIsHovering: boolean = false

    constructor(mesh: Mesh, name = ""){
        super(mesh, name)
        
        window.addEventListener('mousedown', (e) => {
            this.eventMouseDown()
        })
        window.addEventListener('mouseup', (e) => {
            this.eventMouseUp()
        })
    }

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

    eventMouseDown(){
        if(this.mouseIsHovering){
            this.eventMouseDownOnObject()
        }
    }
    eventMouseDownOnObject(){

    }
    eventMouseUp(){
        if(this.mouseIsHovering){
            this.eventMouseUpOnObject()
        }
    }
    eventMouseUpOnObject(){
        
    }
}

export class HoveringObject extends MouseInteractableObject{
    MAX_HOVER_SCALE: number = 1.1
    SCALE_SPEED: number = 1

    BASE_LOCATION: Vector3 = Vector3.zero()
    SHAKE_AMOUNT: number = 0.05;
    isShaking: boolean = false;
    shakeTimer: number = 0;
    SHAKE_TIME: number = 0.5;
    shakeDirection: number = 1;

    constructor(mesh: Mesh, name = ""){
        super(mesh, name)

    }
    
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
        if(this.isShaking){
            this.setLPosition(Vector3.fromV3(this.BASE_LOCATION).add(new Vector3(this.SHAKE_AMOUNT * this.shakeDirection, 0, 0)))
            this.shakeDirection *= -1
            if(this.shakeTimer > 0){
                this.shakeTimer -= deltaTime
            }
            else{
                this.isShaking = false;
                this.setLPosition(Vector3.zero())
            }
        }
    }

    eventMouseDownOnObject(): void{
        this.isShaking = true;
        this.shakeTimer = this.SHAKE_TIME;
        this.shakeDirection = 1;
    }
    eventMouseUpOnObject(): void {
        
    }
}

export class CloudBillboard extends Billboard {
    tick(deltaTime: number){
        // this.moveWPosition(new Vector3(0,0,-2).multiply(deltaTime))
    }
}

export class CameraController extends Camera {

    CAM_ROTATION_SPEED: Vector2 = new Vector2(-1.5, 0.2) 
    CAM_MOVE_SPEED: Vector2 = new Vector2(6, 2) 
    moveVector: Vector3 = Vector3.zero()
    lookVector: Vector2 = Vector2.zero()

    eventIsMouseDown: boolean = false
    realIsMouseDown: boolean = false
    oldIsMouseDown: boolean = false

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


        // document.addEventListener('inputKeyLook', (e) => {
        //     const event: CustomEvent<EventKeyMove> = e as CustomEvent<EventKeyMove>
        //     this.keyLooked(event.detail.vector)
        // })
    }

    oldMoveVector: Vector3 = new Vector3()
    tick(delta:number) {
        this.realIsMouseDown = this.eventIsMouseDown
        this.moveWPosition(Vector3.fromV3(this.moveVector).multiply(delta * 10))
        // console.log(delta,"\t\t", this.moveVector.toString())
        // console.log(this.oldMoveVector.toString(),"\t\t\t",this.moveVector.toString())
        if(this.moveVector.isEqual(Vector3.zero()) && !this.oldMoveVector.isEqual(Vector3.zero())){
        }
        this.oldMoveVector = Vector3.fromV3(this.moveVector)

        this.RotateW(new Vector3(this.lookVector.x, this.lookVector.y, 0))

        this.oldIsMouseDown = this.realIsMouseDown
    }

    resetRotation() {
        super.resetRotation()
        this.moveWPosition(new Vector3(0, 1.1, 4.1))
        // this.moveWPosition(new Vector3(0, 0, 10))
        this.camRotate(new Vector2(-Math.PI, 0.2))
    }

    mouseMoved(position: Vector2, delta: Vector2){
        this.resetRotation()
        // this.dragVector = delta 
        this.camRotate(new Vector2((position.x/window.innerWidth-0.5)*this.CAM_ROTATION_SPEED.x, (position.y/window.innerHeight-0.5)*this.CAM_ROTATION_SPEED.y))
        this.moveWPosition(new Vector3((position.x/window.innerWidth-0.5)*this.CAM_MOVE_SPEED.x, (position.y/window.innerHeight-0.5)*this.CAM_MOVE_SPEED.y))
    }

    keyLooked(vector: Vector2){
        this.lookVector = vector
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