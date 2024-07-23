from enum import Enum
import time
import sys
from pynput import mouse, keyboard
from pynput.keyboard import Key, KeyCode
from pynput.mouse import Button
from threading import Lock
from typing import Literal
import pywinctl as pwc
from pywinbox import Rect
import pymonctl as pmc
import argparse

class State(Enum):
    NORMAL = "normal"
    MOUSE = "mouse"
    SPECIAL = "special"

class KeyEvent:
    def __init__(self, key: Key | KeyCode | None, pressed: bool):
        self.pressed: bool = pressed
        self.key: Key | KeyCode | None = key
    
    def is_special(self) -> bool:
        for special_key in [Key.enter, Key.ctrl, Key.alt, Key.cmd, Key.tab]:
            if self.key == special_key:
                return True
        return False

    def __str__(self):
        if isinstance(self.key, Key):
            return f"\"{self.key.name}\""
        elif isinstance(self.key, KeyCode):
            if self.key.char is not None:
                if self.key.char == "\"":
                    return "\"\\\"\""
                return f"\"{self.key.char}\""
            elif self.key.vk is not None:
                return f"\"{self.key.vk}\""
            else:
                return "None"
        else:
            return "None"

class MouseEvent:
    def __init__(self, x: int, y: int, button: Button, pressed: bool, display: Rect | None):
        self.pressed: bool = pressed
        self.x: int = x
        self.y: int = y
        self.button: Button = button
        self.display: Rect | None = display
    
    def __str__(self):
        formatted_display = f"""{{"left":{self.display.left},"top":{self.display.top},"right":{self.display.right},"bottom":{self.display.bottom}}}""" if self.display is not None else "null"
        return f"""{{"x":{self.x},"y":{self.y},"button":"{self.button.name}","pressed":{"true" if self.pressed else "false"},"display":{formatted_display}}}"""

class BufferWithTime:
    def __init__(self):
        self.buffer: list[KeyEvent | MouseEvent] = []
        self.startTime: float = 0
    
    def get(self):
        return self.buffer, int(self.startTime * 1000), int(time.time() * 1000)
    
    def clear(self):
        self.buffer = []
        self.startTime = 0
    
    def append(self, event: KeyEvent | MouseEvent):
        if len(self.buffer) == 0:
            self.startTime = time.time()
        self.buffer.append(event)

class DisplayDevice:
    def __init__(self, id: int, type: Literal["window", "screen"] | None):
        self.type: Literal["window", "screen"] | None = type
        self.display: pwc.Window | Rect | None = None
        try:
            if type == "window":
                self.display = pwc.Window(id)
            elif type == "screen":
                screens = pmc.getAllMonitorsDict()
                for screen_name in screens:
                    screen = screens[screen_name]
                    if screen.get("id") == id:
                        self.display = screen.get("workarea")
                        break
        except:
            self.type = None
            self.display = None
    
    def get_display(self) -> Rect | None:
        if self.type == "screen":
            return self.display
        elif self.type == "window":
            window: pwc.Window = self.display
            if window.isActive:
                return window.getClientFrame()
            else:
                return Rect(-1, -1, -1, -1)
        else:
            return None

class StateMachine:
    def __init__(self, mutex: Lock):
        self.state: State = State.NORMAL
        self.mutex: Lock = mutex

        self.trigger: Key | None = None
        self.buffer: BufferWithTime = BufferWithTime()
    
    def flush_buffer(self):
        buffer, startTime, endTime = self.buffer.get()
        if len(buffer) == 0:
            return
        sys.stdout.write(f"""{{"events":[{",".join([str(event) for event in buffer])}],"startTime":{startTime},"endTime":{endTime}}}""")
        sys.stdout.write("\n")
        sys.stdout.flush()
        self.buffer.clear()

    
    def handle_normal(self, event: KeyEvent | MouseEvent):
        if event.pressed:
            if isinstance(event, KeyEvent):
                if event.is_special() and self.trigger is None:
                    self.trigger = event.key
                    self.flush_buffer()
                    self.buffer.append(event)
                    self.state = State.SPECIAL
                else:
                    self.buffer.append(event)
            elif isinstance(event, MouseEvent):
                self.flush_buffer()
                self.buffer.append(event)
                self.state = State.MOUSE

    def handle_mouse(self, event: KeyEvent | MouseEvent):
        if isinstance(event, MouseEvent) and not(event.pressed):
            self.buffer.append(event)
            self.flush_buffer()
            self.state = State.NORMAL
        elif event.pressed:
            self.buffer.append(event)
    
    def handle_special(self, event: KeyEvent | MouseEvent):
        if event.pressed:
            self.buffer.append(event)
        elif isinstance(event, KeyEvent) and event.key == self.trigger:
                self.trigger = None
                self.flush_buffer()
                self.state = State.NORMAL
            
    
    def update(self, event: KeyEvent | MouseEvent):
        with self.mutex:
            match self.state:
                case State.NORMAL:
                    self.handle_normal(event)
                case State.MOUSE:
                    self.handle_mouse(event)
                case State.SPECIAL:
                    self.handle_special(event)

stateMachine: StateMachine = StateMachine(Lock())

def on_press(key: Key | KeyCode | None):
    stateMachine.update(KeyEvent(key, True))


def on_release(key: Key | KeyCode | None):
    stateMachine.update(KeyEvent(key, False))


def init_display_device(id: str | None) -> DisplayDevice:
    if id is None:
        return DisplayDevice(-1, None)

    #id if of the form "window:<window_id>", or "screen:<screen_id>"
    if id.startswith("window:"):
        window_id = int(id.split(":")[1])
        return DisplayDevice(window_id, "window")
    elif id.startswith("screen:"):
        screen_id = int(id.split(":")[1])
        return DisplayDevice(screen_id, "screen")
    
    return DisplayDevice(-1, None)

def start_recording(id: str | None = None):
    display_device: DisplayDevice = init_display_device(id)
    
    def on_click(_x: int, _y: int, button: Button, pressed: bool):
        display = display_device.get_display()
        x, y = pmc.getMousePos()
        if display is None:
            return stateMachine.update(MouseEvent(x, y, button, pressed, None))
        else:
            if (display.left <= x <= display.right) and (display.top <= y <= display.bottom):
                return stateMachine.update(MouseEvent(x, y, button, pressed, display))

    keyboard_listener = keyboard.Listener(
        on_press=on_press,
        on_release=on_release
    )

    mouse_listener = mouse.Listener(
        on_click=on_click,
        #on_scroll=on_scroll
    )
    
    keyboard_listener.start()
    mouse_listener.start()
    keyboard_listener.join()
    mouse_listener.join()


if __name__ == "__main__":
    parser = argparse.ArgumentParser("sniive_script")
    parser.add_argument("id", type=str, default=None, nargs="?")
    args = parser.parse_args()
    
    id = args.id
    start_recording(id)
    