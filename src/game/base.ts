import * as fs from 'fs'

import { Neovim, Buffer } from 'neovim';
import { GameState, GameOptions, GameDifficulty } from './types';
import wait from '../wait';
import { join } from '../log';

export function newGameState(buffer: Buffer): GameState {
    return {
        buffer,
        ending: { count: 10 },
        currentCount: 0,
        lineRange: {start: 2, end: 22},
        lineLength: 20,
        results: [],
    }
}

export const extraWords = [
    "aar",
    "bar",
    "car",
    "dar",
    "ear",
    "far",
    "gar",
    "har",
    "iar",
    "jar",
    "kar",
    "lar",
    "mar",
    "nar",
    "oar",
    "par",
    "qar",
    "rar",
    "sar",
    "tar",
    "uar",
    "var",
    "war",
    "xar",
    "yar",
    "zar",
];

export function getRandomWord() {
    return extraWords[Math.floor(Math.random() * extraWords.length)];
}

export type LinesCallback = (args: any[]) => void;

export abstract class BaseGame {
    public state: GameState;
    public nvim: Neovim;

    private linesCallback?: LinesCallback;
    private listenLines: LinesCallback;

    constructor(nvim: Neovim, state: GameState, opts: GameOptions = {
        difficulty: GameDifficulty.Easy
    }) {

        this.state = state;
        this.nvim = nvim;

        this.listenLines = (args: any[]) => {
            if (this.linesCallback) {
                this.linesCallback(args);
            }
        }

        this.state.buffer.listen("lines", this.listenLines);
    }

    public onLines(cb: LinesCallback) {
        this.linesCallback = cb;
    }

    public finish() {
        fs.writeFileSync("/tmp/relative-" + Date.now(), this.state.results.map(x => x + "\n").join(','));
        this.linesCallback = undefined;
        this.state.buffer.off("lines", this.listenLines);
    }

    protected pickRandomLine(): number {
        return ~~(this.state.lineRange.start + Math.random() * this.state.lineLength);
    }

    protected midPointRandomPoint(midPoint: number, high: boolean, padding = 0) {
        let line: number;
        do {
            line = this.pickRandomLine();
        } while (high && (line + padding) > midPoint ||
                 !high && (line + padding) < midPoint);
        return line;
    }

    abstract run(): Promise<void>;
    abstract clear(): Promise<void>;
    abstract checkForWin(): Promise<boolean>;

    async debugTitle(...title: any[]) {
        await this.setTitle(...title);
        await wait(1000);
    }

    async setTitle(...title: any[]) {
        await this.state.buffer.
            setLines(
                join(...title), {
                    start: 0,
                    end: 1
                });
    }
}
