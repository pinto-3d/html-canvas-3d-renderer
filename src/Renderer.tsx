import { Object3D, Vector3, Face, Mesh, Camera, Billboard } from "./3D"
import { ColorRGBA, General, Vector2 } from "./2D"
import { MMath } from "./Matrix"
import { inv } from "mathjs"
import { CameraController } from "./Objects"

export type RendererProps = {
    ctx: CanvasRenderingContext2D,
    deltaTime: number, 
    frameCount: number
}

export class Renderer{
    
    camera: Camera = new CameraController()
    FOV: number = 360*2;
    scaleMultiplier: number = 1
    renderDimensions: Vector2 = Vector2.zero()
    screenDimensions: Vector2 = Vector2.zero()
    fi: FrameInfo

    depthBuffer:number[] = []

    NEAR_PLANE: number = 0
    NEAR_SHADE: number = 14.5
    FAR_PLANE: number = 17

    BILLBOARD_SIZE: number = 50

    colors: ColorRGBA[] = []

    mousePosition: Vector2 = Vector2.zero()

    constructor(){
        this.camera.resetRotation()
        this.fi = new FrameInfo(this.FAR_PLANE, 0)
    }

    displayMatrix(ctx: CanvasRenderingContext2D, mat:number[][], offset: Vector2){
        for(let k=0;k<mat[0].length;k++){
            for(let l=0; l<mat.length;l++){
                ctx.fillText((Math.trunc(mat[l][k] * 100) / 100).toString(), k*30 + offset.x, (l*18) + offset.y)
            }
        }
    }
    
    draw(props: RendererProps, objects: Object3D[]){
        this.depthBuffer = new Array(props.ctx.canvas.width * props.ctx.canvas.height)
        this.fi = new FrameInfo(this.FAR_PLANE, props.frameCount)
        this.drawMeshes(props.ctx, objects)

        // this.displayMatrix(props.ctx, this.camera.localMatrix, new Vector2(40, 20))
        // this.displayMatrix(props.ctx, this.camera.worldMatrix, new Vector2(200, 20))
        // this.displayMatrix(props.ctx, this.camera.combinedMatrix, new Vector2(360, 20))
        // this.displayMatrix(props.ctx, this.camera.getFwdVector().toMatrix3(), new Vector2(580, 20))
        // if(objects.length > 0){
        //     this.displayMatrix(props.ctx, objects[0].localMatrix, new Vector2(200, 100))
        // }
    }

    setObjs(objs: Object3D[]){
        // objects.push(obj)
        // obj.wMovePosition(new Vector3(10,1,0))
    }


    getScreenSpaceOfVert(vert: Vector3){
        if(vert.z < this.NEAR_PLANE || vert.z > this.FAR_PLANE){
            return null
        }

        let shortVert = -vert.y/vert.z * this.FOV
        let shortHorz = vert.x/vert.z * this.FOV

        shortHorz *= this.scaleMultiplier
        shortVert *= this.scaleMultiplier

        shortHorz += this.renderDimensions.x/2
        shortVert += this.renderDimensions.y/2
        
        return new Vector3(shortHorz, shortVert, vert.z)
    }

