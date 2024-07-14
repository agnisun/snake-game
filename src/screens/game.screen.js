import { Container, Graphics, Text, Ticker } from "pixi.js"

const CELL_SIZE = 22
const CELL_SIZE_HALF = Math.floor(CELL_SIZE / 2)
export const BOARD_SIZE = CELL_SIZE * CELL_SIZE
const BOARD_SIZE_HALF = Math.floor(BOARD_SIZE / 2)
const TEXTNODE_STYLE = {
    fill: "#ff0",
    fontSize: 96,
}

const LABELS = {
    row: "row",
    column: "column",
    point: "point",
    head: "head",
    body: "body",
}
const DIRECTIONS = {
    top: "top",
    right: "right",
    left: "left",
    bottom: "bottom",
}
const SNAKE_REGEXP = new RegExp(`${LABELS.body}|${LABELS.head}`, "g")

export class GameScreen extends Container {
    #ticker = new Ticker()
    #score = 0
    #isPause = true
    #isGameOver = false
    #snake = [
        [CELL_SIZE_HALF, 1],
        [CELL_SIZE_HALF, 2],
        [CELL_SIZE_HALF, 3],
    ]
    #direction = DIRECTIONS.right
    #cells = new Container()
    #isDirectionChanged = false
    #elapsedMS = 0
    #point = [0, 0]
    #speed = 840
    #scoreTextNode = new Text({
        text: "0",
        x: 5,
        y: BOARD_SIZE,
    })
    #pauseOverlay = new Container()
    #gameOverOverlay = new Container({ interactive: true, cursor: "pointer" })

    constructor() {
        super()

        this.#initCells()
        this.#initSnake()
        this.#initOverlayPause()
        this.#initOverlayGameOver()
        this.#generatePoint()

        this.addChild(this.#cells, this.#scoreTextNode)

        this.#ticker.add((time) => {
            if (this.#isGameOver) {
                this.addChild(this.#gameOverOverlay)
            } else {
                this.#clearSnake()
                this.#initSnake()

                if (!this.#isPause) {
                    this.#pauseOverlay.removeFromParent()
                    this.#elapsedMS += time.elapsedMS

                    if (this.#elapsedMS > 1000 - this.#speed) {
                        this.#moveSnake()
                        this.#elapsedMS = 0
                        this.#isDirectionChanged = false
                    }
                } else {
                    this.addChild(this.#pauseOverlay)
                }
            }
        })

        this.#ticker.start()

        document.addEventListener("keydown", this.#onKeyDown)
    }

    #onKeyDown = (event) => {
        if (this.#isGameOver) return

        const key = event.keyCode

        switch (key) {
            case 32: {
                this.#isPause = !this.#isPause
                break
            }
        }

        if (this.#isPause || this.#isDirectionChanged) return

        if (key === 38 && this.#direction !== DIRECTIONS.bottom) this.#direction = DIRECTIONS.top
        else if (key === 39 && this.#direction !== DIRECTIONS.left) this.#direction = DIRECTIONS.right
        else if (key === 37 && this.#direction !== DIRECTIONS.right) this.#direction = DIRECTIONS.left
        else if (key === 40 && this.#direction !== DIRECTIONS.top) this.#direction = DIRECTIONS.bottom

        this.#isDirectionChanged = true
    }

    #initOverlayPause() {
        this.#pauseOverlay.addChild(
            new Graphics({
                width: BOARD_SIZE,
                height: BOARD_SIZE,
            })
                .rect(0, 0, BOARD_SIZE, BOARD_SIZE)
                .fill("rgba(0, 0, 0, 0.5)")
        )
    }

    #initOverlayGameOver() {
        const gameOverTopTextNode = new Text({ text: "GAME", style: TEXTNODE_STYLE })
        const gameOverBottomTextNode = new Text({ text: "OVER!", style: TEXTNODE_STYLE })

        gameOverTopTextNode.anchor.set(0.5, 0.5)
        gameOverTopTextNode.x = BOARD_SIZE_HALF
        gameOverTopTextNode.y = BOARD_SIZE_HALF - Math.floor(gameOverTopTextNode.height / 2)

        gameOverBottomTextNode.anchor.set(0.5, 0.5)
        gameOverBottomTextNode.x = BOARD_SIZE_HALF
        gameOverBottomTextNode.y = gameOverTopTextNode.y + gameOverTopTextNode.height

        this.#gameOverOverlay.addEventListener("click", () => {
            this.#restartGame()
        })
        this.#gameOverOverlay.addChild(
            new Graphics({
                width: BOARD_SIZE,
                height: BOARD_SIZE,
            })
                .rect(0, 0, BOARD_SIZE, BOARD_SIZE)
                .fill("rgba(0, 0, 0, 0.5)"),
            new Container({
                children: [gameOverTopTextNode, gameOverBottomTextNode],
            })
        )
    }

    #restartGame() {
        const parent = this.parent
        this.destroy()

        parent.addChild(new GameScreen())
    }

    #updateScore() {
        this.#score += 5
        this.#scoreTextNode.text = String(this.#score)
    }

    #moveSnake() {
        let [row, column] = this.#snake.at(-1)
        let newHead

        switch (this.#direction) {
            case DIRECTIONS.right: {
                newHead = [row, column === CELL_SIZE - 1 ? 0 : column + 1]
                break
            }
            case DIRECTIONS.top: {
                newHead = [row === 0 ? CELL_SIZE - 1 : row - 1, column]
                break
            }
            case DIRECTIONS.bottom: {
                newHead = [row === CELL_SIZE - 1 ? 0 : row + 1, column]
                break
            }
            case DIRECTIONS.left: {
                newHead = [row, column === 0 ? CELL_SIZE - 1 : column - 1]
                break
            }
        }

        if (newHead[0] === this.#point[0] && newHead[1] === this.#point[1]) {
            this.#snake.push(newHead)
            this.#generatePoint()
            this.#updateScore()
            this.#speed += 2
        } else if (this.#cells.children[newHead[0]].children[newHead[1]].getChildByLabel(SNAKE_REGEXP)) {
            this.#isGameOver = true
        } else this.#snake = this.#snake.slice(1).concat([newHead])
    }

    #initCells() {
        for (let row = 0; row < CELL_SIZE; row++) {
            const rowCells = new Container({ label: LABELS.row })

            for (let column = 0; column < CELL_SIZE; column++) {
                rowCells.addChild(this.#createCell(column * CELL_SIZE, row * CELL_SIZE))
            }

            this.#cells.addChild(rowCells)
        }
    }

    #initSnake() {
        this.#createSnake(this.#snake.at(-1)[0], this.#snake.at(-1)[1], LABELS.head)

        for (let i = 0; i < this.#snake.length - 1; i++) this.#createSnake(this.#snake[i][0], this.#snake[i][1])
    }

    #clearSnake() {
        const containers = this.#cells.getChildrenByLabel(SNAKE_REGEXP, true)
        containers.forEach((container) => container.destroy())
    }

    #createSnake(row, column, label = LABELS.body) {
        this.#cells.children[row].children[column].addChild(
            new Graphics({
                label,
            })
                .roundRect(0, 0, CELL_SIZE, CELL_SIZE, Math.floor(CELL_SIZE / 3))
                .fill(label === LABELS.head ? "rgb(50, 205, 50)" : "rgb(0, 128, 0)")
        )
    }

    #generatePoint() {
        this.#cells.getChildByLabel(LABELS.point, true)?.destroy()

        const possibleCells = this.#cells.children.filter(
            (rowContainer) => !rowContainer.getChildByLabel(LABELS.point) || !rowContainer.getChildByLabel(SNAKE_REGEXP)
        )

        if (possibleCells.length === 0) {
            this.#isGameOver = true
            return
        }

        const randomRow = Math.floor(Math.random() * possibleCells.length)
        const randomColumn = Math.floor(Math.random() * possibleCells[randomRow].children.length)

        this.#point = [randomRow, randomColumn]

        possibleCells[randomRow].children[randomColumn].addChild(
            new Graphics({ label: LABELS.point }).circle(CELL_SIZE_HALF, CELL_SIZE_HALF, Math.PI * 2).fill("#ff0")
        )
    }

    #createCell(x, y) {
        return new Container({
            label: LABELS.column,
            x,
            y,
            children: [new Graphics().rect(0, 0, CELL_SIZE, CELL_SIZE).fill("#000")],
        })
    }

    destroy(options) {
        super.destroy(options)

        this.#ticker.destroy()
        document.removeEventListener("keydown", this.#onKeyDown)
    }
}
