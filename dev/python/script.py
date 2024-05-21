from enum import Enum
import time
import sys
from pynput import mouse, keyboard
from pynput.keyboard import Key, KeyCode
from pynput.mouse import Button
from threading import Lock

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
    def __init__(self, x: int, y: int, button: Button, pressed: bool):
        self.pressed: bool = pressed
        self.x: int = x
        self.y: int = y
        self.button: Button = button
    
    def __str__(self):
        return f"""{{"x":{self.x},"y":{self.y},"button":"{self.button.name}","pressed":{"true" if self.pressed else "false"}}}"""

class BufferWithTime:
    def __init__(self):
        self.buffer: list[KeyEvent | MouseEvent] = []
        self.time: float = time
    
    def get(self):
        return self.buffer, self.time
    
    def clear(self):
        self.buffer = []
        self.time = time
    
    def append(self, event: KeyEvent | MouseEvent):
        if len(self.buffer) == 0:
            self.time = time.time()
        self.buffer.append(event)



class StateMachine:
    def __init__(self, mutex: Lock):
        self.state: State = State.NORMAL
        self.mutex: Lock = mutex

        self.trigger: Key | None = None
        self.buffer: BufferWithTime = BufferWithTime()
    
    def flush_buffer(self):
        buffer, time = self.buffer.get()
        if len(buffer) == 0:
            return
        sys.stdout.write(f"""{{"events":[{",".join([str(event) for event in buffer])}],"time":{time}}}""")
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


def on_click(x: int, y: int, button: Button, pressed: bool):
    stateMachine.update(MouseEvent(x, y, button, pressed))


def on_scroll(x: int, y: int, dx: int, dy: int):
    json_string = f"""{{"action":"scrolled", "vertical_direction":{dy}, "horizontal_direction":{dx}, "x":{x}, "y":{y}, "time":{time.time()}}}"""
    #output_json(json_string)

    


def start_recording():
    keyboard_listener = keyboard.Listener(
        on_press=on_press,
        on_release=on_release
    )

    mouse_listener = mouse.Listener(
            on_click=on_click,
            on_scroll=on_scroll
    )
    
    keyboard_listener.start()
    mouse_listener.start()
    keyboard_listener.join()
    mouse_listener.join()


if __name__ == "__main__":
    start_recording()
    