    drawMeshes(ctx: CanvasRenderingContext2D, objects: Object3D[]){
        let linesDrawn = 0
        let facesDrawn = 0

        
        for(let j=0;j<objects.length;j++){
            let obj: Object3D = objects[j]
            let mesh: Mesh = obj.mesh
            let localScreenSpaceVerts: Vector3[] = [] 

            let Wverts = obj.getWVerts()
            let verts = this.objVertsToCamera(obj)

            for(let i=0;i<verts.length;i++){
                let ssv = this.getScreenSpaceOfVert(verts[i])
                if(!ssv){
                    continue
                }

                localScreenSpaceVerts[i] = ssv

                if(mesh.vert2faceMap.has(i)){
                    let faceIndexes: number[] | undefined = mesh.vert2faceMap.get(i)
                    if(!faceIndexes){
                        continue
                    }
                    
                    let center: Vector3 = Vector3.zero()
                    for(let l=0;l<faceIndexes.length;l++){
                        let face: Face = mesh.faceArr[faceIndexes[l]]
                        let averageDepth: number = 0
                        let skipped: boolean = false

                        let avgVertLocation: Vector3 = Vector3.zero()
                        let avgWVertLocation: Vector3 = Vector3.zero()

                        for(let m=0;m<face.vertIndexes.length;m++){
                            if(face.vertIndexes[m] >= localScreenSpaceVerts.length || localScreenSpaceVerts[face.vertIndexes[m]] == undefined){
                                skipped = true
                                break
                            }
                            // if(localScreenSpaceVerts[face.vertIndexes[m]].z > )
                            
                            averageDepth += localScreenSpaceVerts[face.vertIndexes[m]].z

                            avgVertLocation = avgVertLocation.add(verts[face.vertIndexes[m]])
                            avgWVertLocation = avgWVertLocation.add(Wverts[face.vertIndexes[m]])
                        }
                        if(skipped){
                            continue
                        }

                        averageDepth /= face.vertIndexes.length
                        avgVertLocation.divide(face.vertIndexes.length)
                        avgWVertLocation.divide(face.vertIndexes.length)

                        let normalVert: Vector3 = face.normal
                        let normalWVert = obj.getWVert(normalVert)
                        normalVert = this.worldVertToCamera(normalWVert)

                        let normalMultiplied: Vector3 = MMath.toVector3(MMath.multiply(obj.localMatrix, face.normal.toMatrix4()))
                        normalMultiplied = MMath.toVector3(MMath.multiply(obj.worldMatrix, face.normal.toMatrix4())).normalize()
                        let facingCamDot = avgWVertLocation.subtract(this.camera.getWPosition()).normalize().dotWith(normalMultiplied)
                        
                        if(facingCamDot < 0){
                            this.fi.screenSpaceFaces.push(new FaceDepthStart(face, this.fi.screenSpaceFaces.length, this.fi.worldScreenSpaceVerts.length, averageDepth, facingCamDot, General.truncate(facingCamDot, 2).toString()))
                        }
                    }
                }
            }

            this.fi.worldScreenSpaceVerts = this.fi.worldScreenSpaceVerts.concat(localScreenSpaceVerts)
        }

        for(let j=0;j<objects.length;j++){
            let obj: Object3D = objects[j]
            let mesh: Mesh = obj.mesh
        }

        let imgdata: ImageData = ctx.getImageData(0,0,ctx.canvas.width, ctx.canvas.height)
        for(let i=0;i<this.fi.screenSpaceFaces.length;i++){
            // this.drawPolygonPen(ctx, this.fi.worldScreenSpaceVerts, this.fi.screenSpaceFaces[i], true)
            this.drawTri(ctx, imgdata, this.fi.worldScreenSpaceVerts, this.fi.screenSpaceFaces[i], true, true)
            facesDrawn++
        }
        
        ctx.putImageData(imgdata,0,0)
        if(this.fi.mouseHoverPosTriIndex != -1){
        }
        
        for(let i=0;i<this.fi.screenSpaceFaces.length;i++){
            // this.drawPolygonPen(ctx, this.fi.worldScreenSpaceVerts, this.fi.screenSpaceFaces[i], true)
            // facesDrawn++
        }
    }

    pos = 0;

    objVertsToCamera(obj: Object3D){
        let verts = obj.getWVerts()
        for(let i=0;i<verts.length;i++){
            verts[i] = this.worldVertToCamera(verts[i])
        }
        return verts
    }

    objVertToCamera(obj: Object3D, vert:Vector3){
        let newVert = obj.getWVert(vert)
        return this.worldVertToCamera(newVert)
    }

    worldVertToCamera(vert: Vector3){
        vert = MMath.toVector3(MMath.multiply(inv(this.camera.worldMatrix), vert.toMatrix4()))
        vert = MMath.toVector3(MMath.multiply(this.camera.localMatrix, vert.toMatrix4()))
        return vert
    }

