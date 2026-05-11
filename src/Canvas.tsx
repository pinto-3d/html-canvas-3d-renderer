import { useEffect, useRef } from 'react';
import { InputManager } from './InputManager';
import { Game } from './Game';

interface CanvasProps {}

const Canvas = (props : CanvasProps) => {

    const canvasRef = useRef(null);
    const fileRef = useRef(null);
    const game = useRef<Game>(null)

    const prevTime = useRef<number>(Date.now());
    const timeSinceStart = useRef<number>(0);

    useEffect(() => {
        if(Game.instance){ return; }

        if(!canvasRef.current){ return; }

        const canvas: HTMLCanvasElement = canvasRef.current
        const context: CanvasRenderingContext2D | null = canvas.getContext('2d')
        
        if(!context){ return; }

        let frameCount = 0
        let animationFrameId : number

        let displayScale = 2
        canvas.width = 640 * displayScale
        canvas.height = 360 * displayScale

        context.imageSmoothingEnabled = false;
        context.lineWidth = 0

        game.current = new Game()

        if(!game.current){return;}

        game.current.init(context, displayScale).then(() =>{
            const tick = () => {
                frameCount++
                if(true){
                    let deltaTime: number = (Date.now() - prevTime.current)/1000;
                    game.current!.deltaTime = deltaTime
                    prevTime.current = Date.now()
                    timeSinceStart.current += deltaTime;

                    game.current!.tick(context, deltaTime)
                }
                animationFrameId = window.requestAnimationFrame(() => {
                    tick();
                })
            };
            tick();
        });
        

        return () => {
            window.cancelAnimationFrame(animationFrameId)
        }
    }, [canvasRef])

    document.addEventListener('DOMContentLoaded', () => {
        document.addEventListener(InputManager.strELockMouse, (e) =>{
            if(!canvasRef.current){ return; }

            const canvas: HTMLCanvasElement = canvasRef.current
            const context: CanvasRenderingContext2D | null = canvas.getContext('2d')

            if(!context){ return; }

            canvas.requestPointerLock()

        });

        document.addEventListener(InputManager.strEOpenFilePicker, (e) =>{
            if(!fileRef.current){
                return
            }
            let file : HTMLInputElement = fileRef.current
            file.click()
        });
    });

    function openFilePicker(){
        if(!fileRef.current){return}
        let fileElement : HTMLInputElement = fileRef.current
        if(!fileElement.files){return}
        let file = fileElement.files[0]
        if(!file){return}

        let reader: FileReader = new FileReader()

        reader.onload = (e) => {
            readFile(file.name, reader.result)
        }

        reader.readAsText(file)
        // reader.readAsArrayBuffer(file)
    }

    function readFile(name: string, content: string | ArrayBuffer | null){
        
        console.log('file'+name)
        if(name.endsWith('.obj')){
            if(!content){
                return
            }
            if(typeof(content) != "string"){
                return
            }
            
            // renderer.current.setObjs(FileImport3D.OBJ_Import(content, Color.orangeJuiceOrange))
        }
    }

    return(
        <>
            <canvas ref={canvasRef} {...props} style={{width:100+`%`, height:'100dvh', imageRendering: 'pixelated'}} />
            <input ref={fileRef} type='file' onChange={openFilePicker} style={{display:'none'}} />
        </>
    );
}

export default Canvas;