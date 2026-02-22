type GamepadButtonEvent = {
    gamepadIndex: number;
    buttonIndex: number;
    buttonName: string;
    pressed: boolean;
    value: number; // 0-1 for analog buttons
};

type GamepadAxisEvent = {
    gamepadIndex: number;
    axisIndex: number;
    axisName: string;
    value: number;
};

type GamepadConnectionEvent = {
    gamepadIndex: number;
    gamepadId: string;
    connected: boolean;
};

type EventCallback<T> = (event: T) => void;
type Unsubscribe = () => void;

const BUTTON_NAMES: Record<number, string> = {
    0: "A",
    1: "B",
    2: "X",
    3: "Y",
    4: "LB",
    5: "RB",
    6: "LT",
    7: "RT",
    8: "Back",
    9: "Start",
    10: "L3",
    11: "R3",
    12: "DPad-Up",
    13: "DPad-Down",
    14: "DPad-Left",
    15: "DPad-Right",
};

const AXIS_NAMES: Record<number, string> = {
    0: "LeftStick-X",
    1: "LeftStick-Y",
    2: "RightStick-X",
    3: "RightStick-Y",
};

export class GamepadManager {
    private buttonListeners: Map<string, Set<EventCallback<GamepadButtonEvent>>> = new Map();
    private axisListeners: Map<string, Set<EventCallback<GamepadAxisEvent>>> = new Map();
    private connectionListeners: Set<EventCallback<GamepadConnectionEvent>> = new Set();

    private previousButtonStates: Map<string, boolean> = new Map();
    private previousAxisValues: Map<string, number> = new Map();
    private connectedGamepads: Set<number> = new Set();

    private animationFrameId: number | null = null;
    private deadZone = 0.1;

    constructor(deadZone: number = 0.1) {
        this.deadZone = deadZone;
        this.setupConnectionListeners();
        this.startPolling();
    }

    private setupConnectionListeners(): void {
        window.addEventListener("gamepadconnected", (e: GamepadEvent) => {
            const gamepad = e.gamepad;
            this.connectedGamepads.add(gamepad.index);
            this.emitConnectionEvent(gamepad.index, gamepad.id, true);
        });

        window.addEventListener("gamepaddisconnected", (e: GamepadEvent) => {
            const gamepad = e.gamepad;
            this.connectedGamepads.delete(gamepad.index);
            this.emitConnectionEvent(gamepad.index, gamepad.id, false);
            this.clearGamepadState(gamepad.index);
        });
    }

    private startPolling(): void {
        const poll = () => {
            const gamepads = navigator.getGamepads();

            for (let i = 0; i < gamepads.length; i++) {
                const gamepad = gamepads[i];
                if (!gamepad) continue;

                this.pollButtons(gamepad);
                this.pollAxes(gamepad);
            }

            this.animationFrameId = requestAnimationFrame(poll);
        };

        this.animationFrameId = requestAnimationFrame(poll);
    }

    private pollButtons(gamepad: Gamepad): void {
        gamepad.buttons.forEach((button, index) => {
            const key = `gamepad-${gamepad.index}-button-${index}`;
            const isPressed = button.pressed;
            const wasPressed = this.previousButtonStates.get(key) ?? false;

            // Emit events only on state change
            if (isPressed !== wasPressed) {
                const buttonName = BUTTON_NAMES[index] || `Button${index}`;
                const event: GamepadButtonEvent = {
                    gamepadIndex: gamepad.index,
                    buttonIndex: index,
                    buttonName,
                    pressed: isPressed,
                    value: button.value,
                };

                const eventType = isPressed ? "buttondown" : "buttonup";
                this.emitButtonEvent(eventType, event);
            }

            this.previousButtonStates.set(key, isPressed);
        });
    }

    private pollAxes(gamepad: Gamepad): void {
        gamepad.axes.forEach((value, index) => {
            // Apply dead zone
            const adjustedValue = Math.abs(value) > this.deadZone ? value : 0;
            const key = `gamepad-${gamepad.index}-axis-${index}`;
            const previousValue = this.previousAxisValues.get(key) ?? 0;

            // Emit only if value changed significantly
            if (Math.abs(adjustedValue - previousValue) > 0.01) {
                const axisName = AXIS_NAMES[index] || `Axis${index}`;
                const event: GamepadAxisEvent = {
                    gamepadIndex: gamepad.index,
                    axisIndex: index,
                    axisName,
                    value: adjustedValue,
                };

                this.emitAxisEvent(event);
            }

            this.previousAxisValues.set(key, adjustedValue);
        });
    }

    private emitButtonEvent(eventType: string, event: GamepadButtonEvent): void {
        const key = eventType;
        const listeners = this.buttonListeners.get(key);
        listeners?.forEach((callback) => callback(event));
    }

    private emitAxisEvent(event: GamepadAxisEvent): void {
        const listeners = this.axisListeners.get("axisMoved");
        listeners?.forEach((callback) => callback(event));
    }

    private emitConnectionEvent(
        index: number,
        id: string,
        connected: boolean
    ): void {
        const event: GamepadConnectionEvent = { gamepadIndex: index, gamepadId: id, connected };
        this.connectionListeners.forEach((callback) => callback(event));
    }

    private clearGamepadState(gamepadIndex: number): void {
        const keysToDelete = Array.from(this.previousButtonStates.keys()).filter(
            (key) => key.includes(`gamepad-${gamepadIndex}`)
        );
        keysToDelete.forEach((key) => this.previousButtonStates.delete(key));

        const axisKeysToDelete = Array.from(this.previousAxisValues.keys()).filter(
            (key) => key.includes(`gamepad-${gamepadIndex}`)
        );
        axisKeysToDelete.forEach((key) => this.previousAxisValues.delete(key));
    }

    // Public subscription methods
    onButtonDown(callback: EventCallback<GamepadButtonEvent>): Unsubscribe {
        if (!this.buttonListeners.has("buttondown")) {
            this.buttonListeners.set("buttondown", new Set());
        }
        this.buttonListeners.get("buttondown")!.add(callback);

        return () => {
            this.buttonListeners.get("buttondown")?.delete(callback);
        };
    }

    onButtonUp(callback: EventCallback<GamepadButtonEvent>): Unsubscribe {
        if (!this.buttonListeners.has("buttonup")) {
            this.buttonListeners.set("buttonup", new Set());
        }
        this.buttonListeners.get("buttonup")!.add(callback);

        return () => {
            this.buttonListeners.get("buttonup")?.delete(callback);
        };
    }

    onAxisMove(callback: EventCallback<GamepadAxisEvent>): Unsubscribe {
        if (!this.axisListeners.has("axisMoved")) {
            this.axisListeners.set("axisMoved", new Set());
        }
        this.axisListeners.get("axisMoved")!.add(callback);

        return () => {
            this.axisListeners.get("axisMoved")?.delete(callback);
        };
    }

    onGamepadConnection(callback: EventCallback<GamepadConnectionEvent>): Unsubscribe {
        this.connectionListeners.add(callback);

        return () => {
            this.connectionListeners.delete(callback);
        };
    }

    // Cleanup
    destroy(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.buttonListeners.clear();
        this.axisListeners.clear();
        this.connectionListeners.clear();
        this.previousButtonStates.clear();
        this.previousAxisValues.clear();
        this.connectedGamepads.clear();
    }

    // Utility methods
    getConnectedGamepads(): number[] {
        return Array.from(this.connectedGamepads);
    }

    isGamepadConnected(index: number): boolean {
        return this.connectedGamepads.has(index);
    }
}