    drawTri(ctx:CanvasRenderingContext2D, imgdata: ImageData, screenSpaceVerts: Vector3[], fdc: FaceDepthStart, isShaded: boolean = true, drawDebug: boolean = false, onlyDebug: boolean = false, overrideColor: ColorRGBA | null = null){
        
        if(fdc.face.vertIndexes.length != 3){
            return;
        }
        
        var width = ctx.canvas.width;
		var height = ctx.canvas.height;

        let ssvs: Vector3[] = []
	
		var pts = [];
		for (var i=0; i<3; i++) {
            let curInd: number = fdc.face.vertIndexes[i] + fdc.vertStartIndex
            ssvs.push(new Vector3(Math.round(screenSpaceVerts[curInd].x), Math.round(screenSpaceVerts[curInd].y), screenSpaceVerts[curInd].z))

			var p = ssvs[i];
			pts.push(p);
		}
	
	
		var bboxmin = new Vector2(Number.MAX_VALUE, Number.MAX_VALUE);
		var bboxmax = new Vector2(-Number.MAX_VALUE, -Number.MAX_VALUE);
		var clamp   = new Vector2(width-1, height-1);
	
		for (var i=0; i<3; i++) {
	
			bboxmin.x = Math.max(0.0,     Math.min(bboxmin.x, pts[i].x));
			bboxmax.x = Math.min(clamp.x, Math.max(bboxmax.x, pts[i].x));
		
			bboxmin.y = Math.max(0.0,     Math.min(bboxmin.y, pts[i].y));
			bboxmax.y = Math.min(clamp.y, Math.max(bboxmax.y, pts[i].y));
		}
	
		var P = new Vector3();
		var xLength = Math.ceil(bboxmax.x);
		var yLength = Math.ceil(bboxmax.y);
		var xFloor = Math.floor(bboxmin.x);
		var yFloor = Math.floor(bboxmin.y);
		for (P.x = xFloor; P.x <= xLength; P.x++) {
			for (P.y = yFloor; P.y <= yLength; P.y++) {
			
				let bc_screen: Vector3  = Vector3.barycentric(pts[0], pts[1], pts[2], P);
				
				if (bc_screen.x<0 || bc_screen.y<0 || bc_screen.z<0) continue;
			
				P.z = 0;
				P.z += pts[0].z * bc_screen.x;
				P.z += pts[1].z * bc_screen.y;
				P.z += pts[2].z * bc_screen.z;

                let depthind: number = this.getDepthIndex(Math.floor(P.x), Math.floor(P.y))

                if(this.depthBuffer[depthind] > P.z || this.depthBuffer[depthind] == null){
                    this.depthBuffer[depthind] = P.z

                    let newZ: number = ((this.FAR_PLANE)/(this.FAR_PLANE - this.NEAR_SHADE)) + 1/P.z *((-this.FAR_PLANE * this.NEAR_SHADE)/(this.FAR_PLANE - this.NEAR_SHADE))

                    let newColor: ColorRGBA = new ColorRGBA(fdc.face.color.r, fdc.face.color.g, fdc.face.color.b, fdc.face.color.a)
                    if(isShaded){
                        let change = 0
                        change = -((fdc.dot) * 50)
                        // change = 
                        
                        newColor.r = fdc.face.color.r + change
                        newColor.g = fdc.face.color.g + change
                        newColor.b = fdc.face.color.b + change

                        newColor.r = (1-newZ) * newColor.r + newZ * ColorRGBA.background.r
                        newColor.g = (1-newZ) * newColor.g + newZ * ColorRGBA.background.g
                        newColor.b = (1-newZ) * newColor.b + newZ * ColorRGBA.background.b
                    }

                    this.setImgDataXYtoRGBA(imgdata, P.x, P.y, newColor)
                }
			}
		}

        if(fdc.face.vertIndexes.length == 3){
            console.log("mouseTriIndex: " + fdc.faceIndex)
            if(Vector2.pointInTriangle(
                this.fi.worldScreenSpaceVerts[this.fi.screenSpaceFaces[fdc.faceIndex].face.vertIndexes[0] + this.fi.screenSpaceFaces[fdc.faceIndex].vertStartIndex].toVector2xy(), 
                this.fi.worldScreenSpaceVerts[this.fi.screenSpaceFaces[fdc.faceIndex].face.vertIndexes[1] + this.fi.screenSpaceFaces[fdc.faceIndex].vertStartIndex].toVector2xy(), 
                this.fi.worldScreenSpaceVerts[this.fi.screenSpaceFaces[fdc.faceIndex].face.vertIndexes[2] + this.fi.screenSpaceFaces[fdc.faceIndex].vertStartIndex].toVector2xy(), 
                this.screenSpaceMousePosition()
            )){
                if(this.fi.mouseHoverPosTriDepth > this.fi.screenSpaceFaces[fdc.faceIndex].depth){
                    this.fi.mouseHoverPosTriIndex = fdc.faceIndex
                    this.fi.mouseHoverPosTriDepth = this.fi.screenSpaceFaces[fdc.faceIndex].depth
                }
            }
        }
    }
    
    setImgDataToRGBA(imgdata:ImageData, pos:number, color: ColorRGBA){
        imgdata.data[pos*4] = color.r
        imgdata.data[pos*4+1] = color.g
        imgdata.data[pos*4+2] = color.b
        imgdata.data[pos*4+3] = color.a*255
    }

    setImgDataXYtoRGBA(imgdata:ImageData, x:number, y:number, color: ColorRGBA){
        imgdata.data[(y * imgdata.width+x)*4] = color.r
        imgdata.data[(y * imgdata.width+x)*4+1] = color.g
        imgdata.data[(y * imgdata.width+x)*4+2] = color.b
        imgdata.data[(y * imgdata.width+x)*4+3] = color.a*255
    }

    triGetRightAndLeftX(points: Vector3[], y:number){
        let x1 = Math.round(this.getXatYonLine(points[0], points[1], y))
        let x2 = Math.round(this.getXatYonLine(points[0], points[2], y))
        if(x2 > x1){
            return [x1, x2]
        }
        return [x2, x1]
    }

    getXatYonLine(p1:Vector3, p2:Vector3, y:number){
        let slope: number = (p2.y-p1.y)/(p2.x-p1.x)
        if(slope == 0){
            return p1.x
        }
        return (y-p1.y)/slope + p1.x
    }

