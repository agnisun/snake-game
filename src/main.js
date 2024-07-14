import { Application } from "pixi.js"
import { GameScreen, BOARD_SIZE } from "./screens"
import "./index.css"

export const app = new Application()

async function init() {
    await app.init({
        backgroundColor: "#fff",
        width: BOARD_SIZE,
        height: BOARD_SIZE + 30,
    })

    document.body.appendChild(app.canvas)

    app.stage.addChild(new GameScreen())
}

init()
