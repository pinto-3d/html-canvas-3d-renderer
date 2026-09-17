export class Vector2 {
    x: number;
    y: number;

    constructor(x : number = 0, y : number = 0){
        this.x = x
        this.y = y
    }

    multiply(num: number){
        this.x *= num
        this.y *= num
        return this
    }

    add(vector:Vector2){
        this.x += vector.x
        this.y += vector.y
        return this
    }
    
    magnitude(){
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2))
    }

    setZero(){
        this.x = 0
        this.y = 0
    }
    isZero(){
        return this.x == 0 && this.y == 0
    }
    static zero(){
        return new Vector2(0, 0)
    }

    static pointInTriangle(a: Vector2, b: Vector2, c: Vector2, p:Vector2){
        let wOne: number = Vector2.w1(a,b,c,p)
        let wTwo: number = Vector2.w2(a,b,c,p)

        if(wOne >= 0 && wTwo >= 0 && (wOne + wTwo) <= 1){
            return true
        }
        return false
    }

    static w1(a: Vector2, b: Vector2, c: Vector2, p:Vector2){
        return (a.x*(c.y-a.y)+(p.y-a.y)*(c.x-a.x)-p.x*(c.y-a.y))/((b.y-a.y)*(c.x-a.x)-(b.x-a.x)*(c.y-a.y))
    }

    static w2(a: Vector2, b: Vector2, c: Vector2, p:Vector2){
        return (p.y-a.y-this.w1(a,b,c,p)*(b.y-a.y))/(c.y-a.y)
    }

    toString(){
        return General.truncate(this.x, 2) + ", "+ General.truncate(this.y, 2)
    }
}

export class General{
    static truncate(num: number, trunc:number){
        return Math.trunc(num*trunc*10)/(trunc*10)
    }
}

export class ColorRGBA {
    r: number
    g: number
    b: number
    a: number

    constructor(r:number,g:number,b:number,a:number=1){
        this.r = r
        this.g = g
        this.b = b
        this.a = a
    }

    toHex(){
        let str: string = '#'
        str += this._toTwoHex(this.r)
        str += this._toTwoHex(this.g)
        str += this._toTwoHex(this.b)
        str += this._toTwoHex(this.a*255)
        
        return str
    }

    _toTwoHex(num: number){
        let str = num.toString(16)
        if(str.length == 1){
            str = "0" + str
        }
        return str
    }

    rgbaString(){
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`
    }

    static fromHex(hex:string){
        if(hex.startsWith('#')){
            hex = hex.slice(1, hex.length)
        }
        if(hex.length != 6 && hex.length != 8){
            return new ColorRGBA(-1, -1, -1, -1)
        }
        let r,g,b,a : number
        a = 1

        try{
            let strr: string = hex.slice(0, 2)
            let strg: string = hex.slice(2, 4)
            let strb: string = hex.slice(4, 6)


            r = parseInt(hex.slice(0, 2), 16)
            g = parseInt(hex.slice(2, 4), 16)
            b = parseInt(hex.slice(4, 6), 16)
            if(hex.length == 8){
                a =  parseInt(hex.slice(6, 8), 16)/255
            }

            return new ColorRGBA(r, g, b, a)
        }
        catch{
            return new ColorRGBA(-1, -1, -1, -1)
        }
    }

    static fromColorRGBA(color:ColorRGBA){
        return new ColorRGBA(color.r, color.g, color.b, color.a)
    }

    toColorHSV(){
        let h = 0
        let nums = [this.r/255, this.g/255, this.b/255]
        nums.sort((a,b) => {
            return a-b
        })
        let large = nums[2]
        let mid = nums[1]
        let small = nums[0]
        let diff = large-small

        let ratior = this.r/255
        let ratiog = this.g/255
        let ratiob = this.b/255
        switch(large){
            case this.r/255:
                h = (60*((ratiog-ratiob)/diff)+360)%360
                break
            case this.g/255:
                h = (60*((ratiob-ratior)/diff)+120)%360
                break
            case this.b/255:
                h = (60*((ratior-ratiog)/diff)+240)%360
                break
        }

        let v=large * 100
        let s=diff/large * 100

        return new ColorHSV(h,s,v)
    }

    static darkBlue = ColorRGBA.fromHex('#0000FF')
    static lightBlue = ColorRGBA.fromHex('#00AAEE')
    static orangeJuiceOrange = ColorRGBA.fromHex('#EEAA00')
    static skyLightBlue = ColorRGBA.fromHex('#AAEEFF')
    static hotPink = ColorRGBA.fromHex('#FF00AA')
    static lightPurple = ColorRGBA.fromHex('#AAAAFF')
    static lightGreen = ColorRGBA.fromHex('#00FFAA')
    static white = ColorRGBA.fromHex('#FFFFFF')
    static black = ColorRGBA.fromHex('#000000')
    
    static background = this.lightBlue

    static exampleArray7 = [
        this.darkBlue,
        this.lightBlue,
        this.orangeJuiceOrange,
        this.skyLightBlue,
        this.hotPink,
        this.lightPurple,
        this.lightGreen
    ]

    static matColors: Map<string, ColorRGBA> = new Map([
        ["Grass", ColorRGBA.fromHex("#4AB01C")],
        ["House", ColorRGBA.fromHex("#8A57B0")],
        ["Roof", ColorRGBA.fromHex("#E70070")],
        ["Tree", ColorRGBA.fromHex("#6F3607")],
        ["Door", ColorRGBA.fromHex("#6F3607")],
        ["Land", ColorRGBA.fromHex("#6F3607")]
    ])
}

export class ColorHSV {
    h: number
    s: number
    v: number
    a: number

    constructor(h:number,s:number,v:number,a:number=1){
        this.h = h
        this.s = s
        this.v = v
        this.a = a
    }

    toColorRGBA(){

    }
}

export class AnimatedSprite{
    frames: ImageBitmap[] = []
    timeBtFrames: number = 1
    prevTime: number = 0
    currentFrameIndex: number = 0
    nextFrameTime: number = 0

    constructor(frames: ImageBitmap[], timeBtFrames: number){
        this.frames = frames
        this.timeBtFrames = timeBtFrames
        this.nextFrameTime = this.timeBtFrames
    }

    tick(deltaTime: number){
        if(this.nextFrameTime < this.prevTime){
            this.advanceFrame()
        }
        this.prevTime += deltaTime
    }

    getFrame(): ImageBitmap {
        return this.frames[this.currentFrameIndex]
    }

    advanceFrame(){
        this.currentFrameIndex++
        if(this.currentFrameIndex > this.frames.length-1){
            this.currentFrameIndex = 0
        }
    }
}