    drawPolygonPen(ctx: CanvasRenderingContext2D, screenSpaceVerts: Vector3[], fdc: FaceDepthStart, isShaded: boolean = true, drawDebug: boolean = false, onlyDebug: boolean = false, overrideColor: ColorRGBA | null = null){
        let face: Face = fdc.face
        if(!onlyDebug){
            if(face.mesh.obj instanceof Billboard){
                let billboard: Billboard = face.mesh.obj
                let scale: number = (this.FAR_PLANE - fdc.depth) / this.FAR_PLANE * billboard.scale * this.BILLBOARD_SIZE
                let offset: Vector2 = new Vector2(screenSpaceVerts[face.vertIndexes[0] + fdc.vertStartIndex].x - ((billboard.sprite.width* scale)/2), screenSpaceVerts[face.vertIndexes[0] + fdc.vertStartIndex].y - ((billboard.sprite.height*scale/2)))
                
                
                ctx.drawImage(billboard.sprite, offset.x, offset.y, billboard.sprite.width * scale, billboard.sprite.height * scale)
                return
            }

            ctx.beginPath()

            for(let m=0;m<face.vertIndexes.length;m++){
                let curInd: number = face.vertIndexes[m] + fdc.vertStartIndex
                ctx.lineTo(screenSpaceVerts[curInd].x, screenSpaceVerts[curInd].y)
            }
            ctx.lineTo(screenSpaceVerts[face.vertIndexes[0] + fdc.vertStartIndex].x, screenSpaceVerts[face.vertIndexes[0] + fdc.vertStartIndex].y)

            let newColor: ColorRGBA = new ColorRGBA(face.color.r, face.color.g, face.color.b, face.color.a)

            let newZ: number = ((this.FAR_PLANE)/(this.FAR_PLANE - this.NEAR_SHADE)) + 1/fdc.depth *((-this.FAR_PLANE * this.NEAR_SHADE)/(this.FAR_PLANE - this.NEAR_SHADE))

            if(overrideColor){
                newColor = overrideColor
            }

            if(isShaded){
                newColor.r = face.color.r - ((fdc.dot/6) * 500)
                newColor.g = face.color.g - ((fdc.dot/6) * 500)
                newColor.b = face.color.b - ((fdc.dot/6) * 500)

                
                // newColor.r = (1-newZ) * newColor.r + newZ * Color.background.r
                // newColor.g = (1-newZ) * newColor.g + newZ * Color.background.g
                // newColor.b = (1-newZ) * newColor.b + newZ * Color.background.b
            }

            ctx.fillStyle = newColor.rgbaString()
            ctx.strokeStyle = newColor.rgbaString()

            ctx.closePath()
            ctx.stroke()
            ctx.fill()
        }

        if(fdc.isDebug && drawDebug){
            ctx.fillStyle = ColorRGBA.white.toHex()
            let avgV3: Vector3 = Vector3.zero()
            for(let i=0;i<face.vertIndexes.length;i++){
                let curInd: number = face.vertIndexes[i] + fdc.vertStartIndex
                avgV3 = avgV3.add(screenSpaceVerts[curInd])
            }
            avgV3 = avgV3.divide(face.vertIndexes.length)
        }
    }

    clear(ctx: CanvasRenderingContext2D){
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.fillStyle = ColorRGBA.background.toHex()
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    }

    screenSpaceMousePosition(){
        return new Vector2( this.mousePosition.x*(this.renderDimensions.x/this.screenDimensions.x) , this.mousePosition.y* (this.renderDimensions.y/this.screenDimensions.y) )
    }

    getDepthIndex(x:number, y:number){
        return x + y * this.renderDimensions.x
    }
}

export class FrameInfo{
    worldScreenSpaceVerts: Vector3[] = [] 
    screenSpaceFaces: FaceDepthStart[] = []
    
    mouseHoverPosTriDepth: number = 30
    mouseHoverPosTriIndex: number = -1

    frameCount: number = 0

    constructor(farPlane: number, frameCount: number){
        this.mouseHoverPosTriDepth = farPlane
        this.frameCount = frameCount
    }
}

export class FaceDepthStart {
    face: Face
    faceIndex: number = -1
    depth: number = -1
    dot: number = -1
    vertStartIndex: number = 0
    isDebug: boolean
    debugText: string = ""

    constructor(face: Face, faceIndex:number, vertStartIndex: number, depth: number, dot:number, debugText: string = ""){
        this.face = face
        this.faceIndex = faceIndex
        this.vertStartIndex = vertStartIndex
        this.depth = depth
        this.dot = dot
        
        this.isDebug = debugText != ""
        this.debugText = debugText
    }
}